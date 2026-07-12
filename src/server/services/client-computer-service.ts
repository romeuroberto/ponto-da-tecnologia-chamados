import type { ClientComputerInput } from "@/lib/validations/client-computer";
import { isDatabaseConfigured, normalizeOptionalString } from "@/server/db-support";
import { clientComputerRepository } from "@/server/repositories/client-computer-repository";
import { clientRepository } from "@/server/repositories/client-repository";

function normalizeClientComputerInput(input: ClientComputerInput) {
  return {
    name: input.name,
    location: normalizeOptionalString(input.location),
    responsibleName: normalizeOptionalString(input.responsibleName),
    remoteTool: input.remoteTool,
    remoteCode: normalizeOptionalString(input.remoteCode),
    remotePassword: normalizeOptionalString(input.remotePassword),
    notes: normalizeOptionalString(input.notes),
    active: input.active
  };
}

async function ensureClientExists(clientId: string) {
  const client = await clientRepository.findById(clientId);

  if (!client) {
    throw new Error("Cliente não encontrado.");
  }

  return client;
}

async function ensureComputerBelongsToClient(clientId: string, computerId: string) {
  const computer = await clientComputerRepository.findByClientAndId(clientId, computerId);

  if (!computer) {
    throw new Error("Computador não encontrado para este cliente.");
  }

  return computer;
}

export const clientComputerService = {
  async listRemoteAccessDirectory(input: { includeInactive?: boolean } = {}) {
    if (!isDatabaseConfigured()) {
      return [];
    }

    return clientComputerRepository.listAll(input);
  },

  async listClientComputers(clientId: string, input: { includeInactive?: boolean } = {}) {
    if (!isDatabaseConfigured()) {
      return [];
    }

    await ensureClientExists(clientId);

    return clientComputerRepository.listByClient(clientId, input);
  },

  async getClientComputer(clientId: string, computerId: string) {
    if (!isDatabaseConfigured()) {
      return null;
    }

    await ensureClientExists(clientId);

    return clientComputerRepository.findByClientAndId(clientId, computerId);
  },

  async createClientComputer(clientId: string, input: ClientComputerInput) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de cadastrar computadores.");
    }

    await ensureClientExists(clientId);

    return clientComputerRepository.create(clientId, normalizeClientComputerInput(input));
  },

  async updateClientComputer(clientId: string, computerId: string, input: ClientComputerInput) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de atualizar computadores.");
    }

    await ensureClientExists(clientId);
    await ensureComputerBelongsToClient(clientId, computerId);

    return clientComputerRepository.update(clientId, computerId, normalizeClientComputerInput(input));
  }
};
