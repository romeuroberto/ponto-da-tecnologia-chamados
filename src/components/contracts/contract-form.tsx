"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import type { ClientContract, TicketCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
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
  notes: string;
};

function toDateInputValue(isoString?: string) {
  if (!isoString) return "";
  return isoString.slice(0, 10);
}

function CategoryPicker({
  categories,
  selected,
  onChange
}: {
  categories: TicketCategory[];
  selected: string[];
  onChange: (names: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const available = categories.filter(
    (c) => !selected.includes(c.name) && c.label.toLowerCase().includes(query.toLowerCase())
  );

  function add(name: string) {
    onChange([...selected, name]);
    setQuery("");
    inputRef.current?.focus();
  }

  function remove(name: string) {
    onChange(selected.filter((s) => s !== name));
  }

  function labelOf(name: string) {
    return categories.find((c) => c.name === name)?.label ?? name;
  }

  return (
    <div className="space-y-2">
      <div
        className="flex min-h-10 flex-wrap gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-2 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {selected.map((name) => (
          <span
            key={name}
            className="inline-flex items-center gap-1 rounded-md bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800"
          >
            {labelOf(name)}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(name); }}
              className="text-sky-500 hover:text-sky-800"
              aria-label={`Remover ${labelOf(name)}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={selected.length === 0 ? "Buscar categoria..." : ""}
          className="min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      {open && available.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white shadow-md">
          {available.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onMouseDown={() => add(cat.name)}
              className="flex w-full items-center px-3 py-2 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-800 first:rounded-t-lg last:rounded-b-lg"
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {open && query.length > 0 && available.length === 0 && (
        <p className="px-1 text-xs text-slate-400">Nenhuma categoria encontrada.</p>
      )}

      {selected.length === 0 && (
        <p className="text-xs text-slate-400">Vazio = todas as categorias são cobertas.</p>
      )}
    </div>
  );
}

export function ContractForm({
  clientId,
  contract,
  suggestedNumber,
  categories = [],
  onDone
}: {
  clientId: string;
  contract?: ClientContract;
  suggestedNumber?: string;
  categories?: TicketCategory[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    contract?.coveredCategories ?? []
  );

  const [formData, setFormData] = useState<ContractFormState>({
    contractNumber: contract?.contractNumber ?? suggestedNumber ?? "",
    startDate: toDateInputValue(contract?.startDate),
    endDate: toDateInputValue(contract?.endDate),
    status: contract?.status ?? "ATIVO",
    coverageType: contract?.coverageType ?? "PARCIAL",
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

    const fd = new FormData(event.currentTarget);
    const rawMonthlyValue = parseFloat(fd.get("monthlyValue") as string);

    startTransition(async () => {
      const payload = {
        contractNumber: formData.contractNumber,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        status: formData.status,
        coverageType: formData.coverageType,
        monthlyValue: rawMonthlyValue > 0 ? rawMonthlyValue : undefined,
        coveredCategories: selectedCategories,
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
          <Label htmlFor="contractNumber">
            Número do contrato *{" "}
            {!contract && suggestedNumber && (
              <span className="text-slate-400 text-xs">(gerado automaticamente)</span>
            )}
          </Label>
          <Input
            id="contractNumber"
            value={formData.contractNumber}
            onChange={(e) => handleChange("contractNumber", e.target.value)}
            placeholder="Ex: CONT-2026-001"
            readOnly={!contract && !!suggestedNumber}
            className={!contract && suggestedNumber ? "bg-slate-50 text-slate-500 cursor-default" : ""}
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
          <CurrencyInput
            id="monthlyValue"
            name="monthlyValue"
            defaultValue={contract?.monthlyValue}
            placeholder="0,00"
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
        <Label>Categorias cobertas</Label>
        <CategoryPicker
          categories={categories}
          selected={selectedCategories}
          onChange={setSelectedCategories}
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
