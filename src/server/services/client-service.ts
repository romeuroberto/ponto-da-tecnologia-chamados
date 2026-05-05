import type { ClientInput } from "@/lib/validations/client";
import { normalizeBrazilianPhone } from "@/lib/utils";
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
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de gravar clientes reais.");
    }

    return clientRepository.create({
      ...input,
      email: input.email || undefined,
      phone: normalizeBrazilianPhone(input.phone),
      billingProfile: input.billingProfile
        ? {
            ...input.billingProfile,
            hourlyRate: input.billingProfile.hourlyRate,
            travelRate: input.billingProfile.travelRate,
            defaultDiscountPercent: input.billingProfile.defaultDiscountPercent,
            contractNotes: input.billingProfile.contractNotes || undefined
          }
        : undefined
    });
  },
  async updateClient(id: string, input: ClientInput) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de atualizar clientes reais.");
    }

    return clientRepository.update(id, {
      ...input,
      email: input.email || undefined,
      phone: normalizeBrazilianPhone(input.phone),
      billingProfile: input.billingProfile
        ? {
            ...input.billingProfile,
            hourlyRate: input.billingProfile.hourlyRate,
            travelRate: input.billingProfile.travelRate,
            defaultDiscountPercent: input.billingProfile.defaultDiscountPercent,
            contractNotes: input.billingProfile.contractNotes || undefined
          }
        : undefined
    });
  }
};
