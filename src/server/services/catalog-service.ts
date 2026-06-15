import type { PartCatalogItemInput, PartCatalogItemUpdateInput, ServiceCatalogItemInput } from "@/lib/validations/catalog";
import { isDatabaseConfigured } from "@/server/db-support";
import { catalogRepository } from "@/server/repositories/catalog-repository";
import { stockRepository } from "@/server/repositories/stock-repository";

export const catalogService = {
  async listServiceItems(includeInactive = false) {
    return catalogRepository.listServiceItems({ includeInactive });
  },

  async listPartItems(includeInactive = false) {
    return catalogRepository.listPartItems({ includeInactive });
  },

  async createServiceItem(input: ServiceCatalogItemInput) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de cadastrar serviços.");
    }

    return catalogRepository.createServiceItem({
      name: input.name,
      description: input.description || undefined,
      defaultPrice: input.defaultPrice,
      resalePrice: input.resalePrice ?? null,
      active: input.active
    });
  },

  async updateServiceItem(id: string, input: ServiceCatalogItemInput) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de atualizar serviços.");
    }

    return catalogRepository.updateServiceItem(id, {
      name: input.name,
      description: input.description || undefined,
      defaultPrice: input.defaultPrice,
      resalePrice: input.resalePrice ?? null,
      active: input.active
    });
  },

  async createPartItem(input: PartCatalogItemInput & { createdById: string }) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de cadastrar materiais.");
    }

    const item = await catalogRepository.createPartItem({
      name: input.name,
      description: input.description || undefined,
      unit: input.unit,
      costPrice: input.costPrice,
      unitPrice: input.unitPrice,
      resalePrice: input.resalePrice ?? null,
      minimumStock: input.minimumStock ?? null,
      active: input.active
    });

    if (input.initialQuantity > 0) {
      await stockRepository.addEntry({
        partCatalogItemId: item.id,
        quantity: input.initialQuantity,
        notes: "Saldo inicial definido no cadastro do material.",
        createdById: input.createdById
      });

      const refreshed = (await stockRepository.listParts()).find((part) => part.id === item.id);

      if (refreshed) {
        return refreshed;
      }
    }

    return item;
  },

  async updatePartItem(id: string, input: PartCatalogItemUpdateInput) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de atualizar materiais.");
    }

    return catalogRepository.updatePartItem(id, {
      name: input.name,
      description: input.description || undefined,
      unit: input.unit,
      costPrice: input.costPrice,
      unitPrice: input.unitPrice,
      resalePrice: input.resalePrice ?? null,
      minimumStock: input.minimumStock ?? null,
      active: input.active
    });
  }
};
