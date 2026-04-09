import {
  pgSchema,
  serial,
  varchar,
  text,
  timestamp,
  numeric,
  integer,
} from "drizzle-orm/pg-core";

export const sysjuros = pgSchema("sysjuros");

// Enums
export const roleEnum = sysjuros.enum("role", ["user", "admin"]);
export const contractTypeEnum = sysjuros.enum("contract_type", ["fixed", "installment", "revolving"]);
export const contractStatusEnum = sysjuros.enum("contract_status", ["open", "closed"]);
export const installmentStatusEnum = sysjuros.enum("installment_status", ["pending", "paid", "overdue"]);

export const users = sysjuros.table("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const customers = sysjuros.table("customers", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  cpfCnpj: varchar("cpfCnpj", { length: 20 }),
  birthDate: varchar("birthDate", { length: 10 }),
  address: text("address"),
  addressNumber: varchar("addressNumber", { length: 10 }),
  complement: text("complement"),
  neighborhood: varchar("neighborhood", { length: 100 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

export const contracts = sysjuros.table("contracts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  customerId: integer("customerId").notNull(),
  contractNumber: varchar("contractNumber", { length: 50 }).notNull().unique(),
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
});

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

export const installments = sysjuros.table("installments", {
  id: serial("id").primaryKey(),
  contractId: integer("contractId").notNull(),
  installmentNumber: integer("installmentNumber").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  value: numeric("value", { precision: 12, scale: 2 }).notNull(),
  paidValue: numeric("paidValue", { precision: 12, scale: 2 }).default("0"),
  status: installmentStatusEnum("status").default("pending").notNull(),
  paidDate: timestamp("paidDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Installment = typeof installments.$inferSelect;
export type InsertInstallment = typeof installments.$inferInsert;
