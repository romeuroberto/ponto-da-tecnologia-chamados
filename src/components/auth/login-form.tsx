"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false
      });

      if (!result || result.error) {
        setError("E-mail ou senha invalidos.");
        return;
      }

      window.location.href = "/dashboard";
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error ? <div className="rounded-lg border border-rose-700 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">{error}</div> : null}
      <div className="grid gap-2">
        <Label htmlFor="email" className="text-slate-200">
          E-mail
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
          placeholder="voce@empresa.com"
          className="border-slate-700 bg-slate-950 text-white"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password" className="text-slate-200">
          Senha
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
          className="border-slate-700 bg-slate-950 text-white"
        />
      </div>
      <Button className="w-full" disabled={isPending}>
        {isPending ? "Entrando..." : "Entrar"}
      </Button>
      <p className="text-center text-sm text-slate-400">Use um usuario cadastrado no sistema para acessar.</p>
    </form>
  );
}
