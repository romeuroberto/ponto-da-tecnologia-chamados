import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { PartCatalogItem, ServiceCatalogItem } from "@/types";
import { isDatabaseConfigured, normalizeOptionalString } from "@/server/db-support";

interface ServiceCatalogRecord {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  defaultPrice: { toNumber(): number };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PartCatalogRecord {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  costPrice: { toNumber(): number };
  unitPrice: { toNumber(): number };
  stockQuantity: { toNumber(): number };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListCatalogInput {
  includeInactive?: boolean;
}

export interface ServiceCatalogUpsertInput {
  name: string;
  description?: string;
  defaultPrice: number;
  active: boolean;
}

export interface PartCatalogUpsertInput {
  name: string;
  description?: string;
  costPrice: number;
  unitPrice: number;
  active: boolean;
}

export interface PartCatalogLookup {
  id: string;
  name: string;
  code?: string;
  description?: string;
  costPrice: number;
  unitPrice: number;
  stockQuantity: number;
  active: boolean;
}

function getServiceCatalogDelegate() {
  return (prisma as typeof prisma & { serviceCatalogItem?: typeof prisma.serviceCatalogItem }).serviceCatalogItem;
}

function getPartCatalogDelegate() {
  return (prisma as typeof prisma & { partCatalogItem?: typeof prisma.partCatalogItem }).partCatalogItem;
}

function isMissingCatalogTableError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

function extractNextCode(codes: Array<string | null>, prefix: string) {
  const nextNumber =
    codes.reduce((highest, code) => {
      if (!code || !code.startsWith(`${prefix}-`)) {
        return highest;
      }

      const value = Number(code.slice(prefix.length + 1));
      return Number.isFinite(value) ? Math.max(highest, value) : highest;
    }, 0) + 1;

  return `${prefix}-${String(nextNumber).padStart(4, "0")}`;
}

function mapServiceCatalogItem(record: ServiceCatalogRecord): ServiceCatalogItem {
  return {
    id: record.id,
    name: record.name,
    code: record.code ?? undefined,
    description: record.description ?? undefined,
    defaultPrice: record.defaultPrice.toNumber(),
    active: record.active,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function mapPartCatalogItem(record: PartCatalogRecord): PartCatalogItem {
  return {
    id: record.id,
    name: record.name,
    code: record.code ?? undefined,
    description: record.description ?? undefined,
    costPrice: record.costPrice.toNumber(),
    unitPrice: record.unitPrice.toNumber(),
    stockQuantity: record.stockQuantity.toNumber(),
    active: record.active,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export const catalogRepository = {
  async listServiceItems(input?: ListCatalogInput): Promise<ServiceCatalogItem[]> {
    if (!isDatabaseConfigured()) {
      return [];
    }

    const delegate = getServiceCatalogDelegate();

    if (!delegate) {
      return [];
    }

    try {
      const records = await delegate.findMany({
        where: input?.includeInactive ? undefined : { active: true },
        orderBy: [{ active: "desc" }, { name: "asc" }]
      });

      return records.map((record) => mapServiceCatalogItem(record));
    } catch (error) {
      if (isMissingCatalogTableError(error)) {
        return [];
      }
      throw error;
    }
  },

  async listPartItems(input?: ListCatalogInput): Promise<PartCatalogItem[]> {
    if (!isDatabaseConfigured()) {
      return [];
    }

    const delegate = getPartCatalogDelegate();

    if (!delegate) {
      return [];
    }

    try {
      const records = await delegate.findMany({
        where: input?.includeInactive ? undefined : { active: true },
        orderBy: [{ active: "desc" }, { name: "asc" }]
      });

      return records.map((record) => mapPartCatalogItem(record));
    } catch (error) {
      if (isMissingCatalogTableError(error)) {
        return [];
      }
      throw error;
    }
  },

  async createServiceItem(input: ServiceCatalogUpsertInput): Promise<ServiceCatalogItem> {
    const delegate = getServiceCatalogDelegate();

    if (!delegate) {
      throw new Error("Catalogo de servicos indisponivel. Reinicie a aplicacao e atualize o Prisma Client.");
    }

    const existingCodes = await delegate.findMany({
      select: { code: true }
    });

    const record = await delegate.create({
      data: {
        name: input.name,
        code: extractNextCode(existingCodes.map((item) => item.code), "SRV"),
        description: normalizeOptionalString(input.description),
        defaultPrice: input.defaultPrice,
        active: input.active
      }
    });

    return mapServiceCatalogItem(record);
  },

  async updateServiceItem(id: string, input: ServiceCatalogUpsertInput): Promise<ServiceCatalogItem | null> {
    const delegate = getServiceCatalogDelegate();

    if (!delegate) {
      throw new Error("Catalogo de servicos indisponivel. Reinicie a aplicacao e atualize o Prisma Client.");
    }

    const existing = await delegate.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return null;
    }

    const record = await delegate.update({
      where: { id },
      data: {
        name: input.name,
        description: normalizeOptionalString(input.description),
        defaultPrice: input.defaultPrice,
        active: input.active
      }
    });

    return mapServiceCatalogItem(record);
  },

  async createPartItem(input: PartCatalogUpsertInput): Promise<PartCatalogItem> {
    const delegate = getPartCatalogDelegate();

    if (!delegate) {
      throw new Error("Catalogo de pecas indisponivel. Reinicie a aplicacao e atualize o Prisma Client.");
    }

    const existingCodes = await delegate.findMany({
      select: { code: true }
    });

    const record = await delegate.create({
      data: {
        name: input.name,
        code: extractNextCode(existingCodes.map((item) => item.code), "PEC"),
        description: normalizeOptionalString(input.description),
        costPrice: input.costPrice,
        unitPrice: input.unitPrice,
        active: input.active
      }
    });

    return mapPartCatalogItem(record);
  },

  async updatePartItem(id: string, input: PartCatalogUpsertInput): Promise<PartCatalogItem | null> {
    const delegate = getPartCatalogDelegate();

    if (!delegate) {
      throw new Error("Catalogo de pecas indisponivel. Reinicie a aplicacao e atualize o Prisma Client.");
    }

    const existing = await delegate.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return null;
    }

    const record = await delegate.update({
      where: { id },
      data: {
        name: input.name,
        description: normalizeOptionalString(input.description),
        costPrice: input.costPrice,
        unitPrice: input.unitPrice,
        active: input.active
      }
    });

    return mapPartCatalogItem(record);
  },

  async findPartItemsByIds(ids: string[]): Promise<PartCatalogLookup[]> {
    if (!isDatabaseConfigured() || ids.length === 0) {
      return [];
    }

    const delegate = getPartCatalogDelegate();

    if (!delegate) {
      return [];
    }

    try {
      const records = await delegate.findMany({
        where: {
          id: {
            in: ids
          }
        }
      });

      return records.map((record) => ({
        id: record.id,
        name: record.name,
        code: record.code ?? undefined,
        description: record.description ?? undefined,
        costPrice: record.costPrice.toNumber(),
        unitPrice: record.unitPrice.toNumber(),
        stockQuantity: record.stockQuantity.toNumber(),
        active: record.active
      }));
    } catch (error) {
      if (isMissingCatalogTableError(error)) {
        return [];
      }
      throw error;
    }
  }
};
