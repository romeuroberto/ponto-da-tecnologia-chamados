"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RentalBilling } from "@/types";

interface GenerateBillingProps {
  contractId: string;
  suggestedAmount: number;
}

export function GenerateBillingForm({ contractId, suggestedAmount }: GenerateBillingProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [amount, setAmount] = useState(String(suggestedAmount.toFixed(2)));
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/rentals/${contractId}/billings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceMonth: parseInt(month),
          referenceYear: parseInt(year),
          amount: parseFloat(amount),
          dueDate: dueDate || undefined,
          notes: notes.trim() || undefined
        })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? "Erro.");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar cobrança.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>+ Gerar cobrança</Button>
    );
  }

  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
      <p className="text-sm font-semibold text-slate-700">Gerar cobrança mensal</p>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs">Mês</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            {months.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Ano</Label>
          <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Valor (R$)</Label>
          <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Vencimento</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div className="space-y-1 sm:col-span-4">
          <Label className="text-xs">Observação</Label>
          <Input placeholder="Opcional" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={saving}>{saving ? "Gerando..." : "Gerar"}</Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
    </div>
  );
}

interface PayBillingProps {
  billing: RentalBilling;
}

export function PayBillingButton({ billing }: PayBillingProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentReference, setPaymentReference] = useState("");

  async function handlePay() {
    if (!paymentMethod.trim()) { setError("Informe a forma de pagamento."); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/rentals/billings/${billing.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          financialStatus: "PAGO",
          paymentMethod,
          paymentDate,
          paymentReference: paymentReference.trim() || undefined
        })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? "Erro.");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/rentals/billings/${billing.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) { setError(json.message ?? "Erro."); return; }
    router.refresh();
  }

  if (billing.financialStatus === "PAGO") {
    return <span className="text-xs text-emerald-600 font-medium">Pago</span>;
  }

  if (billing.financialStatus === "CANCELADO") {
    return <span className="text-xs text-slate-400">Cancelado</span>;
  }

  if (!open) {
    return (
      <div className="flex items-center gap-2">
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setOpen(true)}>
          Registrar pagamento
        </Button>
        <Button size="sm" variant="outline" className="border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-700" onClick={handleDelete}>
          Excluir
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2 col-span-full">
      <p className="text-xs font-semibold text-emerald-800">Registrar pagamento</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs">Forma de pagamento *</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="PIX">PIX</option>
            <option value="Boleto">Boleto</option>
            <option value="Cartão de crédito">Cartão de crédito</option>
            <option value="Cartão de débito">Cartão de débito</option>
            <option value="Transferência">Transferência</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Data</Label>
          <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Referência / comprovante</Label>
          <Input placeholder="Opcional" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handlePay} disabled={saving}>{saving ? "Salvando..." : "Confirmar"}</Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
    </div>
  );
}
