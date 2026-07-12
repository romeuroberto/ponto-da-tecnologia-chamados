"use client";

import type { Route } from "next";
import Link from "next/link";
import { Copy, Eye, EyeOff, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ClientComputerAccess, RemoteAccessTool } from "@/types";

const remoteToolLabels: Record<RemoteAccessTool, string> = {
  ANYDESK: "AnyDesk",
  TEAMVIEWER: "TeamViewer",
  RUSTDESK: "RustDesk",
  CHROME_REMOTE_DESKTOP: "Chrome Remote Desktop",
  WINDOWS_RDP: "Área de Trabalho Remota",
  OTHER: "Outro"
};

export function RemoteAccessDirectory({ accesses }: { accesses: ClientComputerAccess[] }) {
  const [query, setQuery] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredAccesses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return accesses;
    }

    return accesses.filter((access) =>
      [
        access.clientName,
        access.name,
        access.location ?? "",
        access.responsibleName ?? "",
        remoteToolLabels[access.remoteTool],
        access.remoteCode ?? "",
        access.notes ?? ""
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [accesses, query]);

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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por cliente, computador, setor, ferramenta ou código..."
            className="pl-9"
          />
        </div>
        <span className="text-sm text-slate-500">
          {filteredAccesses.length} de {accesses.length} acesso(s)
        </span>
      </div>

      {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

      {filteredAccesses.length > 0 ? (
        <div className="grid gap-3">
          {filteredAccesses.map((access) => {
            const isPasswordVisible = visiblePasswords[access.id] ?? false;

            return (
              <Card key={access.id}>
                <CardContent className="p-4">
                  <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-center">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">{access.clientName}</p>
                      <p className="mt-1 truncate text-base font-semibold text-slate-900">{access.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {[access.location, access.responsibleName].filter(Boolean).join(" · ") || "Sem local definido"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Ferramenta</p>
                      <p className="mt-1 text-sm text-slate-900">{remoteToolLabels[access.remoteTool]}</p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                      <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <span className="min-w-0 truncate font-mono text-sm text-slate-900">
                          {access.remoteCode || "Sem código"}
                        </span>
                        <Button type="button" variant="outline" size="sm" title="Copiar código" onClick={() => copyValue(access.remoteCode, "Código")}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <span className="min-w-0 truncate font-mono text-sm text-slate-900">
                          {access.remotePassword ? (isPasswordVisible ? access.remotePassword : "••••••••") : "Sem senha"}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            title={isPasswordVisible ? "Ocultar senha" : "Revelar senha"}
                            onClick={() => setVisiblePasswords((current) => ({ ...current, [access.id]: !isPasswordVisible }))}
                          >
                            {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button type="button" variant="outline" size="sm" title="Copiar senha" onClick={() => copyValue(access.remotePassword, "Senha")}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Link href={`/clientes/${access.clientId}` as Route} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full lg:w-auto")}>
                      Editar no cliente
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
          Nenhum acesso remoto encontrado.
        </div>
      )}
    </div>
  );
}
