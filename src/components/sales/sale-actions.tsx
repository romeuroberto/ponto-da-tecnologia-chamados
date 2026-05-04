"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PAYMENT_METHODS = ["Dinheiro", "Pix", "Cartão de débito", "Cartão de crédito", "Transferência", "Boleto"];

export function SaleActions({ saleId }: { saleId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<"pay" | "cancel" | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentReference, setPaymentReference] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(status: "PAGO" | "CANCELADO") {
    setError("");
    startTransition(async () => {
      const res = await fetch(`/api/sales/${saleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          financialStatus: status,
          ...(status === "PAGO" ? { paymentMethod, paymentDate, paymentReference: paymentReference || undefined } : {}),
          ...(status === "CANCELADO" ? { cancellationReason } : {})
        })
      });
      if (!res.ok) {
        setError("Erro ao atualizar a venda.");
        return;
      }
      setAction(null);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle>Ações</CardTitle></CardHeader>
      <CardContent className="space-y-3 p-6">
        {error && <p className="text-sm text-rose-600">{error}</p>}

        {action === null && (
          <div className="flex flex-col gap-2">
            <Button onClick={() => setAction("pay")}>Confirmar pagamento</Button>
            <Button variant="outline" onClick={() => setAction("cancel")} className="border-rose-200 text-rose-700 hover:bg-rose-50">
              Cancelar venda
            </Button>
          </div>
        )}

        {action === "pay" && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">Registrar pagamento</p>
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Forma de pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              >
                <option value="">Selecione</option>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Data do pagamento</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Referência (opcional)</label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Ex.: comprovante, código"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleSubmit("PAGO")} disabled={isPending || !paymentMethod}>
                {isPending ? "Salvando..." : "Confirmar"}
              </Button>
              <Button variant="outline" onClick={() => setAction(null)}>Cancelar</Button>
            </div>
          </div>
        )}

        {action === "cancel" && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">Cancelar venda</p>
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Motivo do cancelamento</label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-400 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleSubmit("CANCELADO")}
                disabled={isPending || !cancellationReason.trim()}
                className="bg-rose-600 hover:bg-rose-700"
              >
                {isPending ? "Cancelando..." : "Confirmar cancelamento"}
              </Button>
              <Button variant="outline" onClick={() => setAction(null)}>Voltar</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
