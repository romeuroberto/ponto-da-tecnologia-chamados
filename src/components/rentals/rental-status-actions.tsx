"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { RentalContract } from "@/types";

interface Props {
  contract: RentalContract;
}

export function RentalStatusActions({ contract }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);

  async function setStatus(status: string) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/rentals/${contract.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? "Erro.");
      setConfirmClose(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar status.");
    } finally {
      setSaving(false);
    }
  }

  if (contract.status === "ENCERRADO" || contract.status === "EXPIRADO") return null;

  return (
    <div className="rounded-xl border bg-white p-5 space-y-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ações do contrato</p>

      {contract.status === "RASCUNHO" && (
        <Button className="w-full" onClick={() => setStatus("ATIVO")} disabled={saving}>
          Ativar contrato
        </Button>
      )}

      {contract.status === "ATIVO" && (
        <>
          {confirmClose ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-600">Confirma o encerramento do contrato? Esta ação não pode ser desfeita.</p>
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={() => setStatus("ENCERRADO")} disabled={saving}>
                  {saving ? "..." : "Encerrar"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmClose(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => setConfirmClose(true)}>
              Encerrar contrato
            </Button>
          )}
        </>
      )}

      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
