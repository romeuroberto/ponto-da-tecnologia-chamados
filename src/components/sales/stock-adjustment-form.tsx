"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { PartCatalogItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PartCombobox } from "@/components/ui/part-combobox";

export function StockAdjustmentForm({ parts }: { parts: PartCatalogItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [partId, setPartId] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const selectedPart = parts.find((p) => p.id === partId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    startTransition(async () => {
      const res = await fetch("/api/stock/adjustment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partCatalogItemId: partId,
          newQuantity: parseFloat(newQuantity),
          notes: notes || undefined
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Erro ao registrar ajuste.");
        return;
      }
      setPartId("");
      setNewQuantity("");
      setNotes("");
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle>Ajuste de estoque</CardTitle></CardHeader>
      <CardContent className="p-6 space-y-4">
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">Ajuste registrado com sucesso!</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-1.5">
            <Label>Material</Label>
            <PartCombobox parts={parts} value={partId} onChange={(id) => { setPartId(id); setNewQuantity(""); }} />
          </div>

          {selectedPart && (
            <p className="text-xs text-slate-500">
              Estoque atual:{" "}
              <span className={`font-semibold ${selectedPart.stockQuantity <= 0 ? "text-rose-600" : "text-slate-700"}`}>
                {Number(selectedPart.stockQuantity)} {selectedPart.unit}
              </span>
            </p>
          )}

          <div className="grid gap-1.5">
            <Label>Nova quantidade</Label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              disabled={!partId}
              placeholder="Informe a quantidade correta"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Motivo do ajuste</Label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: contagem física, perda ou avaria"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            className="w-full"
            disabled={isPending || !partId || newQuantity === ""}
          >
            {isPending ? "Ajustando..." : "Confirmar ajuste"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
