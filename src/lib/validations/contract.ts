import { z } from "zod";

export const contractSchema = z.object({
  contractNumber: z.string().trim().min(2, "Número do contrato obrigatório"),
  startDate: z.string().min(1, "Data de início obrigatória"),
  endDate: z.string().optional().or(z.literal("")),
  status: z.enum(["RASCUNHO", "ATIVO", "ENCERRADO", "EXPIRADO"]),
  coverageType: z.enum(["TOTAL", "PARCIAL"]),
  monthlyValue: z.coerce.number().min(0).optional(),
  coveredCategories: z.array(z.string()),
  notes: z.string().trim().max(1000).optional().or(z.literal(""))
});

export type ContractInput = z.infer<typeof contractSchema>;
