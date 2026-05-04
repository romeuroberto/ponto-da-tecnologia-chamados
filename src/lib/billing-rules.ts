import type { FinancialStatus } from "@/types";

// APROVADO em diante: lançamentos bloqueados (valores aprovados não podem mudar)
const ENTRIES_LOCKED: FinancialStatus[] = ["APROVADO", "FATURADO", "PAGO", "CANCELADO"];

// Apenas PAGO é completamente imutável — CANCELADO permite reabrir
const SUMMARY_LOCKED: FinancialStatus[] = ["PAGO"];

export function areBillingEntriesLocked(status: FinancialStatus): boolean {
  return ENTRIES_LOCKED.includes(status);
}

export function isBillingSummaryLocked(status: FinancialStatus): boolean {
  return SUMMARY_LOCKED.includes(status);
}

export const LOCKED_STATUS_LABELS: Record<FinancialStatus, string | null> = {
  PENDENTE: null,
  EM_ANALISE: null,
  APROVADO: "Os lançamentos estão bloqueados após a aprovação. Para corrigir valores, cancele o financeiro e reinicie.",
  FATURADO: "Os lançamentos estão bloqueados após o faturamento. Para corrigir valores, cancele o financeiro e reinicie.",
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
