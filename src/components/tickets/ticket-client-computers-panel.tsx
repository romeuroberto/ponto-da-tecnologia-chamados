"use client";

import type { Route } from "next";
import Link from "next/link";
import { Copy, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ClientComputer, RemoteAccessTool } from "@/types";

const remoteToolLabels: Record<RemoteAccessTool, string> = {
  ANYDESK: "AnyDesk",
  TEAMVIEWER: "TeamViewer",
  RUSTDESK: "RustDesk",
  CHROME_REMOTE_DESKTOP: "Chrome Remote Desktop",
  WINDOWS_RDP: "Área de Trabalho Remota",
  OTHER: "Outro"
};

interface TicketClientComputersPanelProps {
  clientId: string;
  computers: ClientComputer[];
}

export function TicketClientComputersPanel({ clientId, computers }: TicketClientComputersPanelProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Acessos remotos do cliente</CardTitle>
          <p className="mt-1 text-sm text-slate-500">{computers.length} computador(es) ativo(s)</p>
        </div>
        <Link href={`/clientes/${clientId}` as Route} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}>
          Gerenciar
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

        {computers.length > 0 ? (
          <div className="grid gap-3">
            {computers.map((computer) => {
              const isPasswordVisible = visiblePasswords[computer.id] ?? false;

              return (
                <div key={computer.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{computer.name}</p>
                      <p className="text-xs text-slate-500">
                        {[computer.location, computer.responsibleName].filter(Boolean).join(" · ") || "Sem local definido"}
                      </p>
                    </div>
                    <span className="w-fit rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                      {remoteToolLabels[computer.remoteTool]}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase text-slate-500">Código</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate font-mono text-sm text-slate-900">
                          {computer.remoteCode || "Não informado"}
                        </span>
                        <Button type="button" variant="outline" size="sm" title="Copiar código" onClick={() => copyValue(computer.remoteCode, "Código")}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase text-slate-500">Senha</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate font-mono text-sm text-slate-900">
                          {computer.remotePassword ? (isPasswordVisible ? computer.remotePassword : "••••••••") : "Não informada"}
                        </span>
                        <div className="flex items-center gap-2">
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
                      </div>
                    </div>
                  </div>

                  {computer.notes ? <p className="mt-3 text-sm leading-6 text-slate-600">{computer.notes}</p> : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 p-5 text-sm text-slate-500">
            Nenhum computador ativo cadastrado para este cliente.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
