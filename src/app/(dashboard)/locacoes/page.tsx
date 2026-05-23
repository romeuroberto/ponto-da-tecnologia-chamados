import type { Route } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { RentalContractForm } from "@/components/rentals/rental-contract-form";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requireRole } from "@/server/auth/session";
import { clientService } from "@/server/services/client-service";
import { rentalService } from "@/server/services/rental-service";
import type { RentalContractStatus } from "@/types";

const statusLabel: Record<RentalContractStatus, string> = {
  RASCUNHO: "Rascunho",
  ATIVO: "Ativo",
  ENCERRADO: "Encerrado",
  EXPIRADO: "Expirado"
};

const statusClass: Record<RentalContractStatus, string> = {
  RASCUNHO: "bg-slate-100 text-slate-600",
  ATIVO: "bg-emerald-100 text-emerald-800",
  ENCERRADO: "bg-rose-100 text-rose-700",
  EXPIRADO: "bg-amber-100 text-amber-700"
};

export default async function LocacoesPage() {
  const session = await requireRole(["ADMIN", "ATTENDANT"]);
  const isAdmin = session.role === "ADMIN";

  const [contracts, clients, equipment] = await Promise.all([
    rentalService.listContracts(),
    clientService.listClients(),
    rentalService.listEquipment({ status: "DISPONIVEL" })
  ]);

  const active = contracts.filter((c) => c.status === "ATIVO");
  const draft = contracts.filter((c) => c.status === "RASCUNHO");
  const closed = contracts.filter((c) => c.status === "ENCERRADO" || c.status === "EXPIRADO");
  const monthlyRevenue = active.reduce((s, c) => s + c.totalMonthlyValue, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Locações" description="Contratos de locação de equipamentos" />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Contratos ativos</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{active.length}</p>
        </div>
        <div className="rounded-xl border bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs text-emerald-700 uppercase tracking-wide font-semibold">Receita mensal</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">{formatCurrency(monthlyRevenue)}</p>
        </div>
        <div className="rounded-xl border bg-amber-50 p-4 shadow-sm">
          <p className="text-xs text-amber-700 uppercase tracking-wide font-semibold">Rascunhos</p>
          <p className="mt-1 text-2xl font-bold text-amber-800">{draft.length}</p>
        </div>
        <div className="rounded-xl border bg-slate-50 p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Encerrados</p>
          <p className="mt-1 text-2xl font-bold text-slate-700">{closed.length}</p>
        </div>
      </div>

      {/* New contract form */}
      {isAdmin && (
        <RentalContractForm clients={clients} availableEquipment={equipment} />
      )}

      {/* Contracts table */}
      <Card>
        <CardContent className="p-0">
          {contracts.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">
              Nenhum contrato de locação cadastrado.{" "}
              <Link href={"/locacoes/equipamentos" as Route} className="text-blue-600 hover:underline">
                Comece cadastrando os equipamentos.
              </Link>
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-3 bg-slate-50 px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Contrato / Cliente</span>
                <span>Equipamentos</span>
                <span>Mensalidade</span>
                <span>Início</span>
                <span>Status</span>
                <span></span>
              </div>
              {contracts.map((c) => (
                <div key={c.id} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] items-center gap-3 px-6 py-3.5 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{c.contractNumber}</p>
                    <p className="text-xs text-slate-400">{c.clientName}</p>
                  </div>
                  <div>
                    <p className="text-slate-700">{c.items.filter((i) => !i.returnedAt).length} ativo(s)</p>
                    <p className="text-xs text-slate-400">
                      {c.items
                        .filter((i) => !i.returnedAt)
                        .map((i) => i.equipmentModel)
                        .join(", ")}
                    </p>
                  </div>
                  <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(c.totalMonthlyValue)}</span>
                  <span className="text-slate-500">{formatDate(c.startDate)}</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium w-fit ${statusClass[c.status]}`}>
                    {statusLabel[c.status]}
                  </span>
                  <Link href={`/locacoes/${c.id}` as Route} className="text-xs text-blue-600 hover:underline whitespace-nowrap">
                    Ver →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick link to equipment */}
      <div className="flex justify-end">
        <Link href={"/locacoes/equipamentos" as Route} className="text-sm text-slate-500 hover:text-slate-800 hover:underline">
          Gerenciar equipamentos →
        </Link>
      </div>
    </div>
  );
}
