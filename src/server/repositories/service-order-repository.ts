import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { ServiceOrder, ServiceOrderStatus } from "@/types";
import { isDatabaseConfigured, normalizeOptionalString } from "@/server/db-support";
import { mapServiceOrder, serviceOrderInclude, serviceOrderIncludeWithoutParts } from "@/server/mappers";
import { generateServiceOrderNumber } from "@/server/number-generator";

export interface ServiceOrderPartInput {
  partCatalogItemId: string;
  partName: string;
  partCode?: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface CreateServiceOrderInput {
  serviceType?: string;
  assignedTechnicianId?: string;
  scheduledStartAt?: string;
  executionNotes?: string;
  parts?: ServiceOrderPartInput[];
  createdById: string;
}

export interface UpdateServiceOrderInput {
  status: ServiceOrderStatus;
  serviceType?: string;
  assignedTechnicianId?: string;
  scheduledStartAt?: string;
  startedAt?: string;
  finishedAt?: string;
  executionNotes?: string;
  customerApprovalName?: string;
  customerApprovalAt?: string;
  parts?: ServiceOrderPartInput[];
}

function toOptionalDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizePartInputs(parts?: ServiceOrderPartInput[]) {
  return (parts ?? []).map((part) => ({
    partCatalogItemId: part.partCatalogItemId,
    partName: part.partName.trim(),
    partCode: normalizeOptionalString(part.partCode),
    quantity: part.quantity,
    unitPrice: part.unitPrice,
    notes: normalizeOptionalString(part.notes)
  }));
}

function isMissingServiceOrderPartsTableError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021" && error.message.includes("ServiceOrderPart");
}

async function runServiceOrderQuery<T>(withParts: () => Promise<T>, withoutParts: () => Promise<T>) {
  try {
    return await withParts();
  } catch (error) {
    if (isMissingServiceOrderPartsTableError(error)) {
      return withoutParts();
    }
    throw error;
  }
}

export const serviceOrderRepository = {
  async listByTicketId(ticketId: string): Promise<ServiceOrder[]> {
    if (!isDatabaseConfigured()) {
      return [];
    }

    const records = await runServiceOrderQuery(
      () =>
        prisma.serviceOrder.findMany({
          where: { ticketId },
          include: serviceOrderInclude,
          orderBy: [{ createdAt: "desc" }]
        }),
      () =>
        prisma.serviceOrder.findMany({
          where: { ticketId },
          include: serviceOrderIncludeWithoutParts,
          orderBy: [{ createdAt: "desc" }]
        })
    );

    return records.map(mapServiceOrder);
  },

  async findById(ticketId: string, id: string): Promise<ServiceOrder | null> {
    if (!isDatabaseConfigured()) {
      return null;
    }

    const record = await runServiceOrderQuery(
      () =>
        prisma.serviceOrder.findFirst({
          where: { id, ticketId },
          include: serviceOrderInclude
        }),
      () =>
        prisma.serviceOrder.findFirst({
          where: { id, ticketId },
          include: serviceOrderIncludeWithoutParts
        })
    );

    return record ? mapServiceOrder(record) : null;
  },

  async create(ticketId: string, input: CreateServiceOrderInput): Promise<ServiceOrder> {
    const number = await generateServiceOrderNumber();
    const parts = normalizePartInputs(input.parts);
    const baseData = {
      ticketId,
      number,
      status: "PLANNED" as const,
      serviceType: normalizeOptionalString(input.serviceType),
      assignedTechnicianId: normalizeOptionalString(input.assignedTechnicianId),
      scheduledStartAt: toOptionalDate(input.scheduledStartAt),
      executionNotes: normalizeOptionalString(input.executionNotes),
      createdById: input.createdById
    };

    const record = await runServiceOrderQuery(
      () =>
        prisma.serviceOrder.create({
          data: {
            ...baseData,
            parts: parts.length > 0 ? { create: parts } : undefined
          },
          include: serviceOrderInclude
        }),
      () =>
        prisma.serviceOrder.create({
          data: baseData,
          include: serviceOrderIncludeWithoutParts
        })
    );

    return mapServiceOrder(record);
  },

  async update(ticketId: string, id: string, input: UpdateServiceOrderInput): Promise<ServiceOrder | null> {
    const existing = await prisma.serviceOrder.findFirst({
      where: { id, ticketId },
      select: { id: true }
    });

    if (!existing) {
      return null;
    }

    const parts = normalizePartInputs(input.parts);
    const baseData = {
      status: input.status,
      serviceType: normalizeOptionalString(input.serviceType),
      assignedTechnicianId: normalizeOptionalString(input.assignedTechnicianId),
      scheduledStartAt: toOptionalDate(input.scheduledStartAt),
      startedAt: toOptionalDate(input.startedAt),
      finishedAt: toOptionalDate(input.finishedAt),
      executionNotes: normalizeOptionalString(input.executionNotes),
      customerApprovalName: normalizeOptionalString(input.customerApprovalName),
      customerApprovalAt: toOptionalDate(input.customerApprovalAt)
    };

    const record = await runServiceOrderQuery(
      () =>
        prisma.serviceOrder.update({
          where: { id },
          data: {
            ...baseData,
            parts: {
              deleteMany: {},
              create: parts
            }
          },
          include: serviceOrderInclude
        }),
      () =>
        prisma.serviceOrder.update({
          where: { id },
          data: baseData,
          include: serviceOrderIncludeWithoutParts
        })
    );

    return mapServiceOrder(record);
  }
};
