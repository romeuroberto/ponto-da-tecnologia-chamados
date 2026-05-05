import { prisma } from "@/lib/db/prisma";
import type { PartCatalogItem, StockMovement } from "@/types";
import { mapStockMovement } from "@/server/mappers";

export interface StockItem extends PartCatalogItem {
  stockQuantity: number;
}

export const stockRepository = {
  async listParts(): Promise<PartCatalogItem[]> {
    const records = await prisma.partCatalogItem.findMany({
      orderBy: { name: "asc" }
    });
    return records.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code ?? undefined,
      description: r.description ?? undefined,
      unit: r.unit,
      costPrice: Number(r.costPrice),
      unitPrice: Number(r.unitPrice),
      stockQuantity: Number(r.stockQuantity),
      active: r.active,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }));
  },

  async listMovements(partCatalogItemId?: string): Promise<StockMovement[]> {
    const records = await prisma.stockMovement.findMany({
      where: partCatalogItemId ? { partCatalogItemId } : undefined,
      include: { part: true, createdBy: true },
      orderBy: { createdAt: "desc" },
      take: 200
    });
    return records.map(mapStockMovement);
  },

  async addEntry(input: {
    partCatalogItemId: string;
    quantity: number;
    notes?: string;
    createdById: string;
  }): Promise<void> {
    await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          partCatalogItemId: input.partCatalogItemId,
          type: "ENTRY",
          quantity: input.quantity,
          notes: input.notes ?? null,
          createdById: input.createdById
        }
      }),
      prisma.partCatalogItem.update({
        where: { id: input.partCatalogItemId },
        data: { stockQuantity: { increment: input.quantity } }
      })
    ]);
  }
};
