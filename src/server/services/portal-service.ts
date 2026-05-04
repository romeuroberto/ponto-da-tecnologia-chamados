import type { BillingListItem } from "@/server/repositories/billing-repository";
import { billingRepository } from "@/server/repositories/billing-repository";
import { fiscalDocumentRepository } from "@/server/repositories/fiscal-document-repository";
import { paymentInstructionRepository } from "@/server/repositories/payment-instruction-repository";
import { clientService } from "@/server/services/client-service";
import { saleService } from "@/server/services/sale-service";
import { ticketService } from "@/server/services/ticket-service";
import type { FiscalDocument, FinancialStatus, Sale, Ticket } from "@/types";

export interface PortalFinancialRecord {
  id: string;
  kind: "ticket" | "sale";
  number: string;
  title: string;
  status: FinancialStatus;
  totalAmount: number;
  createdAt: string;
  dueDate?: string;
  paidAt?: string;
  paymentMethod?: string;
  documentCount: number;
}

function isPendingStatus(status: FinancialStatus) {
  return status !== "PAGO" && status !== "CANCELADO";
}

function isOverdue(item: { status: FinancialStatus; dueDate?: string }) {
  if (item.status !== "FATURADO" || !item.dueDate) {
    return false;
  }

  return new Date(item.dueDate).getTime() < Date.now();
}

function countLinkedDocuments(documents: FiscalDocument[], matcher: (document: FiscalDocument) => boolean) {
  return documents.filter(matcher).length;
}

function mapBillingRecord(record: BillingListItem, documents: FiscalDocument[]): PortalFinancialRecord {
  return {
    id: record.ticketId,
    kind: "ticket",
    number: record.ticketNumber,
    title: record.ticketTitle,
    status: record.financialStatus,
    totalAmount: record.totalAmount,
    createdAt: record.updatedAt,
    dueDate: record.invoiceDueDate,
    documentCount: countLinkedDocuments(documents, (document) =>
      document.links.some((link) => link.ticketId === record.ticketId)
    )
  };
}

function mapSaleRecord(sale: Sale, documents: FiscalDocument[]): PortalFinancialRecord {
  return {
    id: sale.id,
    kind: "sale",
    number: sale.number,
    title: `${sale.items.length} item(s)`,
    status: sale.financialStatus,
    totalAmount: sale.totalAmount,
    createdAt: sale.createdAt,
    paidAt: sale.paidAt,
    paymentMethod: sale.paymentMethod,
    documentCount: countLinkedDocuments(documents, (document) =>
      document.links.some((link) => link.saleId === sale.id)
    )
  };
}

export const portalService = {
  async getDashboard(clientId: string) {
    const [client, ticketResult, sales, billings, documents, paymentInstructions] = await Promise.all([
      clientService.getClient(clientId),
      ticketService.searchTickets({
        client: clientId,
        sort: "updated_desc",
        pageSize: 50
      }),
      saleService.listSales({ clientId }),
      billingRepository.listByClient(clientId),
      fiscalDocumentRepository.listByClient(clientId),
      paymentInstructionRepository.listActiveForClient(clientId)
    ]);

    const financialRecords = [
      ...billings.map((billing) => mapBillingRecord(billing, documents)),
      ...sales.map((sale) => mapSaleRecord(sale, documents))
    ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

    const openTickets = ticketResult.items.filter((ticket) => !["CLOSED", "CANCELED"].includes(ticket.status)).length;
    const pendingRecords = financialRecords.filter((record) => isPendingStatus(record.status));
    const paidRecords = financialRecords.filter((record) => record.status === "PAGO");
    const overdueRecords = financialRecords.filter((record) => isOverdue(record));

    return {
      client,
      tickets: ticketResult.items,
      recentTickets: ticketResult.items.slice(0, 4),
      recentSales: sales.slice(0, 4),
      recentDocuments: documents.slice(0, 6),
      paymentInstructions,
      financialRecords,
      summary: {
        openTickets,
        pendingAmount: pendingRecords.reduce((sum, record) => sum + record.totalAmount, 0),
        paidAmount: paidRecords.reduce((sum, record) => sum + record.totalAmount, 0),
        overdueAmount: overdueRecords.reduce((sum, record) => sum + record.totalAmount, 0),
        pendingCount: pendingRecords.length,
        paidCount: paidRecords.length,
        documentCount: documents.length,
        salesCount: sales.length
      }
    };
  },

  async getTicketDetail(clientId: string, ticketId: string) {
    const ticket = await ticketService.getTicket(ticketId);

    if (!ticket || ticket.clientId !== clientId) {
      return null;
    }

    const [documents, paymentInstructions] = await Promise.all([
      fiscalDocumentRepository.listByTicket(ticketId),
      paymentInstructionRepository.listActiveForClient(clientId)
    ]);

    return {
      ticket,
      documents,
      paymentInstructions
    };
  },

  async listFinancialRecords(clientId: string) {
    const [sales, billings, documents, paymentInstructions] = await Promise.all([
      saleService.listSales({ clientId }),
      billingRepository.listByClient(clientId),
      fiscalDocumentRepository.listByClient(clientId),
      paymentInstructionRepository.listActiveForClient(clientId)
    ]);

    const records = [
      ...billings.map((billing) => mapBillingRecord(billing, documents)),
      ...sales.map((sale) => mapSaleRecord(sale, documents))
    ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

    return {
      records,
      documents,
      paymentInstructions,
      summary: {
        pendingAmount: records.filter((record) => isPendingStatus(record.status)).reduce((sum, record) => sum + record.totalAmount, 0),
        paidAmount: records.filter((record) => record.status === "PAGO").reduce((sum, record) => sum + record.totalAmount, 0),
        overdueAmount: records.filter((record) => isOverdue(record)).reduce((sum, record) => sum + record.totalAmount, 0),
        pendingCount: records.filter((record) => isPendingStatus(record.status)).length
      }
    };
  },

  async listSales(clientId: string) {
    const [sales, documents, paymentInstructions] = await Promise.all([
      saleService.listSales({ clientId }),
      fiscalDocumentRepository.listByClient(clientId),
      paymentInstructionRepository.listActiveForClient(clientId)
    ]);

    return {
      sales,
      documents,
      paymentInstructions
    };
  },

  async getSaleDetail(clientId: string, saleId: string) {
    const sale = await saleService.getSale(saleId);

    if (!sale || sale.clientId !== clientId) {
      return null;
    }

    const [documents, paymentInstructions] = await Promise.all([
      fiscalDocumentRepository.listBySale(saleId),
      paymentInstructionRepository.listActiveForClient(clientId)
    ]);

    return {
      sale,
      documents,
      paymentInstructions
    };
  },

  async listDocuments(clientId: string) {
    return fiscalDocumentRepository.listByClient(clientId);
  }
};
