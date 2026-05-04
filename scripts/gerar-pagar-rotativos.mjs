import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, lte } from "drizzle-orm";
import { pgSchema, serial, varchar, text, timestamp, numeric, integer } from "drizzle-orm/pg-core";

const DATABASE_URL = "postgresql://postgres.nfjyjnvmorwhikhczplp:CNTteqllkjcCXkkA@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

const sysjuros = pgSchema("sysjuros");
const contractTypeEnum  = sysjuros.enum("contract_type", ["fixed","installment","revolving","sac"]);
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

const client = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(client);

const TODAY = new Date();
TODAY.setHours(23, 59, 59, 999); // fim do dia de hoje

// Adiciona N meses a uma data mantendo o dia
function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

// Busca contratos rotativos abertos
const rotativos = await db.select().from(contracts)
  .where(and(eq(contracts.type, "revolving"), eq(contracts.status, "open")));

console.log(`\n📋 Contratos rotativos encontrados: ${rotativos.length}\n`);

let totalCriadas = 0;
let totalPagas = 0;

for (const c of rotativos) {
  const principal = parseFloat(c.originalValue ?? "0");
  const rate = parseFloat(c.interestRate ?? "0");
  const monthlyInterest = principal * rate / 100;
  const startDate = new Date(c.startDate);

  // Parcelas já existentes neste contrato
  const existing = await db.select({
    id: installments.id,
    installmentNumber: installments.installmentNumber,
    dueDate: installments.dueDate,
    status: installments.status,
  }).from(installments).where(eq(installments.contractId, c.id));

  const existingDates = new Set(
    existing.map(i => new Date(i.dueDate).toISOString().slice(0, 7)) // YYYY-MM
  );
  const lastNumber = existing.length > 0
    ? Math.max(...existing.map(i => i.installmentNumber))
    : 0;

  // Gera vencimentos mensais de startDate+1 até hoje
  const dueDates = [];
  let month = 1;
  while (true) {
    const due = addMonths(startDate, month);
    if (due > TODAY) break;
    dueDates.push(due);
    month++;
  }

  // Cria parcelas que ainda não existem
  let counter = lastNumber;
  const criadas = [];
  for (const due of dueDates) {
    const key = due.toISOString().slice(0, 7);
    if (!existingDates.has(key)) {
      counter++;
      await db.insert(installments).values({
        contractId: c.id,
        installmentNumber: counter,
        dueDate: due,
        value: monthlyInterest.toFixed(2),
      });
      criadas.push(due);
      totalCriadas++;
    }
  }

  // Marca como pagas todas as parcelas com vencimento até hoje (qualquer status)
  const toPayIds = [];
  const allInst = await db.select({
    id: installments.id,
    dueDate: installments.dueDate,
    value: installments.value,
    status: installments.status,
  }).from(installments)
    .where(and(eq(installments.contractId, c.id), lte(installments.dueDate, TODAY)));

  for (const inst of allInst) {
    if (inst.status !== "paid") {
      const val = parseFloat(inst.value ?? "0");
      await db.update(installments).set({
        status: "paid",
        paidValue: val.toFixed(2),
        capitalPaid: "0.00",
        interestPaid: val.toFixed(2),
        paidDate: new Date(inst.dueDate),
      }).where(eq(installments.id, inst.id));
      toPayIds.push(inst.id);
      totalPagas++;
    }
  }

  console.log(`  Contrato ${c.contractNumber} (id:${c.id}) | R$${principal} × ${rate}% = R$${monthlyInterest.toFixed(2)}/mês`);
  console.log(`    → ${criadas.length} parcelas criadas, ${toPayIds.length} marcadas como pagas`);
}

console.log(`\n✅ Concluído: ${totalCriadas} parcelas criadas, ${totalPagas} marcadas como pagas.`);
await client.end();
