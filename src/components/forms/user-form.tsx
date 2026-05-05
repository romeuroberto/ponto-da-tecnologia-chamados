"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { AppUser } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { FormMessage } from "./form-message";

export function UserForm({ user }: { user?: AppUser }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role ?? "ATTENDANT"
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(user ? `/api/users/${user.id}` : "/api/users", {
        method: user ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: result.message ?? "Não foi possível salvar o usuário."
        });
        return;
      }

      setMessage({
        type: "success",
        text: user ? "Usuário atualizado com sucesso." : "Usuário criado com sucesso."
      });

      if (!user) {
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "ATTENDANT"
        });
      } else {
        setFormData((current) => ({ ...current, password: "" }));
      }

      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <form className="grid gap-6" onSubmit={handleSubmit}>
          {message ? <FormMessage type={message.type} message={message.text} /> : null}

          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Dados de acesso</h2>
              <p className="mt-1 text-sm text-slate-600">Cadastre a pessoa e defina o nível de acesso ao sistema.</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} placeholder="Nome completo" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={formData.email} onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))} placeholder="usuario@empresa.com" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                  placeholder={user ? "Deixe em branco para manter" : "Defina uma senha"}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Perfil</Label>
                <Select id="role" value={formData.role} onChange={(event) => setFormData((current) => ({ ...current, role: event.target.value as AppUser["role"] }))}>
                  <option value="ADMIN">Administrador</option>
                  <option value="ATTENDANT">Atendente</option>
                  <option value="TECHNICIAN">Técnico</option>
                </Select>
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? "Salvando..." : "Salvar usuário"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
