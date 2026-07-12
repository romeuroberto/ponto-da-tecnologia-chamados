import { prisma } from "@/lib/db/prisma";
import type { ClientComputer, ClientComputerAccess, RemoteAccessTool } from "@/types";
import { mapClientComputer, mapClientComputerAccess } from "@/server/mappers";

export interface UpsertClientComputerInput {
  name: string;
  location?: string | null;
  responsibleName?: string | null;
  remoteTool: RemoteAccessTool;
  remoteCode?: string | null;
  remotePassword?: string | null;
  notes?: string | null;
  active?: boolean;
}

export const clientComputerRepository = {
  async listAll(input: { includeInactive?: boolean } = {}): Promise<ClientComputerAccess[]> {
    const records = await prisma.clientComputer.findMany({
      where: {
        ...(input.includeInactive ? {} : { active: true }),
        client: {
          active: true
        }
      },
      include: {
        client: {
          select: {
            name: true
          }
        }
      },
      orderBy: [{ client: { name: "asc" } }, { name: "asc" }]
    });

    return records.map(mapClientComputerAccess);
  },

  async listByClient(clientId: string, input: { includeInactive?: boolean } = {}): Promise<ClientComputer[]> {
    const records = await prisma.clientComputer.findMany({
      where: {
        clientId,
        ...(input.includeInactive ? {} : { active: true })
      },
      orderBy: [{ active: "desc" }, { name: "asc" }]
    });

    return records.map(mapClientComputer);
  },

  async findByClientAndId(clientId: string, id: string): Promise<ClientComputer | null> {
    const record = await prisma.clientComputer.findFirst({
      where: {
        id,
        clientId
      }
    });

    return record ? mapClientComputer(record) : null;
  },

  async create(clientId: string, input: UpsertClientComputerInput): Promise<ClientComputer> {
    const record = await prisma.clientComputer.create({
      data: {
        clientId,
        name: input.name,
        location: input.location ?? null,
        responsibleName: input.responsibleName ?? null,
        remoteTool: input.remoteTool,
        remoteCode: input.remoteCode ?? null,
        remotePassword: input.remotePassword ?? null,
        notes: input.notes ?? null,
        active: input.active ?? true
      }
    });

    return mapClientComputer(record);
  },

  async update(clientId: string, id: string, input: UpsertClientComputerInput): Promise<ClientComputer> {
    const record = await prisma.clientComputer.update({
      where: { id },
      data: {
        clientId,
        name: input.name,
        location: input.location ?? null,
        responsibleName: input.responsibleName ?? null,
        remoteTool: input.remoteTool,
        remoteCode: input.remoteCode ?? null,
        remotePassword: input.remotePassword ?? null,
        notes: input.notes ?? null,
        active: input.active ?? true
      }
    });

    return mapClientComputer(record);
  }
};
