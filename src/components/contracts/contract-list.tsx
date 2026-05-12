"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { ClientContract, TicketCategory } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractForm } from "@/components/contracts/contract-form";

const statusLabel: Record<ClientContract["status"], string> = {
  ATIVO: "Ativo",
  RASCUNHO: "Rascunho",
  ENCERRADO: "Encerrado",
  EXPIRADO: "Expirado"
};

const statusColor: Record<ClientContract["status"], string> = {
  ATIVO: "bg-green-100 text-green-800",
  RASCUNHO: "bg-yellow-100 text-yellow-800",
  ENCERRADO: "bg-slate-100 text-slate-600",
  EXPIRADO: "bg-red-100 text-red-700"
};

const coverageLabel: Record<ClientContract["coverageType"], string> = {
  TOTAL: "Cobertura Total",
  PARCIAL: "Cobertura Parcial"
};

const coverageColor: Record<ClientContract["coverageType"], string> = {
  TOTAL: "bg-blue-800 text-white",
  PARCIAL: "bg-blue-100 text-blue-800"
};

interface HistoryEntry {
  id: string;
  message: string;
  createdAt: string;
  author: { name: string };
}

function ContractHistorySection({ clientId, contractId }: { clientId: string; contractId: string }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!open && history === null) {
      setLoading(true);
      try {
        const res = await fetch(`/api/clients/${clientId}/contracts/${contractId}/history`);
        const result = await res.json();
        if (result.success) setHistory(result.data);
      } finally {
        setLoading(false);
      }
    }
    setOpen((v) => !v);
  }

  return (
    <div className="border-t border-slate-100 pt-2">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
      >
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {loading ? "Carregando..." : "Histórico"}
      </button>

      {open && history !== null && (
        <div className="mt-2 space-y-1.5">
          {history.length === 0 ? (
            <p className="text-xs text-slate-400">Nenhum registro de histórico.</p>
          ) : (
            history.map((entry) => (
              <div key={entry.id} className="flex gap-2 text-xs">
                <span className="shrink-0 text-slate-400">
                  {new Date(entry.createdAt).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
                <span className="text-slate-500">{entry.author.name}:</span>
                <span className="text-slate-700">{entry.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function ContractList({
  clientId,
  initialContracts,
  canEdit,
  nextContractNumber,
  categories = []
}: {
  clientId: string;
  initialContracts: ClientContract[];
  canEdit: boolean;
  nextContractNumber?: string;
  categories?: TicketCategory[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [contracts, setContracts] = useState<ClientContract[]>(initialContracts);
  const [showForm, setShowForm] = useState(false);
  const [editingContract, setEditingContract] = useState<ClientContract | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleFormDone() {
    setShowForm(false);
    setEditingContract(null);
    startTransition(async () => {
      const response = await fetch(`/api/clients/${clientId}/contracts`);
      const result = await response.json();
      if (result.success) setContracts(result.data);
    });
  }

  function handleDelete(contractId: string) {
    if (!confirm("Excluir este contrato? Esta ação não pode ser desfeita.")) return;
    setDeletingId(contractId);
    startTransition(async () => {
      await fetch(`/api/clients/${clientId}/contracts/${contractId}`, { method: "DELETE" });
      setContracts((prev) => prev.filter((c) => c.id !== contractId));
      setDeletingId(null);
      router.refresh();
    });
  }

  const isFormOpen = showForm || editingContract !== null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Contratos</CardTitle>
        {canEdit && !isFormOpen && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            + Novo contrato
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isFormOpen && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-700">
              {editingContract ? "Editar contrato" : "Novo contrato"}
            </p>
            <ContractForm
              clientId={clientId}
              contract={editingContract ?? undefined}
              suggestedNumber={editingContract ? undefined : nextContractNumber}
              categories={categories}
              onDone={handleFormDone}
            />
          </div>
        )}

        {contracts.length === 0 && !isFormOpen && (
          <p className="text-sm text-slate-500">Nenhum contrato cadastrado.</p>
        )}

        {contracts.map((contract) => (
          <div
            key={contract.id}
            className="rounded-xl border border-slate-200 p-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">{contract.contractNumber}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[contract.status]}`}>
                    {statusLabel[contract.status]}
                  </span>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${coverageColor[contract.coverageType]}`}>
                    {coverageLabel[contract.coverageType]}
                  </span>
                </div>
              </div>
              {canEdit && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEditingContract(contract); setShowForm(false); }}
                    disabled={isPending || isFormOpen}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(contract.id)}
                    disabled={isPending || deletingId === contract.id}
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    {deletingId === contract.id ? "Excluindo..." : "Excluir"}
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-700">
              <p>
                <span className="font-medium text-slate-950">Início:</span>{" "}
                {formatDate(contract.startDate)}
              </p>
              <p>
                <span className="font-medium text-slate-950">Fim:</span>{" "}
                {contract.endDate ? formatDate(contract.endDate) : "Indeterminado"}
              </p>
              {contract.monthlyValue !== undefined && (
                <p>
                  <span className="font-medium text-slate-950">Mensalidade:</span>{" "}
                  {formatCurrency(contract.monthlyValue)}
                </p>
              )}
              {contract.coveredCategories.length > 0 && (
                <p className="col-span-2">
                  <span className="font-medium text-slate-950">Categorias:</span>{" "}
                  {contract.coveredCategories.join(", ")}
                </p>
              )}
              {contract.coverageType === "TOTAL" && contract.coveredCategories.length === 0 && (
                <p className="col-span-2 text-blue-700 text-xs">Cobre todas as categorias de chamado.</p>
              )}
              {contract.notes && (
                <p className="col-span-2">
                  <span className="font-medium text-slate-950">Obs.:</span> {contract.notes}
                </p>
              )}
            </div>

            <ContractHistorySection clientId={clientId} contractId={contract.id} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
