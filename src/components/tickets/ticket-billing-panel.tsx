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
import { areBillingEntriesLocked, isBillingSummaryLocked, PAYMENT_METHODS } from "@/lib/billing-rules";
import { formatCurrency, formatCurrencyInput, formatDate, parseCurrencyInput } from "@/lib/utils";
import type {
  AppUser,
  BillingEntry,
  BillingEntryType,
  BillingType,
  ClientBillingProfile,
  FinancialStatus,
  PartCatalogItem,
  TicketBilling
} from "@/types";
import { canManageTicketBilling, canViewFinancialModule } from "@/server/auth/permissions";

type SummaryFormState = {
  billingType: BillingType;
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

type FlowAction = {
  targetStatus: FinancialStatus;
  label: string;
  variant: "default" | "outline" | "destructive";
  description: string;
  tone?: "primary" | "secondary";
};

type PendingTransition = FlowAction & {
  invoiceNumber: string;
  invoiceDueDate: string;
  paymentMethod: string;
  paymentDate: string;
  paymentReference: string;
  cancellationReason: string;
};

const entryTypeLabel: Record<BillingEntryType, string> = {
  LABOR: "Mão de obra",
  PART: "Material / Peça",
  TRAVEL: "Deslocamento",
  EXTRA: "Cobrança avulsa",
  CONSULTING: "Consultoria / Análise",
  REMOTE_SUPPORT: "Suporte Remoto"
};

function getFlowActions(status: FinancialStatus, billingType: BillingType): FlowAction[] {
  const isNoChargeFlow = billingType === "CORTESIA" || billingType === "GARANTIA";

  switch (status) {
    case "PENDENTE":
      return [
        {
          targetStatus: "FATURADO",
          label: "Registrar cobrança",
          variant: "default",
          description: "Registra os dados da cobrança e avança o financeiro.",
          tone: "primary"
        },
        {
          targetStatus: "PAGO",
          label: isNoChargeFlow ? "Concluir sem cobrança" : "Registrar pagamento direto",
          variant: "outline",
          description: isNoChargeFlow
            ? "Fecha o ciclo financeiro sem gerar cobrança para o cliente."
            : "Use quando o pagamento já ocorreu e você quer concluir o fluxo de uma vez.",
          tone: "secondary"
        },
        {
          targetStatus: "CANCELADO",
          label: "Cancelar financeiro",
          variant: "destructive",
          description: "Encerra o ciclo financeiro sem cobrança."
        }
      ];
    case "EM_ANALISE":
    case "APROVADO":
      return [
        {
          targetStatus: "FATURADO",
          label: "Registrar cobrança",
          variant: "default",
          description: "Registra os dados da cobrança e segue para recebimento.",
          tone: "primary"
        },
        {
          targetStatus: "PENDENTE",
          label: "Reabrir revisão",
          variant: "outline",
          description: "Permite revisar lançamentos e valores antes de faturar.",
          tone: "secondary"
        },
        {
          targetStatus: "CANCELADO",
          label: "Cancelar financeiro",
          variant: "destructive",
          description: "Encerra o ciclo financeiro sem cobrança."
        }
      ];
    case "FATURADO":
      return [
        {
          targetStatus: "PAGO",
          label: "Confirmar pagamento",
          variant: "default",
          description: "Registra o recebimento e conclui o financeiro.",
          tone: "primary"
        },
        {
          targetStatus: "CANCELADO",
          label: "Cancelar financeiro",
          variant: "destructive",
          description: "Cancela a cobrança já emitida."
        }
      ];
    case "CANCELADO":
      return [
        {
          targetStatus: "PENDENTE",
          label: "Reabrir financeiro",
          variant: "outline",
          description: "Reinicia o ciclo financeiro para nova revisão.",
          tone: "secondary"
        }
      ];
    case "PAGO":
      return [];
  }
}

function needsInvoiceData(status: FinancialStatus) {
  return status === "FATURADO";
}

function needsPaymentData(status: FinancialStatus, billingType: BillingType) {
  return status === "PAGO" && billingType !== "CORTESIA" && billingType !== "GARANTIA";
}

function needsCancellationReason(status: FinancialStatus) {
  return status === "CANCELADO";
}

function getDefaultBilling(profile?: ClientBillingProfile): SummaryFormState {
  return {
    billingType: profile?.defaultBillingType ?? "AVULSO",
    discountAmount: formatCurrencyInput(profile?.defaultDiscountPercent ?? 0),
    internalNotes: profile?.contractNotes ?? ""
  };
}

function getDefaultEntry(profile?: ClientBillingProfile): EntryFormState {
  return {
    entryType: "LABOR",
    description: "",
    quantity: "1",
    unitPrice: formatCurrencyInput(profile?.hourlyRate ?? 0),
    billable: true
  };
}

function emptyTransition(action: FlowAction): PendingTransition {
  return {
    ...action,
    invoiceNumber: "",
    invoiceDueDate: "",
    paymentMethod: "",
    paymentDate: "",
    paymentReference: "",
    cancellationReason: ""
  };
}

const statusBadge: Record<FinancialStatus, { label: string; className: string }> = {
  PENDENTE: { label: "Pendente", className: "bg-slate-100 text-slate-700" },
  EM_ANALISE: { label: "Em revisão interna", className: "bg-blue-100 text-blue-700" },
  APROVADO: { label: "Pronto para faturar", className: "bg-emerald-100 text-emerald-700" },
  FATURADO: { label: "Faturado", className: "bg-violet-100 text-violet-700" },
  PAGO: { label: "Pago", className: "bg-green-100 text-green-800 font-semibold" },
  CANCELADO: { label: "Cancelado", className: "bg-rose-100 text-rose-700" }
};

const TERMINAL_TECHNICAL_STATUSES = ["RESOLVED", "CLOSED", "CANCELED"] as const;

export function TicketBillingPanel({
  ticketId,
  ticketStatus,
  initialBilling,
  clientBillingProfile,
  role,
  partCatalogItems: _partCatalogItems
}: {
  ticketId: string;
  ticketStatus: string;
  initialBilling?: TicketBilling;
  clientBillingProfile?: ClientBillingProfile;
  role: AppUser["role"];
  partCatalogItems?: PartCatalogItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [billing, setBilling] = useState<TicketBilling | undefined>(initialBilling);
  const [summaryFields, setSummaryFields] = useState<SummaryFormState>(() =>
    initialBilling
      ? {
          billingType: initialBilling.billingType,
          discountAmount: formatCurrencyInput(initialBilling.discountAmount),
          internalNotes: initialBilling.internalNotes ?? ""
        }
      : getDefaultBilling(clientBillingProfile)
  );
  const [entryFields, setEntryFields] = useState(getDefaultEntry(clientBillingProfile));
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [pendingTransition, setPendingTransition] = useState<PendingTransition | null>(null);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const canView = canViewFinancialModule(role);
  const canManage = canManageTicketBilling(role);
  const isTechnicallyComplete = TERMINAL_TECHNICAL_STATUSES.includes(ticketStatus as typeof TERMINAL_TECHNICAL_STATUSES[number]);
  const currentStatus = billing?.financialStatus ?? "PENDENTE";
  const activeBillingType: BillingType = billing?.billingType ?? summaryFields.billingType;
  const summaryLocked = billing ? isBillingSummaryLocked(billing.financialStatus) : false;
  const entriesLocked = billing ? areBillingEntriesLocked(billing.financialStatus) : false;
  const flowActions = getFlowActions(currentStatus, activeBillingType);
  const editingEntry = useMemo(() => billing?.entries.find((entry) => entry.id === editingEntryId) ?? null, [billing?.entries, editingEntryId]);

  if (!canView) return null;

  function syncBilling(next: TicketBilling) {
    setBilling(next);
    setSummaryFields({
      billingType: next.billingType,
      discountAmount: formatCurrencyInput(next.discountAmount),
      internalNotes: next.internalNotes ?? ""
    });
  }

  async function callBillingApi(body: object): Promise<TicketBilling | null> {
    const response = await fetch(`/api/tickets/${ticketId}/billing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage({ type: "error", text: result.message ?? "Não foi possível salvar o financeiro." });
      return null;
    }
    return result.data as TicketBilling;
  }

  function saveSummary() {
    setMessage(null);
    startTransition(async () => {
      const data = await callBillingApi({
        billingType: summaryFields.billingType,
        financialStatus: currentStatus,
        discountAmount: parseCurrencyInput(summaryFields.discountAmount),
        internalNotes: summaryFields.internalNotes
      });

      if (data) {
        syncBilling(data);
        setMessage({ type: "success", text: "Resumo financeiro salvo." });
        router.refresh();
      }
    });
  }

  function executeTransition() {
    if (!pendingTransition) return;
    setMessage(null);

    startTransition(async () => {
      const data = await callBillingApi({
        billingType: billing?.billingType ?? summaryFields.billingType,
        financialStatus: pendingTransition.targetStatus,
        discountAmount: parseCurrencyInput(summaryFields.discountAmount),
        internalNotes: summaryFields.internalNotes,
        invoiceNumber: pendingTransition.invoiceNumber || undefined,
        invoiceDueDate: pendingTransition.invoiceDueDate ? new Date(pendingTransition.invoiceDueDate).toISOString() : undefined,
        paymentMethod: pendingTransition.paymentMethod || undefined,
        paymentDate: pendingTransition.paymentDate ? new Date(pendingTransition.paymentDate).toISOString() : undefined,
        paymentReference: pendingTransition.paymentReference || undefined,
        cancellationReason: pendingTransition.cancellationReason || undefined
      });

      if (data) {
        syncBilling(data);
        setPendingTransition(null);
        setMessage({ type: "success", text: `Status: ${statusBadge[pendingTransition.targetStatus].label}.` });
        router.refresh();
      }
    });
  }

  function submitEntry() {
    setMessage(null);
    startTransition(async () => {
      const url = editingEntryId ? `/api/tickets/${ticketId}/billing/entries/${editingEntryId}` : `/api/tickets/${ticketId}/billing/entries`;
      const response = await fetch(url, {
        method: editingEntryId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
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
        setMessage({ type: "error", text: result.message ?? "Não foi possível salvar o lançamento." });
        return;
      }
      syncBilling(result.data);
      setEntryFields(getDefaultEntry(clientBillingProfile));
      setEditingEntryId(null);
      setMessage({ type: "success", text: editingEntryId ? "Lançamento atualizado." : "Lançamento adicionado." });
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

  function generateReceipt() {
    setIsGeneratingReceipt(true);
    setMessage(null);
    fetch(`/api/tickets/${ticketId}/recibo`, { method: "POST" })
      .then(async (res) => {
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setMessage({ type: "error", text: (json as { message?: string }).message ?? "Não foi possível gerar o recibo." });
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setReceiptUrl(url);
      })
      .catch(() => setMessage({ type: "error", text: "Falha na conexão. Tente novamente." }))
      .finally(() => setIsGeneratingReceipt(false));
  }

  function deleteEntry(entryId: string) {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/tickets/${ticketId}/billing/entries/${entryId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        setMessage({ type: "error", text: result.message ?? "Não foi possível remover o lançamento." });
        return;
      }
      syncBilling(result.data);
      if (editingEntryId === entryId) cancelEditEntry();
      setMessage({ type: "success", text: "Lançamento removido." });
      router.refresh();
    });
  }

  function applyContractCoverage() {
    const contract = billing?.activeContract;
    if (!contract) return;
    const totalToDiscount = Math.max(0, (billing?.osContributionsTotal ?? 0) + (billing?.subtotalAmount ?? 0));
    const today = new Date().toISOString().slice(0, 10);
    setMessage(null);
    startTransition(async () => {
      const data = await callBillingApi({
        billingType: "CONTRATO",
        financialStatus: "PAGO",
        discountAmount: totalToDiscount,
        internalNotes: summaryFields.internalNotes || `Coberto pelo contrato ${contract.contractNumber}`,
        paymentMethod: `Contrato ${contract.contractNumber}`,
        paymentDate: new Date(today).toISOString()
      });
      if (data) {
        syncBilling(data);
        setMessage({ type: "success", text: `Cobertura do contrato ${contract.contractNumber} aplicada.` });
        router.refresh();
      }
    });
  }

  const badge = statusBadge[currentStatus];
  const primaryActions = flowActions.filter((action) => action.tone === "primary");
  const secondaryActions = flowActions.filter((action) => action.tone === "secondary");
  const destructiveActions = flowActions.filter((action) => action.variant === "destructive");

  return (
    <div className="space-y-6">
      {!isTechnicallyComplete ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-semibold">Chamado ainda não concluído tecnicamente.</span>{" "}
          Lançamentos podem ser registrados, mas não é possível faturar ou registrar pagamento enquanto o chamado não estiver Resolvido ou Encerrado.
        </div>
      ) : null}
      {message ? <FormMessage type={message.type} message={message.text} /> : null}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lançamentos</CardTitle>
            {billing ? (
              <span className="text-sm text-slate-500">
                {billing.osContributions.length > 0 ? `${billing.osContributions.length} OS + ` : ""}
                {billing.entries.length} avulso{billing.entries.length !== 1 ? "s" : ""}
              </span>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {billing && billing.osContributions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ordens de Serviço concluídas</p>
              <div className="divide-y divide-emerald-100 overflow-hidden rounded-xl border border-emerald-200">
                {billing.osContributions.map((c) => (
                  <div key={c.osId} className="flex items-center gap-3 bg-emerald-50/40 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">OS {c.osNumber}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Mão de obra: {formatCurrency(c.laborAmount)} · Materiais: {formatCurrency(c.partsAmount)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-emerald-700">{formatCurrency(c.totalAmount)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {billing && billing.osContributions.length > 0 ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lançamentos avulsos</p>
          ) : null}

          {billing?.entries.length ? (
            <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
              {billing.entries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 bg-white px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-950">{entry.description}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {entryTypeLabel[entry.entryType]} · {entry.quantity} x {formatCurrency(entry.unitPrice)} · {entry.billable ? "Faturável" : "Não faturável"}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-slate-950">{formatCurrency(entry.totalPrice)}</span>
                  {canManage && !entriesLocked ? (
                    <div className="flex shrink-0 gap-1">
                      <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => startEditEntry(entry)}>Editar</Button>
                      <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => deleteEntry(entry.id)}>Remover</Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
              Nenhum lançamento avulso adicionado.
            </div>
          )}

          {canManage && !entriesLocked ? (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">{editingEntry ? "Editando lançamento" : "Novo lançamento"}</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="entryType">Tipo</Label>
                  <Select id="entryType" value={entryFields.entryType} disabled={isPending} onChange={(e) => setEntryFields((current) => ({ ...current, entryType: e.target.value as BillingEntryType }))}>
                    <option value="LABOR">Mão de obra</option>
                    <option value="TRAVEL">Deslocamento</option>
                    <option value="EXTRA">Cobrança avulsa</option>
                    <option value="CONSULTING">Consultoria / Análise</option>
                    <option value="REMOTE_SUPPORT">Suporte Remoto</option>
                    {editingEntry?.entryType === "PART" ? <option value="PART">Material / Peça</option> : null}
                  </Select>
                  {entryFields.entryType === "LABOR" ? (
                    <p className="text-xs text-amber-600">Prefira registrar mão de obra via Ordem de Serviço para vinculação automática ao financeiro.</p>
                  ) : null}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="entryDescription">Descrição</Label>
                  <Input id="entryDescription" value={entryFields.description} disabled={isPending} onChange={(e) => setEntryFields((current) => ({ ...current, description: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input id="quantity" type="number" min="0.01" step="0.01" value={entryFields.quantity} disabled={isPending} onChange={(e) => setEntryFields((current) => ({ ...current, quantity: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unitPrice">Valor unitário</Label>
                  <Input id="unitPrice" value={entryFields.unitPrice} disabled={isPending} onChange={(e) => setEntryFields((current) => ({ ...current, unitPrice: e.target.value }))} onBlur={() => setEntryFields((current) => ({ ...current, unitPrice: formatCurrencyInput(parseCurrencyInput(current.unitPrice)) }))} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={entryFields.billable} disabled={isPending} onChange={(e) => setEntryFields((current) => ({ ...current, billable: e.target.checked }))} />
                    Faturável
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" className="flex-1" disabled={isPending} onClick={submitEntry}>
                  {isPending ? "Salvando..." : editingEntry ? "Atualizar" : "Adicionar"}
                </Button>
                {editingEntry ? (
                  <Button type="button" variant="outline" disabled={isPending} onClick={cancelEditEntry}>Cancelar</Button>
                ) : null}
              </div>
            </div>
          ) : entriesLocked ? (
            <p className="text-xs text-slate-500">Lançamentos bloqueados - status <strong>{badge.label}</strong>.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Situação financeira</CardTitle>
            <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
              <p className="text-xs text-emerald-600">OSs concluídas</p>
              <p className="mt-1 font-semibold text-emerald-900">{formatCurrency(billing?.osContributionsTotal ?? 0)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs text-slate-500">Lançamentos avulsos</p>
              <p className="mt-1 font-semibold text-slate-950">{formatCurrency(billing?.subtotalAmount ?? 0)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs text-slate-500">Desconto</p>
              <p className="mt-1 font-semibold text-slate-950">{formatCurrency(parseCurrencyInput(summaryFields.discountAmount))}</p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-center">
              <p className="text-xs text-sky-600">Total</p>
              <p className="mt-1 font-semibold text-sky-950">
                {formatCurrency(
                  billing
                    ? Math.max(
                        0,
                        (billing.osContributionsTotal ?? 0) +
                          billing.subtotalAmount -
                          parseCurrencyInput(summaryFields.discountAmount)
                      )
                    : 0
                )}
              </p>
            </div>
          </div>

          {billing?.activeContract ? (
            billing.activeContract.coverageType === "TOTAL" && currentStatus !== "PAGO" && currentStatus !== "CANCELADO" ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Contrato ativo — Cobertura Total
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    {billing.activeContract.contractNumber} · Este chamado está coberto pelo contrato do cliente.
                  </p>
                </div>
                {canManage ? (
                  <Button
                    type="button"
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white"
                    disabled={isPending}
                    onClick={applyContractCoverage}
                  >
                    {isPending ? "Aplicando..." : "Aplicar cobertura do contrato"}
                  </Button>
                ) : null}
              </div>
            ) : billing.activeContract.coverageType === "PARCIAL" ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                <span className="font-semibold">Contrato ativo — Cobertura Parcial</span>
                <span className="ml-2 text-blue-600 text-xs">{billing.activeContract.contractNumber}</span>
              </div>
            ) : null
          ) : null}

          {!summaryLocked && canManage ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="billingType">Tipo de cobrança</Label>
                <Select id="billingType" value={summaryFields.billingType} disabled={isPending || entriesLocked} onChange={(e) => setSummaryFields((current) => ({ ...current, billingType: e.target.value as BillingType }))}>
                  <option value="AVULSO">Avulso</option>
                  <option value="CONTRATO">Contrato</option>
                  <option value="GARANTIA">Garantia</option>
                  <option value="CORTESIA">Cortesia</option>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="discountAmount">Desconto (R$)</Label>
                <Input
                  id="discountAmount"
                  value={summaryFields.discountAmount}
                  disabled={isPending || entriesLocked}
                  onChange={(e) => setSummaryFields((current) => ({ ...current, discountAmount: e.target.value }))}
                  onBlur={() => setSummaryFields((current) => ({ ...current, discountAmount: formatCurrencyInput(parseCurrencyInput(current.discountAmount)) }))}
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="internalNotes">Observações internas</Label>
                <Textarea id="internalNotes" value={summaryFields.internalNotes} disabled={isPending} onChange={(e) => setSummaryFields((current) => ({ ...current, internalNotes: e.target.value }))} placeholder="Observações para cobrança, contrato ou controle interno" />
              </div>
              <div className="md:col-span-2">
                <Button type="button" variant="outline" className="w-full" disabled={isPending} onClick={saveSummary}>
                  {isPending ? "Salvando..." : "Salvar configurações"}
                </Button>
              </div>
            </div>
          ) : null}

          {billing && ["FATURADO", "PAGO"].includes(currentStatus) ? (
            <div className="space-y-1 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
              <p className="font-semibold">Cobrança registrada</p>
              {billing.invoiceNumber ? <p>Número: <span className="font-medium">{billing.invoiceNumber}</span></p> : null}
              {billing.invoiceDueDate ? <p>Vencimento: <span className="font-medium">{new Date(billing.invoiceDueDate).toLocaleDateString("pt-BR")}</span></p> : null}
            </div>
          ) : null}

          {billing && currentStatus === "PAGO" ? (
            billing.billingType === "CORTESIA" || billing.billingType === "GARANTIA" ? (
              <div className="space-y-1 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
                <p className="font-semibold">Concluído sem cobrança</p>
                <p className="text-green-700">O chamado foi fechado sem valor cobrado do cliente.</p>
              </div>
            ) : (
              <div className="space-y-1 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
                <p className="font-semibold">Pagamento confirmado</p>
                {billing.paymentMethod ? <p>Forma: <span className="font-medium">{billing.paymentMethod}</span></p> : null}
                {billing.paymentDate ? <p>Data: <span className="font-medium">{new Date(billing.paymentDate).toLocaleDateString("pt-BR")}</span></p> : null}
                {billing.paymentReference ? <p>Referência: <span className="font-medium">{billing.paymentReference}</span></p> : null}
              </div>
            )
          ) : null}

          {billing?.cancellationReason ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <p className="font-semibold">Motivo do cancelamento</p>
              <p className="mt-1">{billing.cancellationReason}</p>
            </div>
          ) : null}

          {canManage && currentStatus !== "PAGO" ? (
            <div className="space-y-2 border-t border-slate-200 pt-4">
              {pendingTransition ? (
                <div className="space-y-3 rounded-xl border border-sky-200 bg-sky-50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-sky-950">{pendingTransition.label}</p>
                    <p className="mt-0.5 text-xs text-sky-700">{pendingTransition.description}</p>
                  </div>

                  {needsInvoiceData(pendingTransition.targetStatus) ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="grid gap-1.5">
                        <Label htmlFor="invoiceNumber">Número da cobrança <span className="text-slate-400">(opcional)</span></Label>
                        <Input id="invoiceNumber" placeholder="Ex.: NF-0042" value={pendingTransition.invoiceNumber} disabled={isPending} onChange={(e) => setPendingTransition((current) => (current ? { ...current, invoiceNumber: e.target.value } : current))} />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="invoiceDueDate">Data de vencimento <span className="text-rose-500">*</span></Label>
                        <Input id="invoiceDueDate" type="date" value={pendingTransition.invoiceDueDate} disabled={isPending} onChange={(e) => setPendingTransition((current) => (current ? { ...current, invoiceDueDate: e.target.value } : current))} />
                      </div>
                    </div>
                  ) : null}

                  {needsPaymentData(pendingTransition.targetStatus, activeBillingType) ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="grid gap-1.5">
                        <Label htmlFor="paymentDate">Data do recebimento <span className="text-rose-500">*</span></Label>
                        <Input id="paymentDate" type="date" value={pendingTransition.paymentDate} disabled={isPending} onChange={(e) => setPendingTransition((current) => (current ? { ...current, paymentDate: e.target.value } : current))} />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="paymentMethod">Forma de pagamento <span className="text-rose-500">*</span></Label>
                        <Select id="paymentMethod" value={pendingTransition.paymentMethod} disabled={isPending} onChange={(e) => setPendingTransition((current) => (current ? { ...current, paymentMethod: e.target.value } : current))}>
                          <option value="">Selecione...</option>
                          {PAYMENT_METHODS.map((method) => (
                            <option key={method} value={method}>{method}</option>
                          ))}
                        </Select>
                      </div>
                      <div className="grid gap-1.5 md:col-span-2">
                        <Label htmlFor="paymentReference">Referência / comprovante <span className="text-slate-400">(opcional)</span></Label>
                        <Input id="paymentReference" placeholder="Código Pix, número do boleto, etc." value={pendingTransition.paymentReference} disabled={isPending} onChange={(e) => setPendingTransition((current) => (current ? { ...current, paymentReference: e.target.value } : current))} />
                      </div>
                    </div>
                  ) : null}

                  {needsCancellationReason(pendingTransition.targetStatus) ? (
                    <div className="grid gap-1.5">
                      <Label htmlFor="cancellationReason">Motivo do cancelamento <span className="text-rose-500">*</span></Label>
                      <Textarea id="cancellationReason" placeholder="Descreva o motivo para registro no histórico" value={pendingTransition.cancellationReason} disabled={isPending} onChange={(e) => setPendingTransition((current) => (current ? { ...current, cancellationReason: e.target.value } : current))} />
                    </div>
                  ) : null}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={executeTransition}
                      disabled={
                        isPending ||
                        (needsInvoiceData(pendingTransition.targetStatus) && !pendingTransition.invoiceDueDate) ||
                        (needsPaymentData(pendingTransition.targetStatus, activeBillingType) && (!pendingTransition.paymentDate || !pendingTransition.paymentMethod)) ||
                        (needsCancellationReason(pendingTransition.targetStatus) && !pendingTransition.cancellationReason.trim())
                      }
                    >
                      {isPending ? "Salvando..." : "Confirmar"}
                    </Button>
                    <Button type="button" variant="outline" className="flex-1" disabled={isPending} onClick={() => setPendingTransition(null)}>
                      Voltar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {primaryActions.map((action) => (
                    <Button key={action.targetStatus} type="button" className="w-full" disabled={isPending} onClick={() => setPendingTransition(emptyTransition(action))}>
                      {action.label}
                    </Button>
                  ))}
                  {secondaryActions.map((action) => (
                    <Button key={action.targetStatus} type="button" variant="outline" className="w-full" disabled={isPending} onClick={() => setPendingTransition(emptyTransition(action))}>
                      {action.label}
                    </Button>
                  ))}
                  {destructiveActions.length > 0 && (primaryActions.length > 0 || secondaryActions.length > 0) ? <div className="pt-1" /> : null}
                  {destructiveActions.map((action) => (
                    <Button key={action.targetStatus} type="button" variant="outline" className="w-full border-rose-200 text-rose-700 hover:bg-rose-50" disabled={isPending} onClick={() => setPendingTransition(emptyTransition(action))}>
                      {action.label}
                    </Button>
                  ))}
                  {flowActions.length === 0 ? <p className="py-2 text-center text-xs text-slate-500">Ciclo financeiro concluído.</p> : null}
                </div>
              )}
            </div>
          ) : null}

          {summaryLocked ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Resumo bloqueado no status atual. Para alterar valores, reabra ou reinicie o ciclo financeiro.
            </div>
          ) : null}

          {canManage && billing && currentStatus !== "CANCELADO" ? (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold text-slate-700">Recibo</p>
              <p className="text-xs text-slate-500">
                {["PAGO", "FATURADO"].includes(currentStatus)
                  ? "Gera um PDF com os dados do serviço e disponibiliza no portal do cliente."
                  : "Gera um recibo de cobrança para envio ao cliente antes do pagamento."}
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={isGeneratingReceipt} onClick={generateReceipt}>
                  {isGeneratingReceipt ? "Gerando..." : ["PAGO", "FATURADO"].includes(currentStatus) ? "Gerar recibo" : "Gerar recibo de cobrança"}
                </Button>
                {receiptUrl ? (
                  <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
                    Abrir PDF
                  </a>
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
          <CardContent>
            <div className="relative space-y-0 pl-4">
              <div className="absolute bottom-2 left-0 top-2 w-px bg-slate-200" />
              {billing.history.map((item) => (
                <div key={item.id} className="relative pb-5 last:pb-0">
                  <div className="absolute -left-[1.1rem] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-slate-300 bg-white" />
                  <div className="pl-3">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="text-sm font-semibold text-slate-950">{item.authorName}</p>
                      <p className="shrink-0 text-xs text-slate-400">{formatDate(item.createdAt)}</p>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
