import type { Route } from "next";
import Link from "next/link";

import { PortalDocumentList } from "@/components/portal/portal-document-list";
import { PortalPaymentInstructions } from "@/components/portal/portal-payment-instructions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { financialStatusClass, financialStatusLabel } from "@/lib/portal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requirePortalUser } from "@/server/auth/session";
import { portalService } from "@/server/services/portal-service";

export default async function PortalFinancialPage() {
  const user = await requirePortalUser();
  const { records, documents, paymentInstructions, summary } = await portalService.listFinancialRecords(user.clientId);

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Financeiro</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Resumo financeiro</h1>
        <p className="mt-2 text-sm text-slate-500">Acompanhe valores em aberto, vencimentos, recebimentos e documentos fiscais.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Em aberto</p>
          <p className="mt-2 text-2xl font-semibold text-amber-950">{formatCurrency(summary.pendingAmount)}</p>
          <p className="mt-1 text-sm text-amber-700">{summary.pendingCount} lançamento(s) aguardando.</p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Vencido</p>
          <p className="mt-2 text-2xl font-semibold text-rose-950">{formatCurrency(summary.overdueAmount)}</p>
          <p className="mt-1 text-sm text-rose-700">Cobranças sem baixa confirmada.</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Já pago</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-950">{formatCurrency(summary.paidAmount)}</p>
          <p className="mt-1 text-sm text-emerald-700">Valores recebidos e registrados.</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Lançamentos</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Cobranças, vendas, mensalidades e locações com situação financeira disponível.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {records.length > 0 ? (
            records.map((record) => {
              const href =
                record.kind === "ticket"
                  ? (`/portal/chamados/${record.id}` as Route)
                  : record.kind === "sale"
                    ? (`/portal/vendas/${record.id}` as Route)
                    : null;
              const typeLabel =
                record.kind === "ticket"
                  ? "Chamado"
                  : record.kind === "sale"
                    ? "Venda"
                    : record.kind === "monthly-billing"
                      ? "Mensalidade"
                      : "Locação";
              const content = (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {typeLabel} · {record.number}
                    </p>
                    <p className="mt-0.5 truncate font-medium text-slate-950">{record.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {record.dueDate ? `Vencimento em ${formatDate(record.dueDate)} · ` : ""}
                      {formatDate(record.createdAt)}
                      {record.documentCount > 0 ? ` · ${record.documentCount} doc.` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${financialStatusClass[record.status]}`}>
                      {financialStatusLabel[record.status]}
                    </span>
                    <p className="text-sm font-semibold text-slate-950">{formatCurrency(record.totalAmount)}</p>
                  </div>
                </div>
              );

              if (!href) {
                return (
                  <div key={`${record.kind}-${record.id}`} className="rounded-2xl border border-slate-200 p-3">
                    {content}
                  </div>
                );
              }

              return (
                <Link
                  key={`${record.kind}-${record.id}`}
                  href={href}
                  className="block rounded-2xl border border-slate-200 p-3 transition-colors hover:border-sky-200 hover:bg-sky-50/40"
                >
                  {content}
                </Link>
              );
            })
          ) : (
            <p className="py-6 text-center text-sm text-slate-500">Nenhum lançamento financeiro disponível.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Dados para pagamento</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Copie a chave Pix, QR code ou dados bancários.</p>
          </CardHeader>
          <CardContent>
            <PortalPaymentInstructions instructions={paymentInstructions} />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Documentos fiscais</CardTitle>
                <p className="mt-1 text-sm text-slate-500">Notas e documentos vinculados às cobranças.</p>
              </div>
              <Link href={"/portal/documentos" as Route} className="shrink-0 text-sm font-semibold text-sky-700 hover:text-sky-800">
                Ver todos
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <PortalDocumentList documents={documents.slice(0, 5)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
