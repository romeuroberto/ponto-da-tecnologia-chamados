import { prisma } from "@/lib/db/prisma";
import { mapTicketCategory } from "@/server/mappers";

export interface CreateTicketCategoryInput {
  name: string;
  label: string;
  suggestedRole?: "ATTENDANT" | "TECHNICIAN" | null;
  sortOrder?: number;
}

export interface UpdateTicketCategoryInput {
  label: string;
  suggestedRole?: "ATTENDANT" | "TECHNICIAN" | null;
  sortOrder?: number;
  active?: boolean;
}

export const ticketCategoryRepository = {
  async list(onlyActive = false) {
    const records = await prisma.ticketCategory.findMany({
      where: onlyActive ? { active: true } : undefined,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    });
    return records.map(mapTicketCategory);
  },

  async findById(id: string) {
    const record = await prisma.ticketCategory.findUnique({ where: { id } });
    return record ? mapTicketCategory(record) : null;
  },

  async create(input: CreateTicketCategoryInput) {
    const record = await prisma.ticketCategory.create({
      data: {
        name: input.name,
        label: input.label,
        suggestedRole: input.suggestedRole ?? null,
        sortOrder: input.sortOrder ?? 0
      }
    });
    return mapTicketCategory(record);
  },

  async update(id: string, input: UpdateTicketCategoryInput) {
    const record = await prisma.ticketCategory.update({
      where: { id },
      data: {
        label: input.label,
        suggestedRole: input.suggestedRole ?? null,
        active: input.active,
        sortOrder: input.sortOrder
      }
    });
    return mapTicketCategory(record);
  }
};
