import type { Route } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { GenerateBillingForm, PayBillingButton } from "@/components/rentals/rental-billing-actions";
import { RentalItemDelete } from "@/components/rentals/rental-item-delete";
import { RentalItemEditPrice } from "@/components/rentals/rental-item-edit-price";
import { RentalItemReturn } from "@/components/rentals/rental-item-return";
import { RentalStatusActions } from "@/components/rentals/rental-status-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSafeReturnPath } from "@/lib/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requireRole } from "@/server/auth/session";
import { rentalService } from "@/server/services/rental-service";
import type { FinancialStatus, RentalContractStatus } from "@/types";

const contractStatusLabel: Record<RentalContractStatus, string> = {
  RASCUNHO: "Rascunho",
  ATIVO: "Ativo",
  ENCERRADO: "Encerrado",
  EXPIRADO: "Expirado"
};

const contractStatusClass: Record<RentalContractStatus, string> = {
  RASCUNHO: "bg-slate-100 text-slate-600",
  ATIVO: "bg-emerald-100 text-emerald-800",
  ENCERRADO: "bg-rose-100 text-rose-700",
  EXPIRADO: "bg-amber-100 text-amber-700"
};

const billingStatusLabel: Record<FinancialStatus, string> = {
  PENDENTE: "Pendente",
  EM_ANALISE: "Pendente de cobrança",
  APROVADO: "Pendente de cobrança",
  FATURADO: "Faturado",
  PAGO: "Pago",
  CANCELADO: "Cancelado"
};

const billingStatusClass: Record<FinancialStatus, string> = {
  PENDENTE: "bg-amber-100 text-amber-800",
  EM_ANALISE: "bg-amber-100 text-amber-800",
  APROVADO: "bg-amber-100 text-amber-800",
  FATURADO: "bg-purple-100 text-purple-700",
  PAGO: "bg-emerald-100 text-emerald-800",
  CANCELADO: "bg-slate-100 text-slate-500"
};

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default async function RentalContractDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireRole(["ADMIN", "ATTENDANT"]);
  const isAdmin = session.role === "ADMIN";
  const { id } = await params;
  const query = await searchParams;

  const contract = await rentalService.getContract(id);
  if (!contract) notFound();

  const activeItems = contract.items.filter((i) => !i.returnedAt);
  const returnedItems = contract.items.filter((i) => i.returnedAt);
  const pendingBillings = contract.billings.filter((b) => b.financialStatus === "PENDENTE");
  const paidBillings = contract.billings.filter((b) => b.financialStatus === "PAGO");
  const totalBilled = contract.billings.filter((b) => b.financialStatus !== "CANCELADO").reduce((s, b) => s + b.amount, 0);
  const totalReceived = paidBillings.reduce((s, b) => s + b.amount, 0);
  const returnTo = getSafeReturnPath(query.returnTo, "/locacoes");
  const returnLabel = returnTo.includes("/financeiro") ? "← Voltar ao extrato" : "← Voltar para locações";

  return (
    <div className="space-y-6">
      <PageHeader
        title={contract.contractNumber}
        description={`Cliente: ${contract.clientName}`}
        action={
          <Link href={returnTo as Route} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
            {returnLabel}
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.65fr]">

        {/* ── Left column ─── */}
        <div className="space-y-6">

          {/* Active equipment */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Equipamentos locados ({activeItems.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {activeItems.length === 0 ? (
                <p className="px-6 py-6 text-sm text-slate-400">Nenhum equipamento ativo neste contrato.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1.5fr] gap-3 bg-slate-50 px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span>Equipamento</span>
                    <span>Mensalidade</span>
                    <span>Instalação</span>
                    <span>Ação</span>
                  </div>
                  {activeItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-[2fr_1.2fr_1.2fr_1.5fr] items-center gap-3 px-6 py-3.5 text-sm">
                      <div>
                        <p className="font-medium text-slate-900">{item.equipmentModel}</p>
                        <p className="text-xs text-slate-400">{item.equipmentSerialNumber}</p>
                        {item.notes ? <p className="text-xs text-slate-400">{item.notes}</p> : null}
                      </div>
                      <div>
                        <span className="font-semibold tabular-nums">{formatCurrency(item.monthlyPrice)}</span>
                        {isAdmin && <RentalItemEditPrice item={item} />}
                      </div>
                      <span className="text-slate-500">{formatDate(item.installedAt)}</span>
                      {isAdmin ? (
                        <div className="flex items-center gap-3">
                          <RentalItemReturn item={item} />
                          <RentalItemDelete itemId={item.id} />
                        </div>
                      ) : <span />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billings */}
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-4">
              <CardTitle className="text-base">Cobranças mensais</CardTitle>
              {isAdmin && contract.status === "ATIVO" && (
                <GenerateBillingForm contractId={contract.id} suggestedAmount={contract.totalMonthlyValue} />
              )}
            </CardHeader>
            <CardContent className="p-0">
              {contract.billings.length === 0 ? (
                <p className="px-6 py-6 text-sm text-slate-400">Nenhuma cobrança gerada ainda.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1.5fr] gap-3 bg-slate-50 px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span>Período</span>
                    <span>Valor</span>
                    <span>Vencimento</span>
                    <span>Status</span>
                    <span>Ação</span>
                  </div>
                  {contract.billings.map((billing) => (
                    <div key={billing.id} className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1.5fr] items-center gap-3 px-6 py-3.5 text-sm">
                      <span className="font-medium text-slate-800">
                        {monthNames[billing.referenceMonth - 1]}/{billing.referenceYear}
                      </span>
                      <div>
                        <span className="font-semibold tabular-nums">{formatCurrency(billing.amount)}</span>
                        {billing.paymentMethod && (
                          <p className="text-xs text-slate-400">{billing.paymentMethod}</p>
                        )}
                      </div>
                      <span className="text-slate-500">{billing.dueDate ? formatDate(billing.dueDate) : "—"}</span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium w-fit ${billingStatusClass[billing.financialStatus]}`}>
                        {billingStatusLabel[billing.financialStatus]}
                      </span>
                      {isAdmin ? <PayBillingButton billing={billing} /> : <span />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Returned items (collapsed) */}
          {returnedItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-slate-500">Equipamentos devolvidos ({returnedItems.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {returnedItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-6 py-3 text-sm text-slate-500">
                      <div>
                        <span className="font-medium">{item.equipmentModel}</span>
                        <span className="ml-2 text-xs text-slate-400">{item.equipmentSerialNumber}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs">Devolvido em {formatDate(item.returnedAt!)}</span>
                        {isAdmin && <RentalItemDelete itemId={item.id} />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right sidebar ─── */}
        <div className="space-y-4">

          {/* Status card */}
          <Card className={contractStatusClass[contract.status].includes("emerald") ? "border-emerald-200 bg-emerald-50" : ""}>
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Status</span>
                <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${contractStatusClass[contract.status]}`}>
                  {contractStatusLabel[contract.status]}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Início</span>
                <span>{formatDate(contract.startDate)}</span>
              </div>
              {contract.endDate && (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Término</span>
                  <span>{formatDate(contract.endDate)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-slate-500">
                <span>Aviso prévio</span>
                <span>{contract.noticeDays} dias</span>
              </div>
            </CardContent>
          </Card>

          {/* Financial summary */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Financeiro</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mensalidade atual</span>
                  <span className="font-bold text-slate-900">{formatCurrency(contract.totalMonthlyValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total cobrado</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(totalBilled)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total recebido</span>
                  <span className="font-semibold text-emerald-700 tabular-nums">{formatCurrency(totalReceived)}</span>
                </div>
                {pendingBillings.length > 0 && (
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-amber-700">Em aberto</span>
                    <span className="font-semibold text-amber-700 tabular-nums">
                      {formatCurrency(pendingBillings.reduce((s, b) => s + b.amount, 0))}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contract actions */}
          {isAdmin && (
            <RentalStatusActions contract={contract} />
          )}

          {/* Meta */}
          <Card>
            <CardContent className="p-5 space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Criado em</span>
                <span className="font-medium text-slate-800">{formatDate(contract.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Criado por</span>
                <span className="font-medium text-slate-800">{contract.createdByName}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
