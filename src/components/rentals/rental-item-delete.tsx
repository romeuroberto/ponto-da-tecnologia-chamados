"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  itemId: string;
}

export function RentalItemDelete({ itemId }: Props) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/rentals/items/${itemId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? "Erro ao remover.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao remover.");
      setDeleting(false);
    }
  }

  if (error) {
    return <span className="text-xs text-rose-600">{error}</span>;
  }

  if (!confirm) {
    return (
      <button
        className="text-xs text-rose-400 hover:text-rose-600"
        onClick={() => setConfirm(true)}
      >
        Remover
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <button
        className="text-xs font-semibold text-rose-600 hover:text-rose-800"
        onClick={handleDelete}
        disabled={deleting}
      >
        {deleting ? "Removendo..." : "Confirmar"}
      </button>
      <button
        className="text-xs text-slate-400 hover:text-slate-600"
        onClick={() => setConfirm(false)}
      >
        Cancelar
      </button>
    </span>
  );
}
