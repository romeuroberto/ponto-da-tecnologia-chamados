import type { Route } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  EM_ANALISE: { label: "Em análise", className: "bg-blue-100 text-blue-700" },
  APROVADO:   { label: "Aprovado",   className: "bg-emerald-100 text-emerald-700" },
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

  const sales = await saleService.listSales({ financialStatus: (statusParam as FinancialStatus) || undefined });

  const totalAmount = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const pendingCount = sales.filter((s) => s.financialStatus === "PENDENTE").length;
  const paidAmount = sales.filter((s) => s.financialStatus === "PAGO").reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendas"
        description="Registro de vendas de peças e produtos para clientes."
        action={
          <Link href={"/vendas/nova" as Route}>
            <Button>Nova venda</Button>
          </Link>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Total no filtro</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{sales.length}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-5">
            <p className="text-sm text-amber-700">Aguardando pagamento</p>
            <p className="mt-2 text-3xl font-semibold text-amber-950">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-5">
            <p className="text-sm text-emerald-700">Total recebido</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-950">{formatCurrency(paidAmount)}</p>
          </CardContent>
        </Card>
      </section>

      <form action="/vendas" className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="submit"
            name="status"
            value={opt.value}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
              statusParam === opt.value
                ? "border-sky-600 bg-sky-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </form>

      {sales.length > 0 ? (
        <div className="space-y-3">
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
            <span>Venda / Cliente</span>
            <span>Data</span>
            <span>Status</span>
            <span className="text-right">Total</span>
            <span />
          </div>

          {sales.map((sale) => {
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
                    <p className="mt-0.5 font-semibold text-slate-900 leading-tight">{sale.clientName}</p>
                    <p className="text-xs text-slate-500">{sale.items.length} item(s)</p>
                  </div>
                  <span className="text-sm text-slate-600">{formatDate(sale.createdAt)}</span>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                    {badge.label}
                  </span>
                  <span className="text-right font-semibold text-slate-950">{formatCurrency(sale.totalAmount)}</span>
                  <span className="text-xs text-slate-400 text-right">{sale.createdByName}</span>
                </div>
              </Link>
            );
          })}

          <div className="flex justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-sm font-semibold text-slate-700">Total geral</span>
            <span className="text-sm font-semibold text-slate-950">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      ) : (
        <EmptyState title="Nenhuma venda encontrada" description="Registre uma nova venda clicando em Nova venda." />
      )}
    </div>
  );
}
