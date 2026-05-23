"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Equipment, EquipmentStatus } from "@/types";

const statusLabel: Record<EquipmentStatus, string> = {
  DISPONIVEL: "Disponível",
  LOCADO: "Locado",
  MANUTENCAO: "Em manutenção",
  BAIXADO: "Baixado"
};

const statusClass: Record<EquipmentStatus, string> = {
  DISPONIVEL: "bg-emerald-100 text-emerald-800",
  LOCADO: "bg-blue-100 text-blue-800",
  MANUTENCAO: "bg-amber-100 text-amber-800",
  BAIXADO: "bg-slate-100 text-slate-500"
};

interface FormState {
  model: string;
  serialNumber: string;
  patrimonyCode: string;
  purchaseCost: string;
  notes: string;
}

function formatCurrency(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCurrencyToNumber(formatted: string): number | undefined {
  if (!formatted) return undefined;
  const digits = formatted.replace(/\D/g, "");
  if (!digits) return undefined;
  return parseInt(digits, 10) / 100;
}

interface EquipmentFormProps {
  form: FormState;
  saving: boolean;
  error: string | null;
  isNew: boolean;
  onChange: (field: keyof FormState, value: string) => void;
  onSave: () => void;
  onCancel?: () => void;
}

function EquipmentForm({ form, saving, error, isNew, onChange, onSave, onCancel }: EquipmentFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Modelo *</Label>
          <Input
            placeholder="ZQ521"
            value={form.model}
            onChange={(e) => onChange("model", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Número de série</Label>
          <Input
            placeholder="ZQ521-XXXX (opcional)"
            value={form.serialNumber}
            onChange={(e) => onChange("serialNumber", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Código patrimonial</Label>
          <Input
            placeholder="Gerado automaticamente"
            value={form.patrimonyCode}
            onChange={(e) => onChange("patrimonyCode", e.target.value)}
          />
          {!form.patrimonyCode && (
            <p className="text-xs text-slate-400">Deixe em branco para gerar automaticamente</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Custo de aquisição (R$)</Label>
          <Input
            placeholder="0,00"
            value={form.purchaseCost}
            onChange={(e) => onChange("purchaseCost", formatCurrency(e.target.value))}
            inputMode="numeric"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Observações</Label>
          <Input
            placeholder="Notas internas"
            value={form.notes}
            onChange={(e) => onChange("notes", e.target.value)}
          />
        </div>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={onSave} disabled={saving} className={isNew ? "w-full sm:w-auto" : ""}>
          {saving ? "Salvando..." : isNew ? "Cadastrar" : "Salvar"}
        </Button>
        {!isNew && onCancel && (
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        )}
      </div>
    </div>
  );
}

const empty: FormState = { model: "", serialNumber: "", patrimonyCode: "", purchaseCost: "", notes: "" };

interface Props {
  equipment: Equipment[];
  isAdmin: boolean;
}

export function EquipmentManager({ equipment, isAdmin }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = equipment.filter((e) => {
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    return (
      e.model.toLowerCase().includes(q) ||
      (e.serialNumber ?? "").toLowerCase().includes(q) ||
      (e.patrimonyCode ?? "").toLowerCase().includes(q)
    );
  });

  function handleFormChange(field: keyof FormState, value: string) {
    setForm((s) => ({ ...s, [field]: value }));
  }

  function startEdit(eq: Equipment) {
    setEditId(eq.id);
    setForm({
      model: eq.model,
      serialNumber: eq.serialNumber ?? "",
      patrimonyCode: eq.patrimonyCode ?? "",
      purchaseCost: eq.purchaseCost != null
        ? eq.purchaseCost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "",
      notes: eq.notes ?? ""
    });
    setError(null);
  }

  function cancelEdit() {
    setEditId(null);
    setForm(empty);
    setError(null);
  }

  async function handleSave(isNew: boolean) {
    if (!form.model.trim()) {
      setError("Modelo é obrigatório.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        model: form.model.trim(),
        serialNumber: form.serialNumber.trim() || undefined,
        patrimonyCode: form.patrimonyCode.trim() || undefined,
        purchaseCost: parseCurrencyToNumber(form.purchaseCost),
        notes: form.notes.trim() || undefined
      };

      const url = isNew ? "/api/equipment" : `/api/equipment/${editId}`;
      const method = isNew ? "POST" : "PATCH";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? "Erro ao salvar.");
      setForm(empty);
      setEditId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: EquipmentStatus) {
    await fetch(`/api/equipment/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeleteError(null);
    const res = await fetch(`/api/equipment/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) {
      setDeleteError(json.message ?? "Erro ao excluir.");
      return;
    }
    setDeleteConfirm(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {isAdmin && !editId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cadastrar equipamento</CardTitle>
          </CardHeader>
          <CardContent>
            <EquipmentForm
              form={form}
              saving={saving}
              error={error}
              isNew={true}
              onChange={handleFormChange}
              onSave={() => handleSave(true)}
            />
          </CardContent>
        </Card>
      )}

      {isAdmin && editId && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base text-blue-800">Editar equipamento</CardTitle>
          </CardHeader>
          <CardContent>
            <EquipmentForm
              form={form}
              saving={saving}
              error={error}
              isNew={false}
              onChange={handleFormChange}
              onSave={() => handleSave(false)}
              onCancel={cancelEdit}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">Equipamentos ({filtered.length})</CardTitle>
          <Input
            placeholder="Buscar por modelo, série ou patrimônio..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="max-w-xs"
          />
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-slate-400">Nenhum equipamento encontrado.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-3 bg-slate-50 px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Modelo / Série</span>
                <span>Patrimônio</span>
                <span>Status</span>
                <span></span>
                <span></span>
              </div>
              {filtered.map((eq) => (
                <div key={eq.id} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] items-center gap-3 px-6 py-3.5 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{eq.model}</p>
                    <p className="text-xs text-slate-400">{eq.serialNumber ?? "—"}</p>
                  </div>
                  <span className="text-slate-500">{eq.patrimonyCode ?? "—"}</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium w-fit ${statusClass[eq.status]}`}>
                    {statusLabel[eq.status]}
                  </span>
                  {isAdmin && eq.status === "LOCADO" ? (
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(eq.id, "MANUTENCAO")} className="text-xs">
                      → Manutenção
                    </Button>
                  ) : isAdmin && eq.status === "MANUTENCAO" ? (
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(eq.id, "DISPONIVEL")} className="text-xs">
                      → Disponível
                    </Button>
                  ) : (
                    <span />
                  )}
                  {isAdmin ? (
                    <div className="flex items-center gap-2">
                      <button className="text-xs text-slate-400 hover:text-slate-700" onClick={() => startEdit(eq)}>
                        Editar
                      </button>
                      {deleteConfirm === eq.id ? (
                        <div className="flex items-center gap-1.5">
                          <button className="text-xs text-rose-600 font-medium" onClick={() => handleDelete(eq.id)}>Confirmar</button>
                          <button className="text-xs text-slate-400" onClick={() => { setDeleteConfirm(null); setDeleteError(null); }}>Cancelar</button>
                        </div>
                      ) : (
                        <button className="text-xs text-rose-400 hover:text-rose-600" onClick={() => { setDeleteConfirm(eq.id); setDeleteError(null); }}>
                          Excluir
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
          {deleteError && <p className="px-6 pb-4 text-sm text-rose-600">{deleteError}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
