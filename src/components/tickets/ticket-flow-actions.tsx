"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { FieldVisitCheckin } from "@/components/tickets/field-visit-checkin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getTicketFlowSummary } from "@/lib/ticket-flow";
import { formatUserWithRole, groupAssignableUsers } from "@/lib/users";
import { canCommentTicket, canEditTicketAssignment } from "@/server/auth/permissions";
import type { AppUser, Ticket } from "@/types";

const CONTRACT_CLOSE_REASON = "Encerrado sem cobrança - categoria coberta pelo contrato.";

type FlowAction = {
  label: string;
  targetStatus: Ticket["status"];
  variant: "default" | "outline";
  requiresReason: boolean;
  autoClosingReason?: string;
};

function getFlowActions(status: Ticket["status"], role: AppUser["role"], contractCoversCategory?: boolean): FlowAction[] {
  const isAttendant = role === "ATTENDANT";
  const concludeAction: FlowAction = {
    label: contractCoversCategory ? "Concluir atendimento sem cobrança" : "Concluir atendimento",
    targetStatus: "CLOSED",
    variant: "default",
    requiresReason: false,
    autoClosingReason: contractCoversCategory ? CONTRACT_CLOSE_REASON : undefined
  };

  switch (status) {
    case "OPEN":
      return [
        { label: "Iniciar atendimento", targetStatus: "IN_PROGRESS", variant: "default", requiresReason: false },
        ...(isAttendant
          ? [{ label: "Cancelar chamado", targetStatus: "CANCELED" as const, variant: "outline" as const, requiresReason: true }]
          : [])
      ];

    case "IN_PROGRESS":
      return [
        { label: "Aguardar resposta do cliente", targetStatus: "WAITING_CUSTOMER", variant: "outline", requiresReason: false },
        { label: "Aguardar peças", targetStatus: "WAITING_PARTS", variant: "outline", requiresReason: false },
        concludeAction,
        ...(isAttendant
          ? [{ label: "Cancelar chamado", targetStatus: "CANCELED" as const, variant: "outline" as const, requiresReason: true }]
          : [])
      ];

    case "WAITING_CUSTOMER":
      return [
        { label: "Retomar atendimento", targetStatus: "IN_PROGRESS", variant: "default", requiresReason: false },
        { ...concludeAction, variant: "outline" }
      ];

    case "WAITING_PARTS":
      return [
        { label: "Retomar atendimento (peças chegaram)", targetStatus: "IN_PROGRESS", variant: "default", requiresReason: false }
      ];

    case "CLOSED":
    case "CANCELED":
      return [{ label: "Reabrir chamado", targetStatus: "OPEN", variant: "outline", requiresReason: false }];

    default:
      return [];
  }
}

export function TicketFlowActions({
  ticket,
  users,
  role,
  currentUserId,
  contractCoversCategory = false
}: {
  ticket: Ticket;
  users: AppUser[];
  role: AppUser["role"];
  currentUserId?: string;
  contractCoversCategory?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [comment, setComment] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [assigneeId, setAssigneeId] = useState(ticket.assigneeId ?? "");
  const [pendingAction, setPendingAction] = useState<FlowAction | null>(null);
  const [closingReason, setClosingReason] = useState("");

  const flow = getTicketFlowSummary(ticket);
  const actions = getFlowActions(ticket.status, role, contractCoversCategory);
  const canComment = canCommentTicket(role);
  const canAssign = canEditTicketAssignment(role);
  const groupedUsers = groupAssignableUsers(users, ticket.category);

  const pendingServiceOrders = ticket.serviceOrders.filter(
    (os) => os.status !== "COMPLETED" && os.status !== "CANCELED"
  );

  function startAction(action: FlowAction) {
    setMessage(null);
    setClosingReason("");
    setPendingAction(action);
  }

  function cancelPendingAction() {
    setPendingAction(null);
    setClosingReason("");
  }

  function executeAction() {
    if (!pendingAction) return;
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: pendingAction.targetStatus,
          priority: ticket.priority,
          assigneeId: ticket.assigneeId ?? "",
          closingReason: pendingAction.requiresReason ? closingReason : (pendingAction.autoClosingReason ?? "")
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: result.message ?? "Não foi possível atualizar o chamado." });
        return;
      }

      setPendingAction(null);
      setClosingReason("");
      setMessage({ type: "success", text: "Chamado atualizado com sucesso." });
      router.refresh();
    });
  }

  function saveAssignment() {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: ticket.status,
          priority: ticket.priority,
          assigneeId,
          closingReason: ticket.closingReason ?? ""
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: result.message ?? "Não foi possível salvar a atribuição." });
        return;
      }

      setMessage({ type: "success", text: "Responsável atualizado com sucesso." });
      router.refresh();
    });
  }

  function submitComment() {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: comment })
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: result.message ?? "Não foi possível registrar o comentário." });
        return;
      }

      setComment("");
      setMessage({ type: "success", text: "Comentário adicionado ao histórico." });
      router.refresh();
    });
  }

  function submitAttachment() {
    if (!attachment) {
      setMessage({ type: "error", text: "Selecione um arquivo antes de enviar." });
      return;
    }

    setMessage(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", attachment);

      const response = await fetch(`/api/tickets/${ticket.id}/attachments`, {
        method: "POST",
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: result.message ?? "Não foi possível enviar o anexo." });
        return;
      }

      setAttachment(null);
      setMessage({ type: "success", text: "Anexo enviado com sucesso." });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {message ? <FormMessage type={message.type} message={message.text} /> : null}
      <FieldVisitCheckin ticket={ticket} role={role} currentUserId={currentUserId ?? ""} />

      <Card>
        <CardHeader>
          <CardTitle>Ações rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-950">Etapa atual: {flow.currentStageLabel}</p>
            <p className="mt-1">{flow.nextAction}</p>
          </div>

          {contractCoversCategory && (ticket.status === "IN_PROGRESS" || ticket.status === "WAITING_CUSTOMER") ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <p className="font-semibold">Coberto pelo contrato</p>
              <p className="mt-0.5">Esta categoria está inclusa no contrato do cliente. Ao concluir o atendimento, você pode encerrar sem gerar cobrança.</p>
            </div>
          ) : null}

          {pendingServiceOrders.length > 0 && actions.some((a) => a.targetStatus === "CLOSED") ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p className="font-semibold">Ordens de serviço pendentes</p>
              <p className="mt-0.5">
                {pendingServiceOrders.length > 1
                  ? `${pendingServiceOrders.length} ordens de serviço ainda não foram concluídas ou canceladas.`
                  : "Uma ordem de serviço ainda não foi concluída ou cancelada."}
                {" "}Conclua ou cancele todas as OS antes de finalizar o chamado.
              </p>
            </div>
          ) : null}

          {pendingAction ? (
            <div className="space-y-3 rounded-xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-sm font-semibold text-sky-950">Confirmar: {pendingAction.label}</p>
              {pendingAction.requiresReason ? (
                <div className="grid gap-2">
                  <Label htmlFor="closingReason">Motivo do cancelamento</Label>
                  <Textarea
                    id="closingReason"
                    value={closingReason}
                    onChange={(e) => setClosingReason(e.target.value)}
                    placeholder="Descreva o motivo para registrar no histórico"
                    disabled={isPending}
                  />
                </div>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  className="flex-1"
                  disabled={isPending || (pendingAction.requiresReason && !closingReason.trim())}
                  onClick={executeAction}
                >
                  {isPending ? "Salvando..." : "Confirmar"}
                </Button>
                <Button type="button" variant="outline" className="flex-1" disabled={isPending} onClick={cancelPendingAction}>
                  Voltar
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              {actions.length > 0 ? (
                actions.map((action) => (
                  <Button
                    key={action.targetStatus}
                    type="button"
                    variant={action.variant}
                    disabled={isPending || (action.targetStatus === "CLOSED" && pendingServiceOrders.length > 0)}
                    onClick={() => startAction(action)}
                    className={action.targetStatus === "CANCELED" ? "border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800" : ""}
                  >
                    {action.label}
                  </Button>
                ))
              ) : (
                <p className="text-sm text-slate-500">Nenhuma ação disponível para o status atual.</p>
              )}
            </div>
          )}

          {canAssign ? (
            <div className="space-y-3 border-t border-slate-200 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Responsável</p>
              <Select value={assigneeId} disabled={isPending} onChange={(e) => setAssigneeId(e.target.value)}>
                <option value="">Não atribuído</option>
                {groupedUsers.suggestedUsers.length > 0 ? (
                  <optgroup label={groupedUsers.suggestion.label}>
                    {groupedUsers.suggestedUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {formatUserWithRole(user)}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
                {groupedUsers.otherUsers.length > 0 ? (
                  <optgroup label="Outros perfis operacionais">
                    {groupedUsers.otherUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {formatUserWithRole(user)}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
              </Select>
              <p className="text-xs text-slate-500">{groupedUsers.suggestion.description}</p>
              <Button type="button" variant="outline" className="w-full" disabled={isPending || assigneeId === (ticket.assigneeId ?? "")} onClick={saveAssignment}>
                {isPending ? "Salvando..." : "Salvar responsável"}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {canComment ? (
        <Card>
          <CardHeader>
            <CardTitle>Nova interação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Registrar comentário, retorno do cliente ou tratativa executada" />
            <Button type="button" className="w-full" disabled={isPending || !comment.trim()} onClick={submitComment}>
              {isPending ? "Enviando..." : "Adicionar ao histórico"}
            </Button>
            <div className="space-y-3 border-t border-slate-200 pt-4">
              <Label htmlFor="attachment">Anexo</Label>
              <Input id="attachment" type="file" onChange={(e) => setAttachment(e.target.files?.[0] ?? null)} />
              <p className="text-xs text-slate-500">Limite de 5 MB por arquivo.</p>
              <Button type="button" className="w-full" variant="outline" disabled={isPending} onClick={submitAttachment}>
                {isPending ? "Enviando..." : "Enviar anexo"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
