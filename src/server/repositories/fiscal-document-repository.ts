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
  }): Promise<FiscalDocument> {
    const [tickets, sales] = await Promise.all([
      input.ticketIds.length > 0
        ? prisma.ticket.findMany({
            where: { id: { in: input.ticketIds } },
            select: { id: true, number: true, title: true }
          })
        : Promise.resolve([]),
      input.saleIds.length > 0
        ? prisma.sale.findMany({
            where: { id: { in: input.saleIds } },
            select: { id: true, number: true }
          })
        : Promise.resolve([])
    ]);

    const ticketMap = new Map(tickets.map((ticket) => [ticket.id, ticket]));
    const saleMap = new Map(sales.map((sale) => [sale.id, sale]));

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
            }))
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
