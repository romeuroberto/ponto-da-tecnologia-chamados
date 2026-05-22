"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { PartCatalogItem } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface Props {
  parts: PartCatalogItem[];
  isAdmin: boolean;
}

export function StockPartsTable({ parts, isAdmin }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const activeParts = parts.filter((p) => p.active);
  const filtered = search.trim()
    ? activeParts.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.code ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : activeParts;

  function handleDelete(id: string) {
    setDeleteError(null);
    startTransition(async () => {
      const res = await fetch(`/api/stock/parts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.message ?? "Não foi possível excluir o material.");
        setConfirmId(null);
        return;
      }
      setConfirmId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Buscar por nome ou código..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {deleteError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-sm text-rose-700">{deleteError}</p>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">Nenhum material encontrado.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          <div className={`grid gap-3 px-6 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 ${isAdmin ? "grid-cols-[2fr_1fr_1fr_1fr_auto]" : "grid-cols-[2fr_1fr_1fr_1fr]"}`}>
            <span>Material</span>
            <span>Código</span>
            <span className="text-right">Preço unit.</span>
            <span className="text-right">Em estoque</span>
            {isAdmin && <span />}
          </div>

          {filtered.map((part) => (
            <div
              key={part.id}
              className={`grid items-center gap-3 px-6 py-3 text-sm ${isAdmin ? "grid-cols-[2fr_1fr_1fr_1fr_auto]" : "grid-cols-[2fr_1fr_1fr_1fr]"}`}
            >
              <div>
                <span className="font-medium text-slate-900">{part.name}</span>
                {part.minimumStock != null && part.stockQuantity <= part.minimumStock && (
                  <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                    Baixo
                  </span>
                )}
              </div>
              <span className="text-slate-500">{part.code ?? "—"}</span>
              <span className="text-right text-slate-600">{formatCurrency(part.unitPrice)}</span>
              <span className={`text-right font-semibold ${part.stockQuantity > 0 ? "text-slate-950" : "text-rose-600"}`}>
                {Number(part.stockQuantity)} {part.unit}
              </span>

              {isAdmin && (
                <div className="flex items-center justify-end gap-2">
                  {confirmId === part.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDelete(part.id)}
                        disabled={isPending}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        disabled={isPending}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setDeleteError(null); setConfirmId(part.id); }}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:border-rose-300 hover:text-rose-600"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="px-6 pb-2 text-xs text-slate-400">
        {filtered.length} de {activeParts.length} material(is) ativo(s)
        {search ? ` · filtrando por "${search}"` : ""}
      </p>
    </div>
  );
}
