import { isDatabaseConfigured } from "@/server/db-support";
import { requireActivePartCatalogItems } from "@/server/services/service-order-support";
import { billingRepository } from "@/server/repositories/billing-repository";
import { serviceOrderRepository } from "@/server/repositories/service-order-repository";
import { ticketRepository } from "@/server/repositories/ticket-repository";
import { userRepository } from "@/server/repositories/user-repository";

export const serviceOrderService = {
  async listTicketServiceOrders(ticketId: string) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de usar ordens de serviço.");
    }

    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new Error("Chamado não encontrado.");
    }

    return serviceOrderRepository.listByTicketId(ticketId);
  },

  async getTicketServiceOrder(ticketId: string, serviceOrderId: string) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de usar ordens de serviço.");
    }

    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new Error("Chamado não encontrado.");
    }

    const serviceOrder = await serviceOrderRepository.findById(ticketId, serviceOrderId);
    if (!serviceOrder) {
      throw new Error("Ordem de serviço não encontrada.");
    }

    return serviceOrder;
  },

  async createTicketServiceOrder(
    ticketId: string,
    input: {
      serviceType?: string;
      servicePrice?: number;
      assignedTechnicianId?: string;
      scheduledStartAt?: string;
      executionNotes?: string;
      parts?: {
        partCatalogItemId: string;
        quantity: number;
        unitPrice?: number;
        notes?: string;
      }[];
    },
    authorId: string
  ) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de usar ordens de serviço.");
    }

    const [ticket, author] = await Promise.all([ticketRepository.findById(ticketId), userRepository.findById(authorId)]);

    if (!ticket) {
      throw new Error("Chamado não encontrado.");
    }

    if (ticket.status === "CLOSED" || ticket.status === "CANCELED") {
      throw new Error("Não é possível criar ordens de serviço em chamados encerrados ou cancelados.");
    }

    if (!author?.active) {
      throw new Error("Sua sessão não corresponde mais a um usuário ativo. Entre novamente.");
    }

    if (input.assignedTechnicianId) {
      const technician = await userRepository.findById(input.assignedTechnicianId);
      if (!technician || !technician.active) {
        throw new Error("Técnico informado não foi encontrado ou está inativo.");
      }
    }

    const parts = await requireActivePartCatalogItems(input.parts);

    return serviceOrderRepository.create(ticketId, {
      ...input,
      parts,
      createdById: authorId
    });
  },

  async updateTicketServiceOrder(
    ticketId: string,
    serviceOrderId: string,
    input: {
      status: "PLANNED" | "IN_EXECUTION" | "PAUSED" | "COMPLETED" | "CANCELED";
      serviceType?: string;
      servicePrice?: number;
      assignedTechnicianId?: string;
      scheduledStartAt?: string;
      startedAt?: string;
      finishedAt?: string;
      executionNotes?: string;
      customerApprovalName?: string;
      customerApprovalAt?: string;
      parts?: {
        partCatalogItemId: string;
        quantity: number;
        unitPrice?: number;
        notes?: string;
      }[];
    },
    authorId: string
  ) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de usar ordens de serviço.");
    }

    const [ticket, author] = await Promise.all([ticketRepository.findById(ticketId), userRepository.findById(authorId)]);

    if (!ticket) {
      throw new Error("Chamado não encontrado.");
    }

    if (!author?.active) {
      throw new Error("Sua sessão não corresponde mais a um usuário ativo. Entre novamente.");
    }

    if (input.assignedTechnicianId) {
      const technician = await userRepository.findById(input.assignedTechnicianId);
      if (!technician || !technician.active) {
        throw new Error("Técnico informado não foi encontrado ou está inativo.");
      }
    }

    const parts = await requireActivePartCatalogItems(input.parts);

    const serviceOrder = await serviceOrderRepository.update(ticketId, serviceOrderId, {
      ...input,
      parts
    });

    if (!serviceOrder) {
      throw new Error("Ordem de serviço não encontrada.");
    }

    if (input.status === "COMPLETED") {
      await billingRepository.recalculateForTicket(ticketId);
    }

    return serviceOrder;
  },

  async updateAssignedTechnicianServiceOrder(
    ticketId: string,
    serviceOrderId: string,
    input: {
      status: "PLANNED" | "IN_EXECUTION" | "PAUSED" | "COMPLETED";
      executionNotes?: string;
      customerApprovalName?: string;
      customerApprovalAt?: string;
    },
    authorId: string
  ) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de usar ordens de serviço.");
    }

    const [ticket, author, serviceOrder] = await Promise.all([
      ticketRepository.findById(ticketId),
      userRepository.findById(authorId),
      serviceOrderRepository.findById(ticketId, serviceOrderId)
    ]);

    if (!ticket) {
      throw new Error("Chamado não encontrado.");
    }

    if (!serviceOrder) {
      throw new Error("Ordem de serviço não encontrada.");
    }

    if (!author?.active) {
      throw new Error("Sua sessão não corresponde mais a um usuário ativo. Entre novamente.");
    }

    const nextStartedAt =
      input.status === "IN_EXECUTION"
        ? serviceOrder.startedAt ?? new Date().toISOString()
        : serviceOrder.startedAt;

    const nextFinishedAt =
      input.status === "COMPLETED"
        ? serviceOrder.finishedAt ?? new Date().toISOString()
        : input.status === "PLANNED" || input.status === "PAUSED"
          ? undefined
          : serviceOrder.finishedAt;

    const updatedServiceOrder = await serviceOrderRepository.update(ticketId, serviceOrderId, {
      status: input.status,
      serviceType: serviceOrder.serviceType,
      servicePrice: serviceOrder.servicePrice,
      assignedTechnicianId: serviceOrder.assignedTechnicianId,
      scheduledStartAt: serviceOrder.scheduledStartAt,
      startedAt: nextStartedAt,
      finishedAt: nextFinishedAt,
      executionNotes: input.executionNotes || serviceOrder.executionNotes,
      customerApprovalName: input.customerApprovalName || serviceOrder.customerApprovalName,
      customerApprovalAt: input.customerApprovalAt || serviceOrder.customerApprovalAt,
      parts: serviceOrder.parts.map((part) => ({
        partCatalogItemId: part.partCatalogItemId,
        partName: part.partName,
        partCode: part.partCode,
        quantity: part.quantity,
        unitPrice: part.unitPrice,
        notes: part.notes
      }))
    });

    if (!updatedServiceOrder) {
      throw new Error("Ordem de serviço não encontrada.");
    }

    if (input.status === "COMPLETED") {
      await billingRepository.recalculateForTicket(ticketId);
    }

    return updatedServiceOrder;
  },

  async deleteTicketServiceOrder(ticketId: string, serviceOrderId: string) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada.");
    }

    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new Error("Chamado não encontrado.");

    const serviceOrder = await serviceOrderRepository.findById(ticketId, serviceOrderId);
    if (!serviceOrder) throw new Error("Ordem de serviço não encontrada.");

    if (serviceOrder.status !== "PLANNED") {
      throw new Error("Só é possível excluir ordens de serviço com status Planejada.");
    }

    await serviceOrderRepository.delete(ticketId, serviceOrderId);
  }
};
