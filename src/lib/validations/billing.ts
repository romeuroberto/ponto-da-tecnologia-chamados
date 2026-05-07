import { z } from "zod";

export const billingSummarySchema = z.object({
  billingType: z.enum(["AVULSO", "CONTRATO", "GARANTIA", "CORTESIA"]),
  financialStatus: z.enum(["PENDENTE", "EM_ANALISE", "APROVADO", "FATURADO", "PAGO", "CANCELADO"]),
  discountAmount: z.coerce.number().min(0, "Desconto não pode ser negativo").default(0),
  internalNotes: z.string().trim().max(1000, "Observação muito longa").optional().or(z.literal("")),
  // Faturamento
  invoiceNumber: z.string().trim().max(100).optional().or(z.literal("")),
  invoiceDueDate: z.string().datetime().optional().or(z.literal("")),
  // Pagamento
  paymentMethod: z.string().trim().max(100).optional().or(z.literal("")),
  paymentDate: z.string().datetime().optional().or(z.literal("")),
  paymentReference: z.string().trim().max(200).optional().or(z.literal("")),
  // Cancelamento
  cancellationReason: z.string().trim().max(500).optional().or(z.literal(""))
});

export const billingEntrySchema = z.object({
  entryType: z.enum(["LABOR", "PART", "TRAVEL", "EXTRA", "CONSULTING", "REMOTE_SUPPORT"]),
  description: z.string().trim().min(3, "Descrição obrigatória"),
  quantity: z.coerce.number().positive("Quantidade deve ser maior que zero"),
  unitPrice: z.coerce.number().min(0, "Valor unitário não pode ser negativo"),
  billable: z.boolean().default(true)
});
