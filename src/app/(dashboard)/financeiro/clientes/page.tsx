import type { Route } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import { requireRole } from "@/server/auth/session";
import { getParam } from "@/server/search-params";
import { billingRepository } from "@/server/repositories/billing-repository";

export default async function FinanceiroClientesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["ADMIN", "ATTENDANT"]);

  const params = await searchParams;
  const q = getParam(params.q) ?? "";
  const filter = getParam(params.filter) ?? "";

  const summaries = await billingRepository.listClientSummaries();

  const filtered = summaries
    .filter((s) => !q || s.clientName.toLowerCase().includes(q.toLowerCase()))
    .filter((s) => {
      if (filter === "pendente") return s.openCount > 0;
      if (filter === "vencido") return s.overdueCount > 0;
      return true;
    })
    .sort((a, b) => {
      if (b.overdueCount !== a.overdueCount) return b.overdueCount - a.overdueCount;
      return b.openAmount - a.openAmount;
    });

  const totalEmAberto = summaries.reduce((s, c) => s + c.openAmount, 0);
  const totalVencidos = summaries.reduce((s, c) => s + c.overdueCount, 0);
  const totalRecebido = summaries.reduce((s, c) => s + c.paidAmount, 0);
  const comPendencia = summaries.filter((c) => c.openCount > 0).length;

  const hasFilters = q || filter;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cobranças por cliente"
        description="Visão consolidada do financeiro de cada cliente."
      />

      {/* Métricas globais */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Em aberto</p>
          <p className="mt-2 text-2xl font-semibold text-amber-950">{formatCurrency(totalEmAberto)}</p>
          <p className="mt-1 text-xs text-amber-600">{comPendencia} cliente{comPendencia !== 1 ? "s" : ""} com pendência</p>
        </div>
        <div className={`rounded-2xl border px-5 py-4 ${totalVencidos > 0 ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${totalVencidos > 0 ? "text-rose-700" : "text-slate-500"}`}>Vencidos</p>
          <p className={`mt-2 text-2xl font-semibold ${totalVencidos > 0 ? "text-rose-950" : "text-slate-950"}`}>{totalVencidos}</p>
          <p className={`mt-1 text-xs ${totalVencidos > 0 ? "text-rose-600" : "text-slate-400"}`}>
            {totalVencidos > 0 ? "fatura(s) em atraso" : "nenhum em atraso"}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Recebido total</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-950">{formatCurrency(totalRecebido)}</p>
          <p className="mt-1 text-xs text-emerald-600">
            {summaries.reduce((s, c) => s + c.paidCount, 0)} pagamento{summaries.reduce((s, c) => s + c.paidCount, 0) !== 1 ? "s" : ""} confirmado{summaries.reduce((s, c) => s + c.paidCount, 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Clientes com financeiro</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summaries.length}</p>
          <p className="mt-1 text-xs text-slate-400">com pelo menos 1 cobrança</p>
        </div>
      </section>

      {/* Busca e filtros */}
      <form action="/financeiro/clientes" className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar cliente..."
          className="h-9 flex-1 min-w-48 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />
        <input type="hidden" name="filter" value={filter} />
        <button type="submit" className="h-9 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700">
          Buscar
        </button>
        {hasFilters ? (
          <Link href={"/financeiro/clientes" as Route} className="flex h-9 items-center rounded-lg border border-slate-200 px-4 text-sm text-slate-600 hover:bg-slate-50">
            Limpar
          </Link>
        ) : null}
      </form>

      {/* Pills de filtro rápido */}
      <div className="flex gap-2">
        {[
          { value: "", label: "Todos" },
          { value: "pendente", label: "Com pendência" },
          { value: "vencido", label: "Com vencidos" }
        ].map((opt) => (
          <Link
            key={opt.value}
            href={`/financeiro/clientes${q ? `?q=${encodeURIComponent(q)}&filter=${opt.value}` : `?filter=${opt.value}`}` as Route}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
              filter === opt.value
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
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400 lg:grid">
            <span>Cliente</span>
            <span>Em aberto</span>
            <span>Vencidos</span>
            <span className="text-right">Recebido</span>
            <span />
          </div>

          {filtered.map((client) => (
            <Link
              key={client.clientId}
              href={`/clientes/${client.clientId}/financeiro` as Route}
              className={`block rounded-xl border p-4 transition-colors hover:bg-slate-50 ${
                client.overdueCount > 0
                  ? "border-rose-200 bg-rose-50/30 hover:bg-rose-50"
                  : client.openCount > 0
                  ? "border-amber-100 bg-white"
                  : "border-slate-200 bg-white"
              }`}
            >
              {/* Mobile */}
              <div className="lg:hidden space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-950">{client.clientName}</p>
                  {client.overdueCount > 0 && (
                    <span className="shrink-0 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                      {client.overdueCount} vencido{client.overdueCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-amber-700 font-medium">{formatCurrency(client.openAmount)} em aberto</span>
                  <span className="text-emerald-700">{formatCurrency(client.paidAmount)} recebido</span>
                </div>
              </div>

              {/* Desktop */}
              <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 lg:grid">
                <p className="font-semibold text-slate-950">{client.clientName}</p>
                <div>
                  {client.openAmount > 0 ? (
                    <>
                      <p className="text-sm font-semibold text-amber-700">{formatCurrency(client.openAmount)}</p>
                      <p className="text-xs text-amber-600">{client.openCount} cobrança{client.openCount !== 1 ? "s" : ""}</p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">—</p>
                  )}
                </div>
                <div>
                  {client.overdueCount > 0 ? (
                    <span className="inline-block rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                      {client.overdueCount} vencido{client.overdueCount !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    <p className="text-sm text-slate-400">—</p>
                  )}
                </div>
                <p className="text-right text-sm font-semibold text-emerald-700">
                  {client.paidAmount > 0 ? formatCurrency(client.paidAmount) : <span className="text-slate-400">—</span>}
                </p>
                <span className="text-xs text-slate-400 whitespace-nowrap">Ver extrato →</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhum cliente encontrado"
          description={hasFilters ? "Tente ajustar a busca ou o filtro." : "Nenhum cliente possui cobranças registradas."}
        />
      )}
    </div>
  );
}
