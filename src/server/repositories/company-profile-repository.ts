import { prisma } from "@/lib/db/prisma";
import type { CompanyProfile } from "@/types";
import { isDatabaseConfigured, normalizeOptionalString } from "@/server/db-support";
import { mapCompanyProfile } from "@/server/mappers";
import { isMissingTableError } from "@/server/repositories/portal-support";

export interface UpsertCompanyProfileInput {
  legalName: string;
  tradeName?: string;
  document: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  financialEmail?: string;
  phone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  notes?: string;
  logoPath?: string;
  signaturePath?: string;
}

export const companyProfileRepository = {
  async get(): Promise<CompanyProfile | null> {
    if (!isDatabaseConfigured()) {
      return null;
    }

    try {
      const record = await prisma.companyProfile.findFirst({
        orderBy: {
          createdAt: "asc"
        }
      });

      return record ? mapCompanyProfile(record) : null;
    } catch (error) {
      if (isMissingTableError(error, "CompanyProfile")) {
        return null;
      }

      throw error;
    }
  },

  async upsert(input: UpsertCompanyProfileInput): Promise<CompanyProfile> {
    const current = await prisma.companyProfile.findFirst({
      orderBy: {
        createdAt: "asc"
      }
    });

    const data = {
      legalName: input.legalName,
      tradeName: normalizeOptionalString(input.tradeName) ?? null,
      document: input.document,
      stateRegistration: normalizeOptionalString(input.stateRegistration) ?? null,
      municipalRegistration: normalizeOptionalString(input.municipalRegistration) ?? null,
      financialEmail: normalizeOptionalString(input.financialEmail) ?? null,
      phone: normalizeOptionalString(input.phone) ?? null,
      website: normalizeOptionalString(input.website) ?? null,
      addressLine1: normalizeOptionalString(input.addressLine1) ?? null,
      addressLine2: normalizeOptionalString(input.addressLine2) ?? null,
      city: normalizeOptionalString(input.city) ?? null,
      state: normalizeOptionalString(input.state) ?? null,
      postalCode: normalizeOptionalString(input.postalCode) ?? null,
      notes: normalizeOptionalString(input.notes) ?? null,
      logoPath: normalizeOptionalString(input.logoPath) ?? null,
      signaturePath: normalizeOptionalString(input.signaturePath) ?? null
    };

    const record = current
      ? await prisma.companyProfile.update({
          where: { id: current.id },
          data
        })
      : await prisma.companyProfile.create({
          data
        });

    return mapCompanyProfile(record);
  }
};
