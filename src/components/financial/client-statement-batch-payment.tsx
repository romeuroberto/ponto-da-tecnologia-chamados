"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { PAYMENT_METHODS } from "@/lib/billing-rules";
import { formatCurrency } from "@/lib/utils";
import type { BillingType, FinancialStatus, TicketStatus } from "@/types";

type BatchPaymentItem =
  | {
      kind: "sale";
      id: string;
      label: string;
      detail: string;
      amount: number;
    }
  | {
      kind: "ticket-billing";
      ticketId: string;
      label: string;
      detail: string;
      amount: number;
      billingType: BillingType;
      financialStatus: FinancialStatus;
      ticketStatus: TicketStatus;
    }
  | {
      kind: "monthly-billing";
      id: string;
      label: string;
      detail: string;
      amount: number;
      financialStatus: string;
    }
  | {
      kind: "rental-billing";
      id: string;
      label: string;
      detail: string;
      amount: number;
      financialStatus: FinancialStatus;
    };

export type ClientStatementBatchPaymentItem = BatchPaymentItem;

export type ClientStatementFiscalDocumentOption = {
  id: string;
  label: string;
  detail: string;
};

type SelectedItemPayload =
  | { kind: "sale"; id: string }
  | { kind: "ticket-billing"; ticketId: string }
  | { kind: "monthly-billing"; id: string }
  | { kind: "rental-billing"; id: string };

const terminalTicketStatuses: TicketStatus[] = ["CLOSED", "CANCELED"];

function getItemKey(item: BatchPaymentItem) {
  return item.kind === "ticket-billing" ? `${item.kind}:${item.ticketId}` : `${item.kind}:${item.id}`;
}

function getItemPayload(item: BatchPaymentItem): SelectedItemPayload {
  if (item.kind === "ticket-billing") {
    return { kind: item.kind, ticketId: item.ticketId };
  }

  return { kind: item.kind, id: item.id };
}

function isItemPayable(item: BatchPaymentItem) {
  if (item.kind === "sale") return true;
  if (item.kind === "monthly-billing" || item.kind === "rental-billing") {
    return item.financialStatus !== "PAGO" && item.financialStatus !== "CANCELADO";
  }
  return (
    item.financialStatus !== "PAGO" &&
    item.financialStatus !== "CANCELADO" &&
    terminalTicketStatuses.includes(item.ticketStatus)
  );
}

function getBlockedReason(item: BatchPaymentItem) {
  if (item.kind !== "ticket-billing") return null;
  if (terminalTicketStatuses.includes(item.ticketStatus)) return null;
  return "Chamado ainda não concluído tecnicamente";
}

export function ClientStatementBatchPayment({
  items,
  fiscalDocuments = []
}: {
  items: ClientStatementBatchPaymentItem[];
  fiscalDocuments?: ClientStatementFiscalDocumentOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentReference, setPaymentReference] = useState("");
  const [fiscalDocumentId, setFiscalDocumentId] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const payableItems = useMemo(() => items.filter(isItemPayable), [items]);
  const selectedItems = useMemo(
    () => items.filter((item) => selectedKeys.includes(getItemKey(item)) && isItemPayable(item)),
    [items, selectedKeys]
  );
  const selectedTotal = selectedItems.reduce((sum, item) => sum + item.amount, 0);
  const allPayableSelected = payableItems.length > 0 && selectedItems.length === payableItems.length;

  if (items.length === 0) {
    return null;
  }

  function toggleItem(item: BatchPaymentItem) {
    const key = getItemKey(item);
    setMessage(null);
    setSelectedKeys((current) =>
      current.includes(key) ? current.filter((selectedKey) => selectedKey !== key) : [...current, key]
    );
  }

  function toggleAllPayable() {
    setMessage(null);
    setSelectedKeys(allPayableSelected ? [] : payableItems.map(getItemKey));
  }

  function submitBatchPayment() {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/financeiro/recebimentos-lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          paymentDate,
          paymentReference: paymentReference || undefined,
          fiscalDocumentId: fiscalDocumentId || undefined,
          items: selectedItems.map(getItemPayload)
        })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage({ type: "error", text: result.message ?? "Não foi possível registrar o pagamento em lote." });
        return;
      }

      setMessage({
        type: "success",
        text: `${result.data?.total ?? selectedItems.length} pagamento(s) confirmado(s)${fiscalDocumentId ? " e vinculados ao documento fiscal." : "."}`
      });
      setSelectedKeys([]);
      setPaymentReference("");
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-800">Recebimento em lote</h2>
          <p className="mt-1 text-sm text-emerald-900">
            Selecione vendas, chamados e mensalidades para confirmar um único recebimento.
          </p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900">
          <span className="font-semibold">{selectedItems.length}</span> selecionado(s) ·{" "}
          <span className="font-semibold">{formatCurrency(selectedTotal)}</span>
        </div>
      </div>

      {message ? (
        <p className={`mt-3 text-sm font-medium ${message.type === "success" ? "text-emerald-700" : "text-rose-700"}`}>
          {message.text}
        </p>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-xl border border-emerald-100 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-50 px-4 py-2">
          <button
            type="button"
            onClick={toggleAllPayable}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950"
          >
            {allPayableSelected ? "Limpar seleção" : "Selecionar todos disponíveis"}
          </button>
          <span className="text-xs text-emerald-700">
            {payableItems.length} disponível(is) para baixa
          </span>
        </div>

        <div className="max-h-72 divide-y divide-slate-100 overflow-auto">
          {items.map((item) => {
            const key = getItemKey(item);
            const payable = isItemPayable(item);
            const blockedReason = getBlockedReason(item);

            return (
              <label
                key={key}
                className={`flex items-start gap-3 px-4 py-3 ${payable ? "cursor-pointer hover:bg-slate-50" : "bg-slate-50 text-slate-400"}`}
              >
                <input
                  type="checkbox"
                  checked={selectedKeys.includes(key)}
                  disabled={!payable || isPending}
                  onChange={() => toggleItem(item)}
                  className="mt-1"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900">{item.label}</span>
                  <span className="block text-xs text-slate-500">{item.detail}</span>
                  {blockedReason ? <span className="block text-xs text-amber-700">{blockedReason}</span> : null}
                </span>
                <span className="shrink-0 text-sm font-semibold text-slate-950">{formatCurrency(item.amount)}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_1.5fr_auto] lg:items-end">
        <label className="grid gap-1 text-xs font-medium text-emerald-900">
          Forma
          <select
            value={paymentMethod}
            disabled={isPending}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className="h-10 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none focus:border-emerald-500"
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-emerald-900">
          Data
          <input
            type="date"
            value={paymentDate}
            disabled={isPending}
            onChange={(event) => setPaymentDate(event.target.value)}
            className="h-10 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none focus:border-emerald-500"
          />
        </label>
        <label className="grid gap-1 text-xs font-medium text-emerald-900">
          Referência
          <input
            type="text"
            value={paymentReference}
            disabled={isPending}
            onChange={(event) => setPaymentReference(event.target.value)}
            placeholder="NF, comprovante, Pix, boleto..."
            className="h-10 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none focus:border-emerald-500"
          />
        </label>
        <button
          type="button"
          onClick={submitBatchPayment}
          disabled={isPending || selectedItems.length === 0 || !paymentMethod || !paymentDate}
          className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {isPending ? "Salvando..." : "Confirmar lote"}
        </button>
      </div>

      <div className="mt-3 grid gap-1 text-xs font-medium text-emerald-900">
        Documento fiscal vinculado ao recebimento
        <select
          value={fiscalDocumentId}
          disabled={isPending}
          onChange={(event) => setFiscalDocumentId(event.target.value)}
          className="h-10 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none focus:border-emerald-500"
        >
          <option value="">Não vincular documento fiscal agora</option>
          {fiscalDocuments.map((document) => (
            <option key={document.id} value={document.id}>
              {document.label} · {document.detail}
            </option>
          ))}
        </select>
        <span className="text-xs font-normal text-emerald-700">
          O vínculo fiscal será aplicado aos chamados, vendas, mensalidades e locações selecionados.
        </span>
      </div>
    </section>
  );
}
