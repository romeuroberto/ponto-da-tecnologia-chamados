"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { AppUser, Client, TicketAttendanceType } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { attendanceTypeDescriptions, attendanceTypeLabels } from "@/lib/ticket-attendance";
import { TICKET_CATEGORIES } from "@/lib/ticket-categories";
import { formatUserWithRole, groupAssignableUsers } from "@/lib/users";
import { FormMessage } from "./form-message";

const attendanceTypes: TicketAttendanceType[] = ["REMOTE", "BALCAO", "IN_STORE_EQUIPMENT", "FIELD_VISIT"];

function getValidationMessage(result: unknown) {
  if (!result || typeof result !== "object") {
    return null;
  }

  const errors = (result as { errors?: { fieldErrors?: Record<string, string[] | undefined> } }).errors;
  return errors?.fieldErrors ? Object.values(errors.fieldErrors).flat().find(Boolean) ?? null : null;
}

export function TicketForm({ clients, users }: { clients: Client[]; users: AppUser[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState({
    clientId: "",
    title: "",
    description: "",
    category: "",
    attendanceType: "REMOTE" as TicketAttendanceType,
    priority: "MEDIUM",
    requesterName: "",
    requesterEmail: "",
    assigneeId: ""
  });
  const groupedUsers = groupAssignableUsers(users, formData.category);

  function updateField(field: keyof typeof formData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: getValidationMessage(result) ?? result.message ?? "Não foi possível salvar o chamado."
        });
        return;
      }

      setMessage({
        type: "success",
        text: `Chamado ${result.data.number} criado com sucesso.`
      });

      setFormData({
        clientId: "",
        title: "",
        description: "",
        category: "",
        attendanceType: "REMOTE",
        priority: "MEDIUM",
        requesterName: "",
        requesterEmail: "",
        assigneeId: ""
      });

      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form className="grid gap-5" onSubmit={handleSubmit}>
          {message ? <FormMessage type={message.type} message={message.text} /> : null}
          <div className="grid gap-2">
            <Label htmlFor="client">Cliente</Label>
            <Select id="client" value={formData.clientId} onChange={(event) => updateField("clientId", event.target.value)}>
              <option value="" disabled>
                Selecione um cliente
              </option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" value={formData.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Resumo curto do problema" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Descreva o problema com o máximo de contexto útil"
            />
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="category">Categoria</Label>
              <Select id="category" value={formData.category} onChange={(event) => updateField("category", event.target.value)}>
                <option value="">Selecione uma categoria</option>
                {TICKET_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="attendanceType">Tipo de atendimento</Label>
              <Select id="attendanceType" value={formData.attendanceType} onChange={(event) => updateField("attendanceType", event.target.value)}>
                {attendanceTypes.map((attendanceType) => (
                  <option key={attendanceType} value={attendanceType}>
                    {attendanceTypeLabels[attendanceType]}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-slate-500">{attendanceTypeDescriptions[formData.attendanceType]}</p>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="priority">Prioridade</Label>
            <Select id="priority" value={formData.priority} onChange={(event) => updateField("priority", event.target.value)}>
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica</option>
            </Select>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="requesterName">Solicitante</Label>
              <Input id="requesterName" value={formData.requesterName} onChange={(event) => updateField("requesterName", event.target.value)} placeholder="Nome do solicitante" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="requesterEmail">E-mail do solicitante</Label>
              <Input id="requesterEmail" value={formData.requesterEmail} onChange={(event) => updateField("requesterEmail", event.target.value)} placeholder="contato@cliente.com" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="assignee">Responsável</Label>
            <Select id="assignee" value={formData.assigneeId} onChange={(event) => updateField("assigneeId", event.target.value)}>
              <option value="">Definir depois</option>
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
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar chamado"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
