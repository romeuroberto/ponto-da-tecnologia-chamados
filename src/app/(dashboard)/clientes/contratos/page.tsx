import type { Route } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requireRole } from "@/server/auth/session";
import { getParam } from "@/server/search-params";
import { contractRepository } from "@/server/repositories/contract-repository";

const statusLabel: Record<string, string> = {
  ATIVO: "Ativo",
  RASCUNHO: "Rascunho",
  ENCERRADO: "Encerrado",
  EXPIRADO: "Expirado"
};

const statusClass: Record<string, string> = {
  ATIVO: "bg-emerald-100 text-emerald-800",
  RASCUNHO: "bg-yellow-100 text-yellow-800",
  ENCERRADO: "bg-slate-100 text-slate-600",
  EXPIRADO: "bg-rose-100 text-rose-700"
};

const coverageLabel: Record<string, string> = {
  TOTAL: "Total",
  PARCIAL: "Parcial"
};

export default async function ContratosPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["ADMIN", "ATTENDANT"]);

  const params = await searchParams;
  const q = getParam(params.q) ?? "";
  const statusFilter = getParam(params.status) ?? "";

  const all = await contractRepository.listAll();

  const filtered = all
    .filter((c) => !q || c.clientName.toLowerCase().includes(q.toLowerCase()) || c.contractNumber.toLowerCase().includes(q.toLowerCase()))
    .filter((c) => !statusFilter || c.status === statusFilter);

  const ativos = all.filter((c) => c.status === "ATIVO").length;
  const expirandoEm30 = all.filter((c) => c.status === "ATIVO" && c.daysUntilExpiry !== null && c.daysUntilExpiry >= 0 && c.daysUntilExpiry <= 30).length;
  const semDataFim = all.filter((c) => c.status === "ATIVO" && c.endDate == null).length;
  const encerrados = all.filter((c) => c.status === "ENCERRADO" || c.status === "EXPIRADO").length;

  const hasFilters = q || statusFilter;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contratos"
        description="Visão global de todos os contratos de clientes."
      />

      {/* Cards de resumo */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Ativos</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-950">{ativos}</p>
          <p className="mt-1 text-xs text-emerald-600">{semDataFim} sem data de fim</p>
        </div>
        <div className={`rounded-2xl border px-5 py-4 ${expirandoEm30 > 0 ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${expirandoEm30 > 0 ? "text-amber-700" : "text-slate-500"}`}>
            Vencendo em 30 dias
          </p>
          <p className={`mt-2 text-2xl font-semibold ${expirandoEm30 > 0 ? "text-amber-950" : "text-slate-950"}`}>{expirandoEm30}</p>
          <p className={`mt-1 text-xs ${expirandoEm30 > 0 ? "text-amber-600" : "text-slate-400"}`}>
            {expirandoEm30 > 0 ? "requerem atenção" : "nenhum vencendo em breve"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Encerrados / Expirados</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{encerrados}</p>
          <p className="mt-1 text-xs text-slate-400">fora de vigência</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total de contratos</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{all.length}</p>
          <p className="mt-1 text-xs text-slate-400">em todos os clientes</p>
        </div>
      </section>

      {/* Busca */}
      <form action="/clientes/contratos" className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por cliente ou número..."
          className="h-9 flex-1 min-w-48 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />
        <input type="hidden" name="status" value={statusFilter} />
        <button type="submit" className="h-9 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700">
          Buscar
        </button>
        {hasFilters ? (
          <Link href="/clientes/contratos" className="flex h-9 items-center rounded-lg border border-slate-200 px-4 text-sm text-slate-600 hover:bg-slate-50">
            Limpar
          </Link>
        ) : null}
      </form>

      {/* Pills de status */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: "", label: "Todos" },
          { value: "ATIVO", label: "Ativos" },
          { value: "RASCUNHO", label: "Rascunho" },
          { value: "EXPIRADO", label: "Expirados" },
          { value: "ENCERRADO", label: "Encerrados" }
        ].map((opt) => (
          <Link
            key={opt.value}
            href={`/clientes/contratos?status=${opt.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === opt.value
                ? "border-sky-600 bg-sky-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {/* Lista */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          <div className="hidden grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr] gap-4 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400 lg:grid">
            <span>Cliente</span>
            <span>Contrato</span>
            <span>Cobertura</span>
            <span>Vigência</span>
            <span>Mensalidade</span>
            <span>Status</span>
          </div>

          {filtered.map((contract) => {
            const expiringSoon = contract.status === "ATIVO" && contract.daysUntilExpiry !== null && contract.daysUntilExpiry >= 0 && contract.daysUntilExpiry <= 30;
            return (
              <Link
                key={contract.id}
                href={`/clientes/${contract.clientId}` as Route}
                className={`block rounded-xl border p-4 transition-colors hover:bg-slate-50 ${
                  expiringSoon ? "border-amber-200 bg-amber-50/40 hover:bg-amber-50" : "border-slate-200 bg-white"
                }`}
              >
                {/* Mobile */}
                <div className="lg:hidden space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-950">{contract.clientName}</p>
                      <p className="text-xs text-slate-500">{contract.contractNumber} · {coverageLabel[contract.coverageType]}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass[contract.status]}`}>
                      {statusLabel[contract.status]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                    <span>Início: {formatDate(contract.startDate)}</span>
                    {contract.endDate && <span className={expiringSoon ? "font-semibold text-amber-700" : ""}>Fim: {formatDate(contract.endDate)}{expiringSoon ? ` (${contract.daysUntilExpiry}d)` : ""}</span>}
                    {contract.monthlyValue ? <span>{formatCurrency(contract.monthlyValue)}/mês</span> : null}
                  </div>
                </div>

                {/* Desktop */}
                <div className="hidden grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr] items-center gap-4 lg:grid">
                  <p className="font-semibold text-slate-950">{contract.clientName}</p>
                  <p className="text-sm text-slate-700">{contract.contractNumber}</p>
                  <p className="text-sm text-slate-700">{coverageLabel[contract.coverageType]}</p>
                  <div className="text-sm">
                    <p className="text-slate-700">{formatDate(contract.startDate)}</p>
                    {contract.endDate ? (
                      <p className={expiringSoon ? "font-semibold text-amber-700" : "text-slate-500"}>
                        até {formatDate(contract.endDate)}
                        {expiringSoon ? ` · ${contract.daysUntilExpiry}d` : ""}
                      </p>
                    ) : (
                      <p className="text-slate-400">indeterminado</p>
                    )}
                  </div>
                  <p className="text-sm text-slate-700">
                    {contract.monthlyValue ? formatCurrency(contract.monthlyValue) : <span className="text-slate-400">—</span>}
                  </p>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass[contract.status]}`}>
                    {statusLabel[contract.status]}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Nenhum contrato encontrado"
          description={hasFilters ? "Tente ajustar a busca ou o filtro." : "Nenhum contrato cadastrado ainda."}
        />
      )}
    </div>
  );
}
