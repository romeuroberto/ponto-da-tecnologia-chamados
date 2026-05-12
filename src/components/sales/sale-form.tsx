"use client";

import { useState, useTransition } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";

import type { Client, PartCatalogItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClientCombobox } from "@/components/ui/client-combobox";
import { PartCombobox } from "@/components/ui/part-combobox";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

interface SaleLineItem {
  partCatalogItemId: string;
  partName: string;
  partCode?: string;
  quantity: number;
  unitPrice: number;
}

export function SaleForm({ clients, parts }: { clients: Client[]; parts: PartCatalogItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [clientId, setClientId] = useState("");

  function handleClientChange(newClientId: string) {
    setClientId(newClientId);
    if (!selectedPartId) return;
    const part = parts.find((p) => p.id === selectedPartId);
    if (!part) return;
    const client = clients.find((c) => c.id === newClientId);
    const autoPrice = client?.isReseller && part.resalePrice != null ? part.resalePrice : part.unitPrice;
    setUnitPrice(String(autoPrice));
  }
  const [internalNotes, setInternalNotes] = useState("");
  const [items, setItems] = useState<SaleLineItem[]>([]);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [qty, setQty] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  function handleAddItem() {
    const part = parts.find((p) => p.id === selectedPartId);
    if (!part) return;
    const quantity = parseFloat(qty) || 1;
    const price = parseFloat(unitPrice) || part.unitPrice;
    setItems((prev) => [
      ...prev,
      { partCatalogItemId: part.id, partName: part.name, partCode: part.code, quantity, unitPrice: price }
    ]);
    setSelectedPartId("");
    setQty("1");
    setUnitPrice("");
  }

  function handleRemoveItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handlePartChange(partId: string) {
    setSelectedPartId(partId);
    const part = parts.find((p) => p.id === partId);
    if (!part) return;
    const client = clients.find((c) => c.id === clientId);
    const autoPrice = client?.isReseller && part.resalePrice != null ? part.resalePrice : part.unitPrice;
    setUnitPrice(String(autoPrice));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!clientId) { setError("Selecione um cliente."); return; }
    if (items.length === 0) { setError("Adicione ao menos um item."); return; }

    startTransition(async () => {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, internalNotes: internalNotes || undefined, items })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Erro ao registrar venda.");
        return;
      }
      router.push(`/vendas/${json.data.id}` as Route);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <Card>
        <CardContent className="grid gap-4 p-6 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Cliente</Label>
            <ClientCombobox clients={clients} value={clientId} onChange={handleClientChange} disabled={isPending} />
          </div>
          <div className="grid gap-2">
            <Label>Observações internas</Label>
            <input
              type="text"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Opcional"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <p className="font-semibold text-slate-900">Itens da venda</p>

          <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-[2fr_1fr_1fr_auto]">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Material</Label>
              <PartCombobox parts={parts} value={selectedPartId} onChange={handlePartChange} disabled={isPending} />
              <div className="h-4" />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Quantidade ({parts.find((p) => p.id === selectedPartId)?.unit ?? "un"})</Label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
              <div className="h-4" />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Preço unit. (R$)</Label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0,00"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
              <div className="flex h-4 gap-3 text-xs text-slate-500">
                {(() => {
                  const selected = parts.find((p) => p.id === selectedPartId);
                  if (!selected) return null;
                  return (
                    <>
                      <button type="button" className="hover:text-slate-800 hover:underline" onClick={() => setUnitPrice(String(selected.unitPrice))}>
                        Normal: {formatCurrency(selected.unitPrice)}
                      </button>
                      {selected.resalePrice != null ? (
                        <button type="button" className="text-sky-600 hover:text-sky-800 hover:underline" onClick={() => setUnitPrice(String(selected.resalePrice))}>
                          Revenda: {formatCurrency(selected.resalePrice)}
                        </button>
                      ) : null}
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="flex items-end pb-4">
              <Button type="button" variant="secondary" onClick={handleAddItem} disabled={!selectedPartId}>
                Adicionar
              </Button>
            </div>
          </div>

          {items.length > 0 ? (
            <div className="space-y-1">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Material</span><span>Qtd</span><span>Unit.</span><span>Total</span><span />
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-3 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm">
                  <span className="font-medium text-slate-900">
                    {item.partName}{item.partCode ? ` (${item.partCode})` : ""}
                  </span>
                  <span className="text-slate-600">{item.quantity}</span>
                  <span className="text-slate-600">{formatCurrency(item.unitPrice)}</span>
                  <span className="font-semibold text-slate-950">{formatCurrency(item.quantity * item.unitPrice)}</span>
                  <button type="button" onClick={() => handleRemoveItem(i)} className="text-rose-500 hover:text-rose-700 text-xs font-semibold">
                    Remover
                  </button>
                </div>
              ))}
              <div className="flex justify-end rounded-lg bg-slate-50 px-2 py-2">
                <span className="text-sm font-semibold text-slate-950">Total: {formatCurrency(total)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">Nenhum item adicionado ainda.</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Registrar venda"}
        </Button>
      </div>
    </form>
  );
}
