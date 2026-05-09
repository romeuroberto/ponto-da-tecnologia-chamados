import type { BillingEntryType, FinancialStatus } from "@/types";
import { isDatabaseConfigured } from "@/server/db-support";
import { billingRepository } from "@/server/repositories/billing-repository";
import { ticketRepository } from "@/server/repositories/ticket-repository";
import { userRepository } from "@/server/repositories/user-repository";

export const billingService = {
  async listBillings(input: { financialStatus?: FinancialStatus } = {}) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada.");
    }
    return billingRepository.listAll(input);
  },

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
      invoiceNumber?: string;
      invoiceDueDate?: string;
      paymentMethod?: string;
      paymentDate?: string;
      paymentReference?: string;
      cancellationReason?: string;
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

    const TERMINAL_TECHNICAL_STATUSES = ["RESOLVED", "CLOSED", "CANCELED"];
    const REQUIRES_TERMINAL_TECHNICAL = ["FATURADO", "PAGO"];

    if (
      REQUIRES_TERMINAL_TECHNICAL.includes(input.financialStatus) &&
      !TERMINAL_TECHNICAL_STATUSES.includes(ticket.status)
    ) {
      throw new Error(
        "O chamado precisa estar tecnicamente concluído (Resolvido ou Encerrado) antes de registrar cobrança ou pagamento."
      );
    }

    return billingRepository.upsertByTicketId(ticketId, {
      ...input,
      authorId
    });
  },

  async addBillingEntry(
    ticketId: string,
    input: {
      entryType: BillingEntryType;
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
      entryType: BillingEntryType;
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
