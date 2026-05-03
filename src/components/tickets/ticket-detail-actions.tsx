"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AppUser, Ticket } from "@/types";
import { canCommentTicket, canEditTicketAssignment, canEditTicketPriority, canEditTicketStatus } from "@/server/auth/permissions";
import { Input } from "@/components/ui/input";

export function TicketDetailActions({
  ticket,
  users,
  role
}: {
  ticket: Ticket;
  users: AppUser[];
  role: AppUser["role"];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [fields, setFields] = useState({
    status: ticket.status,
    priority: ticket.priority,
    assigneeId: ticket.assigneeId ?? "",
    closingReason: ticket.closingReason ?? ""
  });
  const [comment, setComment] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const canEditStatus = canEditTicketStatus(role);
  const canEditPriorityValue = canEditTicketPriority(role);
  const canEditAssignment = canEditTicketAssignment(role);
  const canComment = canCommentTicket(role);
  const canSaveFields = canEditStatus || canEditPriorityValue || canEditAssignment;
  const requiresClosingReason = fields.status === "CLOSED" || fields.status === "CANCELED";
  const canReopen = canEditStatus && (ticket.status === "RESOLVED" || ticket.status === "CLOSED" || ticket.status === "CANCELED");

  function saveFields() {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(fields)
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: result.message ?? "Nao foi possivel atualizar o chamado."
        });
        return;
      }

      setMessage({
        type: "success",
        text: "Chamado atualizado com sucesso."
      });
      router.refresh();
    });
  }

  function reopenTicket() {
    setFields((current) => ({
      ...current,
      status: "OPEN",
      closingReason: ""
    }));
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...fields,
          status: "OPEN",
          closingReason: ""
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: result.message ?? "Nao foi possivel reabrir o chamado."
        });
        return;
      }

      setMessage({
        type: "success",
        text: "Chamado reaberto com sucesso."
      });
      router.refresh();
    });
  }

  function submitComment() {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: comment })
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: result.message ?? "Nao foi possivel registrar o comentario."
        });
        return;
      }

      setComment("");
      setMessage({
        type: "success",
        text: "Comentario adicionado ao historico."
      });
      router.refresh();
    });
  }

  function submitAttachment() {
    if (!attachment) {
      setMessage({
        type: "error",
        text: "Selecione um arquivo antes de enviar."
      });
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
        setMessage({
          type: "error",
          text: result.message ?? "Nao foi possivel enviar o anexo."
        });
        return;
      }

      setAttachment(null);
      setMessage({
        type: "success",
        text: "Anexo enviado com sucesso."
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {message ? <FormMessage type={message.type} message={message.text} /> : null}
      {canSaveFields ? (
        <Card>
          <CardHeader>
            <CardTitle>Acoes rapidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canEditStatus ? (
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select id="status" value={fields.status} onChange={(event) => setFields((current) => ({ ...current, status: event.target.value as Ticket["status"] }))}>
                  <option value="OPEN">Aberto</option>
                  <option value="IN_PROGRESS">Em atendimento</option>
                  <option value="WAITING_CUSTOMER">Aguardando cliente</option>
                  <option value="RESOLVED">Resolvido</option>
                  <option value="CLOSED">Encerrado</option>
                  <option value="CANCELED">Cancelado</option>
                </Select>
              </div>
            ) : null}
            {canEditPriorityValue ? (
              <div className="grid gap-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select id="priority" value={fields.priority} onChange={(event) => setFields((current) => ({ ...current, priority: event.target.value as Ticket["priority"] }))}>
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Media</option>
                  <option value="HIGH">Alta</option>
                  <option value="CRITICAL">Critica</option>
                </Select>
              </div>
            ) : null}
            {canEditAssignment ? (
              <div className="grid gap-2">
                <Label htmlFor="assignee">Responsavel</Label>
                <Select id="assignee" value={fields.assigneeId} onChange={(event) => setFields((current) => ({ ...current, assigneeId: event.target.value }))}>
                  <option value="">Nao atribuido</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
            {requiresClosingReason ? (
              <div className="grid gap-2">
                <Label htmlFor="closingReason">Motivo do encerramento</Label>
                <Textarea
                  id="closingReason"
                  value={fields.closingReason}
                  onChange={(event) => setFields((current) => ({ ...current, closingReason: event.target.value }))}
                  placeholder="Descreva por que o chamado foi encerrado ou cancelado"
                />
              </div>
            ) : null}
            <Button type="button" className="w-full" disabled={isPending} onClick={saveFields}>
              {isPending ? "Salvando..." : "Salvar alteracoes"}
            </Button>
            {canReopen ? (
              <Button type="button" variant="outline" className="w-full" disabled={isPending} onClick={reopenTicket}>
                {isPending ? "Processando..." : "Reabrir chamado"}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
      {canComment ? (
        <Card>
          <CardHeader>
            <CardTitle>Nova interacao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Registrar comentario, retorno do cliente ou tratativa executada" />
            <Button type="button" className="w-full" disabled={isPending} onClick={submitComment}>
              {isPending ? "Enviando..." : "Adicionar ao historico"}
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
              <Input
                id="attachment"
                type="file"
                onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
              />
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
