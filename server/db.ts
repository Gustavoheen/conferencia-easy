import { eq, desc, like, and, gte, lte, lt, count, sql, ne, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, customers, contracts, installments } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL, { prepare: false });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function createUser(data: { name: string; email: string; password: string; role?: "user" | "admin" }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(users).values({
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role ?? "user",
    lastSignedIn: new Date(),
  }).returning();
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] ?? undefined;
}

export async function updateUserLastSignedIn(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id));
}

export async function updateUser(id: number, data: { name?: string; phone?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(data).where(eq(users.id, id));
  return getUserById(id);
}

// Customer queries
export async function getCustomersByUserId(userId: number, searchTerm?: string, limit: number = 10, offset: number = 0) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };

  const conditions = [eq(customers.userId, userId)];
  if (searchTerm) {
    conditions.push(like(customers.name, `%${searchTerm}%`));
  }

  const data = await db
    .select()
    .from(customers)
    .where(and(...conditions))
    .orderBy(desc(customers.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(...conditions));

  return { data, total: countResult.length };
}

export async function getCustomerById(customerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
  return result[0] ?? undefined;
}

export async function createCustomer(customer: typeof customers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(customers).values(customer).returning();
  return result[0];
}

export async function updateCustomer(customerId: number, data: Partial<typeof customers.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(customers).set(data).where(eq(customers.id, customerId));
}

export async function deleteCustomer(customerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const contractIds = await db.select({ id: contracts.id }).from(contracts).where(eq(contracts.customerId, customerId));
  if (contractIds.length > 0) {
    await db.delete(installments).where(inArray(installments.contractId, contractIds.map(c => c.id)));
  }
  await db.delete(contracts).where(eq(contracts.customerId, customerId));
  return db.delete(customers).where(eq(customers.id, customerId));
}

// Contract queries
export async function getContractsByUserId(userId: number, customerId?: number, status?: string, limit: number = 10, offset: number = 0) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };

  const conditions = [eq(contracts.userId, userId)];
  if (customerId) conditions.push(eq(contracts.customerId, customerId));
  if (status) conditions.push(eq(contracts.status, status as any));

  const data = await db
    .select()
    .from(contracts)
    .where(and(...conditions))
    .orderBy(desc(contracts.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ id: contracts.id })
    .from(contracts)
    .where(and(...conditions));

  return { data, total: countResult.length };
}

export async function getContractById(contractId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contracts).where(eq(contracts.id, contractId)).limit(1);
  return result[0] ?? undefined;
}

export async function createContract(contract: typeof contracts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contracts).values(contract).returning();
  return result[0];
}

// Próximo número de contrato sequencial por usuário no formato "#N"
export async function getNextContractNumberForUser(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db
    .select({ id: contracts.id })
    .from(contracts)
    .where(eq(contracts.userId, userId));
  return `#${rows.length + 1}`;
}

export async function updateContract(contractId: number, data: Partial<typeof contracts.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(contracts).set(data).where(eq(contracts.id, contractId));
}

export async function deleteContract(contractId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Cascade: parcelas → contrato
  await db.delete(installments).where(eq(installments.contractId, contractId));
  return db.delete(contracts).where(eq(contracts.id, contractId));
}

// Installment queries
export async function getInstallmentsByContractId(contractId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(installments).where(eq(installments.contractId, contractId)).orderBy(installments.dueDate);
}

export async function getInstallmentById(installmentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(installments).where(eq(installments.id, installmentId)).limit(1);
  return result[0] ?? undefined;
}

export async function markOverdueInstallments() {
  const db = await getDb();
  if (!db) return;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  await db
    .update(installments)
    .set({ status: "overdue" })
    .where(and(eq(installments.status, "pending"), lt(installments.dueDate, todayStart)));
}

export async function getInstallmentsByUserId(userId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };

  const data = await db
    .select({
      id: installments.id,
      contractId: installments.contractId,
      installmentNumber: installments.installmentNumber,
      dueDate: installments.dueDate,
      value: installments.value,
      paidValue: installments.paidValue,
      capitalPaid: installments.capitalPaid,
      interestPaid: installments.interestPaid,
      status: installments.status,
      paidDate: installments.paidDate,
      contractNumber: contracts.contractNumber,
      contractType: contracts.type,
      contractMinimumPayment: contracts.minimumPayment,
      contractOriginalValue: contracts.originalValue,
      contractInterestRate: contracts.interestRate,
      customerName: customers.name,
    })
    .from(installments)
    .innerJoin(contracts, eq(installments.contractId, contracts.id))
    .innerJoin(customers, eq(contracts.customerId, customers.id))
    .where(eq(contracts.userId, userId))
    .orderBy(installments.dueDate)
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ id: installments.id })
    .from(installments)
    .innerJoin(contracts, eq(installments.contractId, contracts.id))
    .where(eq(contracts.userId, userId));

  return { data, total: countResult.length };
}

export async function createInstallment(installment: typeof installments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(installments).values(installment).returning();
  return result[0];
}

export async function updateInstallment(installmentId: number, data: Partial<typeof installments.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(installments).set(data).where(eq(installments.id, installmentId));
}

export async function getLastInstallmentNumber(contractId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ installmentNumber: installments.installmentNumber })
    .from(installments)
    .where(eq(installments.contractId, contractId))
    .orderBy(desc(installments.installmentNumber))
    .limit(1);
  return result[0]?.installmentNumber ?? 0;
}

export async function deletePendingInstallments(contractId: number) {
  const db = await getDb();
  if (!db) return;
  return db.delete(installments).where(
    and(eq(installments.contractId, contractId), ne(installments.status, "paid"))
  );
}

export async function getPendingInstallmentsCount(contractId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ cnt: count() })
    .from(installments)
    .where(and(eq(installments.contractId, contractId), ne(installments.status, "paid")));
  return Number(result[0]?.cnt ?? 0);
}

export async function getContractsByCustomerIdWithSummary(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  const contractRows = await db.select().from(contracts)
    .where(eq(contracts.customerId, customerId))
    .orderBy(desc(contracts.createdAt));
  if (contractRows.length === 0) return [];
  const contractIds = contractRows.map(c => c.id);
  const allInstallments = await db
    .select({
      contractId: installments.contractId,
      status: installments.status,
      value: installments.value,
      paidValue: installments.paidValue,
      capitalPaid: installments.capitalPaid,
      interestPaid: installments.interestPaid,
    })
    .from(installments)
    .where(inArray(installments.contractId, contractIds));
  const byContract = new Map<number, typeof allInstallments>();
  for (const row of allInstallments) {
    if (!byContract.has(row.contractId)) byContract.set(row.contractId, []);
    byContract.get(row.contractId)!.push(row);
  }
  return contractRows.map(c => {
    const rows = byContract.get(c.id) ?? [];
    const paid = rows.filter(i => i.status === "paid");
    return {
      ...c,
      totalPaid: paid.reduce((s, i) => s + parseFloat(i.paidValue as string || "0"), 0),
      totalCapitalPaid: paid.reduce((s, i) => s + parseFloat(i.capitalPaid as string || "0"), 0),
      totalInterestPaid: paid.reduce((s, i) => s + parseFloat(i.interestPaid as string || "0"), 0),
      pendingCount: rows.filter(i => i.status !== "paid").length,
      pendingValue: rows.filter(i => i.status !== "paid").reduce((s, i) => s + parseFloat(i.value as string || "0"), 0),
      installmentCount: rows.length,
    };
  });
}

export async function getContractWithInstallments(contractId: number) {
  const db = await getDb();
  if (!db) return null;
  const contractRow = await db.select().from(contracts)
    .where(eq(contracts.id, contractId)).limit(1);
  if (!contractRow[0]) return null;
  const customer = await db.select().from(customers)
    .where(eq(customers.id, contractRow[0].customerId)).limit(1);
  const installmentRows = await db.select().from(installments)
    .where(eq(installments.contractId, contractId))
    .orderBy(installments.installmentNumber);
  return {
    ...contractRow[0],
    customerName: customer[0]?.name || "Desconhecido",
    installments: installmentRows,
  };
}

export async function getInvestmentStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalInvested: 0, capitalRecovered: 0, capitalRemaining: 0, totalInterestReceived: 0, totalReceived: 0 };
  const [contractRows, paidInstallmentRows] = await Promise.all([
    db.select({ originalValue: contracts.originalValue, status: contracts.status })
      .from(contracts)
      .where(eq(contracts.userId, userId)),
    db.select({ capitalPaid: installments.capitalPaid, interestPaid: installments.interestPaid })
      .from(installments)
      .innerJoin(contracts, eq(installments.contractId, contracts.id))
      .where(and(eq(contracts.userId, userId), eq(installments.status, "paid"))),
  ]);
  const capitalRecovered = paidInstallmentRows.reduce((s, i) => s + parseFloat(i.capitalPaid as string || "0"), 0);
  const totalInterestReceived = paidInstallmentRows.reduce((s, i) => s + parseFloat(i.interestPaid as string || "0"), 0);
  // saldo devedor atual + capital já recuperado = capital total emprestado
  const outstandingBalance = contractRows
    .filter(c => c.status === "open")
    .reduce((s, c) => s + parseFloat(c.originalValue as string || "0"), 0);
  const totalInvested = outstandingBalance + capitalRecovered;
  return {
    totalInvested,
    capitalRecovered,
    capitalRemaining: outstandingBalance,
    totalInterestReceived,
    totalReceived: capitalRecovered + totalInterestReceived,
  };
}

export async function updateUserPassword(userId: number, hashedPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const contractIds = await db.select({ id: contracts.id }).from(contracts).where(eq(contracts.userId, userId));
  if (contractIds.length > 0) {
    await db.delete(installments).where(inArray(installments.contractId, contractIds.map(c => c.id)));
  }
  await db.delete(contracts).where(eq(contracts.userId, userId));
  await db.delete(customers).where(eq(customers.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
      customerCount: sql<number>`(select count(*) from sysjuros.customers where "userId" = ${users.id})`,
      contractCount: sql<number>`(select count(*) from sysjuros.contracts where "userId" = ${users.id})`,
      totalContractsValue: sql<number>`coalesce((select sum(cast("totalValue" as numeric)) from sysjuros.contracts where "userId" = ${users.id}), 0)`,
      totalReceived: sql<number>`coalesce((select sum(cast("paidValue" as numeric)) from sysjuros.installments i inner join sysjuros.contracts c on c.id = i."contractId" where c."userId" = ${users.id} and i.status = 'paid'), 0)`,
      outstandingBalance: sql<number>`coalesce((select sum(cast("originalValue" as numeric)) from sysjuros.contracts where "userId" = ${users.id} and status = 'open'), 0)`,
      overdueCount: sql<number>`(select count(*) from sysjuros.installments i inner join sysjuros.contracts c on c.id = i."contractId" where c."userId" = ${users.id} and i.status = 'overdue')`,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
  return rows;
}

// Dashboard queries
export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return {
    todayCount: 0, overdueCount: 0, customerCount: 0, contractCount: 0,
    totalContractsValue: 0, totalReceived: 0, totalPending: 0,
    monthlyChart: [],
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayRows, overdueRows, customerRows, contractRows, allInstallments] = await Promise.all([
    db.select({ id: installments.id }).from(installments)
      .innerJoin(contracts, eq(installments.contractId, contracts.id))
      .where(and(eq(contracts.userId, userId), gte(installments.dueDate, today), lt(installments.dueDate, tomorrow), ne(installments.status, "paid"))),
    db.select({ id: installments.id }).from(installments)
      .innerJoin(contracts, eq(installments.contractId, contracts.id))
      .where(and(eq(contracts.userId, userId), eq(installments.status, "overdue"))),
    db.select({ id: customers.id }).from(customers).where(eq(customers.userId, userId)),
    db.select({ id: contracts.id, totalValue: contracts.totalValue }).from(contracts).where(eq(contracts.userId, userId)),
    db.select({ value: installments.value, paidValue: installments.paidValue, status: installments.status, dueDate: installments.dueDate })
      .from(installments)
      .innerJoin(contracts, eq(installments.contractId, contracts.id))
      .where(eq(contracts.userId, userId)),
  ]);

  const totalContractsValue = contractRows.reduce((s, c) => s + parseFloat(c.totalValue as string || "0"), 0);
  const totalReceived = allInstallments.filter(i => i.status === "paid").reduce((s, i) => s + parseFloat(i.paidValue as string || "0"), 0);
  const totalPending = allInstallments.filter(i => i.status !== "paid").reduce((s, i) => s + parseFloat(i.value as string || "0"), 0);

  // Build last 6 months chart
  const monthlyMap = new Map<string, { month: string; recebido: number; previsto: number }>();
  for (let m = 5; m >= 0; m--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - m);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "short" });
    monthlyMap.set(key, { month: label, recebido: 0, previsto: 0 });
  }
  allInstallments.forEach(i => {
    const d = new Date(i.dueDate as Date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap.has(key)) return;
    const entry = monthlyMap.get(key)!;
    entry.previsto += parseFloat(i.value as string || "0");
    if (i.status === "paid") entry.recebido += parseFloat(i.paidValue as string || "0");
  });

  return {
    todayCount: todayRows.length,
    overdueCount: overdueRows.length,
    customerCount: customerRows.length,
    contractCount: contractRows.length,
    totalContractsValue,
    totalReceived,
    totalPending,
    monthlyChart: Array.from(monthlyMap.values()),
  };
}

export async function revertInstallmentPayment(installmentId: number): Promise<{ success: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.transaction(async (tx) => {
    const instRows = await tx.select().from(installments)
      .where(eq(installments.id, installmentId)).limit(1);
    const installment = instRows[0];
    if (!installment) throw new Error("Parcela não encontrada");
    if (installment.status !== "paid") throw new Error("Parcela não está paga");

    const capitalPaid = parseFloat(installment.capitalPaid as string || "0");

    const contractRows = await tx.select().from(contracts)
      .where(eq(contracts.id, installment.contractId)).limit(1);
    const contract = contractRows[0];
    if (!contract) throw new Error("Contrato não encontrado");

    // Reverte a parcela
    await tx.update(installments).set({
      status: "pending",
      paidValue: "0",
      capitalPaid: "0",
      interestPaid: "0",
      paidDate: null,
    }).where(eq(installments.id, installmentId));

    // Restaura capital no contrato se foi abatido
    if (capitalPaid > 0) {
      const restoredPrincipal = parseFloat(contract.originalValue as string) + capitalPaid;
      const interestRate = parseFloat(contract.interestRate as string);
      await tx.update(contracts).set({
        originalValue: restoredPrincipal.toFixed(2),
        minimumPayment: (restoredPrincipal * interestRate / 100).toFixed(2),
        status: "open",
      }).where(eq(contracts.id, installment.contractId));
    } else if (contract.status === "closed") {
      await tx.update(contracts).set({ status: "open" })
        .where(eq(contracts.id, installment.contractId));
    }

    // Rotativo: remove a parcela auto-gerada após esta
    if (contract.type === "revolving") {
      const nextInst = await tx.select({ id: installments.id })
        .from(installments)
        .where(and(
          eq(installments.contractId, installment.contractId),
          gte(installments.installmentNumber, installment.installmentNumber + 1),
          ne(installments.status, "paid"),
        ))
        .orderBy(installments.installmentNumber)
        .limit(1);
      if (nextInst[0]) {
        await tx.delete(installments).where(eq(installments.id, nextInst[0].id));
      }
    }

    return { success: true };
  });
}

export async function processInstallmentPayment(
  installmentId: number,
  paidValueNum: number,
  capitalPaidNum: number,
): Promise<{ success: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.transaction(async (tx) => {
    const instRows = await tx.select().from(installments)
      .where(eq(installments.id, installmentId)).limit(1);
    const installment = instRows[0];
    if (!installment) throw new Error("Parcela não encontrada");

    const interestPaidNum = paidValueNum - capitalPaidNum;
    await tx.update(installments).set({
      status: "paid",
      paidValue: paidValueNum.toFixed(2),
      capitalPaid: capitalPaidNum.toFixed(2),
      interestPaid: interestPaidNum.toFixed(2),
      paidDate: new Date(),
    }).where(eq(installments.id, installmentId));

    const contractRows = await tx.select().from(contracts)
      .where(eq(contracts.id, installment.contractId)).limit(1);
    const contract = contractRows[0];
    if (!contract || contract.status !== "open") return { success: true };

    const interestRate = parseFloat(contract.interestRate as string);
    const oldPrincipal = parseFloat(contract.originalValue as string);
    let currentPrincipal = oldPrincipal;

    if (capitalPaidNum > 0) {
      currentPrincipal = Math.max(0, currentPrincipal - capitalPaidNum);
      const newMinimumPayment = (currentPrincipal * interestRate / 100).toFixed(2);
      await tx.update(contracts).set({
        originalValue: currentPrincipal.toFixed(2),
        minimumPayment: newMinimumPayment,
      }).where(eq(contracts.id, installment.contractId));

      if (currentPrincipal <= 0) {
        await tx.delete(installments).where(
          and(eq(installments.contractId, installment.contractId), ne(installments.status, "paid"))
        );
        await tx.update(contracts).set({ status: "closed" })
          .where(eq(contracts.id, installment.contractId));
        return { success: true };
      }

      const baseDate = new Date(installment.dueDate as Date);

      if (contract.type === "sac") {
        const installmentValue = parseFloat(installment.value as string);
        const interestPortion = oldPrincipal * interestRate / 100;
        const expectedCapital = Math.max(0, installmentValue - interestPortion);
        const deficit = Math.max(0, expectedCapital - capitalPaidNum);

        if (deficit > 0) {
          const allInst = await tx.select({ status: installments.status, dueDate: installments.dueDate })
            .from(installments).where(eq(installments.contractId, installment.contractId));
          const pendingInst = allInst.filter(i => i.status !== "paid");
          const lastNumRow = await tx
            .select({ installmentNumber: installments.installmentNumber })
            .from(installments)
            .where(eq(installments.contractId, installment.contractId))
            .orderBy(desc(installments.installmentNumber)).limit(1);
          const lastNumber = lastNumRow[0]?.installmentNumber ?? 0;
          let lastDueDate = new Date(baseDate);
          for (const p of pendingInst) {
            const d = new Date(p.dueDate as Date);
            if (d > lastDueDate) lastDueDate = d;
          }
          const newDueDate = new Date(lastDueDate);
          newDueDate.setMonth(newDueDate.getMonth() + 1);
          const deficitInterest = deficit * interestRate / 100;
          await tx.insert(installments).values({
            contractId: installment.contractId,
            installmentNumber: lastNumber + 1,
            dueDate: newDueDate,
            value: (deficit + deficitInterest).toFixed(2),
          });
        }
      } else if (contract.type === "revolving") {
        const monthlyInterest = currentPrincipal * interestRate / 100;
        const dueDate = new Date(baseDate);
        dueDate.setMonth(dueDate.getMonth() + 1);
        await tx.insert(installments).values({
          contractId: installment.contractId,
          installmentNumber: installment.installmentNumber + 1,
          dueDate,
          value: monthlyInterest.toFixed(2),
        });
      } else {
        const pendingCountRow = await tx
          .select({ cnt: count() })
          .from(installments)
          .where(and(eq(installments.contractId, installment.contractId), ne(installments.status, "paid")));
        const pendingCount = Number(pendingCountRow[0]?.cnt ?? 0);
        if (pendingCount > 0) {
          await tx.delete(installments).where(
            and(eq(installments.contractId, installment.contractId), ne(installments.status, "paid"))
          );
          if (contract.type === "installment") {
            const installmentValue = (currentPrincipal / pendingCount) + (currentPrincipal * interestRate / 100);
            for (let i = 1; i <= pendingCount; i++) {
              const dueDate = new Date(baseDate);
              dueDate.setMonth(dueDate.getMonth() + i);
              await tx.insert(installments).values({
                contractId: installment.contractId,
                installmentNumber: installment.installmentNumber + i,
                dueDate,
                value: installmentValue.toFixed(2),
              });
            }
          } else {
            const monthlyInterest = currentPrincipal * interestRate / 100;
            for (let i = 1; i <= pendingCount; i++) {
              const dueDate = new Date(baseDate);
              dueDate.setMonth(dueDate.getMonth() + i);
              await tx.insert(installments).values({
                contractId: installment.contractId,
                installmentNumber: installment.installmentNumber + i,
                dueDate,
                value: monthlyInterest.toFixed(2),
              });
            }
          }
        }
      }
    } else if (contract.type === "revolving") {
      const lastNumRow = await tx
        .select({ installmentNumber: installments.installmentNumber })
        .from(installments)
        .where(eq(installments.contractId, installment.contractId))
        .orderBy(desc(installments.installmentNumber)).limit(1);
      const lastNumber = lastNumRow[0]?.installmentNumber ?? 0;
      if (currentPrincipal > 0) {
        const monthlyInterest = currentPrincipal * interestRate / 100;
        const dueDate = new Date(installment.dueDate as Date);
        dueDate.setMonth(dueDate.getMonth() + 1);
        await tx.insert(installments).values({
          contractId: installment.contractId,
          installmentNumber: lastNumber + 1,
          dueDate,
          value: monthlyInterest.toFixed(2),
        });
      }
    }

    return { success: true };
  });
}

export async function getMasterStats() {
  const db = await getDb();
  if (!db) return { userCount: 0, contractCount: 0, totalInvested: 0, capitalRecovered: 0, interestReceived: 0, outstandingBalance: 0, overdueCount: 0 };

  const [userRows, contractRows, paidInstallments, overdueRows] = await Promise.all([
    db.select({ id: users.id }).from(users).where(ne(users.role, "admin")),
    db.select({ id: contracts.id, originalValue: contracts.originalValue, status: contracts.status }).from(contracts),
    // JOIN para não pegar parcelas de contratos deletados
    db.select({ capitalPaid: installments.capitalPaid, interestPaid: installments.interestPaid })
      .from(installments)
      .innerJoin(contracts, eq(installments.contractId, contracts.id))
      .where(eq(installments.status, "paid")),
    db.select({ id: installments.id })
      .from(installments)
      .innerJoin(contracts, eq(installments.contractId, contracts.id))
      .where(eq(installments.status, "overdue")),
  ]);

  // Mesma lógica do getInvestmentStats: totalInvested = originalValue atual + capital já pago
  const capitalRecovered = paidInstallments.reduce((s, i) => s + parseFloat(i.capitalPaid as string || "0"), 0);
  const interestReceived = paidInstallments.reduce((s, i) => s + parseFloat(i.interestPaid as string || "0"), 0);
  const outstandingBalance = contractRows.filter(c => c.status === "open").reduce((s, c) => s + parseFloat(c.originalValue as string || "0"), 0);
  const totalInvested = outstandingBalance + capitalRecovered; // sempre bate: investido = saldo + recuperado

  return {
    userCount: userRows.length,
    contractCount: contractRows.length,
    totalInvested,       // capital total emprestado (saldo + recuperado)
    capitalRecovered,    // capital devolvido
    interestReceived,    // juros recebidos
    outstandingBalance,  // saldo devedor real
    overdueCount: overdueRows.length,
  };
}
