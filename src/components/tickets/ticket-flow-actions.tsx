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

type FlowAction = {
  label: string;
  targetStatus: Ticket["status"];
  variant: "default" | "outline";
  requiresReason: boolean;
};

function getFlowActions(status: Ticket["status"], role: AppUser["role"]): FlowAction[] {
  const isAttendant = role === "ATTENDANT";

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
        { label: "Marcar como resolvido", targetStatus: "RESOLVED", variant: "default", requiresReason: false },
        ...(isAttendant
          ? [{ label: "Cancelar chamado", targetStatus: "CANCELED" as const, variant: "outline" as const, requiresReason: true }]
          : [])
      ];

    case "WAITING_CUSTOMER":
      return [
        { label: "Retomar atendimento", targetStatus: "IN_PROGRESS", variant: "default", requiresReason: false },
        { label: "Marcar como resolvido", targetStatus: "RESOLVED", variant: "outline", requiresReason: false }
      ];

    case "RESOLVED":
      return [
        ...(isAttendant
          ? [{ label: "Encerrar chamado", targetStatus: "CLOSED" as const, variant: "default" as const, requiresReason: true }]
          : []),
        { label: "Reabrir chamado", targetStatus: "OPEN", variant: "outline", requiresReason: false }
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
  currentUserId
}: {
  ticket: Ticket;
  users: AppUser[];
  role: AppUser["role"];
  currentUserId?: string;
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
  const actions = getFlowActions(ticket.status, role);
  const canComment = canCommentTicket(role);
  const canAssign = canEditTicketAssignment(role);
  const groupedUsers = groupAssignableUsers(users, ticket.category);

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
          closingReason: pendingAction.requiresReason ? closingReason : ""
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

      <Card className="xl:sticky xl:top-24">
        <CardHeader>
          <CardTitle>Ações rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-950">Etapa atual: {flow.currentStageLabel}</p>
            <p className="mt-1">{flow.nextAction}</p>
          </div>

          {pendingAction ? (
            <div className="space-y-3 rounded-xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-sm font-semibold text-sky-950">Confirmar: {pendingAction.label}</p>
              {pendingAction.requiresReason ? (
                <div className="grid gap-2">
                  <Label htmlFor="closingReason">
                    Motivo {pendingAction.targetStatus === "CANCELED" ? "do cancelamento" : "do encerramento"}
                  </Label>
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
                    disabled={isPending}
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
          </CardContent>
        </Card>
      ) : null}

      {canComment ? (
        <Card>
          <CardHeader>
            <CardTitle>Enviar anexo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="attachment">Arquivo</Label>
              <Input id="attachment" type="file" onChange={(e) => setAttachment(e.target.files?.[0] ?? null)} />
              <p className="text-xs text-slate-500">Limite de 5 MB por arquivo.</p>
            </div>
            <Button type="button" className="w-full" disabled={isPending} onClick={submitAttachment}>
              {isPending ? "Enviando..." : "Enviar anexo"}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
