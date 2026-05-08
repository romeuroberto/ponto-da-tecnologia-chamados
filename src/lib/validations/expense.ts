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

export const recurringExpenseSchema = z.object({
  description: z.string().trim().min(3, "Descrição obrigatória").max(160),
  category: expenseCategorySchema,
  baseAmount: z.coerce.number().positive("Valor deve ser maior que zero"),
  paymentMethod: z.string().trim().max(100).optional().or(z.literal("")),
  frequency: z.enum(["MENSAL", "BIMESTRAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"]),
  dayOfMonth: z.coerce.number().int().min(1).max(28).default(1),
  startDate: z.string().min(1, "Data de início obrigatória"),
  endDate: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal(""))
});

export type RecurringExpenseInput = z.infer<typeof recurringExpenseSchema>;
