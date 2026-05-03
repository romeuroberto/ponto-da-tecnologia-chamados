"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { Client } from "@/types";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage } from "./form-message";

type ClientFormState = {
  name: string;
  document: string;
  contactName: string;
  email: string;
  phone: string;
  notes: string;
  defaultBillingType: "AVULSO" | "CONTRATO" | "GARANTIA" | "CORTESIA";
  hourlyRate: string;
  travelRate: string;
  defaultDiscountPercent: string;
  hasActiveContract: boolean;
  contractNotes: string;
};

export function ClientForm({ client }: { client?: Client }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState<ClientFormState>({
    name: client?.name ?? "",
    document: client?.document ?? "",
    contactName: client?.contactName ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    notes: client?.notes ?? "",
    defaultBillingType: client?.billingProfile?.defaultBillingType ?? "AVULSO",
    hourlyRate: formatCurrencyInput(client?.billingProfile?.hourlyRate ?? 0),
    travelRate: formatCurrencyInput(client?.billingProfile?.travelRate ?? 0),
    defaultDiscountPercent: client?.billingProfile?.defaultDiscountPercent !== undefined ? String(client.billingProfile.defaultDiscountPercent) : "",
    hasActiveContract: client?.billingProfile?.hasActiveContract ?? false,
    contractNotes: client?.billingProfile?.contractNotes ?? ""
  });

  function handleChange(field: keyof ClientFormState, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const payload = {
        name: formData.name,
        document: formData.document,
        contactName: formData.contactName,
        email: formData.email,
        phone: formData.phone,
        notes: formData.notes,
        billingProfile: {
          defaultBillingType: formData.defaultBillingType,
          hourlyRate: parseCurrencyInput(formData.hourlyRate),
          travelRate: parseCurrencyInput(formData.travelRate),
          defaultDiscountPercent: formData.defaultDiscountPercent ? Number(formData.defaultDiscountPercent) : undefined,
          hasActiveContract: formData.hasActiveContract,
          contractNotes: formData.contractNotes
        }
      };

      const response = await fetch(client ? `/api/clients/${client.id}` : "/api/clients", {
        method: client ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: result.message ?? "Não foi possível salvar o cliente."
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
          notes: "",
          defaultBillingType: "AVULSO",
          hourlyRate: formatCurrencyInput(0),
          travelRate: formatCurrencyInput(0),
          defaultDiscountPercent: "",
          hasActiveContract: false,
          contractNotes: ""
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
              <Input id="document" value={formData.document} onChange={(event) => handleChange("document", event.target.value)} placeholder="CNPJ ou identificação" />
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
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" value={formData.notes} onChange={(event) => handleChange("notes", event.target.value)} placeholder="Informações relevantes do atendimento" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-base font-semibold text-slate-950">Perfil financeiro</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="defaultBillingType">Tipo de cobrança padrão</Label>
                <Select id="defaultBillingType" value={formData.defaultBillingType} onChange={(event) => handleChange("defaultBillingType", event.target.value)}>
                  <option value="AVULSO">Avulso</option>
                  <option value="CONTRATO">Contrato</option>
                  <option value="GARANTIA">Garantia</option>
                  <option value="CORTESIA">Cortesia</option>
                </Select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.hasActiveContract}
                    onChange={(event) => setFormData((current) => ({ ...current, hasActiveContract: event.target.checked }))}
                  />
                  Cliente com contrato ativo
                </label>
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="hourlyRate">Valor/hora</Label>
                <Input
                  id="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={(event) => handleChange("hourlyRate", event.target.value)}
                  onBlur={() => handleChange("hourlyRate", formatCurrencyInput(parseCurrencyInput(formData.hourlyRate)))}
                  placeholder="R$ 0,00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="travelRate">Valor deslocamento</Label>
                <Input
                  id="travelRate"
                  value={formData.travelRate}
                  onChange={(event) => handleChange("travelRate", event.target.value)}
                  onBlur={() => handleChange("travelRate", formatCurrencyInput(parseCurrencyInput(formData.travelRate)))}
                  placeholder="R$ 0,00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="defaultDiscountPercent">Desconto padrão (%)</Label>
                <Input
                  id="defaultDiscountPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.defaultDiscountPercent}
                  onChange={(event) => handleChange("defaultDiscountPercent", event.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <Label htmlFor="contractNotes">Observações financeiras</Label>
              <Textarea
                id="contractNotes"
                value={formData.contractNotes}
                onChange={(event) => handleChange("contractNotes", event.target.value)}
                placeholder="Regras contratuais, condições especiais ou observações de faturamento"
              />
            </div>
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
