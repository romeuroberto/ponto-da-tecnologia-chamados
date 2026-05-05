import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { tickets } from "@/lib/mock-data";
import type { PaginationResult, Ticket, TicketAttendanceType, TicketPriority, TicketStatus } from "@/types";
import { isDatabaseConfigured, normalizeOptionalString } from "@/server/db-support";
import { mapTicket, ticketInclude, ticketIncludeWithoutServiceOrderParts, ticketIncludeWithoutServiceOrders } from "@/server/mappers";
import { buildPaginationResult, getPagination } from "@/server/pagination";

export interface CreateTicketInput {
  clientId: string;
  number: string;
  title: string;
  description: string;
  category?: string;
  attendanceType: TicketAttendanceType;
  priority: TicketPriority;
  requesterName: string;
  requesterEmail?: string;
  assigneeId?: string;
  openedById: string;
}

export interface UpdateTicketFieldsInput {
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId?: string;
  closingReason?: string;
  title?: string;
  authorId: string;
}

export interface CreateAttachmentInput {
  ticketId: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
  authorId: string;
}

export interface TicketSearchInput {
  query?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  client?: string;
  from?: string;
  to?: string;
  sort?: "updated_desc" | "updated_asc" | "created_desc" | "created_asc" | "priority_desc" | "priority_asc";
  page?: number | string;
  pageSize?: number | string;
}

const statusLabels: Record<TicketStatus, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em atendimento",
  WAITING_CUSTOMER: "Aguardando cliente",
  RESOLVED: "Resolvido",
  CLOSED: "Encerrado",
  CANCELED: "Cancelado"
};

const priorityLabels: Record<TicketPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica"
};

function isMissingServiceOrderTableError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021" && error.message.includes("ServiceOrder");
}

function isMissingServiceOrderPartTableError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021" && error.message.includes("ServiceOrderPart");
}

async function runTicketQuery<T>(
  withServiceOrders: () => Promise<T>,
  withoutServiceOrderParts: () => Promise<T>,
  withoutServiceOrders: () => Promise<T>
) {
  try {
    return await withServiceOrders();
  } catch (error) {
    if (isMissingServiceOrderPartTableError(error)) {
      return withoutServiceOrderParts();
    }
    if (isMissingServiceOrderTableError(error)) {
      return withoutServiceOrders();
    }
    throw error;
  }
}

export const ticketRepository = {
  async list() {
    if (!isDatabaseConfigured()) {
      return tickets;
    }

    const records = await runTicketQuery(
      () => prisma.ticket.findMany({ include: ticketInclude, orderBy: [{ updatedAt: "desc" }] }),
      () => prisma.ticket.findMany({ include: ticketIncludeWithoutServiceOrderParts, orderBy: [{ updatedAt: "desc" }] }),
      () => prisma.ticket.findMany({ include: ticketIncludeWithoutServiceOrders, orderBy: [{ updatedAt: "desc" }] })
    );

    return records.map(mapTicket);
  },

  async search(filters: TicketSearchInput): Promise<PaginationResult<Ticket>> {
    const { page, pageSize, skip } = getPagination(filters.page, filters.pageSize);
    const sort = filters.sort ?? "updated_desc";

    if (!isDatabaseConfigured()) {
      let filtered = [...tickets];

      if (filters.query) {
        const query = filters.query.toLowerCase();
        filtered = filtered.filter((ticket) =>
          [ticket.number, ticket.title, ticket.clientName].some((value) => value.toLowerCase().includes(query))
        );
      }

      if (filters.status) {
        filtered = filtered.filter((ticket) => ticket.status === filters.status);
      }

      if (filters.priority) {
        filtered = filtered.filter((ticket) => ticket.priority === filters.priority);
      }

      if (filters.client) {
        filtered = filtered.filter((ticket) => ticket.clientId === filters.client || ticket.clientName === filters.client);
      }

      if (filters.from) {
        const fromDate = new Date(`${filters.from}T00:00:00`);
        filtered = filtered.filter((ticket) => new Date(ticket.createdAt) >= fromDate);
      }

      if (filters.to) {
        const toDate = new Date(`${filters.to}T23:59:59`);
        filtered = filtered.filter((ticket) => new Date(ticket.createdAt) <= toDate);
      }

      filtered.sort((left, right) => {
        switch (sort) {
          case "updated_asc":
            return Date.parse(left.updatedAt) - Date.parse(right.updatedAt);
          case "created_desc":
            return Date.parse(right.createdAt) - Date.parse(left.createdAt);
          case "created_asc":
            return Date.parse(left.createdAt) - Date.parse(right.createdAt);
          case "priority_desc":
            return ["LOW", "MEDIUM", "HIGH", "CRITICAL"].indexOf(right.priority) - ["LOW", "MEDIUM", "HIGH", "CRITICAL"].indexOf(left.priority);
          case "priority_asc":
            return ["LOW", "MEDIUM", "HIGH", "CRITICAL"].indexOf(left.priority) - ["LOW", "MEDIUM", "HIGH", "CRITICAL"].indexOf(right.priority);
          case "updated_desc":
          default:
            return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
        }
      });

      const total = filtered.length;
      return buildPaginationResult(filtered.slice(skip, skip + pageSize), total, page, pageSize);
    }

    const orderBy =
      sort === "updated_asc"
        ? [{ updatedAt: "asc" as const }]
        : sort === "created_desc"
          ? [{ createdAt: "desc" as const }]
          : sort === "created_asc"
            ? [{ createdAt: "asc" as const }]
            : sort === "priority_desc"
              ? [{ priority: "desc" as const }, { updatedAt: "desc" as const }]
              : sort === "priority_asc"
                ? [{ priority: "asc" as const }, { updatedAt: "desc" as const }]
                : [{ updatedAt: "desc" as const }];

    const where = {
      ...(filters.query
        ? {
            OR: [
              { number: { contains: filters.query, mode: "insensitive" as const } },
              { title: { contains: filters.query, mode: "insensitive" as const } },
              { client: { name: { contains: filters.query, mode: "insensitive" as const } } }
            ]
          }
        : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
      ...(filters.client ? { clientId: filters.client } : {}),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00`) } : {}),
              ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59`) } : {})
            }
          }
        : {})
    };

    const [records, total] = await runTicketQuery(
      () =>
        Promise.all([
          prisma.ticket.findMany({ where, include: ticketInclude, orderBy, skip, take: pageSize }),
          prisma.ticket.count({ where })
        ]),
      () =>
        Promise.all([
          prisma.ticket.findMany({ where, include: ticketIncludeWithoutServiceOrderParts, orderBy, skip, take: pageSize }),
          prisma.ticket.count({ where })
        ]),
      () =>
        Promise.all([
          prisma.ticket.findMany({ where, include: ticketIncludeWithoutServiceOrders, orderBy, skip, take: pageSize }),
          prisma.ticket.count({ where })
        ])
    );

    return buildPaginationResult(records.map(mapTicket), total, page, pageSize);
  },

  async findById(id: string) {
    if (!isDatabaseConfigured()) {
      return tickets.find((ticket) => ticket.id === id) ?? null;
    }

    const record = await runTicketQuery(
      () => prisma.ticket.findUnique({ where: { id }, include: ticketInclude }),
      () => prisma.ticket.findUnique({ where: { id }, include: ticketIncludeWithoutServiceOrderParts }),
      () => prisma.ticket.findUnique({ where: { id }, include: ticketIncludeWithoutServiceOrders })
    );

    return record ? mapTicket(record) : null;
  },

  async create(input: CreateTicketInput) {
    const record = await runTicketQuery(
      () =>
        prisma.ticket.create({
          data: {
            number: input.number,
            title: input.title,
            description: input.description,
            category: normalizeOptionalString(input.category),
            attendanceType: input.attendanceType,
            priority: input.priority,
            status: "OPEN",
            requesterName: input.requesterName,
            requesterEmail: normalizeOptionalString(input.requesterEmail),
            clientId: input.clientId,
            assigneeId: normalizeOptionalString(input.assigneeId),
            openedById: input.openedById,
            history: {
              create: {
                authorId: input.openedById,
                eventType: "CREATED",
                message: "Chamado criado no sistema."
              }
            }
          } as never,
          include: ticketInclude
        }),
      () =>
        prisma.ticket.create({
          data: {
            number: input.number,
            title: input.title,
            description: input.description,
            category: normalizeOptionalString(input.category),
            attendanceType: input.attendanceType,
            priority: input.priority,
            status: "OPEN",
            requesterName: input.requesterName,
            requesterEmail: normalizeOptionalString(input.requesterEmail),
            clientId: input.clientId,
            assigneeId: normalizeOptionalString(input.assigneeId),
            openedById: input.openedById,
            history: {
              create: {
                authorId: input.openedById,
                eventType: "CREATED",
                message: "Chamado criado no sistema."
              }
            }
          } as never,
          include: ticketIncludeWithoutServiceOrderParts
        }),
      () =>
        prisma.ticket.create({
          data: {
            number: input.number,
            title: input.title,
            description: input.description,
            category: normalizeOptionalString(input.category),
            attendanceType: input.attendanceType,
            priority: input.priority,
            status: "OPEN",
            requesterName: input.requesterName,
            requesterEmail: normalizeOptionalString(input.requesterEmail),
            clientId: input.clientId,
            assigneeId: normalizeOptionalString(input.assigneeId),
            openedById: input.openedById,
            history: {
              create: {
                authorId: input.openedById,
                eventType: "CREATED",
                message: "Chamado criado no sistema."
              }
            }
          } as never,
          include: ticketIncludeWithoutServiceOrders
        })
    );

    return mapTicket(record);
  },

  async updateStatus(id: string, status: TicketStatus, authorId: string) {
    const current = await prisma.ticket.findUnique({ where: { id }, select: { status: true } });

    if (!current) {
      return null;
    }

    const record = await runTicketQuery(
      () =>
        prisma.ticket.update({
          where: { id },
          data: {
            status,
            resolvedAt: status === "RESOLVED" ? new Date() : undefined,
            closedAt: status === "CLOSED" ? new Date() : undefined,
            history: {
              create: {
                authorId,
                eventType: "STATUS_CHANGE",
                message: `Status alterado para ${status}.`,
                previousStatus: current.status,
                nextStatus: status
              }
            }
          },
          include: ticketInclude
        }),
      () =>
        prisma.ticket.update({
          where: { id },
          data: {
            status,
            resolvedAt: status === "RESOLVED" ? new Date() : undefined,
            closedAt: status === "CLOSED" ? new Date() : undefined,
            history: {
              create: {
                authorId,
                eventType: "STATUS_CHANGE",
                message: `Status alterado para ${status}.`,
                previousStatus: current.status,
                nextStatus: status
              }
            }
          },
          include: ticketIncludeWithoutServiceOrderParts
        }),
      () =>
        prisma.ticket.update({
          where: { id },
          data: {
            status,
            resolvedAt: status === "RESOLVED" ? new Date() : undefined,
            closedAt: status === "CLOSED" ? new Date() : undefined,
            history: {
              create: {
                authorId,
                eventType: "STATUS_CHANGE",
                message: `Status alterado para ${status}.`,
                previousStatus: current.status,
                nextStatus: status
              }
            }
          },
          include: ticketIncludeWithoutServiceOrders
        })
    );

    return mapTicket(record);
  },

  async updateFields(id: string, input: UpdateTicketFieldsInput) {
    const current = await prisma.ticket.findUnique({
      where: { id },
      select: {
        title: true,
        status: true,
        priority: true,
        assigneeId: true,
        closingReason: true,
        resolvedAt: true,
        closedAt: true
      }
    });

    if (!current) {
      return null;
    }

    const historyEntries = [];
    const isReopening =
      (current.status === "RESOLVED" || current.status === "CLOSED" || current.status === "CANCELED") &&
      (input.status === "OPEN" || input.status === "IN_PROGRESS" || input.status === "WAITING_CUSTOMER");

    if (current.status !== input.status) {
      historyEntries.push({
        authorId: input.authorId,
        eventType: isReopening ? ("REOPENED" as const) : ("STATUS_CHANGE" as const),
        message: isReopening ? `Chamado reaberto e movido para ${statusLabels[input.status]}.` : `Status alterado para ${statusLabels[input.status]}.`,
        previousStatus: current.status,
        nextStatus: input.status
      });
    }

    if (current.priority !== input.priority) {
      historyEntries.push({
        authorId: input.authorId,
        eventType: "PRIORITY_CHANGE" as const,
        message: `Prioridade alterada para ${priorityLabels[input.priority]}.`,
        previousPriority: current.priority,
        nextPriority: input.priority
      });
    }

    if ((current.assigneeId ?? null) !== (input.assigneeId ?? null)) {
      historyEntries.push({
        authorId: input.authorId,
        eventType: "ASSIGNEE_CHANGE" as const,
        message: input.assigneeId ? "Responsável atualizado." : "Responsável removido."
      });
    }

    if (input.title && input.title !== current.title) {
      historyEntries.push({
        authorId: input.authorId,
        eventType: "COMMENT" as const,
        message: `Título alterado para: "${input.title}".`
      });
    }

    if ((input.status === "CLOSED" || input.status === "CANCELED") && input.closingReason && input.closingReason !== current.closingReason) {
      historyEntries.push({
        authorId: input.authorId,
        eventType: "COMMENT" as const,
        message: `Motivo do encerramento: ${input.closingReason}`
      });
    }

    const baseData = {
      ...(input.title ? { title: input.title } : {}),
      status: input.status,
      priority: input.priority,
      assigneeId: normalizeOptionalString(input.assigneeId),
      resolvedAt: input.status === "RESOLVED" || input.status === "CLOSED" ? current.resolvedAt ?? new Date() : null,
      closedAt: input.status === "CLOSED" || input.status === "CANCELED" ? current.closedAt ?? new Date() : null,
      closingReason: input.status === "CLOSED" || input.status === "CANCELED" ? normalizeOptionalString(input.closingReason) : null,
      history: historyEntries.length > 0 ? { create: historyEntries } : undefined
    };

    const record = await runTicketQuery(
      () => prisma.ticket.update({ where: { id }, data: baseData, include: ticketInclude }),
      () => prisma.ticket.update({ where: { id }, data: baseData, include: ticketIncludeWithoutServiceOrderParts }),
      () => prisma.ticket.update({ where: { id }, data: baseData, include: ticketIncludeWithoutServiceOrders })
    );

    return mapTicket(record);
  },

  async checkIn(id: string, authorId: string) {
    const ticket = await prisma.ticket.findUnique({ where: { id }, select: { id: true, checkedInAt: true } });

    if (!ticket) return null;
    if (ticket.checkedInAt) return null;

    const record = await runTicketQuery(
      () => prisma.ticket.update({
        where: { id },
        data: {
          checkedInAt: new Date(),
          history: { create: { authorId, eventType: "COMMENT", message: "Check-in registrado." } }
        },
        include: ticketInclude
      }),
      () => prisma.ticket.update({
        where: { id },
        data: {
          checkedInAt: new Date(),
          history: { create: { authorId, eventType: "COMMENT", message: "Check-in registrado." } }
        },
        include: ticketIncludeWithoutServiceOrderParts
      }),
      () => prisma.ticket.update({
        where: { id },
        data: {
          checkedInAt: new Date(),
          history: { create: { authorId, eventType: "COMMENT", message: "Check-in registrado." } }
        },
        include: ticketIncludeWithoutServiceOrders
      })
    );

    return mapTicket(record);
  },

  async checkOut(id: string, authorId: string) {
    const ticket = await prisma.ticket.findUnique({ where: { id }, select: { id: true, checkedInAt: true, checkedOutAt: true } });

    if (!ticket) return null;
    if (!ticket.checkedInAt) return null;
    if (ticket.checkedOutAt) return null;

    const record = await runTicketQuery(
      () => prisma.ticket.update({
        where: { id },
        data: {
          checkedOutAt: new Date(),
          history: { create: { authorId, eventType: "COMMENT", message: "Check-out registrado." } }
        },
        include: ticketInclude
      }),
      () => prisma.ticket.update({
        where: { id },
        data: {
          checkedOutAt: new Date(),
          history: { create: { authorId, eventType: "COMMENT", message: "Check-out registrado." } }
        },
        include: ticketIncludeWithoutServiceOrderParts
      }),
      () => prisma.ticket.update({
        where: { id },
        data: {
          checkedOutAt: new Date(),
          history: { create: { authorId, eventType: "COMMENT", message: "Check-out registrado." } }
        },
        include: ticketIncludeWithoutServiceOrders
      })
    );

    return mapTicket(record);
  },

  async addComment(id: string, message: string, authorId: string) {
    const ticket = await prisma.ticket.findUnique({ where: { id }, select: { id: true } });

    if (!ticket) {
      return null;
    }

    const record = await runTicketQuery(
      () =>
        prisma.ticket.update({
          where: { id },
          data: {
            history: {
              create: {
                authorId,
                eventType: "COMMENT",
                message
              }
            }
          },
          include: ticketInclude
        }),
      () =>
        prisma.ticket.update({
          where: { id },
          data: {
            history: {
              create: {
                authorId,
                eventType: "COMMENT",
                message
              }
            }
          },
          include: ticketIncludeWithoutServiceOrderParts
        }),
      () =>
        prisma.ticket.update({
          where: { id },
          data: {
            history: {
              create: {
                authorId,
                eventType: "COMMENT",
                message
              }
            }
          },
          include: ticketIncludeWithoutServiceOrders
        })
    );

    return mapTicket(record);
  },

  async addAttachment(input: CreateAttachmentInput) {
    const ticket = await prisma.ticket.findUnique({ where: { id: input.ticketId }, select: { id: true } });

    if (!ticket) {
      return null;
    }

    const record = await runTicketQuery(
      () =>
        prisma.ticket.update({
          where: { id: input.ticketId },
          data: {
            attachments: {
              create: {
                fileName: input.fileName,
                filePath: input.filePath,
                mimeType: input.mimeType,
                sizeBytes: input.sizeBytes
              }
            },
            history: {
              create: {
                authorId: input.authorId,
                eventType: "COMMENT",
                message: `Anexo enviado: ${input.fileName}`
              }
            }
          },
          include: ticketInclude
        }),
      () =>
        prisma.ticket.update({
          where: { id: input.ticketId },
          data: {
            attachments: {
              create: {
                fileName: input.fileName,
                filePath: input.filePath,
                mimeType: input.mimeType,
                sizeBytes: input.sizeBytes
              }
            },
            history: {
              create: {
                authorId: input.authorId,
                eventType: "COMMENT",
                message: `Anexo enviado: ${input.fileName}`
              }
            }
          },
          include: ticketIncludeWithoutServiceOrderParts
        }),
      () =>
        prisma.ticket.update({
          where: { id: input.ticketId },
          data: {
            attachments: {
              create: {
                fileName: input.fileName,
                filePath: input.filePath,
                mimeType: input.mimeType,
                sizeBytes: input.sizeBytes
              }
            },
            history: {
              create: {
                authorId: input.authorId,
                eventType: "COMMENT",
                message: `Anexo enviado: ${input.fileName}`
              }
            }
          },
          include: ticketIncludeWithoutServiceOrders
        })
    );

    return mapTicket(record);
  }
};
