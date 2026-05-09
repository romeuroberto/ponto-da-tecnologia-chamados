import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { Expense, ExpenseCategory, PaginationResult } from "@/types";
import { expenseInclude, mapExpense } from "@/server/mappers";
import { normalizeOptionalString } from "@/server/db-support";
import { buildPaginationResult, getPagination } from "@/server/pagination";

export interface ExpenseListInput {
  from?: string;
  to?: string;
  status?: Expense["status"];
  category?: ExpenseCategory;
  ticketId?: string;
  linked?: "linked" | "unlinked";
  query?: string;
  sort?: "expense_desc" | "expense_asc" | "amount_desc" | "amount_asc" | "created_desc" | "created_asc";
  page?: string | number;
  pageSize?: string | number;
}

export interface ExpenseSummary {
  totalCount: number;
  pendingCount: number;
  paidAmount: number;
  pendingAmount: number;
  byCategory: Array<{
    category: ExpenseCategory;
    amount: number;
    total: number;
  }>;
}

export interface CreateExpenseInput {
  description: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  paymentMethod?: string;
  notes?: string;
  ticketId?: string;
  createdById: string;
}

export interface UpdateExpenseInput {
  description: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  paymentMethod?: string;
  notes?: string;
  ticketId?: string;
}

function toMoney(value: number) {
  return Number(value.toFixed(2));
}

function toDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

function isMissingExpenseTableError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021" && error.message.includes("Expense");
}

async function runExpenseQuery<T>(query: () => Promise<T>, fallback: () => T | Promise<T>) {
  try {
    return await query();
  } catch (error) {
    if (isMissingExpenseTableError(error)) {
      return fallback();
    }

    throw error;
  }
}

function createMissingExpenseTableError() {
  return new Error("A tabela de despesas ainda nao existe no banco atual. Rode a migration do modulo financeiro antes de usar esta funcionalidade.");
}

function buildOrderBy(sort?: ExpenseListInput["sort"]) {
  switch (sort) {
    case "expense_asc":
      return [{ expenseDate: "asc" as const }, { createdAt: "asc" as const }];
    case "amount_desc":
      return [{ amount: "desc" as const }, { expenseDate: "desc" as const }];
    case "amount_asc":
      return [{ amount: "asc" as const }, { expenseDate: "desc" as const }];
    case "created_desc":
      return [{ createdAt: "desc" as const }];
    case "created_asc":
      return [{ createdAt: "asc" as const }];
    case "expense_desc":
    default:
      return [{ expenseDate: "desc" as const }, { createdAt: "desc" as const }];
  }
}

function buildWhere(input: ExpenseListInput) {
  return {
    ...(input.status ? { status: input.status } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.ticketId ? { ticketId: input.ticketId } : {}),
    ...(input.linked === "linked" ? { ticketId: { not: null } } : {}),
    ...(input.linked === "unlinked" ? { ticketId: null } : {}),
    ...(input.query
      ? {
          OR: [
            { description: { contains: input.query, mode: "insensitive" as const } },
            { ticket: { title: { contains: input.query, mode: "insensitive" as const } } },
            { ticket: { number: { contains: input.query, mode: "insensitive" as const } } }
          ]
        }
      : {}),
    ...(input.from || input.to
      ? {
          expenseDate: {
            ...(input.from ? { gte: new Date(`${input.from}T00:00:00`) } : {}),
            ...(input.to ? { lte: new Date(`${input.to}T23:59:59.999`) } : {})
          }
        }
      : {})
  };
}

export const expenseRepository = {
  async list(input: ExpenseListInput = {}): Promise<Expense[]> {
    const records = await runExpenseQuery(
      () =>
        prisma.expense.findMany({
          where: buildWhere(input),
          include: expenseInclude,
          orderBy: buildOrderBy(input.sort)
        }),
      () => []
    );

    return records.map(mapExpense);
  },

  async search(input: ExpenseListInput = {}): Promise<PaginationResult<Expense>> {
    const { page, pageSize, skip } = getPagination(input.page, input.pageSize);
    const where = buildWhere(input);
    const orderBy = buildOrderBy(input.sort);

    const [records, total] = await runExpenseQuery(
      () =>
        Promise.all([
          prisma.expense.findMany({
            where,
            include: expenseInclude,
            orderBy,
            skip,
            take: pageSize
          }),
          prisma.expense.count({ where })
        ]),
      () => [[], 0] as [Array<Awaited<ReturnType<typeof prisma.expense.findMany>>[number]>, number]
    );

    return buildPaginationResult(
      (records as unknown as Array<Parameters<typeof mapExpense>[0]>).map(mapExpense),
      total,
      page,
      pageSize
    );
  },

  async findById(id: string): Promise<Expense | null> {
    const record = await runExpenseQuery(
      () =>
        prisma.expense.findUnique({
          where: { id },
          include: expenseInclude
        }),
      () => null
    );

    return record ? mapExpense(record) : null;
  },

  async create(input: CreateExpenseInput): Promise<Expense> {
    const record = await runExpenseQuery(
      () =>
        prisma.expense.create({
          data: {
            description: input.description,
            category: input.category,
            amount: toMoney(input.amount),
            expenseDate: toDate(input.expenseDate),
            paymentMethod: normalizeOptionalString(input.paymentMethod) ?? null,
            notes: normalizeOptionalString(input.notes) ?? null,
            ticketId: normalizeOptionalString(input.ticketId) ?? null,
            createdById: input.createdById
          },
          include: expenseInclude
        }),
      () => {
        throw createMissingExpenseTableError();
      }
    );

    return mapExpense(record);
  },

  async update(id: string, input: UpdateExpenseInput): Promise<Expense | null> {
    const current = await runExpenseQuery(
      () =>
        prisma.expense.findUnique({
          where: { id },
          select: { id: true, status: true }
        }),
      () => {
        throw createMissingExpenseTableError();
      }
    );

    if (!current || current.status === "CANCELADA" || current.status === "PAGA") {
      return null;
    }

    const record = await runExpenseQuery(
      () =>
        prisma.expense.update({
          where: { id },
          data: {
            description: input.description,
            category: input.category,
            amount: toMoney(input.amount),
            expenseDate: toDate(input.expenseDate),
            paymentMethod: normalizeOptionalString(input.paymentMethod) ?? null,
            notes: normalizeOptionalString(input.notes) ?? null,
            ticketId: normalizeOptionalString(input.ticketId) ?? null
          },
          include: expenseInclude
        }),
      () => {
        throw createMissingExpenseTableError();
      }
    );

    return mapExpense(record);
  },

  async markAsPaid(id: string, input: { paidAt: string; paymentMethod?: string }): Promise<Expense | null> {
    const current = await runExpenseQuery(
      () =>
        prisma.expense.findUnique({
          where: { id },
          select: { id: true, status: true }
        }),
      () => {
        throw createMissingExpenseTableError();
      }
    );

    if (!current || current.status === "CANCELADA") {
      return null;
    }

    const record = await runExpenseQuery(
      () =>
        prisma.expense.update({
          where: { id },
          data: {
            status: "PAGA",
            paidAt: toDate(input.paidAt),
            paymentMethod: normalizeOptionalString(input.paymentMethod) ?? null,
            canceledAt: null,
            cancellationReason: null
          },
          include: expenseInclude
        }),
      () => {
        throw createMissingExpenseTableError();
      }
    );

    return mapExpense(record);
  },

  async cancel(id: string, input: { cancellationReason: string }): Promise<Expense | null> {
    const current = await runExpenseQuery(
      () =>
        prisma.expense.findUnique({
          where: { id },
          select: { id: true, status: true }
        }),
      () => {
        throw createMissingExpenseTableError();
      }
    );

    if (!current || current.status === "PAGA") {
      return null;
    }

    const record = await runExpenseQuery(
      () =>
        prisma.expense.update({
          where: { id },
          data: {
            status: "CANCELADA",
            canceledAt: new Date(),
            cancellationReason: input.cancellationReason
          },
          include: expenseInclude
        }),
      () => {
        throw createMissingExpenseTableError();
      }
    );

    return mapExpense(record);
  },

  async getSummary(input: ExpenseListInput = {}): Promise<ExpenseSummary> {
    const expenses = await this.list(input);
    const paid = expenses.filter((expense) => expense.status === "PAGA");
    const pending = expenses.filter((expense) => expense.status === "PENDENTE");
    const byCategory = Array.from(
      expenses.reduce((map, expense) => {
        const current = map.get(expense.category) ?? { category: expense.category, amount: 0, total: 0 };
        if (expense.status !== "CANCELADA") {
          current.amount += expense.amount;
        }
        current.total += 1;
        map.set(expense.category, current);
        return map;
      }, new Map<ExpenseCategory, { category: ExpenseCategory; amount: number; total: number }>()),
      ([, value]) => ({
        category: value.category,
        amount: Number(value.amount.toFixed(2)),
        total: value.total
      })
    ).sort((left, right) => right.amount - left.amount);

    return {
      totalCount: expenses.length,
      pendingCount: pending.length,
      paidAmount: Number(paid.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)),
      pendingAmount: Number(pending.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)),
      byCategory
    };
  }
};
