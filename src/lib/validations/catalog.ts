import { z } from "zod";

export const serviceCatalogItemSchema = z.object({
  name: z.string().trim().min(2, "Nome obrigatorio").max(120, "Nome muito longo"),
  description: z.string().trim().max(500, "Descricao muito longa").optional().or(z.literal("")),
  defaultPrice: z.coerce.number().min(0, "Valor nao pode ser negativo"),
  active: z.boolean().default(true)
});

export const partCatalogItemSchema = z.object({
  name: z.string().trim().min(2, "Nome obrigatorio").max(120, "Nome muito longo"),
  description: z.string().trim().max(500, "Descricao muito longa").optional().or(z.literal("")),
  costPrice: z.coerce.number().min(0, "Custo nao pode ser negativo"),
  unitPrice: z.coerce.number().min(0, "Valor nao pode ser negativo"),
  initialQuantity: z.coerce.number().min(0, "Quantidade inicial nao pode ser negativa").default(0),
  active: z.boolean().default(true)
});

export const partCatalogItemUpdateSchema = partCatalogItemSchema.omit({ initialQuantity: true });

export type ServiceCatalogItemInput = z.infer<typeof serviceCatalogItemSchema>;
export type PartCatalogItemInput = z.infer<typeof partCatalogItemSchema>;
export type PartCatalogItemUpdateInput = z.infer<typeof partCatalogItemUpdateSchema>;
