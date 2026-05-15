import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleAlert, Clock3, MessageSquareMore } from "lucide-react";

import { PortalCommentForm } from "@/components/portal/portal-comment-form";
import { PortalDocumentList } from "@/components/portal/portal-document-list";
import { PortalPaymentInstructions } from "@/components/portal/portal-payment-instructions";
import {
  financialStatusClass,
  financialStatusLabel,
  portalPriorityLabel,
  portalTicketStatusClass,
  portalTicketStatusLabel
} from "@/lib/portal";
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

  const customerActionMessage =
    ticket.status === "WAITING_CUSTOMER"
      ? "Nosso time aguarda seu retorno para continuar o atendimento."
      : ticket.status === "WAITING_PARTS"
        ? "O atendimento está pausado aguardando a chegada de peças ou materiais."
        : ticket.status === "IN_PROGRESS"
          ? "Seu chamado está em atendimento neste momento."
          : ticket.status === "OPEN"
            ? "Recebemos sua solicitação e ela está entrando em triagem."
            : ticket.status === "CLOSED"
              ? "Este atendimento já foi concluído."
              : "Este chamado foi encerrado sem continuidade.";

  const StatusIcon =
    ticket.status === "WAITING_CUSTOMER"
      ? MessageSquareMore
      : ticket.status === "OPEN" || ticket.status === "IN_PROGRESS"
        ? Clock3
        : CircleAlert;
  const currentUserName = user.name?.trim().toLocaleLowerCase("pt-BR");

  return (
    <div className="space-y-5 pb-40">
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

        <div className="mt-4 rounded-[1.4rem] border border-sky-100 bg-sky-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <StatusIcon className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
            <div>
              <p className="text-sm font-semibold text-sky-950">Situação atual</p>
              <p className="mt-1 text-sm leading-6 text-sky-800">{customerActionMessage}</p>
            </div>
          </div>
        </div>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{ticket.description}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Aberto em</p>
            <p className="mt-1 font-semibold text-slate-900">{formatDate(ticket.createdAt)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Responsável</p>
            <p className="mt-1 font-semibold text-slate-900">{ticket.assigneeName ?? "Em definição"}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Última atualização</p>
            <p className="mt-1 font-semibold text-slate-900">{formatDate(ticket.updatedAt)}</p>
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
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Conversa do chamado</h2>
            <p className="mt-1 text-sm text-slate-500">Acompanhe as mensagens trocadas com nosso time.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {ticket.history.length} mensagem(ns)
          </span>
        </div>
        {ticket.history.length > 0 ? (
          <div className="mt-5 space-y-3">
            {ticket.history.map((item) => {
              const isCurrentUser = item.authorName.trim().toLocaleLowerCase("pt-BR") === currentUserName;

              return (
                <div key={item.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[88%] rounded-[1.4rem] px-4 py-3 shadow-sm ${
                      isCurrentUser ? "bg-sky-600 text-white" : "border border-slate-200 bg-slate-50 text-slate-800"
                    }`}
                  >
                    <p className={`text-xs font-semibold ${isCurrentUser ? "text-sky-100" : "text-slate-500"}`}>
                      {isCurrentUser ? "Você" : item.authorName}
                    </p>
                    <p className={`mt-1 text-sm leading-6 ${isCurrentUser ? "text-white" : "text-slate-700"}`}>{item.message}</p>
                    <p className={`mt-2 text-[11px] ${isCurrentUser ? "text-sky-100" : "text-slate-400"}`}>{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Ainda não houve troca de mensagens neste chamado.</p>
        )}
      </section>

      {ticket.status !== "CLOSED" && ticket.status !== "CANCELED" ? (
        <section className="sticky bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-20 -mx-1 rounded-[1.9rem] border border-slate-200/90 bg-white/92 p-4 shadow-[0_-10px_30px_-24px_rgba(15,23,42,0.55)] backdrop-blur">
          <h2 className="text-lg font-semibold text-slate-950">Responder ao atendimento</h2>
          <p className="mt-1 text-sm text-slate-500">Envie uma nova mensagem sem sair da conversa.</p>
          <div className="mt-3">
            <PortalCommentForm ticketId={ticket.id} variant="chat-sticky" />
          </div>
        </section>
      ) : null}
    </div>
  );
}
