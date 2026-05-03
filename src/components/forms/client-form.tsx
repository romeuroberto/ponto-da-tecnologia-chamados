"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Client } from "@/types";
import { FormMessage } from "./form-message";

export function ClientForm({ client }: { client?: Client }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState({
    name: client?.name ?? "",
    document: client?.document ?? "",
    contactName: client?.contactName ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    notes: client?.notes ?? ""
  });

  function handleChange(field: keyof typeof formData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(client ? `/api/clients/${client.id}` : "/api/clients", {
        method: client ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: result.message ?? "Nao foi possivel salvar o cliente."
        });
        return;
      }

      setMessage({
        type: "success",
        text: client ? "Cliente atualizado com sucesso." : "Cliente criado com sucesso."
      });

      if (!client) {
        setFormData({
          name: "",
          document: "",
          contactName: "",
          email: "",
          phone: "",
          notes: ""
        });
      }

      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form className="grid gap-5" onSubmit={handleSubmit}>
          {message ? <FormMessage type={message.type} message={message.text} /> : null}
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={formData.name} onChange={(event) => handleChange("name", event.target.value)} placeholder="Nome da empresa ou cliente" />
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="document">Documento</Label>
              <Input id="document" value={formData.document} onChange={(event) => handleChange("document", event.target.value)} placeholder="CNPJ ou identificacao" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactName">Contato principal</Label>
              <Input id="contactName" value={formData.contactName} onChange={(event) => handleChange("contactName", event.target.value)} placeholder="Nome do contato" />
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={formData.email} onChange={(event) => handleChange("email", event.target.value)} placeholder="contato@empresa.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={formData.phone} onChange={(event) => handleChange("phone", event.target.value)} placeholder="(00) 00000-0000" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Observacoes</Label>
            <Textarea id="notes" value={formData.notes} onChange={(event) => handleChange("notes", event.target.value)} placeholder="Informacoes relevantes do atendimento" />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar cliente"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
