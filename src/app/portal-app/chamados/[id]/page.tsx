import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PortalCommentForm } from "@/components/portal/portal-comment-form";
import { PortalDocumentList } from "@/components/portal/portal-document-list";
import { PortalPaymentInstructions } from "@/components/portal/portal-payment-instructions";
import { financialStatusClass, financialStatusLabel, portalPriorityLabel, portalTicketStatusClass, portalTicketStatusLabel } from "@/lib/portal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requirePortalUser } from "@/server/auth/session";
import { portalService } from "@/server/services/portal-service";

export default async function PortalAppTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePortalUser();
  const { id } = await params;
  const data = await portalService.getTicketDetail(user.clientId, id);

  if (!data) {
    notFound();
  }

  const { ticket, documents, paymentInstructions } = data;

  return (
    <div className="space-y-5">
      <Link href={"/portal-app/chamados" as Route} className="inline-flex text-sm font-semibold text-sky-700">
        ← Voltar para chamados
      </Link>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${portalTicketStatusClass[ticket.status]}`}>
            {portalTicketStatusLabel[ticket.status]}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {portalPriorityLabel[ticket.priority]}
          </span>
        </div>

        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{ticket.number}</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">{ticket.title}</h1>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{ticket.description}</p>

        <div className="mt-5 grid gap-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Aberto em</p>
            <p className="mt-1 font-semibold text-slate-900">{formatDate(ticket.createdAt)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Responsável</p>
            <p className="mt-1 font-semibold text-slate-900">{ticket.assigneeName ?? "Em definição"}</p>
          </div>
          {ticket.resolvedAt ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Resolvido em</p>
              <p className="mt-1 font-semibold text-slate-900">{formatDate(ticket.resolvedAt)}</p>
            </div>
          ) : null}
        </div>
      </section>

      {ticket.billing ? (
        <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Financeiro</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Resumo deste atendimento</h2>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${financialStatusClass[ticket.billing.financialStatus]}`}>
              {financialStatusLabel[ticket.billing.financialStatus]}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Subtotal</p>
              <p className="mt-1 font-semibold text-slate-950">{formatCurrency(ticket.billing.subtotalAmount)}</p>
            </div>
            <div className="rounded-2xl bg-sky-50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-sky-700">Total</p>
              <p className="mt-1 font-semibold text-sky-950">{formatCurrency(ticket.billing.totalAmount)}</p>
            </div>
          </div>

          <div className="mt-4">
            <PortalPaymentInstructions instructions={paymentInstructions} />
          </div>
        </section>
      ) : null}

      {documents.length > 0 ? (
        <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Documentos</h2>
          <div className="mt-4">
            <PortalDocumentList documents={documents} />
          </div>
        </section>
      ) : null}

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Histórico</h2>
        {ticket.history.length > 0 ? (
          <div className="mt-4 space-y-3">
            {ticket.history.map((item) => (
              <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-sm leading-6 text-slate-700">{item.message}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {item.authorName} • {formatDate(item.createdAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Sem histórico ainda.</p>
        )}
      </section>

      {ticket.status !== "CLOSED" && ticket.status !== "CANCELED" ? (
        <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Enviar mensagem</h2>
          <p className="mt-1 text-sm text-slate-500">Use este campo para complementar informações do atendimento.</p>
          <div className="mt-4">
            <PortalCommentForm ticketId={ticket.id} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
