import { describe, expect, it } from "vitest";
import { areBillingEntriesLocked, isBillingSummaryLocked } from "@/lib/billing-rules";
import type { FinancialStatus } from "@/types";

const cases: Array<[FinancialStatus, entriesLocked: boolean, summaryLocked: boolean]> = [
  ["PENDENTE", false, false],
  ["EM_ANALISE", false, false],
  ["APROVADO", true, true],
  ["FATURADO", true, true],
  ["PAGO", true, true],
  ["CANCELADO", true, false]
];

describe("travas do financeiro", () => {
  it.each(cases)("%s: lançamentos travados = %s, resumo travado = %s", (status, entries, summary) => {
    expect(areBillingEntriesLocked(status)).toBe(entries);
    expect(isBillingSummaryLocked(status)).toBe(summary);
  });
});
