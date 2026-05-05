import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  document: z.string().optional(),
  contactName: z.string().min(2, "Contato principal obrigatório"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
  billingProfile: z.object({
    defaultBillingType: z.enum(["AVULSO", "CONTRATO", "GARANTIA", "CORTESIA"]),
    hourlyRate: z.coerce.number().min(0, "Valor/hora não pode ser negativo").optional(),
    travelRate: z.coerce.number().min(0, "Deslocamento não pode ser negativo").optional(),
    defaultDiscountPercent: z.coerce.number().min(0, "Desconto não pode ser negativo").max(100, "Desconto máximo de 100%").optional(),
    hasActiveContract: z.boolean(),
    contractNotes: z.string().optional(),
    contractCoveredCategories: z.array(z.string()).optional()
  }).optional()
});

export type ClientInput = z.infer<typeof clientSchema>;
