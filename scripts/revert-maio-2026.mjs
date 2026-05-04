import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, gte, lt, ne } from "drizzle-orm";
import { pgSchema, serial, varchar, text, timestamp, numeric, integer } from "drizzle-orm/pg-core";

const DATABASE_URL = "postgresql://postgres.nfjyjnvmorwhikhczplp:CNTteqllkjcCXkkA@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

const sysjuros = pgSchema("sysjuros");
const roleEnum = sysjuros.enum("role", ["user", "admin"]);
const contractTypeEnum = sysjuros.enum("contract_type", ["fixed", "installment", "revolving", "sac"]);
const contractStatusEnum = sysjuros.enum("contract_status", ["open", "closed"]);
const installmentStatusEnum = sysjuros.enum("installment_status", ["pending", "paid", "overdue"]);

const users = sysjuros.table("users", {
  id: serial("id").primaryKey(),
  role: roleEnum("role").default("user").notNull(),
});
const customers = sysjuros.table("customers", { id: serial("id").primaryKey() });
const contracts = sysjuros.table("contracts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  customerId: integer("customerId").notNull(),
  type: contractTypeEnum("type").notNull(),
  status: contractStatusEnum("status").default("open").notNull(),
  originalValue: numeric("originalValue", { precision: 12, scale: 2 }).notNull(),
  interestRate: numeric("interestRate", { precision: 5, scale: 2 }).notNull(),
  interestValue: numeric("interestValue", { precision: 12, scale: 2 }).notNull(),
  totalValue: numeric("totalValue", { precision: 12, scale: 2 }).notNull(),
  minimumPayment: numeric("minimumPayment", { precision: 12, scale: 2 }),
  startDate: timestamp("startDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  contractNumber: varchar("contractNumber", { length: 50 }).notNull().unique(),
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

const maio2026Start = new Date("2026-05-01T00:00:00.000Z");
const maio2026End   = new Date("2026-06-01T00:00:00.000Z");

// 1. Busca todas as parcelas com vencimento em maio/2026 que estão pagas
const paid = await db.select({
  id: installments.id,
  contractId: installments.contractId,
  installmentNumber: installments.installmentNumber,
  paidDate: installments.paidDate,
  paidValue: installments.paidValue,
  capitalPaid: installments.capitalPaid,
}).from(installments)
  .where(and(
    eq(installments.status, "paid"),
    gte(installments.dueDate, maio2026Start),
    lt(installments.dueDate, maio2026End),
  ));

console.log(`\n📋 Parcelas pagas em Maio/2026: ${paid.length}`);
paid.forEach(p => {
  console.log(`  #${p.id} contrato:${p.contractId} parcela:${p.installmentNumber} pago:${p.paidDate?.toLocaleDateString("pt-BR")} valor:R$${p.paidValue} capital:R$${p.capitalPaid}`);
});

if (paid.length === 0) {
  console.log("Nenhuma parcela encontrada. Encerrando.");
  await client.end();
  process.exit(0);
}

console.log(`\n🔄 Estornando ${paid.length} parcelas...\n`);

let ok = 0;
let erros = 0;

for (const inst of paid) {
  try {
    await db.transaction(async (tx) => {
      const capitalPaid = parseFloat((inst.capitalPaid ?? "0") + "");

      // Busca contrato
      const contractRows = await tx.select().from(contracts)
        .where(eq(contracts.id, inst.contractId)).limit(1);
      const contract = contractRows[0];
      if (!contract) throw new Error("Contrato não encontrado");

      // Reverte a parcela
      await tx.update(installments).set({
        status: "pending",
        paidValue: "0",
        capitalPaid: "0",
        interestPaid: "0",
        paidDate: null,
      }).where(eq(installments.id, inst.id));

      // Restaura capital se foi abatido
      if (capitalPaid > 0) {
        const restored = parseFloat(contract.originalValue ?? "0") + capitalPaid;
        const rate = parseFloat(contract.interestRate ?? "0");
        await tx.update(contracts).set({
          originalValue: restored.toFixed(2),
          minimumPayment: (restored * rate / 100).toFixed(2),
          status: "open",
        }).where(eq(contracts.id, inst.contractId));
      } else if (contract.status === "closed") {
        await tx.update(contracts).set({ status: "open" })
          .where(eq(contracts.id, inst.contractId));
      }

      // Rotativo: remove parcela auto-gerada após esta
      if (contract.type === "revolving") {
        const next = await tx.select({ id: installments.id })
          .from(installments)
          .where(and(
            eq(installments.contractId, inst.contractId),
            gte(installments.installmentNumber, inst.installmentNumber + 1),
            ne(installments.status, "paid"),
          ))
          .orderBy(installments.installmentNumber)
          .limit(1);
        if (next[0]) {
          await tx.delete(installments).where(eq(installments.id, next[0].id));
          console.log(`  ✓ #${inst.id} estornado + parcela auto-gerada removida`);
        } else {
          console.log(`  ✓ #${inst.id} estornado`);
        }
      } else {
        console.log(`  ✓ #${inst.id} estornado`);
      }

      ok++;
    });
  } catch (e) {
    console.log(`  ✗ #${inst.id} ERRO: ${e.message}`);
    erros++;
  }
}

console.log(`\n✅ Concluído: ${ok} estornados, ${erros} erros.`);
await client.end();
