import { prisma } from "@/lib/db/prisma";
import type { FiscalDocument } from "@/types";
import { isDatabaseConfigured } from "@/server/db-support";
import { mapFiscalDocument } from "@/server/mappers";
import { isMissingTableError } from "@/server/repositories/portal-support";

const fiscalDocumentInclude = {
  links: {
    orderBy: {
      createdAt: "asc" as const
    }
  }
} as const;

export const fiscalDocumentRepository = {
  async listAll(clientId?: string): Promise<FiscalDocument[]> {
    if (!isDatabaseConfigured()) {
      return [];
    }

    try {
      const records = await prisma.fiscalDocument.findMany({
        where: clientId ? { clientId } : undefined,
        include: fiscalDocumentInclude,
        orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }]
      });

      return records.map(mapFiscalDocument);
    } catch (error) {
      if (isMissingTableError(error, "FiscalDocument")) {
        return [];
      }

      throw error;
    }
  },

  async listByClient(clientId: string): Promise<FiscalDocument[]> {
    if (!isDatabaseConfigured()) {
      return [];
    }

    try {
      const records = await prisma.fiscalDocument.findMany({
        where: { clientId },
        include: fiscalDocumentInclude,
        orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }]
      });

      return records.map(mapFiscalDocument);
    } catch (error) {
      if (isMissingTableError(error, "FiscalDocument")) {
        return [];
      }

      throw error;
    }
  },

  async listByTicket(ticketId: string): Promise<FiscalDocument[]> {
    if (!isDatabaseConfigured()) {
      return [];
    }

    try {
      const records = await prisma.fiscalDocument.findMany({
        where: { links: { some: { ticketId } } },
        include: fiscalDocumentInclude,
        orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }]
      });

      return records.map(mapFiscalDocument);
    } catch (error) {
      if (isMissingTableError(error, "FiscalDocument")) {
        return [];
      }

      throw error;
    }
  },

  async listBySale(saleId: string): Promise<FiscalDocument[]> {
    if (!isDatabaseConfigured()) {
      return [];
    }

    try {
      const records = await prisma.fiscalDocument.findMany({
        where: { links: { some: { saleId } } },
        include: fiscalDocumentInclude,
        orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }]
      });

      return records.map(mapFiscalDocument);
    } catch (error) {
      if (isMissingTableError(error, "FiscalDocument")) {
        return [];
      }

      throw error;
    }
  },

  async listByMonthlyBilling(monthlyBillingId: string): Promise<FiscalDocument[]> {
    if (!isDatabaseConfigured()) {
      return [];
    }

    try {
      const records = await prisma.fiscalDocument.findMany({
        where: { links: { some: { monthlyBillingId } } },
        include: fiscalDocumentInclude,
        orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }]
      });

      return records.map(mapFiscalDocument);
    } catch (error) {
      if (isMissingTableError(error, "FiscalDocument")) {
        return [];
      }

      throw error;
    }
  },

  async listByRentalBilling(rentalBillingId: string): Promise<FiscalDocument[]> {
    if (!isDatabaseConfigured()) {
      return [];
    }

    try {
      const records = await prisma.fiscalDocument.findMany({
        where: { links: { some: { rentalBillingId } } },
        include: fiscalDocumentInclude,
        orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }]
      });

      return records.map(mapFiscalDocument);
    } catch (error) {
      if (isMissingTableError(error, "FiscalDocument")) {
        return [];
      }

      throw error;
    }
  },

  async create(input: {
    clientId: string;
    type: FiscalDocument["type"];
    number: string;
    series?: string;
    issueDate: Date;
    totalAmount?: number;
    fileName: string;
    filePath: string;
    notes?: string;
    ticketIds: string[];
    saleIds: string[];
    monthlyBillingIds: string[];
    rentalBillingIds: string[];
  }): Promise<FiscalDocument> {
    const [tickets, sales, monthlyBillings, rentalBillings] = await Promise.all([
      input.ticketIds.length > 0
        ? prisma.ticket.findMany({
            where: { id: { in: input.ticketIds } },
            select: { id: true, number: true, title: true, clientId: true }
          })
        : Promise.resolve([]),
      input.saleIds.length > 0
        ? prisma.sale.findMany({
            where: { id: { in: input.saleIds } },
            select: { id: true, number: true, clientId: true }
          })
        : Promise.resolve([]),
      input.monthlyBillingIds.length > 0
        ? prisma.contractMonthlyBilling.findMany({
            where: { id: { in: input.monthlyBillingIds } },
            include: { contract: { select: { contractNumber: true } } }
          })
        : Promise.resolve([]),
      input.rentalBillingIds.length > 0
        ? prisma.rentalBilling.findMany({
            where: { id: { in: input.rentalBillingIds } },
            include: { rentalContract: { select: { contractNumber: true } } }
          })
        : Promise.resolve([])
    ]);

    const ticketMap = new Map(tickets.map((ticket) => [ticket.id, ticket]));
    const saleMap = new Map(sales.map((sale) => [sale.id, sale]));
    const monthlyBillingMap = new Map(monthlyBillings.map((billing) => [billing.id, billing]));
    const rentalBillingMap = new Map(rentalBillings.map((billing) => [billing.id, billing]));
    const invalidLink = [
      ...tickets.map((ticket) => ticket.clientId),
      ...sales.map((sale) => sale.clientId),
      ...monthlyBillings.map((billing) => billing.clientId),
      ...rentalBillings.map((billing) => billing.clientId)
    ].find((clientId) => clientId !== input.clientId);

    if (invalidLink) {
      throw new Error("Todos os vínculos do documento fiscal precisam pertencer ao cliente selecionado.");
    }

    const record = await prisma.fiscalDocument.create({
      data: {
        clientId: input.clientId,
        type: input.type,
        number: input.number,
        series: input.series ?? null,
        issueDate: input.issueDate,
        totalAmount: input.totalAmount ?? null,
        fileName: input.fileName,
        filePath: input.filePath,
        notes: input.notes ?? null,
        links: {
          create: [
            ...input.ticketIds.map((ticketId) => ({
              ticketId,
              label: ticketMap.has(ticketId)
                ? `Chamado ${ticketMap.get(ticketId)?.number} · ${ticketMap.get(ticketId)?.title}`
                : "Chamado vinculado"
            })),
            ...input.saleIds.map((saleId) => ({
              saleId,
              label: saleMap.has(saleId) ? `Venda ${saleMap.get(saleId)?.number}` : "Venda vinculada"
            })),
            ...input.monthlyBillingIds.map((monthlyBillingId) => {
              const billing = monthlyBillingMap.get(monthlyBillingId);
              return {
                monthlyBillingId,
                label: billing
                  ? `Mensalidade ${String(billing.referenceMonth).padStart(2, "0")}/${billing.referenceYear} · contrato ${billing.contract.contractNumber}`
                  : "Mensalidade vinculada"
              };
            }),
            ...input.rentalBillingIds.map((rentalBillingId) => {
              const billing = rentalBillingMap.get(rentalBillingId);
              return {
                rentalBillingId,
                label: billing
                  ? `Locação ${String(billing.referenceMonth).padStart(2, "0")}/${billing.referenceYear} · contrato ${billing.rentalContract.contractNumber}`
                  : "Locação vinculada"
              };
            })
          ]
        }
      },
      include: fiscalDocumentInclude
    });

    return mapFiscalDocument(record);
  },

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.fiscalDocument.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      if (String(error).includes("Record to delete does not exist")) {
        return false;
      }

      throw error;
    }
  }
};
