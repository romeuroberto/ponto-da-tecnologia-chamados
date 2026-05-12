import { prisma } from "@/lib/db/prisma";
import { clients } from "@/lib/mock-data";
import type { Client, PaginationResult } from "@/types";
import { isDatabaseConfigured, normalizeOptionalNumber, normalizeOptionalString } from "@/server/db-support";
import { mapClient } from "@/server/mappers";
import { buildPaginationResult, getPagination } from "@/server/pagination";

export interface CreateClientInput {
  name: string;
  document?: string;
  contactName: string;
  email?: string;
  phone?: string;
  notes?: string;
  isReseller?: boolean;
  billingProfile?: {
    defaultBillingType: Client["billingProfile"] extends infer T ? T extends { defaultBillingType: infer U } ? U : never : never;
    hourlyRate?: number;
    travelRate?: number;
    defaultDiscountPercent?: number;
    billingInstructions?: string;
  };
}

export interface UpdateClientInput extends CreateClientInput {
  active?: boolean;
}

export interface ClientSearchInput {
  query?: string;
  sort?: "name_asc" | "name_desc" | "tickets_desc" | "tickets_asc";
  page?: number | string;
  pageSize?: number | string;
}

export const clientRepository = {
  async list() {
    if (!isDatabaseConfigured()) {
      return clients;
    }

    const records = await prisma.client.findMany({
      include: {
        _count: {
          select: {
            tickets: true
          }
        },
        billingProfile: true
      },
      orderBy: [{ name: "asc" }]
    });

    return records.map(mapClient);
  },

  async search(filters: ClientSearchInput): Promise<PaginationResult<Client>> {
    const { page, pageSize, skip } = getPagination(filters.page, filters.pageSize);
    const sort = filters.sort ?? "name_asc";

    if (!isDatabaseConfigured()) {
      let filtered = [...clients];

      if (filters.query) {
        const query = filters.query.toLowerCase();
        filtered = filtered.filter((client) =>
          [client.name, client.contactName, client.email ?? ""].some((value) => value.toLowerCase().includes(query))
        );
      }

      filtered.sort((left, right) => {
        switch (sort) {
          case "name_desc":
            return right.name.localeCompare(left.name);
          case "tickets_desc":
            return right.ticketCount - left.ticketCount;
          case "tickets_asc":
            return left.ticketCount - right.ticketCount;
          case "name_asc":
          default:
            return left.name.localeCompare(right.name);
        }
      });

      const total = filtered.length;
      return buildPaginationResult(filtered.slice(skip, skip + pageSize), total, page, pageSize);
    }

    const orderBy =
      sort === "name_desc"
        ? [{ name: "desc" as const }]
        : sort === "tickets_desc"
          ? [{ tickets: { _count: "desc" as const } }, { name: "asc" as const }]
          : sort === "tickets_asc"
            ? [{ tickets: { _count: "asc" as const } }, { name: "asc" as const }]
            : [{ name: "asc" as const }];

    const where = filters.query
      ? {
          OR: [
            { name: { contains: filters.query, mode: "insensitive" as const } },
            { contactName: { contains: filters.query, mode: "insensitive" as const } },
            { email: { contains: filters.query, mode: "insensitive" as const } }
          ]
        }
      : undefined;

    const [records, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          _count: {
            select: {
              tickets: true
            }
          },
          billingProfile: true
        },
        orderBy,
        skip,
        take: pageSize
      }),
      prisma.client.count({ where })
    ]);

    return buildPaginationResult(records.map(mapClient), total, page, pageSize);
  },

  async findById(id: string) {
    if (!isDatabaseConfigured()) {
      return clients.find((client) => client.id === id) ?? null;
    }

    const record = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tickets: true
          }
        },
        billingProfile: true
      }
    });

    return record ? mapClient(record) : null;
  },

  async create(input: CreateClientInput) {
    const record = await prisma.client.create({
      data: {
        name: input.name,
        document: normalizeOptionalString(input.document),
        contactName: input.contactName,
        email: normalizeOptionalString(input.email),
        phone: normalizeOptionalString(input.phone),
        notes: normalizeOptionalString(input.notes),
        isReseller: input.isReseller ?? false,
        billingProfile: input.billingProfile
          ? {
              create: {
                defaultBillingType: input.billingProfile.defaultBillingType,
                hourlyRate: normalizeOptionalNumber(input.billingProfile.hourlyRate),
                travelRate: normalizeOptionalNumber(input.billingProfile.travelRate),
                defaultDiscountPercent: normalizeOptionalNumber(input.billingProfile.defaultDiscountPercent),
                billingInstructions: normalizeOptionalString(input.billingProfile.billingInstructions)
              }
            }
          : undefined
      },
      include: {
        _count: {
          select: {
            tickets: true
          }
        },
        billingProfile: true
      }
    });

    return mapClient(record);
  },

  async update(id: string, input: UpdateClientInput) {
    const record = await prisma.client.update({
      where: { id },
      data: {
        name: input.name,
        document: normalizeOptionalString(input.document),
        contactName: input.contactName,
        email: normalizeOptionalString(input.email),
        phone: normalizeOptionalString(input.phone),
        notes: normalizeOptionalString(input.notes),
        isReseller: input.isReseller ?? false,
        active: input.active,
        billingProfile: input.billingProfile
          ? {
              upsert: {
                create: {
                  defaultBillingType: input.billingProfile.defaultBillingType,
                  hourlyRate: normalizeOptionalNumber(input.billingProfile.hourlyRate),
                  travelRate: normalizeOptionalNumber(input.billingProfile.travelRate),
                  defaultDiscountPercent: normalizeOptionalNumber(input.billingProfile.defaultDiscountPercent),
                  billingInstructions: normalizeOptionalString(input.billingProfile.billingInstructions)
                },
                update: {
                  defaultBillingType: input.billingProfile.defaultBillingType,
                  hourlyRate: normalizeOptionalNumber(input.billingProfile.hourlyRate),
                  travelRate: normalizeOptionalNumber(input.billingProfile.travelRate),
                  defaultDiscountPercent: normalizeOptionalNumber(input.billingProfile.defaultDiscountPercent),
                  billingInstructions: normalizeOptionalString(input.billingProfile.billingInstructions)
                }
              }
            }
          : undefined
      },
      include: {
        _count: {
          select: {
            tickets: true
          }
        },
        billingProfile: true
      }
    });

    return mapClient(record);
  }
};
