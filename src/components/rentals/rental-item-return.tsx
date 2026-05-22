"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RentalContractItem } from "@/types";

interface Props {
  item: RentalContractItem;
}

export function RentalItemReturn({ item }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [returnedAt, setReturnedAt] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (item.returnedAt) {
    return <span className="text-xs text-slate-400">Devolvido</span>;
  }

  if (!open) {
    return (
      <button className="text-xs text-amber-600 hover:underline" onClick={() => setOpen(true)}>
        Registrar devolução
      </button>
    );
  }

  async function handleReturn() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/rentals/items/${item.id}/return`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnedAt })
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

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Data de devolução</Label>
          <Input type="date" value={returnedAt} onChange={(e) => setReturnedAt(e.target.value)} className="h-8 text-xs" />
        </div>
        <Button size="sm" onClick={handleReturn} disabled={saving} className="h-8 text-xs">
          {saving ? "..." : "Confirmar"}
        </Button>
        <button className="text-xs text-slate-400 hover:text-slate-600" onClick={() => setOpen(false)}>Cancelar</button>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
