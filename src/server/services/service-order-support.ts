import { catalogRepository } from "@/server/repositories/catalog-repository";

export async function requireActivePartCatalogItems(
  parts?: {
    partCatalogItemId: string;
    quantity: number;
    unitPrice?: number;
    notes?: string;
  }[]
) {
  if (!parts || parts.length === 0) {
    return [];
  }

  const catalogItems = await catalogRepository.findPartItemsByIds(parts.map((part) => part.partCatalogItemId));
  const catalogById = new Map(catalogItems.map((item) => [item.id, item]));

  return parts.map((part) => {
    const catalogItem = catalogById.get(part.partCatalogItemId);

    if (!catalogItem) {
      throw new Error("Uma das peças selecionadas não foi encontrada no catálogo.");
    }

    return {
      partCatalogItemId: catalogItem.id,
      partName: catalogItem.name,
      partCode: catalogItem.code,
      quantity: part.quantity,
      unitPrice: typeof part.unitPrice === "number" ? part.unitPrice : catalogItem.unitPrice,
      notes: part.notes
    };
  });
}
