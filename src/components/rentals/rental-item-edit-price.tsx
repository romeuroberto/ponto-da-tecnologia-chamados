"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import type { RentalContractItem } from "@/types";

interface Props {
  item: RentalContractItem;
}

export function RentalItemEditPrice({ item }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(item.monthlyPrice.toFixed(2));
  const [updateBillings, setUpdateBillings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const newPrice = parseFloat(price);
    if (!newPrice || newPrice <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/rentals/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyPrice: newPrice, updateBillings })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? "Erro.");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        className="ml-1 text-xs text-slate-400 hover:text-blue-600 underline-offset-2 hover:underline"
        title="Corrigir valor"
        onClick={() => setOpen(true)}
      >
        Corrigir
      </button>
    );
  }

  return (
    <div className="mt-1 space-y-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs">
      <p className="font-semibold text-blue-800">Corrigir mensalidade</p>
      <p className="text-slate-500">Valor atual: <strong>{formatCurrency(item.monthlyPrice)}</strong></p>
      <div className="space-y-1">
        <Label className="text-xs">Novo valor (R$)</Label>
        <Input
          type="number"
          min="0.01"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="h-8 text-xs"
        />
      </div>
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={updateBillings}
          onChange={(e) => setUpdateBillings(e.target.checked)}
        />
        <span className="text-slate-700 leading-snug">
          Corrigir também todas as cobranças geradas (incluindo as já pagas)
        </span>
      </label>
      {updateBillings && (
        <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
          O valor de todas as cobranças deste contrato será ajustado pela diferença.
        </p>
      )}
      {error && <p className="text-rose-600">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Confirmar"}
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
