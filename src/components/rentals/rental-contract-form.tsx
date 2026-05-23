"use client";

import type { Route } from "next";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Client, Equipment } from "@/types";

interface ItemDraft {
  equipmentId: string;
  monthlyPrice: string;
  installedAt: string;
  notes: string;
}

const emptyItem = (): ItemDraft => ({ equipmentId: "", monthlyPrice: "", installedAt: new Date().toISOString().slice(0, 10), notes: "" });

interface Props {
  clients: Client[];
  availableEquipment: Equipment[];
}

export function RentalContractForm({ clients, availableEquipment }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [contractNumber, setContractNumber] = useState("");
  const [clientId, setClientId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [noticeDays, setNoticeDays] = useState("30");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([emptyItem()]);

  const totalMonthly = items.reduce((s, i) => s + (parseFloat(i.monthlyPrice) || 0), 0);

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof ItemDraft, value: string) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  async function handleSubmit() {
    if (!contractNumber.trim()) { setError("Número do contrato é obrigatório."); return; }
    if (!clientId) { setError("Selecione um cliente."); return; }
    if (!startDate) { setError("Data de início é obrigatória."); return; }
    if (items.some((i) => !i.equipmentId || !i.monthlyPrice || !i.installedAt)) {
      setError("Preencha todos os campos dos equipamentos."); return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractNumber: contractNumber.trim(),
          clientId,
          startDate,
          endDate: endDate || undefined,
          noticeDays: parseInt(noticeDays) || 30,
          notes: notes.trim() || undefined,
          items: items.map((i) => ({
            equipmentId: i.equipmentId,
            monthlyPrice: parseFloat(i.monthlyPrice),
            installedAt: i.installedAt,
            notes: i.notes.trim() || undefined
          }))
        })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? "Erro ao criar contrato.");
      setOpen(false);
      router.push(`/locacoes/${json.data.id}` as Route);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar contrato.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>+ Novo contrato</Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Novo contrato de locação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Contract meta */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Nº do contrato *</Label>
            <Input placeholder="LOC-2026-001" value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Cliente *</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Início *</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Término</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Aviso prévio (dias)</Label>
            <Input type="number" min="0" value={noticeDays} onChange={(e) => setNoticeDays(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-3">
            <Label>Observações</Label>
            <Input placeholder="Notas internas" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        {/* Items */}
        <div>
          <p className="mb-3 text-sm font-semibold text-slate-700">Equipamentos *</p>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[2fr_1.2fr_1.2fr_1fr_auto]">
                <div className="space-y-1">
                  <Label className="text-xs">Equipamento</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
                    value={item.equipmentId}
                    onChange={(e) => updateItem(idx, "equipmentId", e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {availableEquipment
                      .filter((eq) => eq.status === "DISPONIVEL" || eq.id === item.equipmentId)
                      .map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.model} — {eq.serialNumber}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mensalidade (R$)</Label>
                  <Input type="number" min="0" step="0.01" placeholder="0,00" value={item.monthlyPrice} onChange={(e) => updateItem(idx, "monthlyPrice", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Instalação</Label>
                  <Input type="date" value={item.installedAt} onChange={(e) => updateItem(idx, "installedAt", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nota</Label>
                  <Input placeholder="Opcional" value={item.notes} onChange={(e) => updateItem(idx, "notes", e.target.value)} />
                </div>
                <div className="flex items-end">
                  {items.length > 1 && (
                    <button className="text-xs text-rose-500 hover:text-rose-700" onClick={() => removeItem(idx)}>Remover</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button className="mt-2 text-sm text-blue-600 hover:underline" onClick={addItem}>+ Adicionar equipamento</button>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            Total mensal: <span className="text-slate-900">R$ {totalMonthly.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </p>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={saving}>{saving ? "Criando..." : "Criar contrato"}</Button>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
