import { COOKIE_NAME, SESSION_DURATION_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  getCustomersByUserId,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getContractsByUserId,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
  getInstallmentsByContractId,
  getInstallmentsByUserId,
  createInstallment,
  updateInstallment,
  getDashboardStats,
  getLastInstallmentNumber,
  getInstallmentById,
  createUser,
  getUserByEmail,
  updateUser,
  getAllUsers,
  deleteUser,
  updateUserPassword,
  deletePendingInstallments,
  getPendingInstallmentsCount,
  getContractsByCustomerIdWithSummary,
  getContractWithInstallments,
  getInvestmentStats,
  getMasterStats,
  markOverdueInstallments,
  processInstallmentPayment,
  revertInstallmentPayment,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => {
      if (!opts.ctx.user) return null;
      const { password, ...safeUser } = opts.ctx.user;
      return safeUser;
    }),

    register: publicProcedure
      .input(z.object({
        name: z.string().min(2, "Nome muito curto"),
        email: z.string().email("Email inválido"),
        password: z.string().min(8, "Senha mínimo 8 caracteres"),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getUserByEmail(input.email);
        if (existing) throw new Error("Email já cadastrado");

        const hashed = await bcrypt.hash(input.password, 10);
        const user = await createUser({ name: input.name, email: input.email, password: hashed });
        if (!user) throw new Error("Erro ao criar usuário");

        const token = await sdk.createSessionToken(user.id, user.email!, user.name || "");
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: SESSION_DURATION_MS });
        return { success: true };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByEmail(input.email);
        if (!user) throw new Error("Email ou senha incorretos");

        const valid = await bcrypt.compare(input.password, user.password);
        if (!valid) throw new Error("Email ou senha incorretos");

        const token = await sdk.createSessionToken(user.id, user.email!, user.name || "");
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: SESSION_DURATION_MS });
        return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(2).optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return updateUser(ctx.user.id, input);
      }),
  }),

  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return getDashboardStats(ctx.user.id);
    }),
    investmentStats: protectedProcedure.query(async ({ ctx }) => {
      return getInvestmentStats(ctx.user.id);
    }),
    masterStats: adminProcedure.query(async () => {
      return getMasterStats();
    }),
  }),

  customers: router({
    list: protectedProcedure
      .input(
        z.object({
          search: z.string().optional(),
          limit: z.number().max(100).default(10),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        return getCustomersByUserId(ctx.user.id, input.search, input.limit, input.offset);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const customer = await getCustomerById(input.id);
        if (!customer) throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente não encontrado' });
        if (customer.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        return customer;
      }),

    getDetailById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const customer = await getCustomerById(input.id);
        if (!customer) throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente não encontrado' });
        if (customer.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        const contractsList = await getContractsByCustomerIdWithSummary(input.id);
        return { customer, contracts: contractsList };
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email().optional().or(z.literal("")),
          phone: z.string().optional(),
          cpfCnpj: z.string().optional(),
          birthDate: z.string().optional(),
          address: z.string().optional(),
          addressNumber: z.string().optional(),
          complement: z.string().optional(),
          neighborhood: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createCustomer({
          userId: ctx.user.id,
          ...input,
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          cpfCnpj: z.string().optional(),
          birthDate: z.string().optional(),
          address: z.string().optional(),
          addressNumber: z.string().optional(),
          complement: z.string().optional(),
          neighborhood: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const customer = await getCustomerById(input.id);
        if (!customer) throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente não encontrado' });
        if (customer.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        const { id, ...data } = input;
        return updateCustomer(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const customer = await getCustomerById(input.id);
        if (!customer) throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente não encontrado' });
        if (customer.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        return deleteCustomer(input.id);
      }),
  }),

  contracts: router({
    list: protectedProcedure
      .input(
        z.object({
          customerId: z.number().optional(),
          status: z.enum(["open", "closed"]).optional(),
          limit: z.number().max(100).default(10),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        return getContractsByUserId(ctx.user.id, input.customerId, input.status, input.limit, input.offset);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const contract = await getContractById(input.id);
        if (!contract) throw new TRPCError({ code: 'NOT_FOUND', message: 'Contrato não encontrado' });
        if (contract.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        return contract;
      }),

    getDetailById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const contract = await getContractById(input.id);
        if (!contract) throw new TRPCError({ code: 'NOT_FOUND', message: 'Contrato não encontrado' });
        if (contract.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        const data = await getContractWithInstallments(input.id);
        if (!data) throw new TRPCError({ code: 'NOT_FOUND', message: 'Contrato não encontrado' });
        return data;
      }),

    create: protectedProcedure
      .input(
        z.object({
          customerId: z.number(),
          contractNumber: z.string().min(1),
          type: z.enum(["fixed", "installment", "revolving", "sac"]),
          originalValue: z.string(),
          interestRate: z.string(),
          interestValue: z.string(),
          totalValue: z.string(),
          minimumPayment: z.string().optional(),
          startDate: z.date(),
          notes: z.string().optional(),
          installmentCount: z.number().min(1).default(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { installmentCount, ...contractData } = input;
        const minimumPayment = (parseFloat(input.originalValue) * parseFloat(input.interestRate) / 100).toFixed(2);
        const result = await createContract({
          userId: ctx.user.id,
          ...contractData,
          minimumPayment,
        });
        const contractId = (result as any).id as number;

        const originalValue = parseFloat(input.originalValue);
        const interestRate = parseFloat(input.interestRate);
        const startDate = new Date(input.startDate);

        if (input.type === "installment") {
          // Juros simples: mesmo juro em todas as parcelas sobre o valor original
          const n = installmentCount;
          const installmentValue = (originalValue / n) + (originalValue * interestRate / 100);
          for (let i = 1; i <= n; i++) {
            const dueDate = new Date(startDate);
            dueDate.setMonth(dueDate.getMonth() + i);
            await createInstallment({
              contractId,
              installmentNumber: i,
              dueDate,
              value: installmentValue.toFixed(2),
            });
          }
        } else if (input.type === "sac") {
          // SAC: amortização fixa + juros sobre saldo devedor remanescente
          const n = installmentCount;
          const amortization = originalValue / n;
          for (let i = 1; i <= n; i++) {
            const remainingBalance = originalValue - amortization * (i - 1);
            const interest = remainingBalance * interestRate / 100;
            const installmentValue = amortization + interest;
            const dueDate = new Date(startDate);
            dueDate.setMonth(dueDate.getMonth() + i);
            await createInstallment({
              contractId,
              installmentNumber: i,
              dueDate,
              value: installmentValue.toFixed(2),
            });
          }
        } else if (input.type === "revolving") {
          // Gera apenas a primeira parcela (próximo mês)
          // As demais são geradas automaticamente quando cada parcela é paga
          const monthlyInterest = originalValue * interestRate / 100;
          const dueDate = new Date(startDate);
          dueDate.setMonth(dueDate.getMonth() + 1);
          await createInstallment({
            contractId,
            installmentNumber: 1,
            dueDate,
            value: monthlyInterest.toFixed(2),
          });
        }

        return result;
      }),

    generateMonthlyInterest: protectedProcedure
      .input(
        z.object({
          contractId: z.number(),
          months: z.number().default(12),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const contract = await getContractById(input.contractId);
        if (!contract) throw new TRPCError({ code: 'NOT_FOUND', message: 'Contrato não encontrado' });
        if (contract.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });

        const lastNumber = await getLastInstallmentNumber(input.contractId);
        const originalValue = parseFloat(contract.originalValue);
        const interestRate = parseFloat(contract.interestRate);
        const monthlyInterest = originalValue * interestRate / 100;

        const baseDate = new Date();
        for (let i = 1; i <= input.months; i++) {
          const dueDate = new Date(baseDate);
          dueDate.setMonth(dueDate.getMonth() + i);
          await createInstallment({
            contractId: input.contractId,
            installmentNumber: lastNumber + i,
            dueDate,
            value: monthlyInterest.toFixed(2),
          });
        }

        return { generated: input.months };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["open", "closed"]).optional(),
          notes: z.string().optional(),
          type: z.enum(["fixed", "installment", "revolving", "sac"]).optional(),
          originalValue: z.string().optional(),
          interestRate: z.string().optional(),
          interestValue: z.string().optional(),
          totalValue: z.string().optional(),
          startDate: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const contract = await getContractById(input.id);
        if (!contract) throw new TRPCError({ code: 'NOT_FOUND', message: 'Contrato não encontrado' });
        if (contract.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        const { id, ...data } = input;
        return updateContract(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const contract = await getContractById(input.id);
        if (!contract) throw new TRPCError({ code: 'NOT_FOUND', message: 'Contrato não encontrado' });
        if (contract.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        return deleteContract(input.id);
      }),
  }),

  installments: router({
    listByContract: protectedProcedure
      .input(z.object({ contractId: z.number() }))
      .query(async ({ ctx, input }) => {
        const contract = await getContractById(input.contractId);
        if (!contract) throw new TRPCError({ code: 'NOT_FOUND', message: 'Contrato não encontrado' });
        if (contract.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        return getInstallmentsByContractId(input.contractId);
      }),

    listByUser: protectedProcedure
      .input(
        z.object({
          limit: z.number().max(100).default(10),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        await markOverdueInstallments();
        return getInstallmentsByUserId(ctx.user.id, input.limit, input.offset);
      }),

    create: protectedProcedure
      .input(
        z.object({
          contractId: z.number(),
          installmentNumber: z.number(),
          dueDate: z.date(),
          value: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const contract = await getContractById(input.contractId);
        if (!contract) throw new TRPCError({ code: 'NOT_FOUND', message: 'Contrato não encontrado' });
        if (contract.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        return createInstallment(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        dueDate: z.date().optional(),
        value: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const installment = await getInstallmentById(input.id);
        if (!installment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Parcela não encontrada' });
        const contract = await getContractById(installment.contractId);
        if (!contract) throw new TRPCError({ code: 'NOT_FOUND', message: 'Contrato não encontrado' });
        if (contract.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        const { id, ...data } = input;
        return updateInstallment(id, data);
      }),

    markAsPaid: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          paidValue: z.string(),
          capitalPaid: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const installment = await getInstallmentById(input.id);
        if (!installment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Parcela não encontrada' });
        const contract = await getContractById(installment.contractId);
        if (!contract) throw new TRPCError({ code: 'NOT_FOUND', message: 'Contrato não encontrado' });
        if (contract.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });

        return processInstallmentPayment(
          input.id,
          parseFloat(input.paidValue),
          parseFloat(input.capitalPaid || "0"),
        );
      }),

    revertPayment: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const installment = await getInstallmentById(input.id);
        if (!installment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Parcela não encontrada' });
        const contract = await getContractById(installment.contractId);
        if (!contract) throw new TRPCError({ code: 'NOT_FOUND', message: 'Contrato não encontrado' });
        if (contract.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        return revertInstallmentPayment(input.id);
      }),
  }),

  admin: router({
    listUsers: adminProcedure.query(async () => {
      return getAllUsers();
    }),

    createUser: adminProcedure
      .input(z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
      }))
      .mutation(async ({ input }) => {
        const existing = await getUserByEmail(input.email);
        if (existing) throw new Error("Email já cadastrado");
        const hashed = await bcrypt.hash(input.password, 10);
        const user = await createUser({ name: input.name, email: input.email, password: hashed });
        if (!user) throw new Error("Erro ao criar usuário");
        return { success: true, user: { id: user.id, name: user.name, email: user.email } };
      }),

    deleteUser: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (input.userId === ctx.user.id) throw new Error("Você não pode excluir sua própria conta");
        await deleteUser(input.userId);
        return { success: true };
      }),

    resetPassword: adminProcedure
      .input(z.object({ userId: z.number(), password: z.string().min(8) }))
      .mutation(async ({ input }) => {
        const hashed = await bcrypt.hash(input.password, 10);
        await updateUserPassword(input.userId, hashed);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
