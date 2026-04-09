-- Create sysjuros schema
CREATE SCHEMA IF NOT EXISTS sysjuros;

-- Enums
CREATE TYPE sysjuros.role AS ENUM ('user', 'admin');
CREATE TYPE sysjuros.contract_type AS ENUM ('fixed', 'installment', 'revolving');
CREATE TYPE sysjuros.contract_status AS ENUM ('open', 'closed');
CREATE TYPE sysjuros.installment_status AS ENUM ('pending', 'paid', 'overdue');

-- Users
CREATE TABLE sysjuros.users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(320) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role sysjuros.role NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "lastSignedIn" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Customers
CREATE TABLE sysjuros.customers (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  "cpfCnpj" VARCHAR(20) NOT NULL UNIQUE,
  "birthDate" VARCHAR(10),
  address TEXT NOT NULL,
  "addressNumber" VARCHAR(10) NOT NULL,
  complement TEXT,
  neighborhood VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  "zipCode" VARCHAR(10) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Contracts
CREATE TABLE sysjuros.contracts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "customerId" INTEGER NOT NULL,
  "contractNumber" VARCHAR(50) NOT NULL UNIQUE,
  type sysjuros.contract_type NOT NULL,
  status sysjuros.contract_status NOT NULL DEFAULT 'open',
  "originalValue" NUMERIC(12,2) NOT NULL,
  "interestRate" NUMERIC(5,2) NOT NULL,
  "interestValue" NUMERIC(12,2) NOT NULL,
  "totalValue" NUMERIC(12,2) NOT NULL,
  "minimumPayment" NUMERIC(12,2),
  "startDate" TIMESTAMP NOT NULL,
  notes TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Installments
CREATE TABLE sysjuros.installments (
  id SERIAL PRIMARY KEY,
  "contractId" INTEGER NOT NULL,
  "installmentNumber" INTEGER NOT NULL,
  "dueDate" TIMESTAMP NOT NULL,
  value NUMERIC(12,2) NOT NULL,
  "paidValue" NUMERIC(12,2) DEFAULT 0,
  status sysjuros.installment_status NOT NULL DEFAULT 'pending',
  "paidDate" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Foreign keys
ALTER TABLE sysjuros.customers ADD CONSTRAINT fk_customers_user FOREIGN KEY ("userId") REFERENCES sysjuros.users(id) ON DELETE CASCADE;
ALTER TABLE sysjuros.contracts ADD CONSTRAINT fk_contracts_user FOREIGN KEY ("userId") REFERENCES sysjuros.users(id) ON DELETE CASCADE;
ALTER TABLE sysjuros.contracts ADD CONSTRAINT fk_contracts_customer FOREIGN KEY ("customerId") REFERENCES sysjuros.customers(id) ON DELETE CASCADE;
ALTER TABLE sysjuros.installments ADD CONSTRAINT fk_installments_contract FOREIGN KEY ("contractId") REFERENCES sysjuros.contracts(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX idx_customers_user ON sysjuros.customers("userId");
CREATE INDEX idx_contracts_user ON sysjuros.contracts("userId");
CREATE INDEX idx_contracts_customer ON sysjuros.contracts("customerId");
CREATE INDEX idx_installments_contract ON sysjuros.installments("contractId");
CREATE INDEX idx_installments_due ON sysjuros.installments("dueDate");
CREATE INDEX idx_installments_status ON sysjuros.installments(status);
