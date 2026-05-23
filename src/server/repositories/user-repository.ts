import { prisma } from "@/lib/db/prisma";
import { users } from "@/lib/mock-data";
import type { AppUser, PaginationResult, UserRole } from "@/types";
import { isDatabaseConfigured } from "@/server/db-support";
import { mapUser } from "@/server/mappers";
import { buildPaginationResult, getPagination } from "@/server/pagination";

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  clientId?: string;
}

export interface UpdateUserInput {
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  active?: boolean;
}

export interface UserSearchInput {
  query?: string;
  role?: UserRole;
  sort?: "name_asc" | "name_desc" | "role_asc" | "role_desc";
  page?: number | string;
  pageSize?: number | string;
}

export const userRepository = {
  async list() {
    if (!isDatabaseConfigured()) {
      return users;
    }

    const records = await prisma.user.findMany({
      orderBy: [{ name: "asc" }]
    });

    return records.map(mapUser);
  },
  async listAssignable() {
    if (!isDatabaseConfigured()) {
      return users
        .filter((user) => user.active && (user.role === "ADMIN" || user.role === "ATTENDANT" || user.role === "TECHNICIAN"))
        .sort((left, right) => left.name.localeCompare(right.name));
    }

    const records = await prisma.user.findMany({
      where: {
        active: true,
        role: {
          in: ["ADMIN", "ATTENDANT", "TECHNICIAN"]
        }
      },
      orderBy: [{ role: "asc" }, { name: "asc" }]
    });

    return records.map(mapUser);
  },

  async search(filters: UserSearchInput): Promise<PaginationResult<AppUser>> {
    const { page, pageSize, skip } = getPagination(filters.page, filters.pageSize);
    const sort = filters.sort ?? "name_asc";

    if (!isDatabaseConfigured()) {
      let filtered = [...users];

      if (filters.query) {
        const query = filters.query.toLowerCase();
        filtered = filtered.filter((user) =>
          [user.name, user.email].some((value) => value.toLowerCase().includes(query))
        );
      }

      if (filters.role) {
        filtered = filtered.filter((user) => user.role === filters.role);
      }

      filtered.sort((left, right) => {
        switch (sort) {
          case "name_desc":
            return right.name.localeCompare(left.name);
          case "role_asc":
            return left.role.localeCompare(right.role);
          case "role_desc":
            return right.role.localeCompare(left.role);
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
        : sort === "role_asc"
          ? [{ role: "asc" as const }, { name: "asc" as const }]
          : sort === "role_desc"
            ? [{ role: "desc" as const }, { name: "asc" as const }]
            : [{ name: "asc" as const }];

    const where = {
      ...(filters.query
        ? {
            OR: [
              { name: { contains: filters.query, mode: "insensitive" as const } },
              { email: { contains: filters.query, mode: "insensitive" as const } }
            ]
          }
        : {}),
      ...(filters.role ? { role: filters.role } : {})
    };

    const [records, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: pageSize
      }),
      prisma.user.count({ where })
    ]);

    return buildPaginationResult(records.map(mapUser), total, page, pageSize);
  },

  async findById(id: string) {
    if (!isDatabaseConfigured()) {
      return users.find((user) => user.id === id) ?? null;
    }

    const record = await prisma.user.findUnique({
      where: { id }
    });

    return record ? mapUser(record) : null;
  },

  async findFirstActive() {
    if (!isDatabaseConfigured()) {
      return users[0] ?? null;
    }

    const record = await prisma.user.findFirst({
      where: { active: true },
      orderBy: [{ createdAt: "asc" }]
    });

    return record ? mapUser(record) : null;
  },

  async findAuthByEmail(email: string) {
    if (!isDatabaseConfigured()) {
      return null;
    }

    return prisma.user.findUnique({
      where: { email }
    });
  },

  async findByClientId(clientId: string) {
    return prisma.user.findFirst({
      where: { clientId, role: "CLIENT" }
    });
  },

  async create(input: CreateUserInput) {
    const record = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role,
        clientId: input.clientId
      }
    });

    return mapUser(record);
  },

  async update(id: string, input: UpdateUserInput) {
    const record = await prisma.user.update({
      where: { id },
      data: {
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role,
        active: input.active
      }
    });

    return mapUser(record);
  },

  async updatePassword(id: string, passwordHash: string) {
    await prisma.user.update({ where: { id }, data: { passwordHash } });
  }
};
