import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, max as dbMax } from "drizzle-orm";
import { pgSchema, serial, varchar, text, timestamp, numeric, integer } from "drizzle-orm/pg-core";

const DATABASE_URL = "postgresql://postgres.nfjyjnvmorwhikhczplp:CNTteqllkjcCXkkA@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

const sysjuros = pgSchema("sysjuros");
const contractTypeEnum = sysjuros.enum("contract_type", ["fixed","installment","revolving","sac"]);
const contractStatusEnum = sysjuros.enum("contract_status", ["open","closed"]);
const installmentStatusEnum = sysjuros.enum("installment_status", ["pending","paid","overdue"]);

const contracts = sysjuros.table("contracts", {
  id: serial("id").primaryKey(),
  contractNumber: varchar("contractNumber", { length: 50 }).notNull(),
  type: contractTypeEnum("type").notNull(),
  status: contractStatusEnum("status").default("open").notNull(),
  originalValue: numeric("originalValue", { precision: 12, scale: 2 }).notNull(),
  interestRate: numeric("interestRate", { precision: 5, scale: 2 }).notNull(),
  interestValue: numeric("interestValue", { precision: 12, scale: 2 }).notNull(),
  totalValue: numeric("totalValue", { precision: 12, scale: 2 }).notNull(),
  minimumPayment: numeric("minimumPayment", { precision: 12, scale: 2 }),
  startDate: timestamp("startDate").notNull(),
  notes: text("notes"),
  userId: integer("userId").notNull(),
  customerId: integer("customerId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

const installments = sysjuros.table("installments", {
  id: serial("id").primaryKey(),
  contractId: integer("contractId").notNull(),
  installmentNumber: integer("installmentNumber").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  value: numeric("value", { precision: 12, scale: 2 }).notNull(),
  paidValue: numeric("paidValue", { precision: 12, scale: 2 }).default("0"),
  capitalPaid: numeric("capitalPaid", { precision: 12, scale: 2 }).default("0"),
  interestPaid: numeric("interestPaid", { precision: 12, scale: 2 }).default("0"),
  status: installmentStatusEnum("status").default("pending").notNull(),
  paidDate: timestamp("paidDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

const client = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(client);

const rotativos = await db.select().from(contracts)
  .where(and(eq(contracts.type, "revolving"), eq(contracts.status, "open")));

console.log(`\n📋 Contratos rotativos abertos: ${rotativos.length}\n`);

let criadas = 0;
let jaTinham = 0;

for (const c of rotativos) {
  const principal = parseFloat(c.originalValue ?? "0");
  const rate = parseFloat(c.interestRate ?? "0");
  const monthlyInterest = principal * rate / 100;

  const allInst = await db.select({
    id: installments.id,
    installmentNumber: installments.installmentNumber,
    dueDate: installments.dueDate,
    status: installments.status,
  }).from(installments).where(eq(installments.contractId, c.id));

  const hasPending = allInst.some(i => i.status === "pending" || i.status === "overdue");

  if (hasPending) {
    jaTinham++;
    continue;
  }

  // Sem parcela pendente: gera a próxima
  const lastPaid = allInst
    .filter(i => i.status === "paid")
    .sort((a, b) => b.installmentNumber - a.installmentNumber)[0];

  const lastNumber = lastPaid ? lastPaid.installmentNumber : 0;
  const lastDueDate = lastPaid ? new Date(lastPaid.dueDate) : new Date(c.startDate);
  const nextDueDate = addMonths(lastDueDate, lastPaid ? 1 : 1);

  await db.insert(installments).values({
    contractId: c.id,
    installmentNumber: lastNumber + 1,
    dueDate: nextDueDate,
    value: monthlyInterest.toFixed(2),
  });

  criadas++;
  console.log(`  ✓ Contrato ${c.contractNumber} (id:${c.id}) → parcela #${lastNumber + 1} criada para ${nextDueDate.toLocaleDateString("pt-BR")} | R$${monthlyInterest.toFixed(2)}`);
}

console.log(`\n✅ Concluído: ${criadas} parcelas geradas, ${jaTinham} contratos já tinham parcela pendente.`);
await client.end();
