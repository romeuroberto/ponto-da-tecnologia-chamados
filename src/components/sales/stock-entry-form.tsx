"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { PartCatalogItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function StockEntryForm({ parts }: { parts: PartCatalogItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [partId, setPartId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    startTransition(async () => {
      const res = await fetch("/api/stock/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partCatalogItemId: partId, quantity: parseFloat(quantity), notes: notes || undefined })
      });
      if (!res.ok) {
        setError("Erro ao registrar entrada.");
        return;
      }
      setPartId("");
      setQuantity("1");
      setNotes("");
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle>Entrada de estoque</CardTitle></CardHeader>
      <CardContent className="p-6 space-y-4">
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">Entrada registrada com sucesso!</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-1.5">
            <Label>Material</Label>
            <Select value={partId} onChange={(e) => setPartId(e.target.value)}>
              <option value="">Selecione</option>
              {parts.map((p) => (
                <option key={p.id} value={p.id}>{p.name}{p.code ? ` (${p.code})` : ""}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Quantidade</Label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Observações (opcional)</Label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: compra fornecedor X"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending || !partId || !quantity}>
            {isPending ? "Registrando..." : "Registrar entrada"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
