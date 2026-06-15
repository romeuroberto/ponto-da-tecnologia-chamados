import type { Route } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requireRole } from "@/server/auth/session";
import { getParam } from "@/server/search-params";
import { saleService } from "@/server/services/sale-service";
import type { FinancialStatus } from "@/types";

const STATUS_OPTIONS: Array<{ value: FinancialStatus | ""; label: string }> = [
  { value: "", label: "Todas" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "PAGO", label: "Pago" },
  { value: "CANCELADO", label: "Cancelado" }
];

const statusBadge: Record<FinancialStatus, { label: string; className: string }> = {
  PENDENTE:   { label: "Pendente",   className: "bg-amber-100 text-amber-800" },
  EM_ANALISE: { label: "Pendente de cobrança", className: "bg-amber-100 text-amber-800" },
  APROVADO:   { label: "Pendente de cobrança", className: "bg-amber-100 text-amber-800" },
  FATURADO:   { label: "Faturado",   className: "bg-violet-100 text-violet-700" },
  PAGO:       { label: "Pago",       className: "bg-green-100 text-green-800 font-semibold" },
  CANCELADO:  { label: "Cancelado",  className: "bg-rose-100 text-rose-700" }
};

export default async function VendasPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["ADMIN", "ATTENDANT"]);
  const params = await searchParams;
  const statusParam = getParam(params.status) ?? "";
  const q = getParam(params.q) ?? "";
  const from = getParam(params.from) ?? "";
  const to = getParam(params.to) ?? "";

  // All sales matching search + date (for counts and breakdown)
  const allSales = await saleService.listSales({ q: q || undefined, from: from || undefined, to: to || undefined });

  // Filtered by status for display
  const filteredSales = statusParam ? allSales.filter((s) => s.financialStatus === statusParam) : allSales;

  const statusCounts: Record<string, number> = {
    "": allSales.length,
    PENDENTE: allSales.filter((s) => s.financialStatus === "PENDENTE").length,
    PAGO: allSales.filter((s) => s.financialStatus === "PAGO").length,
    CANCELADO: allSales.filter((s) => s.financialStatus === "CANCELADO").length
  };

  const paidSales = filteredSales.filter((s) => s.financialStatus === "PAGO");
  const paidAmount = paidSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const pendingCount = filteredSales.filter((s) => s.financialStatus === "PENDENTE").length;
  const totalAmount = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);

  const paymentBreakdown = paidSales.reduce<Record<string, number>>((acc, s) => {
    const method = s.paymentMethod ?? "Não informado";
    acc[method] = (acc[method] ?? 0) + s.totalAmount;
    return acc;
  }, {});
  const breakdownEntries = Object.entries(paymentBreakdown).sort((a, b) => b[1] - a[1]);

  const hasActiveFilters = q || from || to || statusParam;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendas"
        description="Registro de vendas de materiais e produtos para clientes."
        action={
          <Link href={"/vendas/nova" as Route}>
            <Button>Nova venda</Button>
          </Link>
        }
      />

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vendas no filtro</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{filteredSales.length}</p>
          <p className="mt-1 text-xs text-slate-400">Total: {formatCurrency(totalAmount)}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Aguardando pagamento</p>
          <p className="mt-2 text-3xl font-semibold text-amber-950">{pendingCount}</p>
          <p className="mt-1 text-xs text-amber-600">venda{pendingCount !== 1 ? "s" : ""} pendente{pendingCount !== 1 ? "s" : ""}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Total recebido</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-950">{formatCurrency(paidAmount)}</p>
          {breakdownEntries.length > 0 ? (
            <div className="mt-2 space-y-0.5">
              {breakdownEntries.slice(0, 3).map(([method, amount]) => (
                <p key={method} className="text-xs text-emerald-700">
                  {method}: <span className="font-semibold">{formatCurrency(amount)}</span>
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-xs text-emerald-600">nenhuma venda paga</p>
          )}
        </div>
      </section>

      {/* Search + date range */}
      <form action="/vendas" className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por cliente ou nº da venda..."
          className="h-9 flex-1 min-w-48 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />
        <input
          name="from"
          type="date"
          defaultValue={from}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500"
        />
        <input
          name="to"
          type="date"
          defaultValue={to}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500"
        />
        <input type="hidden" name="status" value={statusParam} />
        <button type="submit" className="h-9 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700">
          Buscar
        </button>
        {hasActiveFilters ? (
          <Link href="/vendas" className="flex h-9 items-center rounded-lg border border-slate-200 px-4 text-sm text-slate-600 hover:bg-slate-50">
            Limpar
          </Link>
        ) : null}
      </form>

      {/* Status pills with counts */}
      <form action="/vendas" className="flex flex-wrap gap-2">
        <input type="hidden" name="q" value={q} />
        <input type="hidden" name="from" value={from} />
        <input type="hidden" name="to" value={to} />
        {STATUS_OPTIONS.map((opt) => {
          const count = statusCounts[opt.value] ?? 0;
          const isActive = statusParam === opt.value;
          return (
            <button
              key={opt.value}
              type="submit"
              name="status"
              value={opt.value}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? "border-sky-600 bg-sky-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
              }`}
            >
              {opt.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </form>

      {/* List */}
      {filteredSales.length > 0 ? (
        <div className="space-y-2">
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400 lg:grid">
            <span>Venda / Cliente</span>
            <span>Data</span>
            <span>Status</span>
            <span className="text-right">Total</span>
            <span />
          </div>

          {filteredSales.map((sale) => {
            const badge = statusBadge[sale.financialStatus];
            return (
              <Link
                key={sale.id}
                href={`/vendas/${sale.id}` as Route}
                className="block rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-sky-200 hover:bg-sky-50/40"
              >
                <div className="lg:hidden space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{sale.number}</p>
                      <p className="mt-0.5 font-semibold text-slate-900">{sale.clientName}</p>
                      <p className="text-xs text-slate-500">{sale.items.length} item(s)</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{formatDate(sale.createdAt)}</span>
                    <span className="font-semibold text-slate-950">{formatCurrency(sale.totalAmount)}</span>
                  </div>
                </div>

                <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 lg:grid">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{sale.number}</p>
                    <p className="mt-0.5 font-semibold leading-tight text-slate-900">{sale.clientName}</p>
                    <p className="text-xs text-slate-400">{sale.items.length} item(s) · por {sale.createdByName}</p>
                  </div>
                  <span className="text-sm text-slate-600">{formatDate(sale.createdAt)}</span>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                    {badge.label}
                  </span>
                  <span className="text-right font-semibold text-slate-950">{formatCurrency(sale.totalAmount)}</span>
                  <span className="text-xs text-slate-400">
                    {sale.paymentMethod ?? "—"}
                  </span>
                </div>
              </Link>
            );
          })}

          <div className="flex justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-sm font-semibold text-slate-700">{filteredSales.length} venda{filteredSales.length !== 1 ? "s" : ""}</span>
            <span className="text-sm font-semibold text-slate-950">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Nenhuma venda encontrada"
          description={hasActiveFilters ? "Tente ajustar os filtros ou a busca." : "Registre uma nova venda clicando em Nova venda."}
        />
      )}
    </div>
  );
}
