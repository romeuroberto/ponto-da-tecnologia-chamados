import type { ClientInput } from "@/lib/validations/client";
import { isDatabaseConfigured } from "@/server/db-support";
import { clientRepository } from "@/server/repositories/client-repository";
import type { ClientSearchInput } from "@/server/repositories/client-repository";

export const clientService = {
  async listClients() {
    return clientRepository.list();
  },
  async searchClients(filters: ClientSearchInput) {
    return clientRepository.search(filters);
  },
  async getClient(id: string) {
    return clientRepository.findById(id);
  },
  async createClient(input: ClientInput) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL nao configurada. Configure o banco antes de gravar clientes reais.");
    }

    return clientRepository.create({
      ...input,
      email: input.email || undefined
    });
  },
  async updateClient(id: string, input: ClientInput) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL nao configurada. Configure o banco antes de atualizar clientes reais.");
    }

    return clientRepository.update(id, {
      ...input,
      email: input.email || undefined
    });
  }
};
