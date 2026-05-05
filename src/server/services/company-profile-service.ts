import { isDatabaseConfigured } from "@/server/db-support";
import { normalizeBrazilianPhone } from "@/lib/utils";
import { companyProfileRepository, type UpsertCompanyProfileInput } from "@/server/repositories/company-profile-repository";

export const companyProfileService = {
  async getProfile() {
    return companyProfileRepository.get();
  },

  async saveProfile(input: UpsertCompanyProfileInput) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de editar o perfil da empresa.");
    }

    return companyProfileRepository.upsert({
      ...input,
      phone: normalizeBrazilianPhone(input.phone)
    });
  }
};
