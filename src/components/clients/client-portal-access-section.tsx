"use client";

import { useState, useTransition } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PortalUserSummary {
  id: string;
  name: string;
  email: string;
  active: boolean;
}

interface ClientPortalAccessSectionProps {
  clientId: string;
  portalUser: PortalUserSummary | null;
  canEdit: boolean;
}

export function ClientPortalAccessSection({ clientId, portalUser, canEdit }: ClientPortalAccessSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [created, setCreated] = useState<PortalUserSummary | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const currentUser = created ?? portalUser;

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await fetch(`/api/clients/${clientId}/portal-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          password: data.get("password")
        })
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Erro ao criar acesso.");
        return;
      }

      setCreated(json);
      setShowForm(false);
    });
  }

  function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const data = new FormData(e.currentTarget);
    const password = data.get("password") as string;
    const confirm = data.get("passwordConfirm") as string;

    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/clients/${clientId}/portal-access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Erro ao alterar senha.");
        return;
      }

      setSuccess("Senha alterada com sucesso.");
      setShowPasswordForm(false);
      (e.target as HTMLFormElement).reset();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acesso ao portal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentUser ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-1">
            <p className="text-sm font-semibold text-emerald-800">Portal habilitado</p>
            <p className="text-sm text-emerald-700">
              <span className="font-medium">Usuário:</span> {currentUser.name}
            </p>
            <p className="text-sm text-emerald-700">
              <span className="font-medium">E-mail:</span> {currentUser.email}
            </p>
            {!currentUser.active && (
              <p className="mt-1 text-xs font-semibold text-rose-600">Acesso desativado</p>
            )}
            <p className="mt-2 text-xs text-emerald-600">
              O cliente pode acessar o portal em{" "}
              <span className="font-mono">/portal</span>
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">Este cliente ainda não tem acesso ao portal do cliente.</p>
          </div>
        )}

        {success && !showPasswordForm && (
          <p className="text-sm font-medium text-emerald-700">{success}</p>
        )}

        {error && !showForm && !showPasswordForm && (
          <p className="text-sm text-rose-600">{error}</p>
        )}

        {canEdit && currentUser && !showPasswordForm && (
          <button
            onClick={() => { setShowPasswordForm(true); setError(""); setSuccess(""); }}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Alterar senha do portal
          </button>
        )}

        {showPasswordForm && (
          <form onSubmit={handleChangePassword} className="space-y-3 rounded-lg border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-700">Alterar senha do portal</p>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Nova senha</label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Confirmar nova senha</label>
              <input
                name="passwordConfirm"
                type="password"
                required
                minLength={6}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {isPending ? "Salvando..." : "Salvar senha"}
              </button>
              <button
                type="button"
                onClick={() => { setShowPasswordForm(false); setError(""); }}
                className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {canEdit && !currentUser && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"
          >
            Habilitar acesso ao portal
          </button>
        )}

        {showForm && (
          <form onSubmit={handleCreate} className="space-y-3 rounded-lg border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-700">Criar acesso de portal</p>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Nome do usuário</label>
              <input
                name="name"
                required
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-slate-600">E-mail de acesso</label>
              <input
                name="email"
                type="email"
                required
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Senha temporária</label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {isPending ? "Criando..." : "Criar acesso"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
