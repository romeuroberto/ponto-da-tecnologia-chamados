import { isDatabaseConfigured, normalizeOptionalString } from "@/server/db-support";
import { fiscalDocumentRepository } from "@/server/repositories/fiscal-document-repository";

export interface FiscalDocumentInput {
  clientId: string;
  type: "NFSE" | "NFE" | "RECIBO" | "OUTRO";
  number: string;
  series?: string;
  issueDate: string;
  totalAmount?: number;
  fileName: string;
  filePath: string;
  notes?: string;
  ticketIds: string[];
  saleIds: string[];
}

export const fiscalDocumentService = {
  async listByClient(clientId?: string) {
    return fiscalDocumentRepository.listAll(clientId);
  },

  async create(input: FiscalDocumentInput) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de lançar documentos fiscais.");
    }

    return fiscalDocumentRepository.create({
      clientId: input.clientId,
      type: input.type,
      number: input.number,
      series: normalizeOptionalString(input.series),
      issueDate: new Date(input.issueDate),
      totalAmount: input.totalAmount,
      fileName: input.fileName,
      filePath: input.filePath,
      notes: normalizeOptionalString(input.notes),
      ticketIds: input.ticketIds,
      saleIds: input.saleIds
    });
  },

  async delete(id: string) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de remover documentos fiscais.");
    }

    const deleted = await fiscalDocumentRepository.delete(id);

    if (!deleted) {
      throw new Error("Documento fiscal não encontrado.");
    }

    return deleted;
  }
};
