import { prisma } from "@/lib/db/prisma";
import type { PartCatalogItem, StockMovement } from "@/types";
import { mapStockMovement } from "@/server/mappers";

export interface StockItem extends PartCatalogItem {
  stockQuantity: number;
}

export interface ListMovementsInput {
  partId?: string;
  type?: string;
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
}

export interface ListMovementsResult {
  movements: StockMovement[];
  total: number;
  totalPages: number;
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
      resalePrice: r.resalePrice != null ? Number(r.resalePrice) : undefined,
      stockQuantity: Number(r.stockQuantity),
      minimumStock: r.minimumStock != null ? Number(r.minimumStock) : undefined,
      active: r.active,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }));
  },

  async listMovements(input: ListMovementsInput = {}): Promise<ListMovementsResult> {
    const { partId, type, from, to, page = 1, perPage = 50 } = input;

    const where = {
      ...(partId ? { partCatalogItemId: partId } : {}),
      ...(type ? { type: type as never } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {})
            }
          }
        : {})
    };

    const [records, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: { part: true, createdBy: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage
      }),
      prisma.stockMovement.count({ where })
    ]);

    return {
      movements: records.map(mapStockMovement),
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage))
    };
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
  },

  async addAdjustment(input: {
    partCatalogItemId: string;
    newQuantity: number;
    notes?: string;
    createdById: string;
  }): Promise<void> {
    const part = await prisma.partCatalogItem.findUniqueOrThrow({
      where: { id: input.partCatalogItemId }
    });
    const delta = input.newQuantity - Number(part.stockQuantity);

    await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          partCatalogItemId: input.partCatalogItemId,
          type: "ADJUSTMENT",
          quantity: Math.abs(delta),
          notes: input.notes ?? null,
          createdById: input.createdById
        }
      }),
      prisma.partCatalogItem.update({
        where: { id: input.partCatalogItemId },
        data: { stockQuantity: input.newQuantity }
      })
    ]);
  },

  async deletePart(id: string): Promise<void> {
    const counts = await prisma.partCatalogItem.findUniqueOrThrow({
      where: { id },
      select: {
        _count: {
          select: {
            stockMovements: true,
            saleItems: true,
            serviceOrderParts: true
          }
        }
      }
    });

    const total =
      counts._count.stockMovements + counts._count.saleItems + counts._count.serviceOrderParts;

    if (total > 0) {
      throw new Error(
        `Este material possui ${total} registro(s) vinculado(s) (movimentações, vendas ou ordens de serviço) e não pode ser excluído.`
      );
    }

    await prisma.partCatalogItem.delete({ where: { id } });
  }
};
