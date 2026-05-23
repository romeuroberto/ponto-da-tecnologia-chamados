import { prisma } from "@/lib/db/prisma";
import type { FinancialStatus, RentalBilling, RentalContract, RentalContractStatus } from "@/types";
import { mapRentalBilling, mapRentalContract, rentalContractInclude } from "@/server/mappers";

export interface CreateRentalContractInput {
  contractNumber: string;
  clientId: string;
  startDate: string;
  endDate?: string;
  noticeDays?: number;
  notes?: string;
  createdById: string;
  items: Array<{
    equipmentId: string;
    monthlyPrice: number;
    installedAt: string;
    notes?: string;
  }>;
}

export interface AddRentalItemInput {
  equipmentId: string;
  monthlyPrice: number;
  installedAt: string;
  notes?: string;
}

export interface CreateRentalBillingInput {
  rentalContractId: string;
  clientId: string;
  referenceMonth: number;
  referenceYear: number;
  amount: number;
  dueDate?: string;
  notes?: string;
  createdById: string;
}

export interface PayRentalBillingInput {
  financialStatus: FinancialStatus;
  paymentMethod?: string;
  paymentDate?: string;
  paymentReference?: string;
}

function toMoney(v: number) {
  return Number(v.toFixed(2));
}

export const rentalRepository = {
  async list(filters: { clientId?: string; status?: RentalContractStatus } = {}): Promise<RentalContract[]> {
    const records = await prisma.rentalContract.findMany({
      where: {
        ...(filters.clientId ? { clientId: filters.clientId } : {}),
        ...(filters.status ? { status: filters.status } : {})
      },
      include: rentalContractInclude,
      orderBy: { createdAt: "desc" }
    });
    return records.map(mapRentalContract);
  },

  async findById(id: string): Promise<RentalContract | null> {
    const r = await prisma.rentalContract.findUnique({
      where: { id },
      include: rentalContractInclude
    });
    return r ? mapRentalContract(r) : null;
  },

  async create(input: CreateRentalContractInput): Promise<RentalContract> {
    const totalMonthlyValue = toMoney(input.items.reduce((s, i) => s + i.monthlyPrice, 0));

    return prisma.$transaction(async (tx) => {
      const contract = await tx.rentalContract.create({
        data: {
          contractNumber: input.contractNumber,
          clientId: input.clientId,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : null,
          noticeDays: input.noticeDays ?? 30,
          totalMonthlyValue,
          notes: input.notes ?? null,
          createdById: input.createdById,
          items: {
            create: input.items.map((item) => ({
              equipmentId: item.equipmentId,
              monthlyPrice: toMoney(item.monthlyPrice),
              installedAt: new Date(item.installedAt),
              notes: item.notes ?? null
            }))
          }
        },
        include: rentalContractInclude
      });

      // Mark equipment as LOCADO
      for (const item of input.items) {
        await tx.equipment.update({
          where: { id: item.equipmentId },
          data: { status: "LOCADO" }
        });
      }

      return mapRentalContract(contract);
    });
  },

  async updateStatus(id: string, status: RentalContractStatus): Promise<RentalContract | null> {
    const r = await prisma.rentalContract.update({
      where: { id },
      data: { status },
      include: rentalContractInclude
    });
    return r ? mapRentalContract(r) : null;
  },

  async addItem(contractId: string, input: AddRentalItemInput): Promise<RentalContract | null> {
    return prisma.$transaction(async (tx) => {
      const contract = await tx.rentalContract.findUnique({
        where: { id: contractId },
        include: { items: true }
      });
      if (!contract) return null;

      await tx.rentalContractItem.create({
        data: {
          rentalContractId: contractId,
          equipmentId: input.equipmentId,
          monthlyPrice: toMoney(input.monthlyPrice),
          installedAt: new Date(input.installedAt),
          notes: input.notes ?? null
        }
      });

      await tx.equipment.update({
        where: { id: input.equipmentId },
        data: { status: "LOCADO" }
      });

      const newTotal = toMoney(
        contract.items.reduce((s, i) => s + i.monthlyPrice.toNumber(), 0) + input.monthlyPrice
      );
      const updated = await tx.rentalContract.update({
        where: { id: contractId },
        data: { totalMonthlyValue: newTotal },
        include: rentalContractInclude
      });
      return mapRentalContract(updated);
    });
  },

  async returnItem(itemId: string, returnedAt: string): Promise<RentalContract | null> {
    return prisma.$transaction(async (tx) => {
      const item = await tx.rentalContractItem.update({
        where: { id: itemId },
        data: { returnedAt: new Date(returnedAt) }
      });

      await tx.equipment.update({
        where: { id: item.equipmentId },
        data: { status: "DISPONIVEL" }
      });

      // Recalculate total with only active items
      const contract = await tx.rentalContract.findUnique({
        where: { id: item.rentalContractId },
        include: { items: true }
      });
      if (!contract) return null;

      // Items fetched before update, so re-fetch after; items with returnedAt are inactive.
      // The item we just returned will now have returnedAt set, so exclude it by id as well.
      const newTotal = toMoney(
        contract.items
          .filter((i) => i.id !== itemId && i.returnedAt === null)
          .reduce((s, i) => s + i.monthlyPrice.toNumber(), 0)
      );

      const updated = await tx.rentalContract.update({
        where: { id: item.rentalContractId },
        data: { totalMonthlyValue: newTotal },
        include: rentalContractInclude
      });
      return mapRentalContract(updated);
    });
  },

  async deleteItem(itemId: string): Promise<void> {
    return prisma.$transaction(async (tx) => {
      const item = await tx.rentalContractItem.findUnique({ where: { id: itemId } });
      if (!item) throw new Error("Item não encontrado.");

      await tx.rentalContractItem.delete({ where: { id: itemId } });

      // Restore equipment to DISPONIVEL only if it hadn't been returned yet
      if (!item.returnedAt) {
        await tx.equipment.update({
          where: { id: item.equipmentId },
          data: { status: "DISPONIVEL" }
        });

        // Recalculate contract total without this item
        const contract = await tx.rentalContract.findUnique({
          where: { id: item.rentalContractId },
          include: { items: true }
        });
        if (contract) {
          const newTotal = toMoney(
            contract.items
              .filter((i) => i.id !== itemId && i.returnedAt === null)
              .reduce((s, i) => s + i.monthlyPrice.toNumber(), 0)
          );
          await tx.rentalContract.update({
            where: { id: item.rentalContractId },
            data: { totalMonthlyValue: newTotal }
          });
        }
      }
    });
  },

  async createBilling(input: CreateRentalBillingInput): Promise<RentalBilling> {
    const r = await prisma.rentalBilling.create({
      data: {
        rentalContractId: input.rentalContractId,
        clientId: input.clientId,
        referenceMonth: input.referenceMonth,
        referenceYear: input.referenceYear,
        amount: toMoney(input.amount),
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        notes: input.notes ?? null,
        createdById: input.createdById
      },
      include: { client: true, createdBy: true }
    });
    return mapRentalBilling(r);
  },

  async updateBillingStatus(id: string, input: PayRentalBillingInput): Promise<RentalBilling | null> {
    const now = new Date();
    const isPaid = input.financialStatus === "PAGO";
    const isCanceled = input.financialStatus === "CANCELADO";

    const r = await prisma.rentalBilling.update({
      where: { id },
      data: {
        financialStatus: input.financialStatus,
        paymentMethod: input.paymentMethod ?? null,
        paymentDate: input.paymentDate ? new Date(input.paymentDate) : null,
        paymentReference: input.paymentReference ?? null,
        paidAt: isPaid ? now : null,
        canceledAt: isCanceled ? now : null
      },
      include: { client: true, createdBy: true }
    });
    return r ? mapRentalBilling(r) : null;
  },

  async deleteBilling(id: string): Promise<void> {
    const billing = await prisma.rentalBilling.findUnique({ where: { id } });
    if (!billing) throw new Error("Cobrança não encontrada.");
    if (billing.financialStatus === "PAGO") {
      throw new Error("Não é possível excluir uma cobrança já paga.");
    }
    await prisma.rentalBilling.delete({ where: { id } });
  }
};
