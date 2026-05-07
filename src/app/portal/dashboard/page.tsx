import type { Route } from "next";
import Link from "next/link";
import { Receipt, ShoppingBag, Ticket, Wallet } from "lucide-react";

import { PortalDocumentList } from "@/components/portal/portal-document-list";
import { PortalPaymentInstructions } from "@/components/portal/portal-payment-instructions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { financialStatusClass, financialStatusLabel, portalTicketStatusClass, portalTicketStatusLabel } from "@/lib/portal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requirePortalUser } from "@/server/auth/session";
import { portalService } from "@/server/services/portal-service";

export default async function PortalDashboardPage() {
  const user = await requirePortalUser();
  const dashboard = await portalService.getDashboard(user.clientId);

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{dashboard.client?.name ?? "Portal do cliente"}</h1>
          <p className="mt-2 text-sm text-slate-500">Visão consolidada de atendimento, financeiro, vendas e documentos.</p>
        </div>
        <Link
          href={"/portal/chamados/novo" as Route}
          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700 sm:w-auto"
        >
          Abrir novo chamado
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Pendências financeiras",
            value: formatCurrency(dashboard.summary.pendingAmount),
            detail: `${dashboard.summary.pendingCount} lançamento(s) em aberto`,
            icon: Wallet,
            color: "text-amber-700"
          },
          {
            label: "Pagamentos confirmados",
            value: formatCurrency(dashboard.summary.paidAmount),
            detail: `${dashboard.summary.paidCount} lançamento(s) pagos`,
            icon: Receipt,
            color: "text-emerald-700"
          },
          {
            label: "Chamados em andamento",
            value: String(dashboard.summary.openTickets),
            detail: "Acompanhamento operacional",
            icon: Ticket,
            color: "text-sky-700"
          },
          {
            label: "Vendas registradas",
            value: String(dashboard.summary.salesCount),
            detail: "Histórico comercial no portal",
            icon: ShoppingBag,
            color: "text-slate-600"
          }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <Icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-950">{item.value}</p>
                <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Valores vencidos</p>
          <p className="mt-2 text-2xl font-semibold text-amber-950">{formatCurrency(dashboard.summary.overdueAmount)}</p>
          <p className="mt-1 text-sm text-amber-700">Cobranças faturadas aguardando confirmação.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Documentos disponíveis</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{dashboard.summary.documentCount}</p>
          <p className="mt-1 text-sm text-slate-500">Notas fiscais e documentos.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contato principal</p>
          <p className="mt-2 font-semibold text-slate-950">{dashboard.client?.contactName ?? user.name}</p>
          <p className="mt-1 text-sm text-slate-500">{dashboard.client?.email ?? user.email}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Movimentações financeiras</CardTitle>
                <p className="mt-1 text-sm text-slate-500">Chamados e vendas com situação financeira recente.</p>
              </div>
              <Link href={"/portal/financeiro" as Route} className="shrink-0 text-sm font-semibold text-sky-700 hover:text-sky-800">
                Ver tudo
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.financialRecords.slice(0, 5).map((record) => (
              <div key={`${record.kind}-${record.id}`} className="rounded-2xl border border-slate-200 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {record.kind === "ticket" ? "Chamado" : "Venda"} · {record.number}
                    </p>
                    <p className="mt-0.5 truncate font-medium text-slate-950">{record.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
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
              </div>
            ))}
            {dashboard.financialRecords.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">Nenhuma movimentação ainda.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Chamados recentes</CardTitle>
                <p className="mt-1 text-sm text-slate-500">Últimas interações operacionais registradas.</p>
              </div>
              <Link href={"/portal/chamados" as Route} className="shrink-0 text-sm font-semibold text-sky-700 hover:text-sky-800">
                Ver chamados
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.recentTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/portal/chamados/${ticket.id}` as Route}
                className="block rounded-2xl border border-slate-200 p-3 transition-colors hover:border-sky-200 hover:bg-sky-50/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{ticket.number}</p>
                    <p className="mt-0.5 truncate font-medium text-slate-950">{ticket.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">Atualizado em {formatDate(ticket.updatedAt)}</p>
                  </div>
                  <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${portalTicketStatusClass[ticket.status]}`}>
                    {portalTicketStatusLabel[ticket.status]}
                  </span>
                </div>
              </Link>
            ))}
            {dashboard.recentTickets.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">Nenhum chamado ainda.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Dados para pagamento</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Use estas informações para quitar cobranças.</p>
          </CardHeader>
          <CardContent>
            <PortalPaymentInstructions instructions={dashboard.paymentInstructions} />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Documentos recentes</CardTitle>
                <p className="mt-1 text-sm text-slate-500">Notas e comprovantes liberados.</p>
              </div>
              <Link href={"/portal/documentos" as Route} className="shrink-0 text-sm font-semibold text-sky-700 hover:text-sky-800">
                Ver documentos
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <PortalDocumentList documents={dashboard.recentDocuments} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
