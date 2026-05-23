import { prisma } from "@/lib/db/prisma";
import type { EquipmentLoan } from "@/types";
import { mapEquipmentLoan } from "@/server/mappers";

const loanInclude = {
  reserveEquipment: { select: { model: true, patrimonyCode: true } },
  mainEquipment: { select: { model: true, patrimonyCode: true } },
  client: { select: { name: true } }
} as const;

export interface CreateLoanInput {
  reserveEquipmentId: string;
  mainEquipmentId?: string;
  clientId: string;
  loanedAt: string;
  notes?: string;
  createdById: string;
}

export const equipmentLoanRepository = {
  async listActive(): Promise<EquipmentLoan[]> {
    const records = await prisma.equipmentLoan.findMany({
      where: { returnedAt: null },
      include: loanInclude,
      orderBy: { loanedAt: "asc" }
    });
    return records.map(mapEquipmentLoan);
  },

  async listByEquipment(reserveEquipmentId: string): Promise<EquipmentLoan[]> {
    const records = await prisma.equipmentLoan.findMany({
      where: { reserveEquipmentId },
      include: loanInclude,
      orderBy: { loanedAt: "desc" }
    });
    return records.map(mapEquipmentLoan);
  },

  async findById(id: string): Promise<EquipmentLoan | null> {
    const r = await prisma.equipmentLoan.findUnique({
      where: { id },
      include: loanInclude
    });
    return r ? mapEquipmentLoan(r) : null;
  },

  async create(input: CreateLoanInput): Promise<EquipmentLoan> {
    return prisma.$transaction(async (tx) => {
      const loan = await tx.equipmentLoan.create({
        data: {
          reserveEquipmentId: input.reserveEquipmentId,
          mainEquipmentId: input.mainEquipmentId ?? null,
          clientId: input.clientId,
          loanedAt: new Date(input.loanedAt),
          notes: input.notes ?? null,
          createdById: input.createdById
        },
        include: loanInclude
      });

      // marca a reserva como LOCADO
      await tx.equipment.update({
        where: { id: input.reserveEquipmentId },
        data: { status: "LOCADO" }
      });

      // marca a principal como MANUTENCAO se informada
      if (input.mainEquipmentId) {
        await tx.equipment.update({
          where: { id: input.mainEquipmentId },
          data: { status: "MANUTENCAO" }
        });
      }

      return mapEquipmentLoan(loan);
    });
  },

  async registerReturn(id: string, returnedAt: string): Promise<EquipmentLoan | null> {
    return prisma.$transaction(async (tx) => {
      const loan = await tx.equipmentLoan.update({
        where: { id },
        data: { returnedAt: new Date(returnedAt) },
        include: loanInclude
      });

      // devolve a reserva para DISPONIVEL
      await tx.equipment.update({
        where: { id: loan.reserveEquipmentId },
        data: { status: "DISPONIVEL" }
      });

      // devolve a principal para DISPONIVEL se estava em MANUTENCAO
      if (loan.mainEquipmentId) {
        const main = await tx.equipment.findUnique({
          where: { id: loan.mainEquipmentId },
          select: { status: true }
        });
        if (main?.status === "MANUTENCAO") {
          await tx.equipment.update({
            where: { id: loan.mainEquipmentId },
            data: { status: "DISPONIVEL" }
          });
        }
      }

      return mapEquipmentLoan(loan);
    });
  }
};
