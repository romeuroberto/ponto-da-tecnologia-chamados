import type { FinancialStatus } from "@/types";

// Valores aprovados ou faturados não devem mais mudar diretamente.
const ENTRIES_LOCKED: FinancialStatus[] = ["APROVADO", "FATURADO", "PAGO", "CANCELADO"];

// O resumo também trava a partir da aprovação para evitar divergência entre total e lançamentos.
const SUMMARY_LOCKED: FinancialStatus[] = ["APROVADO", "FATURADO", "PAGO"];

export function areBillingEntriesLocked(status: FinancialStatus): boolean {
  return ENTRIES_LOCKED.includes(status);
}

export function isBillingSummaryLocked(status: FinancialStatus): boolean {
  return SUMMARY_LOCKED.includes(status);
}

export const LOCKED_STATUS_LABELS: Record<FinancialStatus, string | null> = {
  PENDENTE: null,
  EM_ANALISE: null,
  APROVADO: "Valores aprovados ficam bloqueados. Para corrigir, reabra ou reinicie o ciclo financeiro.",
  FATURADO: "Valores faturados ficam bloqueados. Para corrigir, cancele ou reabra o ciclo financeiro.",
  PAGO: "Este financeiro foi pago e está totalmente bloqueado.",
  CANCELADO: "Este financeiro foi cancelado. É possível reabri-lo para um novo ciclo."
};

export const PAYMENT_METHODS = [
  "Pix",
  "Boleto",
  "Transferência",
  "Dinheiro",
  "Cartão de crédito",
  "Cartão de débito",
  "Outros"
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
