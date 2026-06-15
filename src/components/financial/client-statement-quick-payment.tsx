"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { PAYMENT_METHODS } from "@/lib/billing-rules";
import { formatCurrency } from "@/lib/utils";
import type { BillingType, FinancialStatus, TicketStatus } from "@/types";

type SalePaymentItem = {
  kind: "sale";
  id: string;
  amount: number;
};

type TicketBillingPaymentItem = {
  kind: "ticket-billing";
  ticketId: string;
  amount: number;
  billingType: BillingType;
  financialStatus: FinancialStatus;
  discountAmount: number;
  internalNotes?: string;
  ticketStatus: TicketStatus;
};

type ClientStatementQuickPaymentProps = {
  item: SalePaymentItem | TicketBillingPaymentItem;
};

const terminalTicketStatuses: TicketStatus[] = ["CLOSED", "CANCELED"];

export function ClientStatementQuickPayment({ item }: ClientStatementQuickPaymentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentReference, setPaymentReference] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isTicketBlocked =
    item.kind === "ticket-billing" &&
    !terminalTicketStatuses.includes(item.ticketStatus);

  if (item.kind === "ticket-billing" && item.financialStatus === "PAGO") {
    return null;
  }

  if (isTicketBlocked) {
    return (
      <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        Conclua tecnicamente o chamado antes de registrar pagamento pelo extrato.
      </div>
    );
  }

  function submitPayment() {
    setMessage(null);

    startTransition(async () => {
      const payload =
        item.kind === "sale"
          ? {
              financialStatus: "PAGO",
              paymentMethod,
              paymentDate,
              paymentReference: paymentReference || undefined
            }
          : {
              billingType: item.billingType,
              financialStatus: "PAGO",
              discountAmount: item.discountAmount,
              internalNotes: item.internalNotes ?? "",
              paymentMethod,
              paymentDate: new Date(paymentDate).toISOString(),
              paymentReference: paymentReference || undefined
            };

      const response = await fetch(
        item.kind === "sale" ? `/api/sales/${item.id}` : `/api/tickets/${item.ticketId}/billing`,
        {
          method: item.kind === "sale" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage({
          type: "error",
          text: result.message ?? "Não foi possível confirmar o pagamento."
        });
        return;
      }

      setMessage({ type: "success", text: "Pagamento confirmado." });
      setIsOpen(false);
      setPaymentReference("");
      router.refresh();
    });
  }

  return (
    <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-3">
      {message ? (
        <p className={`mb-2 text-xs font-medium ${message.type === "success" ? "text-emerald-700" : "text-rose-700"}`}>
          {message.text}
        </p>
      ) : null}

      {!isOpen ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            Receber {formatCurrency(item.amount)} sem abrir o detalhe.
          </p>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            Confirmar pagamento
          </button>
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-[1fr_1fr_1.5fr_auto_auto] md:items-end">
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Forma
            <select
              value={paymentMethod}
              disabled={isPending}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm font-normal text-slate-700 outline-none focus:border-sky-500"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Data
            <input
              type="date"
              value={paymentDate}
              disabled={isPending}
              onChange={(event) => setPaymentDate(event.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm font-normal text-slate-700 outline-none focus:border-sky-500"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Referência
            <input
              type="text"
              value={paymentReference}
              disabled={isPending}
              onChange={(event) => setPaymentReference(event.target.value)}
              placeholder="Comprovante, Pix, boleto..."
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm font-normal text-slate-700 outline-none focus:border-sky-500"
            />
          </label>
          <button
            type="button"
            onClick={submitPayment}
            disabled={isPending || !paymentMethod || !paymentDate}
            className="h-9 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {isPending ? "Salvando..." : "Confirmar"}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
