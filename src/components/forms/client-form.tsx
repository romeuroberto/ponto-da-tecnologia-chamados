"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { Client } from "@/types";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
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
  isReseller: boolean;
  defaultBillingType: "AVULSO" | "CONTRATO" | "GARANTIA" | "CORTESIA";
  hourlyRate: string;
  travelRate: string;
  defaultDiscountPercent: string;
  billingInstructions: string;
};

export function ClientForm({ client }: { client?: Client }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ClientFormState>({
    name: client?.name ?? "",
    document: client?.document ?? "",
    contactName: client?.contactName ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    notes: client?.notes ?? "",
    isReseller: client?.isReseller ?? false,
    defaultBillingType: client?.billingProfile?.defaultBillingType ?? "AVULSO",
    hourlyRate: formatCurrencyInput(client?.billingProfile?.hourlyRate ?? 0),
    travelRate: formatCurrencyInput(client?.billingProfile?.travelRate ?? 0),
    defaultDiscountPercent: client?.billingProfile?.defaultDiscountPercent !== undefined ? String(client.billingProfile.defaultDiscountPercent) : "",
    billingInstructions: client?.billingProfile?.billingInstructions ?? ""
  });

  function handleChange(field: keyof ClientFormState, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setFieldErrors({});

    startTransition(async () => {
      const payload = {
        name: formData.name,
        document: formData.document,
        contactName: formData.contactName,
        email: formData.email,
        phone: formData.phone,
        notes: formData.notes,
        isReseller: formData.isReseller,
        billingProfile: {
          defaultBillingType: formData.defaultBillingType,
          hourlyRate: parseCurrencyInput(formData.hourlyRate),
          travelRate: parseCurrencyInput(formData.travelRate),
          defaultDiscountPercent: formData.defaultDiscountPercent ? Number(formData.defaultDiscountPercent) : undefined,
          billingInstructions: formData.billingInstructions
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
        const flat = result.errors?.fieldErrors as Record<string, string[]> | undefined;
        if (flat) {
          const mapped: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(flat)) {
            if (Array.isArray(msgs) && msgs.length > 0) mapped[key] = msgs[0];
          }
          setFieldErrors(mapped);
        }
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
          isReseller: false,
          defaultBillingType: "AVULSO",
          hourlyRate: formatCurrencyInput(0),
          travelRate: formatCurrencyInput(0),
          defaultDiscountPercent: "",
          billingInstructions: ""
        });
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
              <h2 className="text-base font-semibold text-slate-950">Dados principais</h2>
              <p className="mt-1 text-sm text-slate-600">Preencha os dados de identificação e contato do cliente.</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Nome <span className="text-rose-500">*</span></Label>
              <Input id="name" value={formData.name} onChange={(event) => handleChange("name", event.target.value)} placeholder="Nome da empresa ou cliente" aria-invalid={!!fieldErrors.name} />
              {fieldErrors.name ? <p className="text-xs text-rose-600">{fieldErrors.name}</p> : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="document">Documento</Label>
                <Input id="document" value={formData.document} onChange={(event) => handleChange("document", event.target.value)} placeholder="CNPJ ou identificação" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contactName">Contato principal <span className="text-rose-500">*</span></Label>
                <Input id="contactName" value={formData.contactName} onChange={(event) => handleChange("contactName", event.target.value)} placeholder="Nome do contato" aria-invalid={!!fieldErrors.contactName} />
                {fieldErrors.contactName ? <p className="text-xs text-rose-600">{fieldErrors.contactName}</p> : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" value={formData.email} onChange={(event) => handleChange("email", event.target.value)} placeholder="contato@empresa.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <PhoneInput id="phone" value={formData.phone} onValueChange={(value) => handleChange("phone", value)} placeholder="(00) 00000-0000" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" value={formData.notes} onChange={(event) => handleChange("notes", event.target.value)} placeholder="Informações relevantes do atendimento" />
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 cursor-pointer hover:border-sky-200 hover:bg-sky-50/50 transition-colors">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                checked={formData.isReseller}
                onChange={(event) => setFormData((current) => ({ ...current, isReseller: event.target.checked }))}
              />
              <div>
                <span className="font-medium">Cliente revendedor</span>
                <p className="text-xs text-slate-500 mt-0.5">Preço de revenda será aplicado automaticamente nas vendas</p>
              </div>
            </label>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div>
              <h3 className="text-base font-semibold text-slate-950">Perfil financeiro</h3>
              <p className="mt-1 text-sm text-slate-600">Defina regras padrão para cobrança, deslocamento e contrato.</p>
            </div>

            <div className="mt-4 grid gap-2">
              <Label htmlFor="defaultBillingType">Tipo de cobrança padrão</Label>
              <Select id="defaultBillingType" value={formData.defaultBillingType} onChange={(event) => handleChange("defaultBillingType", event.target.value)}>
                <option value="AVULSO">Avulso</option>
                <option value="CONTRATO">Contrato</option>
                <option value="GARANTIA">Garantia</option>
                <option value="CORTESIA">Cortesia</option>
              </Select>
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
              <Label htmlFor="billingInstructions">Observações financeiras</Label>
              <Textarea
                id="billingInstructions"
                value={formData.billingInstructions}
                onChange={(event) => handleChange("billingInstructions", event.target.value)}
                placeholder="Regras contratuais, condições especiais ou observações de faturamento"
              />
            </div>

          </section>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? "Salvando..." : "Salvar cliente"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
