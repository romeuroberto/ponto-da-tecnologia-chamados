"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { ClientContract } from "@/types";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage } from "@/components/forms/form-message";

type ContractFormState = {
  contractNumber: string;
  startDate: string;
  endDate: string;
  status: ClientContract["status"];
  coverageType: ClientContract["coverageType"];
  monthlyValue: string;
  coveredCategories: string;
  notes: string;
};

function toDateInputValue(isoString?: string) {
  if (!isoString) return "";
  return isoString.slice(0, 10);
}

export function ContractForm({
  clientId,
  contract,
  onDone
}: {
  clientId: string;
  contract?: ClientContract;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<ContractFormState>({
    contractNumber: contract?.contractNumber ?? "",
    startDate: toDateInputValue(contract?.startDate),
    endDate: toDateInputValue(contract?.endDate),
    status: contract?.status ?? "ATIVO",
    coverageType: contract?.coverageType ?? "PARCIAL",
    monthlyValue: formatCurrencyInput(contract?.monthlyValue ?? 0),
    coveredCategories: contract?.coveredCategories.join(", ") ?? "",
    notes: contract?.notes ?? ""
  });

  function handleChange(field: keyof ContractFormState, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setFieldErrors({});

    startTransition(async () => {
      const coveredCategories = formData.coveredCategories
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        contractNumber: formData.contractNumber,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        status: formData.status,
        coverageType: formData.coverageType,
        monthlyValue: parseCurrencyInput(formData.monthlyValue) || undefined,
        coveredCategories,
        notes: formData.notes || undefined
      };

      const url = contract
        ? `/api/clients/${clientId}/contracts/${contract.id}`
        : `/api/clients/${clientId}/contracts`;

      const response = await fetch(url, {
        method: contract ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors?.fieldErrors) {
          const flat: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(result.errors.fieldErrors)) {
            flat[key] = (msgs as string[])[0] ?? "";
          }
          setFieldErrors(flat);
        }
        setMessage({ type: "error", text: result.message ?? "Erro ao salvar contrato." });
        return;
      }

      setMessage({ type: "success", text: contract ? "Contrato atualizado." : "Contrato criado." });
      router.refresh();
      setTimeout(onDone, 800);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && <FormMessage type={message.type} message={message.text} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="contractNumber">Número do contrato *</Label>
          <Input
            id="contractNumber"
            value={formData.contractNumber}
            onChange={(e) => handleChange("contractNumber", e.target.value)}
            placeholder="Ex: CONT-2026-001"
          />
          {fieldErrors.contractNumber && <p className="text-xs text-red-600">{fieldErrors.contractNumber}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="coverageType">Tipo de cobertura *</Label>
          <Select
            id="coverageType"
            value={formData.coverageType}
            onChange={(e) => handleChange("coverageType", e.target.value)}
          >
            <option value="PARCIAL">Parcial — tarifas especiais</option>
            <option value="TOTAL">Total — cobre 100% dos chamados</option>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="startDate">Data de início *</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleChange("startDate", e.target.value)}
          />
          {fieldErrors.startDate && <p className="text-xs text-red-600">{fieldErrors.startDate}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="endDate">Data de fim (opcional)</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => handleChange("endDate", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="monthlyValue">Valor da mensalidade</Label>
          <Input
            id="monthlyValue"
            value={formData.monthlyValue}
            onChange={(e) => handleChange("monthlyValue", formatCurrencyInput(e.target.value))}
            placeholder="R$ 0,00"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            value={formData.status}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            <option value="ATIVO">Ativo</option>
            <option value="RASCUNHO">Rascunho</option>
            <option value="ENCERRADO">Encerrado</option>
            <option value="EXPIRADO">Expirado</option>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="coveredCategories">
          Categorias cobertas{" "}
          <span className="text-slate-400 text-xs">(separadas por vírgula — vazio = todas)</span>
        </Label>
        <Input
          id="coveredCategories"
          value={formData.coveredCategories}
          onChange={(e) => handleChange("coveredCategories", e.target.value)}
          placeholder="Ex: Suporte, Manutenção, Remoto"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          rows={3}
          placeholder="Condições especiais, SLA, itens inclusos..."
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onDone} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : contract ? "Salvar alterações" : "Criar contrato"}
        </Button>
      </div>
    </form>
  );
}
