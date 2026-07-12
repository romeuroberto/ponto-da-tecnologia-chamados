"use client";

import { Copy, Eye, EyeOff, Pencil, Plus, Power, RotateCcw, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ClientComputer, RemoteAccessTool } from "@/types";

const remoteToolLabels: Record<RemoteAccessTool, string> = {
  ANYDESK: "AnyDesk",
  TEAMVIEWER: "TeamViewer",
  RUSTDESK: "RustDesk",
  CHROME_REMOTE_DESKTOP: "Chrome Remote Desktop",
  WINDOWS_RDP: "Área de Trabalho Remota",
  OTHER: "Outro"
};

const remoteToolOptions = Object.entries(remoteToolLabels) as Array<[RemoteAccessTool, string]>;

interface ClientComputersSectionProps {
  clientId: string;
  initialComputers: ClientComputer[];
  canManage: boolean;
}

type ComputerFormValues = {
  name: string;
  location: string;
  responsibleName: string;
  remoteTool: RemoteAccessTool;
  remoteCode: string;
  remotePassword: string;
  notes: string;
  active: boolean;
};

function toFormValues(computer?: ClientComputer): ComputerFormValues {
  return {
    name: computer?.name ?? "",
    location: computer?.location ?? "",
    responsibleName: computer?.responsibleName ?? "",
    remoteTool: computer?.remoteTool ?? "ANYDESK",
    remoteCode: computer?.remoteCode ?? "",
    remotePassword: computer?.remotePassword ?? "",
    notes: computer?.notes ?? "",
    active: computer?.active ?? true
  };
}

function getPayloadFromForm(form: HTMLFormElement, fallbackActive: boolean) {
  const data = new FormData(form);

  return {
    name: String(data.get("name") ?? ""),
    location: String(data.get("location") ?? ""),
    responsibleName: String(data.get("responsibleName") ?? ""),
    remoteTool: String(data.get("remoteTool") ?? "ANYDESK"),
    remoteCode: String(data.get("remoteCode") ?? ""),
    remotePassword: String(data.get("remotePassword") ?? ""),
    notes: String(data.get("notes") ?? ""),
    active: data.has("active") ? data.get("active") === "on" : fallbackActive
  };
}

export function ClientComputersSection({ clientId, initialComputers, canManage }: ClientComputersSectionProps) {
  const [computers, setComputers] = useState(initialComputers);
  const [formComputer, setFormComputer] = useState<ClientComputer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const activeCount = useMemo(() => computers.filter((computer) => computer.active).length, [computers]);
  const formValues = toFormValues(formComputer ?? undefined);
  const isEditing = Boolean(formComputer);

  function closeForm() {
    setShowForm(false);
    setFormComputer(null);
    setError("");
  }

  async function copyValue(value: string | undefined, label: string) {
    if (!value) {
      setError(`${label} não informado.`);
      setMessage("");
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} copiado.`);
      setError("");
    } catch {
      setError(`Não foi possível copiar ${label.toLowerCase()}.`);
      setMessage("");
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const payload = getPayloadFromForm(event.currentTarget, formComputer?.active ?? true);
    const url = isEditing
      ? `/api/clients/${clientId}/computers/${formComputer?.id}`
      : `/api/clients/${clientId}/computers`;
    const method = isEditing ? "PUT" : "POST";

    startTransition(async () => {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await response.json();

      if (!response.ok) {
        setError(json.message ?? "Não foi possível salvar o computador.");
        return;
      }

      setComputers((current) => {
        if (isEditing) {
          return current.map((computer) => (computer.id === json.data.id ? json.data : computer));
        }

        return [json.data, ...current];
      });
      setMessage(isEditing ? "Computador atualizado." : "Computador cadastrado.");
      closeForm();
    });
  }

  function updateActive(computer: ClientComputer, active: boolean) {
    setError("");
    setMessage("");

    startTransition(async () => {
      const response = await fetch(`/api/clients/${clientId}/computers/${computer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: computer.name,
          location: computer.location ?? "",
          responsibleName: computer.responsibleName ?? "",
          remoteTool: computer.remoteTool,
          remoteCode: computer.remoteCode ?? "",
          remotePassword: computer.remotePassword ?? "",
          notes: computer.notes ?? "",
          active
        })
      });
      const json = await response.json();

      if (!response.ok) {
        setError(json.message ?? "Não foi possível atualizar o computador.");
        return;
      }

      setComputers((current) => current.map((item) => (item.id === json.data.id ? json.data : item)));
      setMessage(active ? "Computador reativado." : "Computador inativado.");
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Computadores</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            {activeCount} ativo(s) de {computers.length} cadastrado(s)
          </p>
        </div>
        {canManage ? (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setFormComputer(null);
              setShowForm(true);
              setError("");
              setMessage("");
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo computador
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

        {showForm && canManage ? (
          <form
            key={formComputer?.id ?? "new"}
            onSubmit={handleSubmit}
            className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">
                {isEditing ? "Editar computador" : "Novo computador"}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={closeForm}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Nome
                <Input name="name" defaultValue={formValues.name} required maxLength={120} />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Local/setor
                <Input name="location" defaultValue={formValues.location} maxLength={120} />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Responsável
                <Input name="responsibleName" defaultValue={formValues.responsibleName} maxLength={120} />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Ferramenta
                <Select name="remoteTool" defaultValue={formValues.remoteTool}>
                  {remoteToolOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Código de acesso
                <Input name="remoteCode" defaultValue={formValues.remoteCode} maxLength={120} />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Senha
                <Input name="remotePassword" defaultValue={formValues.remotePassword} maxLength={120} />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700 md:col-span-2">
                Observações
                <Textarea name="notes" defaultValue={formValues.notes} maxLength={1000} className="min-h-20" />
              </label>
              {isEditing ? (
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input name="active" type="checkbox" defaultChecked={formValues.active} className="h-4 w-4 rounded border-slate-300" />
                  Computador ativo
                </label>
              ) : null}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : "Salvar computador"}
              </Button>
            </div>
          </form>
        ) : null}

        {computers.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase text-slate-500 lg:grid">
              <span>Computador</span>
              <span>Ferramenta</span>
              <span>Código</span>
              <span>Senha</span>
              <span>Ações</span>
            </div>
            <div className="divide-y divide-slate-200">
              {computers.map((computer) => {
                const isPasswordVisible = visiblePasswords[computer.id] ?? false;

                return (
                  <div
                    key={computer.id}
                    className={`grid gap-3 px-4 py-3 text-sm lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto] lg:items-center ${
                      computer.active ? "bg-white" : "bg-slate-50 text-slate-500"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-slate-950">{computer.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {[computer.location, computer.responsibleName].filter(Boolean).join(" · ") || "Sem local definido"}
                      </p>
                    </div>
                    <p>{remoteToolLabels[computer.remoteTool]}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{computer.remoteCode || "Não informado"}</span>
                      <Button type="button" variant="outline" size="sm" title="Copiar código" onClick={() => copyValue(computer.remoteCode, "Código")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{computer.remotePassword ? (isPasswordVisible ? computer.remotePassword : "••••••••") : "Não informada"}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        title={isPasswordVisible ? "Ocultar senha" : "Revelar senha"}
                        onClick={() => setVisiblePasswords((current) => ({ ...current, [computer.id]: !isPasswordVisible }))}
                      >
                        {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button type="button" variant="outline" size="sm" title="Copiar senha" onClick={() => copyValue(computer.remotePassword, "Senha")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {canManage ? (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFormComputer(computer);
                              setShowForm(true);
                              setError("");
                              setMessage("");
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                          {computer.active ? (
                            <Button type="button" variant="outline" size="sm" onClick={() => updateActive(computer, false)}>
                              <Power className="mr-2 h-4 w-4" />
                              Inativar
                            </Button>
                          ) : (
                            <Button type="button" variant="outline" size="sm" onClick={() => updateActive(computer, true)}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Reativar
                            </Button>
                          )}
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-sm text-slate-500">
            Nenhum computador cadastrado para este cliente.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
