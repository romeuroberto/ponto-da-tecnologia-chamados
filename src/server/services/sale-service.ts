import type { FinancialStatus } from "@/types";
import { isDatabaseConfigured } from "@/server/db-support";
import { generateSaleNumber } from "@/server/number-generator";
import { saleRepository, type UpdateSaleStatusInput } from "@/server/repositories/sale-repository";
import { stockRepository } from "@/server/repositories/stock-repository";

export const saleService = {
  async listSales(input: { financialStatus?: FinancialStatus; clientId?: string } = {}) {
    if (!isDatabaseConfigured()) {
      return [];
    }

    return saleRepository.list(input);
  },

  async getSale(id: string) {
    if (!isDatabaseConfigured()) {
      return null;
    }

    return saleRepository.findById(id);
  },

  async createSale(input: {
    clientId: string;
    internalNotes?: string;
    createdById: string;
    items: Array<{
      partCatalogItemId: string;
      quantity: number;
      unitPrice: number;
    }>;
  }) {
    const parts = await stockRepository.listParts();
    const partMap = new Map(parts.map((p) => [p.id, p]));

    const items = input.items.map((item) => {
      const part = partMap.get(item.partCatalogItemId);
      if (!part) throw new Error(`Material ${item.partCatalogItemId} não encontrado.`);
      return {
        partCatalogItemId: item.partCatalogItemId,
        partName: part.name,
        partCode: part.code,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      };
    });

    const number = await generateSaleNumber();
    return saleRepository.create({ number, clientId: input.clientId, internalNotes: input.internalNotes, createdById: input.createdById, items });
  },

  async updateSaleStatus(id: string, input: UpdateSaleStatusInput) {
    return saleRepository.updateStatus(id, input);
  },

  async listActiveParts() {
    const parts = await stockRepository.listParts();
    return parts.filter((p) => p.active);
  },

  async getStockOverview() {
    return stockRepository.listParts();
  },

  async addStockEntry(input: { partCatalogItemId: string; quantity: number; notes?: string; createdById: string }) {
    return stockRepository.addEntry(input);
  },

  async listMovements(partCatalogItemId?: string) {
    return stockRepository.listMovements(partCatalogItemId);
  }
};
