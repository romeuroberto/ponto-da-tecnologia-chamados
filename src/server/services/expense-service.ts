import type { ExpenseCategory, ExpenseStatus } from "@/types";
import { isDatabaseConfigured } from "@/server/db-support";
import { expenseRepository } from "@/server/repositories/expense-repository";
import { ticketRepository } from "@/server/repositories/ticket-repository";
import { userRepository } from "@/server/repositories/user-repository";

async function ensureActiveUser(userId: string) {
  const user = await userRepository.findById(userId);
  if (!user?.active) {
    throw new Error("Sua sessao nao corresponde mais a um usuario ativo. Entre novamente.");
  }
}

async function ensureTicketExists(ticketId?: string) {
  if (!ticketId) return;
  const ticket = await ticketRepository.findById(ticketId);
  if (!ticket) {
    throw new Error("Chamado vinculado nao encontrado.");
  }
}

export const expenseService = {
  async listExpenses(input: {
    from?: string;
    to?: string;
    status?: ExpenseStatus;
    category?: ExpenseCategory;
    ticketId?: string;
    linked?: "linked" | "unlinked";
    query?: string;
    sort?: "expense_desc" | "expense_asc" | "amount_desc" | "amount_asc" | "created_desc" | "created_asc";
  } = {}) {
    if (!isDatabaseConfigured()) {
      return [];
    }

    return expenseRepository.list(input);
  },

  async searchExpenses(input: {
    from?: string;
    to?: string;
    status?: ExpenseStatus;
    category?: ExpenseCategory;
    ticketId?: string;
    linked?: "linked" | "unlinked";
    query?: string;
    sort?: "expense_desc" | "expense_asc" | "amount_desc" | "amount_asc" | "created_desc" | "created_asc";
    page?: string | number;
    pageSize?: string | number;
  } = {}) {
    if (!isDatabaseConfigured()) {
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 1
      };
    }

    return expenseRepository.search(input);
  },

  async getExpense(id: string) {
    if (!isDatabaseConfigured()) {
      return null;
    }

    return expenseRepository.findById(id);
  },

  async getSummary(input: {
    from?: string;
    to?: string;
    status?: ExpenseStatus;
    category?: ExpenseCategory;
    ticketId?: string;
    linked?: "linked" | "unlinked";
    query?: string;
  } = {}) {
    if (!isDatabaseConfigured()) {
      return {
        totalCount: 0,
        pendingCount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        byCategory: []
      };
    }

    return expenseRepository.getSummary(input);
  },

  async createExpense(input: {
    description: string;
    category: ExpenseCategory;
    amount: number;
    expenseDate: string;
    paymentMethod?: string;
    notes?: string;
    ticketId?: string;
    createdById: string;
  }) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL nao configurada. Configure o banco antes de lancar despesas.");
    }

    await Promise.all([ensureActiveUser(input.createdById), ensureTicketExists(input.ticketId)]);

    return expenseRepository.create(input);
  },

  async updateExpense(
    id: string,
    input: {
      description: string;
      category: ExpenseCategory;
      amount: number;
      expenseDate: string;
      paymentMethod?: string;
      notes?: string;
      ticketId?: string;
    },
    authorId: string
  ) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL nao configurada. Configure o banco antes de editar despesas.");
    }

    await Promise.all([ensureActiveUser(authorId), ensureTicketExists(input.ticketId)]);

    const expense = await expenseRepository.update(id, input);
    if (!expense) {
      throw new Error("Despesa nao encontrada ou ja cancelada.");
    }

    return expense;
  },

  async payExpense(id: string, input: { paidAt: string; paymentMethod?: string }, authorId: string) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL nao configurada. Configure o banco antes de pagar despesas.");
    }

    await ensureActiveUser(authorId);

    const expense = await expenseRepository.markAsPaid(id, input);
    if (!expense) {
      throw new Error("Despesa nao encontrada ou cancelada.");
    }

    return expense;
  },

  async cancelExpense(id: string, input: { cancellationReason: string }, authorId: string) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL nao configurada. Configure o banco antes de cancelar despesas.");
    }

    await ensureActiveUser(authorId);

    const expense = await expenseRepository.cancel(id, input);
    if (!expense) {
      throw new Error("Despesa nao encontrada ou ja paga.");
    }

    return expense;
  }
};
