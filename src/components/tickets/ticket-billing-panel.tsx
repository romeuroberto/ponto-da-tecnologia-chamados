"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatCurrencyInput, formatDate, parseCurrencyInput } from "@/lib/utils";
import type { AppUser, BillingEntry, BillingEntryType, BillingType, ClientBillingProfile, FinancialStatus, TicketBilling } from "@/types";
import { canManageTicketBilling, canViewFinancialModule } from "@/server/auth/permissions";

type SummaryFormState = {
  billingType: BillingType;
  financialStatus: FinancialStatus;
  discountAmount: string;
  internalNotes: string;
};

type EntryFormState = {
  entryType: BillingEntryType;
  description: string;
  quantity: string;
  unitPrice: string;
  billable: boolean;
};

function getDefaultBilling(profile?: ClientBillingProfile): SummaryFormState {
  return {
    billingType: profile?.defaultBillingType ?? "AVULSO",
    financialStatus: "PENDENTE" as const,
    discountAmount: formatCurrencyInput(profile?.defaultDiscountPercent ?? 0),
    internalNotes: profile?.contractNotes ?? ""
  };
}

function getDefaultEntry(profile?: ClientBillingProfile): EntryFormState {
  return {
    entryType: "LABOR" as const,
    description: "",
    quantity: "1",
    unitPrice: formatCurrencyInput(profile?.hourlyRate ?? 0),
    billable: true
  };
}

export function TicketBillingPanel({
  ticketId,
  initialBilling,
  clientBillingProfile,
  role
}: {
  ticketId: string;
  initialBilling?: TicketBilling;
  clientBillingProfile?: ClientBillingProfile;
  role: AppUser["role"];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [billing, setBilling] = useState<TicketBilling | undefined>(initialBilling);
  const [summaryFields, setSummaryFields] = useState(() =>
    initialBilling
      ? {
          billingType: initialBilling.billingType,
          financialStatus: initialBilling.financialStatus,
          discountAmount: formatCurrencyInput(initialBilling.discountAmount),
          internalNotes: initialBilling.internalNotes ?? ""
        }
      : getDefaultBilling(clientBillingProfile)
  );
  const [entryFields, setEntryFields] = useState(getDefaultEntry(clientBillingProfile));
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const canView = canViewFinancialModule(role);
  const canManage = canManageTicketBilling(role);

  const editingEntry = useMemo(
    () => billing?.entries.find((entry) => entry.id === editingEntryId) ?? null,
    [billing?.entries, editingEntryId]
  );

  if (!canView) {
    return null;
  }

  function syncBilling(nextBilling: TicketBilling) {
    setBilling(nextBilling);
    setSummaryFields({
      billingType: nextBilling.billingType,
      financialStatus: nextBilling.financialStatus,
      discountAmount: formatCurrencyInput(nextBilling.discountAmount),
      internalNotes: nextBilling.internalNotes ?? ""
    });
  }

  function saveSummary() {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/tickets/${ticketId}/billing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          billingType: summaryFields.billingType,
          financialStatus: summaryFields.financialStatus,
          discountAmount: parseCurrencyInput(summaryFields.discountAmount),
          internalNotes: summaryFields.internalNotes
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: result.message ?? "Não foi possível salvar o resumo financeiro."
        });
        return;
      }

      syncBilling(result.data);
      setMessage({
        type: "success",
        text: "Resumo financeiro salvo com sucesso."
      });
      router.refresh();
    });
  }

  function submitEntry() {
    setMessage(null);

    startTransition(async () => {
      const url = editingEntryId
        ? `/api/tickets/${ticketId}/billing/entries/${editingEntryId}`
        : `/api/tickets/${ticketId}/billing/entries`;
      const method = editingEntryId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          entryType: entryFields.entryType,
          description: entryFields.description,
          quantity: Number(entryFields.quantity || 0),
          unitPrice: parseCurrencyInput(entryFields.unitPrice),
          billable: entryFields.billable
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: result.message ?? "Não foi possível salvar o lançamento financeiro."
        });
        return;
      }

      syncBilling(result.data);
      setEntryFields(getDefaultEntry(clientBillingProfile));
      setEditingEntryId(null);
      setMessage({
        type: "success",
        text: editingEntryId ? "Lançamento financeiro atualizado." : "Lançamento financeiro adicionado."
      });
      router.refresh();
    });
  }

  function startEditEntry(entry: BillingEntry) {
    setEditingEntryId(entry.id);
    setEntryFields({
      entryType: entry.entryType,
      description: entry.description,
      quantity: String(entry.quantity),
      unitPrice: formatCurrencyInput(entry.unitPrice),
      billable: entry.billable
    });
    setMessage(null);
  }

  function cancelEditEntry() {
    setEditingEntryId(null);
    setEntryFields(getDefaultEntry(clientBillingProfile));
  }

  function deleteEntry(entryId: string) {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/tickets/${ticketId}/billing/entries/${entryId}`, {
        method: "DELETE"
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: result.message ?? "Não foi possível remover o lançamento financeiro."
        });
        return;
      }

      syncBilling(result.data);
      if (editingEntryId === entryId) {
        cancelEditEntry();
      }
      setMessage({
        type: "success",
        text: "Lançamento financeiro removido."
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {message ? <FormMessage type={message.type} message={message.text} /> : null}
      <Card>
        <CardHeader>
          <CardTitle>Financeiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!billing && clientBillingProfile ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              Perfil financeiro do cliente aplicado como sugestão inicial. Revise e salve para criar o financeiro deste chamado.
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="billingType">Tipo de cobrança</Label>
              <Select
                id="billingType"
                value={summaryFields.billingType}
                disabled={!canManage || isPending}
                onChange={(event) =>
                  setSummaryFields((current) => ({
                    ...current,
                    billingType: event.target.value as typeof current.billingType
                  }))
                }
              >
                <option value="AVULSO">Avulso</option>
                <option value="CONTRATO">Contrato</option>
                <option value="GARANTIA">Garantia</option>
                <option value="CORTESIA">Cortesia</option>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="financialStatus">Status financeiro</Label>
              <Select
                id="financialStatus"
                value={summaryFields.financialStatus}
                disabled={!canManage || isPending}
                onChange={(event) =>
                  setSummaryFields((current) => ({
                    ...current,
                    financialStatus: event.target.value as typeof current.financialStatus
                  }))
                }
              >
                <option value="PENDENTE">Pendente</option>
                <option value="EM_ANALISE">Em análise</option>
                <option value="APROVADO">Aprovado</option>
                <option value="FATURADO">Faturado</option>
                <option value="PAGO">Pago</option>
                <option value="CANCELADO">Cancelado</option>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="discountAmount">Desconto</Label>
              <Input
                id="discountAmount"
                value={summaryFields.discountAmount}
                disabled={!canManage || isPending}
                onChange={(event) =>
                  setSummaryFields((current) => ({
                    ...current,
                    discountAmount: event.target.value
                  }))
                }
                onBlur={() =>
                  setSummaryFields((current) => ({
                    ...current,
                    discountAmount: formatCurrencyInput(parseCurrencyInput(current.discountAmount))
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Resumo</Label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p>Subtotal: {formatCurrency(billing?.subtotalAmount ?? 0)}</p>
                <p>Desconto: {formatCurrency(parseCurrencyInput(summaryFields.discountAmount))}</p>
                <p className="mt-1 font-semibold text-slate-950">
                  Total: {formatCurrency(billing ? Math.max(0, billing.subtotalAmount - parseCurrencyInput(summaryFields.discountAmount)) : 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="internalNotes">Observações internas</Label>
            <Textarea
              id="internalNotes"
              value={summaryFields.internalNotes}
              disabled={!canManage || isPending}
              onChange={(event) =>
                setSummaryFields((current) => ({
                  ...current,
                  internalNotes: event.target.value
                }))
              }
              placeholder="Observações para faturamento, contrato ou aprovação"
            />
          </div>
          {canManage ? (
            <Button type="button" className="w-full" disabled={isPending} onClick={saveSummary}>
              {isPending ? "Salvando..." : "Salvar resumo financeiro"}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lançamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {billing?.entries.length ? (
            billing.entries.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{entry.description}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {entry.entryType} | {entry.quantity} x {formatCurrency(entry.unitPrice)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {entry.billable ? "Faturável" : "Não faturável"} | Criado por {entry.createdByName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-950">{formatCurrency(entry.totalPrice)}</span>
                    {canManage ? (
                      <>
                        <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => startEditEntry(entry)}>
                          Editar
                        </Button>
                        <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => deleteEntry(entry.id)}>
                          Remover
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              Nenhum lançamento financeiro adicionado ainda.
            </div>
          )}

          {canManage ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="entryType">Tipo</Label>
                  <Select
                    id="entryType"
                    value={entryFields.entryType}
                    disabled={isPending}
                    onChange={(event) =>
                      setEntryFields((current) => ({
                        ...current,
                        entryType: event.target.value as typeof current.entryType
                      }))
                    }
                  >
                    <option value="LABOR">Horas</option>
                    <option value="PART">Peça</option>
                    <option value="TRAVEL">Deslocamento</option>
                    <option value="EXTRA">Extra</option>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={entryFields.description}
                    disabled={isPending}
                    onChange={(event) =>
                      setEntryFields((current) => ({
                        ...current,
                        description: event.target.value
                      }))
                    }
                  />
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={entryFields.quantity}
                    disabled={isPending}
                    onChange={(event) =>
                      setEntryFields((current) => ({
                        ...current,
                        quantity: event.target.value
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unitPrice">Valor unitário</Label>
                  <Input
                    id="unitPrice"
                    value={entryFields.unitPrice}
                    disabled={isPending}
                    onChange={(event) =>
                        setEntryFields((current) => ({
                          ...current,
                        unitPrice: event.target.value
                        }))
                      }
                      onBlur={() =>
                        setEntryFields((current) => ({
                          ...current,
                          unitPrice: formatCurrencyInput(parseCurrencyInput(current.unitPrice))
                        }))
                      }
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={entryFields.billable}
                      disabled={isPending}
                      onChange={(event) =>
                        setEntryFields((current) => ({
                          ...current,
                          billable: event.target.checked
                        }))
                      }
                    />
                    Faturável
                  </label>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 md:flex-row">
                <Button type="button" className="md:flex-1" disabled={isPending} onClick={submitEntry}>
                  {isPending ? "Salvando..." : editingEntry ? "Atualizar lançamento" : "Adicionar lançamento"}
                </Button>
                {editingEntry ? (
                  <Button type="button" variant="outline" className="md:flex-1" disabled={isPending} onClick={cancelEditEntry}>
                    Cancelar edição
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {billing?.history.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Histórico financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {billing.history.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-slate-950">{item.authorName}</p>
                  <p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                </div>
                <p className="mt-2 text-sm text-slate-700">{item.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
