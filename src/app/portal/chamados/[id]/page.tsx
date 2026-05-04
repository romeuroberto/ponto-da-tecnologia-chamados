import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PortalCommentForm } from "@/components/portal/portal-comment-form";
import { PortalDocumentList } from "@/components/portal/portal-document-list";
import { PortalPaymentInstructions } from "@/components/portal/portal-payment-instructions";
import { financialStatusClass, financialStatusLabel, portalTicketStatusClass, portalTicketStatusLabel } from "@/lib/portal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requirePortalUser } from "@/server/auth/session";
import { portalService } from "@/server/services/portal-service";

export default async function PortalTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePortalUser();
  const { id } = await params;

  const data = await portalService.getTicketDetail(user.clientId, id);

  if (!data) {
    notFound();
  }

  const { ticket, documents, paymentInstructions } = data;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link href={"/portal/chamados" as Route} className="text-sm font-semibold text-sky-700 hover:text-sky-800">
          ← Meus chamados
        </Link>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{ticket.number}</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">{ticket.title}</h1>
          </div>
          <span className={`shrink-0 rounded-full border px-3 py-1 text-sm font-semibold ${portalTicketStatusClass[ticket.status]}`}>
            {portalTicketStatusLabel[ticket.status]}
          </span>
        </div>

        <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600">{ticket.description}</p>

        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Aberto em</p>
            <p className="mt-0.5 text-slate-700">{formatDate(ticket.createdAt)}</p>
          </div>
          {ticket.assigneeName ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Responsável</p>
              <p className="mt-0.5 text-slate-700">{ticket.assigneeName}</p>
            </div>
          ) : null}
          {ticket.resolvedAt ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Resolvido em</p>
              <p className="mt-0.5 text-slate-700">{formatDate(ticket.resolvedAt)}</p>
            </div>
          ) : null}
        </div>
      </div>

      {ticket.billing ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Resumo financeiro deste chamado</h2>
              <p className="mt-1 text-sm text-slate-500">Visualização transparente da cobrança vinculada a este atendimento.</p>
            </div>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${financialStatusClass[ticket.billing.financialStatus]}`}>
              {financialStatusLabel[ticket.billing.financialStatus]}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Subtotal</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(ticket.billing.subtotalAmount)}</p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Desconto</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(ticket.billing.discountAmount)}</p>
            </div>
            <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50 p-5">
              <p className="text-sm text-sky-700">Total</p>
              <p className="mt-2 text-2xl font-semibold text-sky-950">{formatCurrency(ticket.billing.totalAmount)}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {ticket.billing.invoiceNumber ? (
              <div className="rounded-[1.5rem] border border-slate-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Referência</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{ticket.billing.invoiceNumber}</p>
              </div>
            ) : null}
            {ticket.billing.invoiceDueDate ? (
              <div className="rounded-[1.5rem] border border-slate-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Vencimento</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{formatDate(ticket.billing.invoiceDueDate)}</p>
              </div>
            ) : null}
            {ticket.billing.paymentMethod ? (
              <div className="rounded-[1.5rem] border border-slate-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Forma de pagamento</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{ticket.billing.paymentMethod}</p>
              </div>
            ) : null}
            {ticket.billing.paymentReference ? (
              <div className="rounded-[1.5rem] border border-slate-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Referência do pagamento</p>
                <p className="mt-2 break-all text-sm font-semibold text-slate-950">{ticket.billing.paymentReference}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {ticket.billing ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Como pagar</h2>
          <p className="mt-1 text-sm text-slate-500">Quando aplicável, use qualquer uma das opções abaixo para efetuar o pagamento.</p>
          <div className="mt-6">
            <PortalPaymentInstructions instructions={paymentInstructions} />
          </div>
        </div>
      ) : null}

      {documents.length > 0 ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Documentos relacionados</h2>
          <p className="mt-1 text-sm text-slate-500">Notas fiscais e demais documentos liberados para este chamado.</p>
          <div className="mt-6">
            <PortalDocumentList documents={documents} />
          </div>
        </div>
      ) : null}

      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">Histórico</h2>
        {ticket.history.length > 0 ? (
          <div className="mt-6 space-y-4">
            {ticket.history.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-300" />
                <div>
                  <p className="text-sm text-slate-700">{item.message}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {item.authorName} · {formatDate(item.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Sem histórico ainda.</p>
        )}
      </div>

      {ticket.status !== "CLOSED" && ticket.status !== "CANCELED" ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Enviar mensagem</h2>
          <p className="mt-1 text-sm text-slate-500">Use este campo para complementar informações ou responder ao time.</p>
          <div className="mt-6">
            <PortalCommentForm ticketId={ticket.id} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
