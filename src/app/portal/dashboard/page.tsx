import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, Receipt, ShoppingBag, Ticket, Wallet } from "lucide-react";

import { PortalDocumentList } from "@/components/portal/portal-document-list";
import { PortalPaymentInstructions } from "@/components/portal/portal-payment-instructions";
import { financialStatusClass, financialStatusLabel, portalTicketStatusClass, portalTicketStatusLabel } from "@/lib/portal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requirePortalUser } from "@/server/auth/session";
import { portalService } from "@/server/services/portal-service";

export default async function PortalDashboardPage() {
  const user = await requirePortalUser();
  const dashboard = await portalService.getDashboard(user.clientId);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,_#0f172a_0%,_#1d4ed8_55%,_#38bdf8_100%)] p-8 text-white shadow-[0_30px_120px_-48px_rgba(15,23,42,0.55)]">
        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-100">Área do cliente</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight lg:text-4xl">{dashboard.client?.name ?? "Portal do cliente"}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-sky-50/90">
              Centralize o relacionamento com nossa equipe: abra novos chamados, acompanhe o suporte, visualize vendas,
              confira o financeiro e acesse documentos sempre que precisar.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={"/portal/chamados/novo" as Route}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5"
              >
                Abrir novo chamado
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={"/portal/financeiro" as Route}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Ver financeiro
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                label: "Pendências financeiras",
                value: formatCurrency(dashboard.summary.pendingAmount),
                detail: `${dashboard.summary.pendingCount} lançamento(s) em aberto`,
                icon: Wallet
              },
              {
                label: "Pagamentos confirmados",
                value: formatCurrency(dashboard.summary.paidAmount),
                detail: `${dashboard.summary.paidCount} lançamento(s) pagos`,
                icon: Receipt
              },
              {
                label: "Chamados em andamento",
                value: String(dashboard.summary.openTickets),
                detail: "Acompanhamento operacional",
                icon: Ticket
              },
              {
                label: "Vendas registradas",
                value: String(dashboard.summary.salesCount),
                detail: "Histórico comercial no portal",
                icon: ShoppingBag
              }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-[1.75rem] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-sky-50/90">{item.label}</p>
                    <Icon className="h-5 w-5 text-sky-100" />
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-white">{item.value}</p>
                  <p className="mt-2 text-sm text-sky-100/80">{item.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm font-semibold text-amber-900">Valores vencidos</p>
          <p className="mt-3 text-3xl font-semibold text-amber-950">{formatCurrency(dashboard.summary.overdueAmount)}</p>
          <p className="mt-2 text-sm text-amber-800">Cobranças já faturadas e aguardando confirmação.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Documentos disponíveis</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{dashboard.summary.documentCount}</p>
          <p className="mt-2 text-sm text-slate-600">Notas fiscais e documentos relacionados às suas cobranças.</p>
        </div>
        <div className="rounded-[2rem] border border-sky-200 bg-sky-50 p-6">
          <p className="text-sm font-semibold text-sky-900">Contato principal</p>
          <p className="mt-3 text-lg font-semibold text-sky-950">{dashboard.client?.contactName ?? user.name}</p>
          <p className="mt-2 text-sm text-sky-800">{dashboard.client?.email ?? user.email}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Movimentações financeiras</h2>
              <p className="mt-1 text-sm text-slate-500">Chamados e vendas com situação financeira recente.</p>
            </div>
            <Link href={"/portal/financeiro" as Route} className="text-sm font-semibold text-sky-700 hover:text-sky-800">
              Ver tudo
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {dashboard.financialRecords.slice(0, 6).map((record) => (
              <div key={`${record.kind}-${record.id}`} className="rounded-[1.5rem] border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      {record.kind === "ticket" ? "Chamado" : "Venda"} · {record.number}
                    </p>
                    <p className="mt-1 font-semibold text-slate-950">{record.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Atualizado em {formatDate(record.createdAt)}
                      {record.documentCount > 0 ? ` · ${record.documentCount} documento(s)` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${financialStatusClass[record.status]}`}>
                      {financialStatusLabel[record.status]}
                    </span>
                    <p className="mt-3 text-sm font-semibold text-slate-950">{formatCurrency(record.totalAmount)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Chamados recentes</h2>
              <p className="mt-1 text-sm text-slate-500">Últimas interações operacionais registradas no portal.</p>
            </div>
            <Link href={"/portal/chamados" as Route} className="text-sm font-semibold text-sky-700 hover:text-sky-800">
              Ver chamados
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {dashboard.recentTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/portal/chamados/${ticket.id}` as Route}
                className="block rounded-[1.5rem] border border-slate-200 p-4 transition-colors hover:border-sky-200 hover:bg-sky-50/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{ticket.number}</p>
                    <p className="mt-1 font-semibold text-slate-950">{ticket.title}</p>
                    <p className="mt-1 text-sm text-slate-500">Atualizado em {formatDate(ticket.updatedAt)}</p>
                  </div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${portalTicketStatusClass[ticket.status]}`}>
                    {portalTicketStatusLabel[ticket.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Dados para pagamento</h2>
          <p className="mt-1 text-sm text-slate-500">Use estas informações para quitar cobranças quando necessário.</p>
          <div className="mt-6">
            <PortalPaymentInstructions instructions={dashboard.paymentInstructions} />
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Documentos recentes</h2>
              <p className="mt-1 text-sm text-slate-500">Notas e comprovantes liberados para o cliente.</p>
            </div>
            <Link href={"/portal/documentos" as Route} className="text-sm font-semibold text-sky-700 hover:text-sky-800">
              Ver documentos
            </Link>
          </div>
          <div className="mt-6">
            <PortalDocumentList documents={dashboard.recentDocuments} />
          </div>
        </div>
      </section>
    </div>
  );
}
