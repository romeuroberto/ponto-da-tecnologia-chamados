import { z } from "zod";

const expenseCategoryValues = [
  "ALUGUEL",
  "ENERGIA",
  "INTERNET",
  "TRANSPORTE",
  "COMBUSTIVEL",
  "ALIMENTACAO",
  "PECAS_INSUMOS",
  "FERRAMENTAS_EQUIPAMENTOS",
  "IMPOSTOS_TAXAS",
  "SERVICOS_TERCEIROS",
  "OUTROS"
] as const;

export const expenseCategorySchema = z.enum(expenseCategoryValues);

export const expenseSchema = z.object({
  description: z.string().trim().min(3, "Descricao obrigatoria").max(160, "Descricao muito longa"),
  category: expenseCategorySchema,
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  expenseDate: z.string().min(1, "Data da despesa obrigatoria"),
  paymentMethod: z.string().trim().max(100, "Forma de pagamento muito longa").optional().or(z.literal("")),
  notes: z.string().trim().max(1000, "Observacao muito longa").optional().or(z.literal("")),
  ticketId: z.string().trim().optional().or(z.literal(""))
});

export const expensePaySchema = z.object({
  paidAt: z.string().min(1, "Data de pagamento obrigatoria"),
  paymentMethod: z.string().trim().max(100, "Forma de pagamento muito longa").optional().or(z.literal(""))
});

export const expenseCancelSchema = z.object({
  cancellationReason: z.string().trim().min(3, "Informe o motivo do cancelamento").max(500, "Motivo muito longo")
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
