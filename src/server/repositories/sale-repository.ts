import { prisma } from "@/lib/db/prisma";
import type { FinancialStatus, Sale } from "@/types";
import { mapSale, saleInclude } from "@/server/mappers";

export interface CreateSaleInput {
  number: string;
  clientId: string;
  internalNotes?: string;
  createdById: string;
  items: Array<{
    partCatalogItemId: string;
    partName: string;
    partCode?: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface UpdateSaleStatusInput {
  financialStatus: FinancialStatus;
  paymentMethod?: string;
  paymentDate?: string;
  paymentReference?: string;
  cancellationReason?: string;
}

function toMoney(value: number) {
  return Number(value.toFixed(2));
}

export const saleRepository = {
  async list(input: { financialStatus?: FinancialStatus; clientId?: string; q?: string; from?: string; to?: string } = {}): Promise<Sale[]> {
    const records = await prisma.sale.findMany({
      where: {
        ...(input.financialStatus ? { financialStatus: input.financialStatus } : {}),
        ...(input.clientId ? { clientId: input.clientId } : {}),
        ...(input.q
          ? { OR: [{ number: { contains: input.q, mode: "insensitive" } }, { client: { name: { contains: input.q, mode: "insensitive" } } }] }
          : {}),
        ...(input.from || input.to
          ? { createdAt: { ...(input.from ? { gte: new Date(input.from) } : {}), ...(input.to ? { lte: new Date(input.to + "T23:59:59.999Z") } : {}) } }
          : {})
      },
      include: saleInclude,
      orderBy: { createdAt: "desc" }
    });
    return records.map(mapSale);
  },

  async findById(id: string): Promise<Sale | null> {
    const record = await prisma.sale.findUnique({
      where: { id },
      include: saleInclude
    });
    return record ? mapSale(record) : null;
  },

  async create(input: CreateSaleInput): Promise<Sale> {
    const total = toMoney(
      input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    );

    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          number: input.number,
          clientId: input.clientId,
          internalNotes: input.internalNotes ?? null,
          totalAmount: total,
          createdById: input.createdById,
          items: {
            create: input.items.map((item) => ({
              partCatalogItemId: item.partCatalogItemId,
              partName: item.partName,
              partCode: item.partCode ?? null,
              quantity: item.quantity,
              unitPrice: toMoney(item.unitPrice),
              totalPrice: toMoney(item.quantity * item.unitPrice)
            }))
          }
        },
        include: saleInclude
      });

      // Stock movements (SALE_EXIT) + update stockQuantity
      for (const item of input.items) {
        await tx.stockMovement.create({
          data: {
            partCatalogItemId: item.partCatalogItemId,
            type: "SALE_EXIT",
            quantity: item.quantity,
            saleId: sale.id,
            createdById: input.createdById
          }
        });
        await tx.partCatalogItem.update({
          where: { id: item.partCatalogItemId },
          data: { stockQuantity: { decrement: item.quantity } }
        });
      }

      return mapSale(sale);
    });
  },

  async updateStatus(id: string, input: UpdateSaleStatusInput): Promise<Sale | null> {
    const now = new Date();
    const isPaid = input.financialStatus === "PAGO";
    const isCanceled = input.financialStatus === "CANCELADO";

    return prisma.$transaction(async (tx) => {
      const current = await tx.sale.findUnique({
        where: { id },
        include: { items: true }
      });
      if (!current) return null;

      const wasActive = current.financialStatus !== "CANCELADO";
      const becomingCanceled = isCanceled && wasActive;

      const updated = await tx.sale.update({
        where: { id },
        data: {
          financialStatus: input.financialStatus,
          paymentMethod: input.paymentMethod ?? null,
          paymentDate: input.paymentDate ? new Date(input.paymentDate) : null,
          paymentReference: input.paymentReference ?? null,
          cancellationReason: input.cancellationReason ?? null,
          paidAt: isPaid ? now : null,
          canceledAt: isCanceled ? now : null
        },
        include: saleInclude
      });

      // Reverter movimentações de estoque se cancelamento
      if (becomingCanceled) {
        for (const item of current.items) {
          await tx.stockMovement.create({
            data: {
              partCatalogItemId: item.partCatalogItemId,
              type: "ADJUSTMENT",
              quantity: item.quantity,
              saleId: id,
              notes: "Estorno por cancelamento de venda",
              createdById: current.createdById
            }
          });
          await tx.partCatalogItem.update({
            where: { id: item.partCatalogItemId },
            data: { stockQuantity: { increment: item.quantity } }
          });
        }
      }

      return mapSale(updated);
    });
  }
};
