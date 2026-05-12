import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import { requireRole } from "@/server/auth/session";
import { getParam } from "@/server/search-params";
import { clientService } from "@/server/services/client-service";
import { billingRepository } from "@/server/repositories/billing-repository";
import { contractRepository } from "@/server/repositories/contract-repository";
import type { FinancialStatus } from "@/types";

const STATUS_OPTIONS: Array<{ value: FinancialStatus | ""; label: string }> = [
  { value: "", label: "Todos" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "EM_ANALISE", label: "Em análise" },
  { value: "APROVADO", label: "Aprovado" },
  { value: "FATURADO", label: "Faturado" },
  { value: "PAGO", label: "Pago" },
  { value: "CANCELADO", label: "Cancelado" }
];

const statusBadge: Record<FinancialStatus, { label: string; className: string }> = {
  PENDENTE:   { label: "Pendente",    className: "bg-slate-100 text-slate-700" },
  EM_ANALISE: { label: "Em análise",  className: "bg-blue-100 text-blue-700" },
  APROVADO:   { label: "Aprovado",    className: "bg-emerald-100 text-emerald-700" },
  FATURADO:   { label: "Faturado",    className: "bg-violet-100 text-violet-700" },
  PAGO:       { label: "Pago",        className: "bg-green-100 text-green-800 font-semibold" },
  CANCELADO:  { label: "Cancelado",   className: "bg-rose-100 text-rose-700" }
};

const billingTypeLabel: Record<string, string> = {
  AVULSO:   "Avulso",
  CONTRATO: "Contrato",
  GARANTIA: "Garantia",
  CORTESIA: "Cortesia"
};

function isOverdue(invoiceDueDate?: string) {
  if (!invoiceDueDate) return false;
  return new Date(invoiceDueDate) < new Date();
}

export default async function ClientFinanceiroPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["ADMIN", "ATTENDANT"]);

  const { id } = await params;
  const sp = await searchParams;
  const statusParam = getParam(sp.status) ?? "";

  const [client, allBillings, contracts, nextContractNumber] = await Promise.all([
    clientService.getClient(id),
    billingRepository.listByClient(id),
    contractRepository.findByClientId(id),
    contractRepository.nextNumber()
  ]);

  if (!client) notFound();

  const billings = statusParam
    ? allBillings.filter((b) => b.financialStatus === statusParam)
    : allBillings;

  // Métricas — calculadas sempre sobre todos os registros (sem filtro de status)
  const openStatuses: FinancialStatus[] = ["PENDENTE", "EM_ANALISE", "APROVADO", "FATURADO"];
  const totalEmAberto = allBillings
    .filter((b) => openStatuses.includes(b.financialStatus))
    .reduce((s, b) => s + b.totalAmount, 0);
  const totalPago = allBillings
    .filter((b) => b.financialStatus === "PAGO")
    .reduce((s, b) => s + b.totalAmount, 0);
  const overdueCount = allBillings.filter(
    (b) => b.financialStatus === "FATURADO" && isOverdue(b.invoiceDueDate)
  ).length;
  const pendingCount = allBillings.filter((b) => openStatuses.includes(b.financialStatus)).length;

  const activeContracts = contracts.filter((c) => c.status === "ATIVO");

  const filteredTotal = billings.reduce((s, b) => s + b.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/clientes/${id}` as Route}
          className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          ← {client.name}
        </Link>
      </div>

      <PageHeader
        title="Extrato financeiro"
        description={`Todas as cobranças de ${client.name}`}
      />

      {/* Cards de resumo */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className={totalEmAberto > 0 ? "border-amber-200 bg-amber-50/40" : "border-slate-200"}>
          <CardContent className="p-5">
            <p className="text-sm text-amber-700">Saldo em aberto</p>
            <p className="mt-1 text-2xl font-semibold text-amber-950">{formatCurrency(totalEmAberto)}</p>
            <p className="mt-1 text-xs text-amber-600">{pendingCount} cobrança{pendingCount !== 1 ? "s" : ""} pendente{pendingCount !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>

        <Card className={overdueCount > 0 ? "border-rose-200 bg-rose-50/40" : "border-slate-200"}>
          <CardContent className="p-5">
            <p className={`text-sm ${overdueCount > 0 ? "text-rose-700" : "text-slate-600"}`}>Faturas vencidas</p>
            <p className={`mt-1 text-2xl font-semibold ${overdueCount > 0 ? "text-rose-950" : "text-slate-950"}`}>{overdueCount}</p>
            <p className={`mt-1 text-xs ${overdueCount > 0 ? "text-rose-600" : "text-slate-500"}`}>
              {overdueCount > 0 ? "Requerem atenção" : "Sem vencimentos em atraso"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/40">
          <CardContent className="p-5">
            <p className="text-sm text-green-700">Total recebido</p>
            <p className="mt-1 text-2xl font-semibold text-green-950">{formatCurrency(totalPago)}</p>
            <p className="mt-1 text-xs text-green-600">
              {allBillings.filter((b) => b.financialStatus === "PAGO").length} pagamento{allBillings.filter((b) => b.financialStatus === "PAGO").length !== 1 ? "s" : ""} confirmado{allBillings.filter((b) => b.financialStatus === "PAGO").length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Contratos ativos</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{activeContracts.length}</p>
            <p className="mt-1 text-xs text-slate-500">
              {activeContracts.length > 0
                ? activeContracts.map((c) => c.contractNumber).join(", ")
                : "Nenhum contrato ativo"}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Filtro por status */}
      <form action={`/clientes/${id}/financeiro`} className="flex flex-wrap gap-2">
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

      {/* Lista de cobranças */}
      {billings.length > 0 ? (
        <div className="space-y-3">
          {/* Cabeçalho desktop */}
          <div className="hidden grid-cols-[2fr_1.2fr_1fr_1fr_1fr_auto] gap-4 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
            <span>Chamado</span>
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
                {/* Mobile */}
                <div className="lg:hidden space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{billing.ticketNumber}</p>
                      <p className="mt-0.5 font-semibold text-slate-950">{billing.ticketTitle}</p>
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

                {/* Desktop */}
                <div className="hidden grid-cols-[2fr_1.2fr_1fr_1fr_1fr_auto] items-center gap-4 lg:grid">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{billing.ticketNumber}</p>
                    <p className="mt-0.5 font-semibold text-slate-950 leading-tight">{billing.ticketTitle}</p>
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
            <span className="text-sm font-semibold text-slate-700">
              {statusParam ? `Total — ${STATUS_OPTIONS.find((o) => o.value === statusParam)?.label}` : "Total geral"}
            </span>
            <span className="text-sm font-semibold text-slate-950">{formatCurrency(filteredTotal)}</span>
          </div>
        </div>
      ) : (
        <EmptyState
          title={statusParam ? "Nenhuma cobrança com este status" : "Nenhuma cobrança registrada"}
          description={
            statusParam
              ? "Tente selecionar outro filtro de status."
              : "Este cliente ainda não possui cobranças vinculadas a chamados."
          }
        />
      )}
    </div>
  );
}
