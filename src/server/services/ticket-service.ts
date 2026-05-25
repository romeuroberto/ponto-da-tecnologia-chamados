import type { TicketInput } from "@/lib/validations/ticket";
import type { TicketPriority, TicketStatus } from "@/types";
import { isDatabaseConfigured } from "@/server/db-support";
import { generateTicketNumber } from "@/server/number-generator";
import { ticketRepository } from "@/server/repositories/ticket-repository";
import { userRepository } from "@/server/repositories/user-repository";
import type { TicketSearchInput } from "@/server/repositories/ticket-repository";

export const ticketService = {
  async listTickets() {
    return ticketRepository.list();
  },
  async searchTickets(filters: TicketSearchInput) {
    return ticketRepository.search(filters);
  },
  async getTicket(id: string) {
    return ticketRepository.findById(id);
  },
  async createTicket(input: TicketInput, openedById: string) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL nao configurada. Configure o banco antes de gravar chamados reais.");
    }

    const openedBy = await userRepository.findById(openedById);

    if (!openedBy?.active) {
      throw new Error("Sua sessao nao corresponde mais a um usuario ativo. Entre novamente.");
    }

    const number = await generateTicketNumber();

    return ticketRepository.create({
      ...input,
      number,
      requesterEmail: input.requesterEmail || undefined,
      assigneeId: input.assigneeId || undefined,
      openedById
    });
  },
  async updateTicketFields(
    id: string,
    input: { status: TicketStatus; priority: TicketPriority; assigneeId?: string; closingReason?: string; title?: string },
    authorId: string
  ) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL nao configurada. Configure o banco antes de atualizar chamados reais.");
    }

    const author = await userRepository.findById(authorId);

    if (!author?.active) {
      throw new Error("Sua sessao nao corresponde mais a um usuario ativo. Entre novamente.");
    }

    const currentTicket = await ticketRepository.findById(id);

    if (!currentTicket) {
      return null;
    }

    if (input.status === "CLOSED") {
      const pendingOrders = currentTicket.serviceOrders.filter(
        (os) => os.status !== "COMPLETED" && os.status !== "CANCELED"
      );
      if (pendingOrders.length > 0) {
        throw new Error(
          `Não é possível finalizar o chamado. ${pendingOrders.length > 1 ? `${pendingOrders.length} ordens de serviço ainda não foram concluídas ou canceladas.` : "Uma ordem de serviço ainda não foi concluída ou cancelada."}`
        );
      }
    }

    const shouldStartTechnicalExecutionAutomatically =
      currentTicket.status === "OPEN" &&
      input.status === "OPEN" &&
      Boolean(input.assigneeId) &&
      currentTicket.assigneeId !== input.assigneeId;

    return ticketRepository.updateFields(id, {
      ...input,
      status: shouldStartTechnicalExecutionAutomatically ? "IN_PROGRESS" : input.status,
      assigneeId: input.assigneeId || undefined,
      title: input.title || undefined,
      authorId
    });
  },
  async checkIn(id: string, authorId: string) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL nao configurada.");
    }

    const author = await userRepository.findById(authorId);

    if (!author?.active) {
      throw new Error("Sua sessao nao corresponde mais a um usuario ativo. Entre novamente.");
    }

    const result = await ticketRepository.checkIn(id, authorId);

    if (result === null) {
      throw new Error("Chamado não encontrado ou check-in já registrado.");
    }

    return result;
  },

  async checkOut(id: string, authorId: string) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL nao configurada.");
    }

    const author = await userRepository.findById(authorId);

    if (!author?.active) {
      throw new Error("Sua sessao nao corresponde mais a um usuario ativo. Entre novamente.");
    }

    const result = await ticketRepository.checkOut(id, authorId);

    if (result === null) {
      throw new Error("Chamado não encontrado, check-in não realizado ou check-out já registrado.");
    }

    return result;
  },

  async addComment(id: string, message: string, authorId: string) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL nao configurada. Configure o banco antes de comentar em chamados reais.");
    }

    const author = await userRepository.findById(authorId);

    if (!author?.active) {
      throw new Error("Sua sessao nao corresponde mais a um usuario ativo. Entre novamente.");
    }

    return ticketRepository.addComment(id, message, authorId);
  },
  async addAttachment(
    id: string,
    input: { fileName: string; filePath: string; mimeType: string; sizeBytes: number },
    authorId: string
  ) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL nao configurada. Configure o banco antes de enviar anexos reais.");
    }

    const author = await userRepository.findById(authorId);

    if (!author?.active) {
      throw new Error("Sua sessao nao corresponde mais a um usuario ativo. Entre novamente.");
    }

    return ticketRepository.addAttachment({
      ticketId: id,
      authorId,
      ...input
    });
  },
  async claimTicket(id: string, technicianId: string) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL nao configurada. Configure o banco antes de operar chamados reais.");
    }

    const technician = await userRepository.findById(technicianId);

    if (!technician?.active || technician.role !== "TECHNICIAN") {
      throw new Error("Sua sessao nao corresponde a um tecnico ativo.");
    }

    const currentTicket = await ticketRepository.findById(id);

    if (!currentTicket) {
      return null;
    }

    if (currentTicket.status === "CLOSED" || currentTicket.status === "CANCELED") {
      throw new Error("Nao e possivel assumir chamados encerrados ou cancelados.");
    }

    return ticketRepository.claimByTechnician(id, technicianId);
  }
};
