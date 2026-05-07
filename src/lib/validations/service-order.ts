import { z } from "zod";

const serviceOrderPartSchema = z.object({
  partCatalogItemId: z.string().trim().min(1, "Selecione um material do catálogo."),
  quantity: z.coerce.number().positive("Informe uma quantidade maior que zero.").max(9999, "Quantidade muito alta."),
  unitPrice: z.coerce.number().min(0, "O valor não pode ser negativo.").max(999999, "Valor muito alto.").optional(),
  notes: z.string().trim().max(500, "Observações do material muito longas.").optional().or(z.literal(""))
});

export const serviceOrderCreateSchema = z.object({
  serviceType: z.string().trim().max(120, "Tipo de serviço muito longo").optional().or(z.literal("")),
  servicePrice: z.coerce.number().min(0).max(999999).optional(),
  assignedTechnicianId: z.string().trim().optional().or(z.literal("")),
  scheduledStartAt: z.string().datetime().optional().or(z.literal("")),
  executionNotes: z.string().trim().max(5000, "Observações muito longas").optional().or(z.literal("")),
  parts: z.array(serviceOrderPartSchema).max(50, "Muitos materiais informados.").optional().default([])
});

export const serviceOrderUpdateSchema = z.object({
  status: z.enum(["PLANNED", "IN_EXECUTION", "PAUSED", "COMPLETED", "CANCELED"]),
  serviceType: z.string().trim().max(120, "Tipo de serviço muito longo").optional().or(z.literal("")),
  servicePrice: z.coerce.number().min(0).max(999999).optional(),
  assignedTechnicianId: z.string().trim().optional().or(z.literal("")),
  scheduledStartAt: z.string().datetime().optional().or(z.literal("")),
  startedAt: z.string().datetime().optional().or(z.literal("")),
  finishedAt: z.string().datetime().optional().or(z.literal("")),
  executionNotes: z.string().trim().max(5000, "Observações muito longas").optional().or(z.literal("")),
  customerApprovalName: z.string().trim().max(120, "Nome muito longo").optional().or(z.literal("")),
  customerApprovalAt: z.string().datetime().optional().or(z.literal("")),
  parts: z.array(serviceOrderPartSchema).max(50, "Muitos materiais informados.").optional().default([])
});
