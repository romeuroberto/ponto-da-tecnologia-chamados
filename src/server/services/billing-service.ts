import { isDatabaseConfigured } from "@/server/db-support";
import { billingRepository } from "@/server/repositories/billing-repository";
import { ticketRepository } from "@/server/repositories/ticket-repository";
import { userRepository } from "@/server/repositories/user-repository";

export const billingService = {
  async getTicketBilling(ticketId: string) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de usar o financeiro.");
    }

    return billingRepository.findByTicketId(ticketId);
  },

  async saveTicketBilling(
    ticketId: string,
    input: {
      billingType: "AVULSO" | "CONTRATO" | "GARANTIA" | "CORTESIA";
      financialStatus: "PENDENTE" | "EM_ANALISE" | "APROVADO" | "FATURADO" | "PAGO" | "CANCELADO";
      discountAmount: number;
      internalNotes?: string;
    },
    authorId: string
  ) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de usar o financeiro.");
    }

    const [ticket, author] = await Promise.all([ticketRepository.findById(ticketId), userRepository.findById(authorId)]);

    if (!ticket) {
      throw new Error("Chamado não encontrado.");
    }

    if (!author?.active) {
      throw new Error("Sua sessão não corresponde mais a um usuário ativo. Entre novamente.");
    }

    return billingRepository.upsertByTicketId(ticketId, {
      ...input,
      authorId
    });
  },

  async addBillingEntry(
    ticketId: string,
    input: {
      entryType: "LABOR" | "PART" | "TRAVEL" | "EXTRA";
      description: string;
      quantity: number;
      unitPrice: number;
      billable: boolean;
    },
    authorId: string
  ) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de usar o financeiro.");
    }

    const [ticket, author] = await Promise.all([ticketRepository.findById(ticketId), userRepository.findById(authorId)]);

    if (!ticket) {
      throw new Error("Chamado não encontrado.");
    }

    if (!author?.active) {
      throw new Error("Sua sessão não corresponde mais a um usuário ativo. Entre novamente.");
    }

    return billingRepository.addEntry(ticketId, {
      ...input,
      createdById: authorId
    });
  },

  async updateBillingEntry(
    ticketId: string,
    entryId: string,
    input: {
      entryType: "LABOR" | "PART" | "TRAVEL" | "EXTRA";
      description: string;
      quantity: number;
      unitPrice: number;
      billable: boolean;
    },
    authorId: string
  ) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de usar o financeiro.");
    }

    const [ticket, author] = await Promise.all([ticketRepository.findById(ticketId), userRepository.findById(authorId)]);

    if (!ticket) {
      throw new Error("Chamado não encontrado.");
    }

    if (!author?.active) {
      throw new Error("Sua sessão não corresponde mais a um usuário ativo. Entre novamente.");
    }

    const billing = await billingRepository.updateEntry(ticketId, entryId, {
      ...input,
      authorId
    });

    if (!billing) {
      throw new Error("Lançamento financeiro não encontrado.");
    }

    return billing;
  },

  async deleteBillingEntry(ticketId: string, entryId: string, authorId: string) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de usar o financeiro.");
    }

    const [ticket, author] = await Promise.all([ticketRepository.findById(ticketId), userRepository.findById(authorId)]);

    if (!ticket) {
      throw new Error("Chamado não encontrado.");
    }

    if (!author?.active) {
      throw new Error("Sua sessão não corresponde mais a um usuário ativo. Entre novamente.");
    }

    const billing = await billingRepository.deleteEntry(ticketId, entryId, authorId);

    if (!billing) {
      throw new Error("Lançamento financeiro não encontrado.");
    }

    return billing;
  }
};
