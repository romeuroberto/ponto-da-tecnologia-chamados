"use client";

import { useState, useTransition } from "react";

import type { MonthlyBillingItem } from "@/server/repositories/contract-monthly-billing-repository";
import { formatCurrency } from "@/lib/utils";

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const statusLabel: Record<string, string> = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
  CANCELADO: "Cancelado"
};

const statusColor: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-800",
  PAGO: "bg-slate-100 text-slate-600",
  CANCELADO: "bg-rose-100 text-rose-700"
};

const paymentMethods = [
  "Pix",
  "Boleto",
  "Transferência",
  "Cartão de crédito",
  "Cartão de débito",
  "Dinheiro",
  "Cheque"
];

function PaymentForm({
  billingId,
  onPaid
}: {
  billingId: string;
  onPaid: (updated: MonthlyBillingItem) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]);
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await fetch(`/api/contracts/monthly-billings/${billingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod, paidAt: new Date(paidAt).toISOString() })
      });
      const result = await res.json();
      if (result.success) {
        onPaid(result.data);
      } else {
        setError(result.message ?? "Erro ao registrar pagamento.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Forma de pagamento</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="h-8 rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-sky-500"
        >
          {paymentMethods.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Data do pagamento</label>
        <input
          type="date"
          value={paidAt}
          onChange={(e) => setPaidAt(e.target.value)}
          className="h-8 rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-sky-500"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="h-8 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {isPending ? "Salvando..." : "Confirmar pagamento"}
      </button>
      {error && <p className="w-full text-xs text-rose-600">{error}</p>}
    </form>
  );
}

export function MonthlyBillingList({
  clientId: _clientId,
  initialBillings
}: {
  clientId: string;
  initialBillings: MonthlyBillingItem[];
}) {
  const [billings, setBillings] = useState<MonthlyBillingItem[]>(initialBillings);
  const [openPaymentId, setOpenPaymentId] = useState<string | null>(null);

  function handlePaid(updated: MonthlyBillingItem) {
    setBillings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setOpenPaymentId(null);
  }

  return (
    <div className="space-y-2">
      <div className="hidden grid-cols-[1.5fr_1.5fr_1fr_1fr_auto] gap-4 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400 lg:grid">
        <span>Mês / Contrato</span>
        <span>Forma de pagamento</span>
        <span>Valor</span>
        <span>Status</span>
        <span />
      </div>

      {billings.map((billing) => (
        <div key={billing.id} className="rounded-xl border border-slate-200 bg-white p-4">
          {/* Mobile */}
          <div className="lg:hidden space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-950">
                  {monthNames[billing.referenceMonth - 1]}/{billing.referenceYear}
                </p>
                <p className="text-xs text-slate-500">{billing.contractNumber}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[billing.financialStatus]}`}>
                {statusLabel[billing.financialStatus]}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-950">{formatCurrency(billing.amount)}</p>
            {billing.paidAt && (
              <p className="text-xs text-slate-500">
                {billing.paymentMethod} · {new Date(billing.paidAt).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>

          {/* Desktop */}
          <div className="hidden grid-cols-[1.5fr_1.5fr_1fr_1fr_auto] items-center gap-4 lg:grid">
            <div>
              <p className="font-semibold text-slate-950">
                {monthNames[billing.referenceMonth - 1]}/{billing.referenceYear}
              </p>
              <p className="text-xs text-slate-500">{billing.contractNumber}</p>
            </div>
            <p className="text-sm text-slate-700">
              {billing.paidAt
                ? `${billing.paymentMethod} · ${new Date(billing.paidAt).toLocaleDateString("pt-BR")}`
                : "—"}
            </p>
            <p className="text-sm font-semibold text-slate-950">{formatCurrency(billing.amount)}</p>
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[billing.financialStatus]}`}>
              {statusLabel[billing.financialStatus]}
            </span>
            <div>
              {billing.financialStatus === "PENDENTE" && (
                <button
                  type="button"
                  onClick={() => setOpenPaymentId(openPaymentId === billing.id ? null : billing.id)}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {openPaymentId === billing.id ? "Cancelar" : "Registrar pagamento"}
                </button>
              )}
            </div>
          </div>

          {/* Mobile: botão de pagamento */}
          <div className="lg:hidden mt-2">
            {billing.financialStatus === "PENDENTE" && (
              <button
                type="button"
                onClick={() => setOpenPaymentId(openPaymentId === billing.id ? null : billing.id)}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {openPaymentId === billing.id ? "Cancelar" : "Registrar pagamento"}
              </button>
            )}
          </div>

          {openPaymentId === billing.id && (
            <PaymentForm billingId={billing.id} onPaid={handlePaid} />
          )}
        </div>
      ))}
    </div>
  );
}
