import type { Route } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requireRole } from "@/server/auth/session";
import { getParam } from "@/server/search-params";
import { billingService } from "@/server/services/billing-service";
import type { FinancialStatus } from "@/types";

const STATUS_OPTIONS: Array<{ value: FinancialStatus | ""; label: string }> = [
  { value: "", label: "Todos os status" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "FATURADO", label: "Faturado" },
  { value: "PAGO", label: "Pago" },
  { value: "CANCELADO", label: "Cancelado" }
];

const statusBadge: Record<FinancialStatus, { label: string; className: string }> = {
  PENDENTE:   { label: "Pendente",    className: "bg-slate-100 text-slate-700" },
  EM_ANALISE: { label: "Pendente de cobrança", className: "bg-amber-100 text-amber-800" },
  APROVADO:   { label: "Pendente de cobrança", className: "bg-amber-100 text-amber-800" },
  FATURADO:   { label: "Faturado",    className: "bg-violet-100 text-violet-700" },
  PAGO:       { label: "Pago",        className: "bg-green-100 text-green-800 font-semibold" },
  CANCELADO:  { label: "Cancelado",   className: "bg-rose-100 text-rose-700" }
};

const billingTypeLabel: Record<string, string> = {
  AVULSO: "Avulso",
  CONTRATO: "Contrato",
  GARANTIA: "Garantia",
  CORTESIA: "Cortesia"
};

function isOverdue(invoiceDueDate?: string) {
  if (!invoiceDueDate) return false;
  return new Date(invoiceDueDate) < new Date();
}

export default async function CobrancasPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["ADMIN", "ATTENDANT"]);
  const params = await searchParams;
  const statusParam = getParam(params.status) ?? "";
  const from = getParam(params.from) ?? "";
  const to = getParam(params.to) ?? "";

  const billings = await billingService.listBillings({
    financialStatus: (statusParam as FinancialStatus) || undefined,
    from: from || undefined,
    to: to || undefined
  });

  const totalAmount = billings.reduce((sum, b) => sum + b.totalAmount, 0);
  const pendingCount = billings.filter((b) => ["PENDENTE", "EM_ANALISE", "APROVADO", "FATURADO"].includes(b.financialStatus)).length;
  const overdueCount = billings.filter(
    (b) => b.financialStatus === "FATURADO" && isOverdue(b.invoiceDueDate)
  ).length;

  const hasPeriodFilter = from || to;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cobranças"
        description="Lista de todos os chamados com financeiro registrado."
        action={
          hasPeriodFilter ? (
            <Link href="/financeiro/cobrancas" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
              Limpar período
            </Link>
          ) : null
        }
      />

      {/* Filtros */}
      <form action="/financeiro/cobrancas">
        <Card>
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            <div className="grid gap-1">
              <label className="text-xs font-semibold text-slate-600">De</label>
              <Input name="from" type="date" defaultValue={from} className="w-40" />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-semibold text-slate-600">Até</label>
              <Input name="to" type="date" defaultValue={to} className="w-40" />
            </div>
            {/* Preserva o status ao submeter datas */}
            {statusParam ? <input type="hidden" name="status" value={statusParam} /> : null}
            <Button type="submit" variant="secondary">Filtrar período</Button>
          </CardContent>
        </Card>
      </form>

      {/* Filtro por status (pill buttons) */}
      <form action="/financeiro/cobrancas" className="flex flex-wrap gap-2">
        {/* Preserva as datas ao trocar status */}
        {from ? <input type="hidden" name="from" value={from} /> : null}
        {to ? <input type="hidden" name="to" value={to} /> : null}
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

      {/* Métricas rápidas */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Total no filtro</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{billings.length}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-5">
            <p className="text-sm text-amber-700">Pendentes de recebimento</p>
            <p className="mt-2 text-3xl font-semibold text-amber-950">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className={overdueCount > 0 ? "border-rose-200 bg-rose-50/50" : "border-slate-200"}>
          <CardContent className="p-5">
            <p className={`text-sm ${overdueCount > 0 ? "text-rose-700" : "text-slate-600"}`}>Vencidas sem pagamento</p>
            <p className={`mt-2 text-3xl font-semibold ${overdueCount > 0 ? "text-rose-950" : "text-slate-950"}`}>{overdueCount}</p>
          </CardContent>
        </Card>
      </section>

      {/* Lista */}
      {billings.length > 0 ? (
        <div className="space-y-3">
          {/* Cabeçalho (desktop) */}
          <div className="hidden grid-cols-[2fr_1.2fr_1fr_1fr_1fr_auto] gap-4 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
            <span>Chamado / Cliente</span>
            <span>Tipo</span>
            <span>Status</span>
            <span>Vencimento</span>
            <span className="text-right">Total</span>
            <span />
          </div>

          {billings.map((billing) => {
            const badge = statusBadge[billing.financialStatus];
            const overdue = billing.financialStatus === "FATURADO" && isOverdue(billing.invoiceDueDate);

            return (
              <Link
                key={billing.id}
                href={`/chamados/${billing.ticketId}/financeiro` as Route}
                className={`block rounded-xl border p-4 transition-colors hover:bg-slate-50 ${
                  overdue ? "border-rose-200 bg-rose-50/30 hover:bg-rose-50" : "border-slate-200 bg-white"
                }`}
              >
                {/* Mobile layout */}
                <div className="lg:hidden space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{billing.ticketNumber}</p>
                      <p className="mt-0.5 font-semibold text-slate-950">{billing.ticketTitle}</p>
                      <p className="text-sm text-slate-600">{billing.clientName}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{billingTypeLabel[billing.billingType]}</span>
                    <span className="font-semibold text-slate-950">{formatCurrency(billing.totalAmount)}</span>
                  </div>
                  {billing.invoiceDueDate && (
                    <p className={`text-xs ${overdue ? "font-semibold text-rose-700" : "text-slate-500"}`}>
                      Vencimento: {new Date(billing.invoiceDueDate).toLocaleDateString("pt-BR")}
                      {overdue ? " — VENCIDO" : ""}
                    </p>
                  )}
                </div>

                {/* Desktop layout */}
                <div className="hidden grid-cols-[2fr_1.2fr_1fr_1fr_1fr_auto] items-center gap-4 lg:grid">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{billing.ticketNumber}</p>
                    <p className="mt-0.5 font-semibold text-slate-950 leading-tight">{billing.ticketTitle}</p>
                    <p className="text-sm text-slate-600">{billing.clientName}</p>
                  </div>
                  <span className="text-sm text-slate-700">{billingTypeLabel[billing.billingType]}</span>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                    {badge.label}
                  </span>
                  <span className={`text-sm ${overdue ? "font-semibold text-rose-700" : "text-slate-600"}`}>
                    {billing.invoiceDueDate
                      ? new Date(billing.invoiceDueDate).toLocaleDateString("pt-BR")
                      : "—"}
                    {overdue ? " ⚠" : ""}
                  </span>
                  <span className="text-right font-semibold text-slate-950">{formatCurrency(billing.totalAmount)}</span>
                  <span className="text-xs text-slate-400 text-right whitespace-nowrap">
                    {billing.entryCount} lanç.
                  </span>
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
        <EmptyState
          title="Nenhuma cobrança encontrada"
          description="Não há registros financeiros para o filtro selecionado."
        />
      )}
    </div>
  );
}
