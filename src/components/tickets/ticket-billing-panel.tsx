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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  isQuickPath?: boolean;
};

type PendingTransition = FlowAction & {
  invoiceNumber: string;
  invoiceDueDate: string;
  paymentMethod: string;
  paymentDate: string;
  paymentReference: string;
  cancellationReason: string;
};

// ---------------------------------------------------------------------------
// Flow actions — quick paths destacados, fluxo detalhado abaixo
// ---------------------------------------------------------------------------

function getFlowActions(status: FinancialStatus): FlowAction[] {
  switch (status) {
    case "PENDENTE":
      return [
        {
          targetStatus: "APROVADO",
          label: "Aprovar valores",
          variant: "default",
          description: "Confirma os valores e libera para faturamento.",
          isQuickPath: true
        },
        {
          targetStatus: "PAGO",
          label: "Registrar pagamento direto",
          variant: "outline",
          description: "Use quando o pagamento já ocorreu. Encerra o ciclo completo de uma vez.",
          isQuickPath: true
        },
        {
          targetStatus: "CANCELADO",
          label: "Cancelar financeiro",
          variant: "destructive",
          description: "Encerra o ciclo financeiro sem faturamento."
        }
      ];
    case "EM_ANALISE":
      return [
        {
          targetStatus: "APROVADO",
          label: "Aprovar valores",
          variant: "default",
          description: "Confirma os valores e libera para faturamento."
        },
        {
          targetStatus: "FATURADO",
          label: "Aprovar e faturar",
          variant: "outline",
          description: "Aprova e avança diretamente para faturamento.",
          isQuickPath: true
        },
        {
          targetStatus: "PENDENTE",
          label: "Voltar para pendente",
          variant: "outline",
          description: "Retorna para revisão dos lançamentos."
        },
        {
          targetStatus: "CANCELADO",
          label: "Cancelar financeiro",
          variant: "destructive",
          description: "Encerra o ciclo financeiro sem faturamento."
        }
      ];
    case "APROVADO":
      return [
        {
          targetStatus: "FATURADO",
          label: "Registrar faturamento",
          variant: "default",
          description: "Informa os dados da cobrança emitida ao cliente."
        },
        {
          targetStatus: "CANCELADO",
          label: "Cancelar financeiro",
          variant: "destructive",
          description: "Encerra o ciclo financeiro sem faturamento."
        }
      ];
    case "FATURADO":
      return [
        {
          targetStatus: "PAGO",
          label: "Confirmar pagamento",
          variant: "default",
          description: "Registra o recebimento e encerra o ciclo financeiro."
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
          description: "Reinicia o ciclo financeiro desde o início."
        }
      ];
    case "PAGO":
      return [];
  }
}

function needsInvoiceData(t: FinancialStatus) { return t === "FATURADO"; }
function needsPaymentData(t: FinancialStatus) { return t === "PAGO"; }
function needsCancellationReason(t: FinancialStatus) { return t === "CANCELADO"; }

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
  return { ...action, invoiceNumber: "", invoiceDueDate: "", paymentMethod: "", paymentDate: "", paymentReference: "", cancellationReason: "" };
}

const statusBadge: Record<FinancialStatus, { label: string; className: string }> = {
  PENDENTE:   { label: "Pendente",    className: "bg-slate-100 text-slate-700" },
  EM_ANALISE: { label: "Em análise",  className: "bg-blue-100 text-blue-700" },
  APROVADO:   { label: "Aprovado",    className: "bg-emerald-100 text-emerald-700" },
  FATURADO:   { label: "Faturado",    className: "bg-violet-100 text-violet-700" },
  PAGO:       { label: "Pago",        className: "bg-green-100 text-green-800 font-semibold" },
  CANCELADO:  { label: "Cancelado",   className: "bg-rose-100 text-rose-700" }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TicketBillingPanel({
  ticketId,
  initialBilling,
  clientBillingProfile,
  role,
  partCatalogItems: _partCatalogItems
}: {
  ticketId: string;
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
      ? { billingType: initialBilling.billingType, discountAmount: formatCurrencyInput(initialBilling.discountAmount), internalNotes: initialBilling.internalNotes ?? "" }
      : getDefaultBilling(clientBillingProfile)
  );
  const [entryFields, setEntryFields] = useState(getDefaultEntry(clientBillingProfile));
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [pendingTransition, setPendingTransition] = useState<PendingTransition | null>(null);

  const canView = canViewFinancialModule(role);
  const canManage = canManageTicketBilling(role);
  const currentStatus = billing?.financialStatus ?? "PENDENTE";
  const summaryLocked = billing ? isBillingSummaryLocked(billing.financialStatus) : false;
  const entriesLocked = billing ? areBillingEntriesLocked(billing.financialStatus) : false;
  const flowActions = getFlowActions(currentStatus);
  const editingEntry = useMemo(() => billing?.entries.find((e) => e.id === editingEntryId) ?? null, [billing?.entries, editingEntryId]);

  if (!canView) return null;

  function syncBilling(next: TicketBilling) {
    setBilling(next);
    setSummaryFields({ billingType: next.billingType, discountAmount: formatCurrencyInput(next.discountAmount), internalNotes: next.internalNotes ?? "" });
  }

  async function callBillingApi(body: object): Promise<TicketBilling | null> {
    const response = await fetch(`/api/tickets/${ticketId}/billing`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok) { setMessage({ type: "error", text: result.message ?? "Não foi possível salvar o financeiro." }); return null; }
    return result.data as TicketBilling;
  }

  function saveSummary() {
    setMessage(null);
    startTransition(async () => {
      const data = await callBillingApi({ billingType: summaryFields.billingType, financialStatus: currentStatus, discountAmount: parseCurrencyInput(summaryFields.discountAmount), internalNotes: summaryFields.internalNotes });
      if (data) { syncBilling(data); setMessage({ type: "success", text: "Resumo financeiro salvo." }); router.refresh(); }
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
      if (data) { syncBilling(data); setPendingTransition(null); setMessage({ type: "success", text: `Status: ${statusBadge[pendingTransition.targetStatus].label}.` }); router.refresh(); }
    });
  }

  function submitEntry() {
    setMessage(null);
    startTransition(async () => {
      const url = editingEntryId ? `/api/tickets/${ticketId}/billing/entries/${editingEntryId}` : `/api/tickets/${ticketId}/billing/entries`;
      const response = await fetch(url, {
        method: editingEntryId ? "PUT" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryType: entryFields.entryType, description: entryFields.description, quantity: Number(entryFields.quantity || 0), unitPrice: parseCurrencyInput(entryFields.unitPrice), billable: entryFields.billable })
      });
      const result = await response.json();
      if (!response.ok) { setMessage({ type: "error", text: result.message ?? "Não foi possível salvar o lançamento." }); return; }
      syncBilling(result.data);
      setEntryFields(getDefaultEntry(clientBillingProfile));
      setEditingEntryId(null);
      setMessage({ type: "success", text: editingEntryId ? "Lançamento atualizado." : "Lançamento adicionado." });
      router.refresh();
    });
  }

  function startEditEntry(entry: BillingEntry) {
    setEditingEntryId(entry.id);
    setEntryFields({ entryType: entry.entryType, description: entry.description, quantity: String(entry.quantity), unitPrice: formatCurrencyInput(entry.unitPrice), billable: entry.billable });
    setMessage(null);
  }

  function cancelEditEntry() { setEditingEntryId(null); setEntryFields(getDefaultEntry(clientBillingProfile)); }

  function deleteEntry(entryId: string) {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/tickets/${ticketId}/billing/entries/${entryId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) { setMessage({ type: "error", text: result.message ?? "Não foi possível remover o lançamento." }); return; }
      syncBilling(result.data);
      if (editingEntryId === entryId) cancelEditEntry();
      setMessage({ type: "success", text: "Lançamento removido." });
      router.refresh();
    });
  }

  const badge = statusBadge[currentStatus];
  const quickPathActions = flowActions.filter((a) => a.isQuickPath);
  const detailedActions = flowActions.filter((a) => !a.isQuickPath && a.variant !== "destructive");
  const destructiveActions = flowActions.filter((a) => a.variant === "destructive");

  return (
    <div className="space-y-6">
      {message ? <FormMessage type={message.type} message={message.text} /> : null}

      {/* ── SEÇÃO 1: Situação e fluxo ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Situação financeira</CardTitle>
            <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Totais */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs text-slate-500">Subtotal</p>
              <p className="mt-1 font-semibold text-slate-950">{formatCurrency(billing?.subtotalAmount ?? 0)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs text-slate-500">Desconto</p>
              <p className="mt-1 font-semibold text-slate-950">{formatCurrency(parseCurrencyInput(summaryFields.discountAmount))}</p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-center">
              <p className="text-xs text-sky-600">Total</p>
              <p className="mt-1 font-semibold text-sky-950">
                {formatCurrency(billing ? Math.max(0, billing.subtotalAmount - parseCurrencyInput(summaryFields.discountAmount)) : 0)}
              </p>
            </div>
          </div>

          {/* Configuração */}
          {!summaryLocked && canManage ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="billingType">Tipo de cobrança</Label>
                <Select id="billingType" value={summaryFields.billingType} disabled={isPending || entriesLocked}
                  onChange={(e) => setSummaryFields((c) => ({ ...c, billingType: e.target.value as BillingType }))}>
                  <option value="AVULSO">Avulso</option>
                  <option value="CONTRATO">Contrato</option>
                  <option value="GARANTIA">Garantia</option>
                  <option value="CORTESIA">Cortesia</option>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="discountAmount">Desconto (R$)</Label>
                <Input id="discountAmount" value={summaryFields.discountAmount} disabled={isPending || entriesLocked}
                  onChange={(e) => setSummaryFields((c) => ({ ...c, discountAmount: e.target.value }))}
                  onBlur={() => setSummaryFields((c) => ({ ...c, discountAmount: formatCurrencyInput(parseCurrencyInput(c.discountAmount)) }))} />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="internalNotes">Observações internas</Label>
                <Textarea id="internalNotes" value={summaryFields.internalNotes} disabled={isPending}
                  onChange={(e) => setSummaryFields((c) => ({ ...c, internalNotes: e.target.value }))}
                  placeholder="Observações para faturamento, contrato ou aprovação" />
              </div>
              <div className="md:col-span-2">
                <Button type="button" variant="outline" className="w-full" disabled={isPending} onClick={saveSummary}>
                  {isPending ? "Salvando..." : "Salvar configurações"}
                </Button>
              </div>
            </div>
          ) : null}

          {/* Dados registrados de faturamento */}
          {billing && ["FATURADO", "PAGO"].includes(currentStatus) ? (
            <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900 space-y-1">
              <p className="font-semibold">Faturamento</p>
              {billing.invoiceNumber ? <p>Cobrança: <span className="font-medium">{billing.invoiceNumber}</span></p> : null}
              {billing.invoiceDueDate ? <p>Vencimento: <span className="font-medium">{new Date(billing.invoiceDueDate).toLocaleDateString("pt-BR")}</span></p> : null}
            </div>
          ) : null}

          {/* Dados registrados de pagamento */}
          {billing && currentStatus === "PAGO" ? (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 space-y-1">
              <p className="font-semibold">Pagamento recebido</p>
              {billing.paymentMethod ? <p>Forma: <span className="font-medium">{billing.paymentMethod}</span></p> : null}
              {billing.paymentDate ? <p>Data: <span className="font-medium">{new Date(billing.paymentDate).toLocaleDateString("pt-BR")}</span></p> : null}
              {billing.paymentReference ? <p>Ref.: <span className="font-medium">{billing.paymentReference}</span></p> : null}
            </div>
          ) : null}

          {/* Motivo de cancelamento */}
          {billing?.cancellationReason ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <p className="font-semibold">Motivo do cancelamento</p>
              <p className="mt-1">{billing.cancellationReason}</p>
            </div>
          ) : null}

          {/* Ações de fluxo */}
          {canManage && !summaryLocked ? (
            <div className="border-t border-slate-200 pt-4 space-y-2">
              {pendingTransition ? (
                /* Formulário de confirmação da transição */
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-sky-950">{pendingTransition.label}</p>
                    <p className="text-xs text-sky-700 mt-0.5">{pendingTransition.description}</p>
                  </div>

                  {needsInvoiceData(pendingTransition.targetStatus) ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="grid gap-1.5">
                        <Label htmlFor="invoiceNumber">Número da cobrança <span className="text-slate-400">(opcional)</span></Label>
                        <Input id="invoiceNumber" placeholder="Ex.: NF-0042" value={pendingTransition.invoiceNumber} disabled={isPending}
                          onChange={(e) => setPendingTransition((t) => t ? { ...t, invoiceNumber: e.target.value } : t)} />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="invoiceDueDate">Data de vencimento <span className="text-rose-500">*</span></Label>
                        <Input id="invoiceDueDate" type="date" value={pendingTransition.invoiceDueDate} disabled={isPending}
                          onChange={(e) => setPendingTransition((t) => t ? { ...t, invoiceDueDate: e.target.value } : t)} />
                      </div>
                    </div>
                  ) : null}

                  {needsPaymentData(pendingTransition.targetStatus) ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="grid gap-1.5">
                        <Label htmlFor="paymentDate">Data do recebimento <span className="text-rose-500">*</span></Label>
                        <Input id="paymentDate" type="date" value={pendingTransition.paymentDate} disabled={isPending}
                          onChange={(e) => setPendingTransition((t) => t ? { ...t, paymentDate: e.target.value } : t)} />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="paymentMethod">Forma de pagamento <span className="text-rose-500">*</span></Label>
                        <Select id="paymentMethod" value={pendingTransition.paymentMethod} disabled={isPending}
                          onChange={(e) => setPendingTransition((t) => t ? { ...t, paymentMethod: e.target.value } : t)}>
                          <option value="">Selecione...</option>
                          {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                        </Select>
                      </div>
                      <div className="grid gap-1.5 md:col-span-2">
                        <Label htmlFor="paymentReference">Referência / comprovante <span className="text-slate-400">(opcional)</span></Label>
                        <Input id="paymentReference" placeholder="Código Pix, número do boleto, etc." value={pendingTransition.paymentReference} disabled={isPending}
                          onChange={(e) => setPendingTransition((t) => t ? { ...t, paymentReference: e.target.value } : t)} />
                      </div>
                    </div>
                  ) : null}

                  {needsCancellationReason(pendingTransition.targetStatus) ? (
                    <div className="grid gap-1.5">
                      <Label htmlFor="cancellationReason">Motivo do cancelamento <span className="text-rose-500">*</span></Label>
                      <Textarea id="cancellationReason" placeholder="Descreva o motivo para registro no histórico" value={pendingTransition.cancellationReason} disabled={isPending}
                        onChange={(e) => setPendingTransition((t) => t ? { ...t, cancellationReason: e.target.value } : t)} />
                    </div>
                  ) : null}

                  <div className="flex gap-2">
                    <Button type="button" className="flex-1" onClick={executeTransition} disabled={
                      isPending ||
                      (needsInvoiceData(pendingTransition.targetStatus) && !pendingTransition.invoiceDueDate) ||
                      (needsPaymentData(pendingTransition.targetStatus) && (!pendingTransition.paymentDate || !pendingTransition.paymentMethod)) ||
                      (needsCancellationReason(pendingTransition.targetStatus) && !pendingTransition.cancellationReason.trim())
                    }>
                      {isPending ? "Salvando..." : "Confirmar"}
                    </Button>
                    <Button type="button" variant="outline" className="flex-1" disabled={isPending} onClick={() => setPendingTransition(null)}>
                      Voltar
                    </Button>
                  </div>
                </div>
              ) : (
                /* Botões de ação */
                <div className="space-y-2">
                  {/* Ações principais */}
                  {[...quickPathActions, ...detailedActions].map((action) => (
                    <Button key={action.targetStatus} type="button" variant={action.variant === "default" ? "default" : "outline"} className="w-full" disabled={isPending}
                      onClick={() => setPendingTransition(emptyTransition(action))}>
                      {action.label}
                    </Button>
                  ))}

                  {/* Cancelar (separado visualmente) */}
                  {destructiveActions.length > 0 && (quickPathActions.length > 0 || detailedActions.length > 0) ? (
                    <div className="pt-1" />
                  ) : null}
                  {destructiveActions.map((action) => (
                    <Button key={action.targetStatus} type="button" variant="outline"
                      className="w-full border-rose-200 text-rose-700 hover:bg-rose-50" disabled={isPending}
                      onClick={() => setPendingTransition(emptyTransition(action))}>
                      {action.label}
                    </Button>
                  ))}

                  {flowActions.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-2">✓ Ciclo financeiro concluído.</p>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}

          {summaryLocked && currentStatus === "PAGO" ? (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              ✓ Este financeiro foi pago e está totalmente encerrado.
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* ── SEÇÃO 2: Lançamentos ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lançamentos</CardTitle>
            {billing ? <span className="text-sm text-slate-500">{billing.entries.length} item{billing.entries.length !== 1 ? "s" : ""}</span> : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {billing?.entries.length ? (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
              {billing.entries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-3 bg-white">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-950 truncate">{entry.description}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {entry.entryType} · {entry.quantity} × {formatCurrency(entry.unitPrice)} · {entry.billable ? "Faturável" : "Não faturável"}
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
              Nenhum lançamento adicionado ainda.
            </div>
          )}

          {canManage && !entriesLocked ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
              <p className="text-sm font-semibold text-slate-700">{editingEntry ? "Editando lançamento" : "Novo lançamento"}</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="entryType">Tipo</Label>
                  <Select id="entryType" value={entryFields.entryType} disabled={isPending}
                    onChange={(e) => setEntryFields((c) => ({ ...c, entryType: e.target.value as BillingEntryType }))}>
                    <option value="LABOR">Horas</option>
                    <option value="PART">Material</option>
                    <option value="TRAVEL">Deslocamento</option>
                    <option value="EXTRA">Extra</option>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="entryDescription">Descrição</Label>
                  <Input id="entryDescription" value={entryFields.description} disabled={isPending}
                    onChange={(e) => setEntryFields((c) => ({ ...c, description: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input id="quantity" type="number" min="0.01" step="0.01" value={entryFields.quantity} disabled={isPending}
                    onChange={(e) => setEntryFields((c) => ({ ...c, quantity: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unitPrice">Valor unitário</Label>
                  <Input id="unitPrice" value={entryFields.unitPrice} disabled={isPending}
                    onChange={(e) => setEntryFields((c) => ({ ...c, unitPrice: e.target.value }))}
                    onBlur={() => setEntryFields((c) => ({ ...c, unitPrice: formatCurrencyInput(parseCurrencyInput(c.unitPrice)) }))} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={entryFields.billable} disabled={isPending}
                      onChange={(e) => setEntryFields((c) => ({ ...c, billable: e.target.checked }))} />
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
            <p className="text-xs text-slate-500">Lançamentos bloqueados — status <strong>{badge.label}</strong>.</p>
          ) : null}
        </CardContent>
      </Card>

      {/* ── SEÇÃO 3: Histórico ── */}
      {billing?.history.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Histórico financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-4 space-y-0">
              <div className="absolute left-0 top-2 bottom-2 w-px bg-slate-200" />
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
