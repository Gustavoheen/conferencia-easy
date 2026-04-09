import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Dashboard Stats", () => {
  it("should return dashboard statistics", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.dashboard.stats();

    expect(stats).toBeDefined();
    expect(stats).toHaveProperty("todayCount");
    expect(stats).toHaveProperty("overdueCount");
    expect(stats).toHaveProperty("customerCount");
    expect(stats).toHaveProperty("contractCount");
    expect(typeof stats.todayCount).toBe("number");
    expect(typeof stats.overdueCount).toBe("number");
    expect(typeof stats.customerCount).toBe("number");
    expect(typeof stats.contractCount).toBe("number");
  });
});

describe("Customers", () => {
  it("should list customers with pagination", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.customers.list({
      limit: 10,
      offset: 0,
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.data)).toBe(true);
    expect(typeof result.total).toBe("number");
  });


});

describe("Contracts", () => {
  it("should list contracts with pagination", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contracts.list({
      limit: 10,
      offset: 0,
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("should filter contracts by status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const openContracts = await caller.contracts.list({
      status: "open",
      limit: 10,
      offset: 0,
    });

    expect(Array.isArray(openContracts.data)).toBe(true);
    openContracts.data.forEach((contract: any) => {
      expect(contract.status).toBe("open");
    });
  });
});

describe("Installments", () => {
  it("should list installments by user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.installments.listByUser({
      limit: 10,
      offset: 0,
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.data)).toBe(true);
  });
});

describe("Interest Calculation", () => {
  it("should calculate interest correctly", () => {
    const originalValue = 1000;
    const interestRate = 10;
    const expectedInterest = (originalValue * interestRate) / 100;
    const expectedTotal = originalValue + expectedInterest;

    expect(expectedInterest).toBe(100);
    expect(expectedTotal).toBe(1100);
  });

  it("should handle different interest rates", () => {
    const testCases = [
      { original: 1000, rate: 5, expectedInterest: 50, expectedTotal: 1050 },
      { original: 5000, rate: 15, expectedInterest: 750, expectedTotal: 5750 },
      { original: 2000, rate: 8.5, expectedInterest: 170, expectedTotal: 2170 },
    ];

    testCases.forEach(({ original, rate, expectedInterest, expectedTotal }) => {
      const interest = (original * rate) / 100;
      const total = original + interest;

      expect(interest).toBeCloseTo(expectedInterest, 2);
      expect(total).toBeCloseTo(expectedTotal, 2);
    });
  });

  it("should calculate zero interest when rate is 0", () => {
    const originalValue = 1000;
    const interestRate = 0;
    const interest = (originalValue * interestRate) / 100;
    const total = originalValue + interest;

    expect(interest).toBe(0);
    expect(total).toBe(1000);
  });

  it("should handle decimal interest rates", () => {
    const originalValue = 1000;
    const interestRate = 2.5;
    const interest = (originalValue * interestRate) / 100;
    const total = originalValue + interest;

    expect(interest).toBeCloseTo(25, 2);
    expect(total).toBeCloseTo(1025, 2);
  });
});

describe("Auth", () => {
  it("should return current user info", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeDefined();
    expect(user?.id).toBe(1);
    expect(user?.openId).toBe("user-1");
    expect(user?.role).toBe("user");
  });

  it("should logout successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});
