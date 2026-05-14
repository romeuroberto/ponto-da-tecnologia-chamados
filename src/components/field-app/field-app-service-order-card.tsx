"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import type { ServiceOrder } from "@/types";

const statusLabel = {
  PLANNED: "Planejada",
  IN_EXECUTION: "Em execução",
  PAUSED: "Pausada",
  COMPLETED: "Concluída",
  CANCELED: "Cancelada"
} as const;

const statusTone = {
  PLANNED: "bg-slate-100 text-slate-700",
  IN_EXECUTION: "bg-sky-100 text-sky-700",
  PAUSED: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELED: "bg-rose-100 text-rose-700"
} as const;

export function FieldAppServiceOrderCard({
  ticketId,
  serviceOrder,
  currentUserId
}: {
  ticketId: string;
  serviceOrder: ServiceOrder;
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(serviceOrder.executionNotes ?? "");
  const [approvalName, setApprovalName] = useState(serviceOrder.customerApprovalName ?? "");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isAssignedToTechnician = Boolean(serviceOrder.assignedTechnicianId);
  const canUpdate = serviceOrder.assignedTechnicianId === currentUserId;
  const canStart = serviceOrder.status === "PLANNED" || serviceOrder.status === "PAUSED";
  const canFinish = serviceOrder.status === "IN_EXECUTION";
  const canPause = serviceOrder.status === "IN_EXECUTION";

  function saveProgress(status: "PLANNED" | "IN_EXECUTION" | "PAUSED" | "COMPLETED") {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/tickets/${ticketId}/service-orders/${serviceOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          executionNotes: notes,
          customerApprovalName: approvalName,
          customerApprovalAt: status === "COMPLETED" && approvalName.trim() ? new Date().toISOString() : ""
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: result.message ?? "Não foi possível atualizar a ordem de serviço." });
        return;
      }

      setMessage({ type: "success", text: "Ordem de serviço atualizada com sucesso." });
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-950">{serviceOrder.number}</p>
          <p className="mt-1 text-sm text-slate-600">{serviceOrder.serviceType ?? "Serviço sem tipo definido"}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone[serviceOrder.status]}`}>
          {statusLabel[serviceOrder.status]}
        </span>
      </div>

      <div className="mt-4 grid gap-2 rounded-2xl bg-white p-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Técnico</span>
          <span className="font-medium text-slate-900">{serviceOrder.assignedTechnicianName ?? "Não atribuído"}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Agendada</span>
          <span className="font-medium text-slate-900">{serviceOrder.scheduledStartAt ? formatDate(serviceOrder.scheduledStartAt) : "Sem agendamento"}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Início</span>
          <span className="font-medium text-slate-900">{serviceOrder.startedAt ? formatDate(serviceOrder.startedAt) : "Não iniciado"}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Fim</span>
          <span className="font-medium text-slate-900">{serviceOrder.finishedAt ? formatDate(serviceOrder.finishedAt) : "Em aberto"}</span>
        </div>
      </div>

      {message ? <div className="mt-4"><FormMessage type={message.type} message={message.text} /></div> : null}

      {isAssignedToTechnician ? (
        <div className="mt-4 space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Anotações de execução</p>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Descreva o andamento, diagnóstico ou o que foi executado."
              disabled={isPending || !canUpdate || serviceOrder.status === "COMPLETED" || serviceOrder.status === "CANCELED"}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Aprovação do cliente</p>
            <Textarea
              value={approvalName}
              onChange={(event) => setApprovalName(event.target.value)}
              placeholder="Nome de quem aprovou ou recebeu o atendimento."
              disabled={isPending || !canUpdate || serviceOrder.status === "CANCELED"}
            />
          </div>

          {!canUpdate ? (
            <p className="text-sm text-slate-500">Esta OS está atribuída a outro técnico e fica em modo somente leitura para você.</p>
          ) : (
            <div className="grid gap-2">
              {canStart ? (
              <Button type="button" disabled={isPending} onClick={() => saveProgress("IN_EXECUTION")}>
                {isPending ? "Salvando..." : serviceOrder.status === "PAUSED" ? "Retomar OS" : "Iniciar OS"}
              </Button>
              ) : null}
              {canPause ? (
              <Button type="button" variant="outline" disabled={isPending} onClick={() => saveProgress("PAUSED")}>
                {isPending ? "Salvando..." : "Pausar OS"}
              </Button>
              ) : null}
              {canFinish ? (
              <Button type="button" variant="outline" disabled={isPending} onClick={() => saveProgress("COMPLETED")}>
                {isPending ? "Salvando..." : "Concluir OS"}
              </Button>
              ) : null}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Esta OS ainda não está atribuída a um técnico específico.</p>
      )}

      {serviceOrder.parts.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Materiais vinculados</p>
          {serviceOrder.parts.map((part) => (
            <div key={part.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <p className="font-medium text-slate-900">
                {part.partName}
                {part.partCode ? ` (${part.partCode})` : ""}
              </p>
              <p className="mt-1 text-slate-600">Quantidade: {part.quantity}</p>
              {part.notes ? <p className="mt-1 text-slate-600">{part.notes}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
