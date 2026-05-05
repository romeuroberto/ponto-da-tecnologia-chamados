"use client";

import { useState, useTransition } from "react";

import type { TicketCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { FormMessage } from "@/components/forms/form-message";

type EditingState = {
  id: string | null;
  name: string;
  label: string;
  suggestedRole: string;
  sortOrder: string;
};

const emptyForm: EditingState = { id: null, name: "", label: "", suggestedRole: "", sortOrder: "0" };

export function CategoryManager({ initialCategories }: { initialCategories: TicketCategory[] }) {
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState(initialCategories);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function openNew() {
    setMessage(null);
    setEditing(emptyForm);
  }

  function openEdit(cat: TicketCategory) {
    setMessage(null);
    setEditing({
      id: cat.id,
      name: cat.name,
      label: cat.label,
      suggestedRole: cat.suggestedRole ?? "",
      sortOrder: String(cat.sortOrder)
    });
  }

  function cancelEdit() {
    setEditing(null);
    setMessage(null);
  }

  function saveEdit() {
    if (!editing) return;
    setMessage(null);

    const payload = {
      name: editing.name.trim(),
      label: editing.label.trim(),
      suggestedRole: editing.suggestedRole || null,
      sortOrder: Number(editing.sortOrder) || 0
    };

    if (!payload.name || !payload.label) {
      setMessage({ type: "error", text: "Nome e label são obrigatórios." });
      return;
    }

    startTransition(async () => {
      const isNew = editing.id === null;
      const url = isNew ? "/api/categories" : `/api/categories/${editing.id}`;
      const method = isNew ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: result.message ?? "Não foi possível salvar a categoria." });
        return;
      }

      setCategories((current) =>
        isNew
          ? [...current, result.data].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
          : current.map((c) => (c.id === result.data.id ? result.data : c))
      );
      setEditing(null);
      setMessage({ type: "success", text: isNew ? "Categoria criada com sucesso." : "Categoria atualizada." });
    });
  }

  function toggleActive(cat: TicketCategory) {
    startTransition(async () => {
      const response = await fetch(`/api/categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cat.name,
          label: cat.label,
          suggestedRole: cat.suggestedRole ?? null,
          sortOrder: cat.sortOrder,
          active: !cat.active
        })
      });

      const result = await response.json();
      if (!response.ok) {
        setMessage({ type: "error", text: result.message ?? "Falha ao alterar status." });
        return;
      }
      setCategories((current) => current.map((c) => (c.id === cat.id ? result.data : c)));
    });
  }

  const roleLabel: Record<string, string> = {
    ATTENDANT: "Atendente",
    TECHNICIAN: "Técnico"
  };

  return (
    <div className="space-y-4">
      {message ? <FormMessage type={message.type} message={message.text} /> : null}

      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle>{editing.id ? "Editar categoria" : "Nova categoria"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="cat-name">Nome (slug interno)</Label>
                <Input
                  id="cat-name"
                  value={editing.name}
                  onChange={(e) => setEditing((s) => s && { ...s, name: e.target.value })}
                  placeholder="Ex: CFTV"
                  disabled={!!editing.id}
                />
                {editing.id ? <p className="text-xs text-slate-500">O nome não pode ser alterado após a criação pois é usado em chamados existentes.</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cat-label">Label exibido</Label>
                <Input
                  id="cat-label"
                  value={editing.label}
                  onChange={(e) => setEditing((s) => s && { ...s, label: e.target.value })}
                  placeholder="Ex: CFTV e Câmeras"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="cat-role">Perfil sugerido para atribuição</Label>
                <Select
                  id="cat-role"
                  value={editing.suggestedRole}
                  onChange={(e) => setEditing((s) => s && { ...s, suggestedRole: e.target.value })}
                >
                  <option value="">Sem sugestão</option>
                  <option value="ATTENDANT">Atendente</option>
                  <option value="TECHNICIAN">Técnico</option>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cat-order">Ordem de exibição</Label>
                <Input
                  id="cat-order"
                  type="number"
                  min="0"
                  value={editing.sortOrder}
                  onChange={(e) => setEditing((s) => s && { ...s, sortOrder: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" disabled={isPending} onClick={saveEdit}>
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
              <Button type="button" variant="outline" disabled={isPending} onClick={cancelEdit}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex justify-end">
          <Button type="button" onClick={openNew}>Nova categoria</Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Categorias cadastradas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {categories.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma categoria cadastrada.</p>
          ) : (
            categories
              .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
              .map((cat) => (
                <div
                  key={cat.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    cat.active ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-60"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-950">{cat.label}</p>
                      {!cat.active ? (
                        <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                          Inativa
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      <span className="font-mono">{cat.name}</span>
                      {cat.suggestedRole ? ` · Sugerido: ${roleLabel[cat.suggestedRole]}` : " · Sem sugestão"}
                      {" · Ordem: "}{cat.sortOrder}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={() => openEdit(cat)} disabled={isPending}>
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={`h-8 px-3 text-xs ${cat.active ? "border-rose-200 text-rose-700 hover:bg-rose-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}
                      onClick={() => toggleActive(cat)}
                      disabled={isPending}
                    >
                      {cat.active ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </div>
              ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
