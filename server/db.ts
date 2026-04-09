import { eq, desc, like, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, customers, contracts, installments } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL, { prepare: false, ssl: "require" });
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

export async function updateContract(contractId: number, data: Partial<typeof contracts.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(contracts).set(data).where(eq(contracts.id, contractId));
}

export async function deleteContract(contractId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
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

export async function getInstallmentsByUserId(userId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };

  // Auto-mark overdue
  const now = new Date();
  await db
    .update(installments)
    .set({ status: "overdue" })
    .where(and(eq(installments.status, "pending"), lte(installments.dueDate, now)));

  const data = await db
    .select({
      id: installments.id,
      contractId: installments.contractId,
      installmentNumber: installments.installmentNumber,
      dueDate: installments.dueDate,
      value: installments.value,
      paidValue: installments.paidValue,
      status: installments.status,
      paidDate: installments.paidDate,
      contractNumber: contracts.contractNumber,
      contractType: contracts.type,
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
      .where(and(eq(contracts.userId, userId), gte(installments.dueDate, today), lte(installments.dueDate, tomorrow), eq(installments.status, "pending"))),
    db.select({ id: installments.id }).from(installments)
      .innerJoin(contracts, eq(installments.contractId, contracts.id))
      .where(and(eq(contracts.userId, userId), lte(installments.dueDate, today), eq(installments.status, "pending"))),
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
