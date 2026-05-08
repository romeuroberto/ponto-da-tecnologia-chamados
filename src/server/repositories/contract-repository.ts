import { prisma } from "@/lib/db/prisma";
import type { ClientContract } from "@/types";
import { mapClientContract } from "@/server/mappers";
import type { ContractInput } from "@/lib/validations/contract";

export const contractRepository = {
  async findByClientId(clientId: string): Promise<ClientContract[]> {
    const records = await prisma.clientContract.findMany({
      where: { clientId },
      orderBy: { startDate: "desc" }
    });
    return records.map(mapClientContract);
  },

  async findActiveByClientId(clientId: string): Promise<ClientContract | null> {
    const now = new Date();
    const record = await prisma.clientContract.findFirst({
      where: {
        clientId,
        status: "ATIVO",
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }]
      },
      orderBy: { startDate: "desc" }
    });
    return record ? mapClientContract(record) : null;
  },

  async findById(id: string): Promise<ClientContract | null> {
    const record = await prisma.clientContract.findUnique({ where: { id } });
    return record ? mapClientContract(record) : null;
  },

  async create(clientId: string, input: ContractInput): Promise<ClientContract> {
    const record = await prisma.clientContract.create({
      data: {
        clientId,
        contractNumber: input.contractNumber,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        status: input.status,
        coverageType: input.coverageType,
        monthlyValue: input.monthlyValue ?? null,
        coveredCategories: input.coveredCategories,
        notes: input.notes || null
      }
    });
    return mapClientContract(record);
  },

  async update(id: string, input: ContractInput): Promise<ClientContract | null> {
    const existing = await prisma.clientContract.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return null;

    const record = await prisma.clientContract.update({
      where: { id },
      data: {
        contractNumber: input.contractNumber,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        status: input.status,
        coverageType: input.coverageType,
        monthlyValue: input.monthlyValue ?? null,
        coveredCategories: input.coveredCategories,
        notes: input.notes || null
      }
    });
    return mapClientContract(record);
  },

  async delete(id: string): Promise<boolean> {
    const existing = await prisma.clientContract.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return false;
    await prisma.clientContract.delete({ where: { id } });
    return true;
  }
};
