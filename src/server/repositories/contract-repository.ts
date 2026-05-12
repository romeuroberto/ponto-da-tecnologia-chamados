import { prisma } from "@/lib/db/prisma";
import type { ClientContract } from "@/types";
import { mapClientContract } from "@/server/mappers";
import type { ContractInput } from "@/lib/validations/contract";

export interface ContractListItem {
  id: string;
  clientId: string;
  clientName: string;
  contractNumber: string;
  status: ClientContract["status"];
  coverageType: ClientContract["coverageType"];
  monthlyValue?: number;
  startDate: string;
  endDate?: string;
  daysUntilExpiry: number | null;
}

async function expireStaleContracts(clientId: string): Promise<void> {
  const now = new Date();
  await prisma.clientContract.updateMany({
    where: {
      clientId,
      status: "ATIVO",
      endDate: { lt: now }
    },
    data: { status: "EXPIRADO" }
  });
}

function buildHistoryMessage(before: ContractInput, after: ContractInput): string {
  const changes: string[] = [];
  if (before.status !== after.status) changes.push(`Status alterado de ${before.status} para ${after.status}.`);
  if (before.contractNumber !== after.contractNumber) changes.push(`Número alterado para ${after.contractNumber}.`);
  if (before.coverageType !== after.coverageType) changes.push(`Cobertura alterada para ${after.coverageType}.`);
  if (String(before.monthlyValue ?? "") !== String(after.monthlyValue ?? "")) changes.push("Mensalidade atualizada.");
  if (before.startDate !== after.startDate || before.endDate !== after.endDate) changes.push("Vigência atualizada.");
  if (JSON.stringify(before.coveredCategories) !== JSON.stringify(after.coveredCategories)) changes.push("Categorias cobertas atualizadas.");
  return changes.length > 0 ? changes.join(" ") : "Contrato atualizado.";
}

export const contractRepository = {
  async findByClientId(clientId: string): Promise<ClientContract[]> {
    await expireStaleContracts(clientId);
    const records = await prisma.clientContract.findMany({
      where: { clientId },
      orderBy: { startDate: "desc" }
    });
    return records.map(mapClientContract);
  },

  async findActiveByClientId(clientId: string): Promise<ClientContract | null> {
    await expireStaleContracts(clientId);
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

  async create(clientId: string, input: ContractInput, authorId: string): Promise<ClientContract> {
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
        notes: input.notes || null,
        history: {
          create: {
            authorId,
            message: `Contrato criado com status ${input.status}.`
          }
        }
      }
    });
    return mapClientContract(record);
  },

  async update(id: string, input: ContractInput, authorId: string): Promise<ClientContract | null> {
    const existing = await prisma.clientContract.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        contractNumber: true,
        coverageType: true,
        monthlyValue: true,
        startDate: true,
        endDate: true,
        coveredCategories: true,
        notes: true
      }
    });
    if (!existing) return null;

    const before: ContractInput = {
      contractNumber: existing.contractNumber,
      startDate: existing.startDate.toISOString(),
      endDate: existing.endDate?.toISOString(),
      status: existing.status as ContractInput["status"],
      coverageType: existing.coverageType as ContractInput["coverageType"],
      monthlyValue: existing.monthlyValue?.toNumber() ?? undefined,
      coveredCategories: existing.coveredCategories,
      notes: existing.notes ?? undefined
    };

    const message = buildHistoryMessage(before, input);

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
        notes: input.notes || null,
        history: {
          create: { authorId, message }
        }
      }
    });
    return mapClientContract(record);
  },

  async delete(id: string): Promise<boolean> {
    const existing = await prisma.clientContract.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return false;
    await prisma.clientContract.delete({ where: { id } });
    return true;
  },

  async findHistoryByContractId(contractId: string) {
    return prisma.contractHistory.findMany({
      where: { contractId },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } }
    });
  },

  async listAll(): Promise<ContractListItem[]> {
    const now = new Date();
    const records = await prisma.clientContract.findMany({
      include: { client: { select: { name: true } } },
      orderBy: { startDate: "desc" }
    });
    return records.map((r) => {
      const daysUntilExpiry = r.endDate
        ? Math.ceil((r.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      return {
        id: r.id,
        clientId: r.clientId,
        clientName: r.client.name,
        contractNumber: r.contractNumber,
        status: r.status as ClientContract["status"],
        coverageType: r.coverageType as ClientContract["coverageType"],
        monthlyValue: r.monthlyValue?.toNumber() ?? undefined,
        startDate: r.startDate.toISOString(),
        endDate: r.endDate?.toISOString(),
        daysUntilExpiry
      };
    });
  },

  async nextNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CONT-${year}-`;
    const records = await prisma.clientContract.findMany({
      where: { contractNumber: { startsWith: prefix } },
      select: { contractNumber: true }
    });
    const max = records.reduce((acc, r) => {
      const seq = parseInt(r.contractNumber.slice(prefix.length), 10);
      return isNaN(seq) ? acc : Math.max(acc, seq);
    }, 0);
    return `${prefix}${String(max + 1).padStart(3, "0")}`;
  }
};
