import { prisma } from "@/lib/db/prisma";
import type { Equipment, EquipmentStatus } from "@/types";
import { mapEquipment } from "@/server/mappers";

export interface UpsertEquipmentInput {
  model: string;
  serialNumber?: string | null;
  patrimonyCode?: string | null;
  purchaseDate?: string | null;
  purchaseCost?: number | null;
  notes?: string | null;
}

export const equipmentRepository = {
  async list(filters: { status?: EquipmentStatus; q?: string } = {}): Promise<Equipment[]> {
    const records = await prisma.equipment.findMany({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.q
          ? {
              OR: [
                { model: { contains: filters.q, mode: "insensitive" } },
                { serialNumber: { contains: filters.q, mode: "insensitive" } },
                { patrimonyCode: { contains: filters.q, mode: "insensitive" } }
              ]
            }
          : {})
      },
      orderBy: { createdAt: "desc" }
    });
    return records.map(mapEquipment);
  },

  async findById(id: string): Promise<Equipment | null> {
    const r = await prisma.equipment.findUnique({ where: { id } });
    return r ? mapEquipment(r) : null;
  },

  async create(input: UpsertEquipmentInput): Promise<Equipment> {
    const r = await prisma.equipment.create({
      data: {
        model: input.model,
        serialNumber: input.serialNumber,
        patrimonyCode: input.patrimonyCode ?? null,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
        purchaseCost: input.purchaseCost ?? null,
        notes: input.notes ?? null
      }
    });
    return mapEquipment(r);
  },

  async update(id: string, input: Partial<UpsertEquipmentInput> & { status?: EquipmentStatus; isReserve?: boolean }): Promise<Equipment | null> {
    const r = await prisma.equipment.update({
      where: { id },
      data: {
        ...(input.model !== undefined ? { model: input.model } : {}),
        ...(input.serialNumber !== undefined ? { serialNumber: input.serialNumber } : {}),
        ...(input.patrimonyCode !== undefined ? { patrimonyCode: input.patrimonyCode ?? null } : {}),
        ...(input.purchaseDate !== undefined ? { purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null } : {}),
        ...(input.purchaseCost !== undefined ? { purchaseCost: input.purchaseCost ?? null } : {}),
        ...(input.notes !== undefined ? { notes: input.notes ?? null } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.isReserve !== undefined ? { isReserve: input.isReserve } : {})
      }
    });
    return r ? mapEquipment(r) : null;
  },

  async delete(id: string): Promise<void> {
    const eq = await prisma.equipment.findUnique({
      where: { id },
      include: { _count: { select: { rentalItems: true } } }
    });
    if (!eq) throw new Error("Equipamento não encontrado.");
    if (eq._count.rentalItems > 0) {
      throw new Error("Não é possível excluir um equipamento que já foi vinculado a contratos de locação.");
    }
    await prisma.equipment.delete({ where: { id } });
  }
};
