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
import { formatUserWithRole } from "@/lib/users";
import { formatCurrency, formatCurrencyInput, formatDate, parseCurrencyInput } from "@/lib/utils";
import { canOperateOnTicket } from "@/server/auth/permissions";
import type { AppUser, PartCatalogItem, ServiceCatalogItem, ServiceOrder, ServiceOrderPart, ServiceOrderStatus, Ticket } from "@/types";

const MANUAL_SERVICE_OPTION = "__manual__";

type PartDraft = {
  partCatalogItemId: string;
  quantity: string;
  unitPrice: string;
  notes: string;
};

const emptyPartDraft = (): PartDraft => ({
  partCatalogItemId: "",
  quantity: "1",
  unitPrice: formatCurrencyInput(0),
  notes: ""
});

const statusLabels: Record<ServiceOrderStatus, string> = {
  PLANNED: "Planejada",
  IN_EXECUTION: "Em execução",
  PAUSED: "Em pausa",
  COMPLETED: "Concluída",
  CANCELED: "Cancelada"
};

const statusClasses: Record<ServiceOrderStatus, string> = {
  PLANNED: "bg-slate-100 text-slate-700",
  IN_EXECUTION: "bg-sky-100 text-sky-700",
  PAUSED: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELED: "bg-rose-100 text-rose-700"
};

function toDateInput(value?: string) {
  if (!value) return "";
  return value.slice(0, 10);
}

function getCatalogSelection(serviceType: string, serviceCatalogItems: ServiceCatalogItem[]) {
  return serviceCatalogItems.some((item) => item.name === serviceType) ? serviceType : MANUAL_SERVICE_OPTION;
}

function getSelectedCatalogItem(serviceType: string, serviceCatalogItems: ServiceCatalogItem[]) {
  return serviceCatalogItems.find((item) => item.name === serviceType) ?? null;
}

function getCatalogOptionLabel(item: ServiceCatalogItem) {
  return item.code ? `${item.name} (${item.code})` : item.name;
}

function getCatalogMeta(item: ServiceCatalogItem | null) {
  if (!item) return null;
  const details = [item.code ? `Código: ${item.code}` : null, item.description ? item.description : null].filter(Boolean);
  return details.join(" · ");
}

function mapPartsToDrafts(parts: ServiceOrderPart[]): PartDraft[] {
  if (parts.length === 0) {
    return [emptyPartDraft()];
  }

  return parts.map((part) => ({
    partCatalogItemId: part.partCatalogItemId,
    quantity: String(part.quantity),
    unitPrice: formatCurrencyInput(part.unitPrice),
    notes: part.notes ?? ""
  }));
}

function buildPartPayload(parts: PartDraft[]) {
  return parts
    .filter((part) => part.partCatalogItemId)
    .map((part) => ({
      partCatalogItemId: part.partCatalogItemId,
      quantity: Number(part.quantity.replace(",", ".")) || 0,
      unitPrice: parseCurrencyInput(part.unitPrice),
      notes: part.notes
    }));
}

export function TicketServiceOrdersPanel({
  ticket,
  users,
  role,
  currentUserId,
  serviceCatalogItems,
  partCatalogItems,
  isReseller = false
}: {
  ticket: Ticket;
  users: AppUser[];
  role: AppUser["role"];
  currentUserId: string;
  serviceCatalogItems: ServiceCatalogItem[];
  partCatalogItems: PartCatalogItem[];
  isReseller?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(ticket.serviceOrders ?? []);
  const [createFields, setCreateFields] = useState({
    serviceType: "",
    servicePrice: "",
    assignedTechnicianId: "",
    scheduledStartAt: "",
    executionNotes: ""
  });
  const [createParts, setCreateParts] = useState<PartDraft[]>([emptyPartDraft()]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({
    status: "PLANNED" as ServiceOrderStatus,
    serviceType: "",
    servicePrice: "",
    assignedTechnicianId: "",
    scheduledStartAt: "",
    startedAt: "",
    finishedAt: "",
    executionNotes: "",
    customerApprovalName: "",
    customerApprovalAt: ""
  });
  const [editParts, setEditParts] = useState<PartDraft[]>([emptyPartDraft()]);

  const technicianOptions = useMemo(() => users.filter((user) => user.active).sort((a, b) => a.name.localeCompare(b.name)), [users]);
  const partOptions = useMemo(() => [...partCatalogItems].sort((a, b) => a.name.localeCompare(b.name)), [partCatalogItems]);

  if (ticket.attendanceType === "REMOTE") return null;

  const ticketIsFinished = ticket.status === "CLOSED" || ticket.status === "CANCELED";
  const canManage = (role === "ADMIN" || role === "ATTENDANT") && canOperateOnTicket(role, currentUserId, ticket.assigneeId);
  const createServiceSelection = getCatalogSelection(createFields.serviceType, serviceCatalogItems);
  const editServiceSelection = getCatalogSelection(editFields.serviceType, serviceCatalogItems);
  const selectedCreateCatalogItem = getSelectedCatalogItem(createFields.serviceType, serviceCatalogItems);
  const selectedEditCatalogItem = getSelectedCatalogItem(editFields.serviceType, serviceCatalogItems);

  function syncAndRefresh(next?: ServiceOrder) {
    if (next) {
      setServiceOrders((current) => {
        const exists = current.some((item) => item.id === next.id);
        return exists ? current.map((item) => (item.id === next.id ? next : item)) : [next, ...current];
      });
    }

    router.refresh();
  }

  function resetCreateForm() {
    setCreateFields({
      serviceType: "",
      servicePrice: "",
      assignedTechnicianId: "",
      scheduledStartAt: "",
      executionNotes: ""
    });
    setCreateParts([emptyPartDraft()]);
  }

  function startEdit(serviceOrder: ServiceOrder) {
    setEditingId(serviceOrder.id);
    setEditFields({
      status: serviceOrder.status,
      serviceType: serviceOrder.serviceType ?? "",
      servicePrice: serviceOrder.servicePrice != null ? formatCurrencyInput(serviceOrder.servicePrice) : "",
      assignedTechnicianId: serviceOrder.assignedTechnicianId ?? "",
      scheduledStartAt: toDateInput(serviceOrder.scheduledStartAt),
      startedAt: toDateInput(serviceOrder.startedAt),
      finishedAt: toDateInput(serviceOrder.finishedAt),
      executionNotes: serviceOrder.executionNotes ?? "",
      customerApprovalName: serviceOrder.customerApprovalName ?? "",
      customerApprovalAt: toDateInput(serviceOrder.customerApprovalAt)
    });
    setEditParts(mapPartsToDrafts(serviceOrder.parts));
    setMessage(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditParts([emptyPartDraft()]);
    setMessage(null);
  }

  function getServicePrice(item: ServiceCatalogItem | undefined, currentPrice: string): string {
    if (!item) return currentPrice;
    const price = isReseller && item.resalePrice != null ? item.resalePrice : item.defaultPrice;
    return price != null ? formatCurrencyInput(price) : currentPrice;
  }

  function applyCatalogServiceToCreate(serviceName: string) {
    const selectedItem = serviceCatalogItems.find((item) => item.name === serviceName);
    setCreateFields((current) => ({
      ...current,
      serviceType: serviceName,
      servicePrice: getServicePrice(selectedItem, current.servicePrice),
      executionNotes: current.executionNotes || selectedItem?.description || ""
    }));
  }

  function applyCatalogServiceToEdit(serviceName: string) {
    const selectedItem = serviceCatalogItems.find((item) => item.name === serviceName);
    setEditFields((current) => ({
      ...current,
      serviceType: serviceName,
      servicePrice: getServicePrice(selectedItem, current.servicePrice),
      executionNotes: current.executionNotes || selectedItem?.description || ""
    }));
  }

  function updatePartDraft(parts: PartDraft[], index: number, nextValues: Partial<PartDraft>) {
    return parts.map((part, currentIndex) => (currentIndex === index ? { ...part, ...nextValues } : part));
  }

  function handlePartSelection(parts: PartDraft[], index: number, partCatalogItemId: string) {
    const selectedPart = partOptions.find((item) => item.id === partCatalogItemId);
    const price = isReseller && selectedPart?.resalePrice != null ? selectedPart.resalePrice : (selectedPart?.unitPrice ?? 0);

    return updatePartDraft(parts, index, {
      partCatalogItemId,
      unitPrice: formatCurrencyInput(price),
      notes: parts[index]?.notes || selectedPart?.description || ""
    });
  }

  function renderPartsEditor(parts: PartDraft[], setParts: (parts: PartDraft[]) => void) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-950">Materiais da OS</p>
              {isReseller && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Tabela de revenda</span>}
            </div>
            <p className="text-xs text-slate-500">Registre apenas os itens relevantes para este atendimento.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setParts([...parts, emptyPartDraft()])}>
            Adicionar material
          </Button>
        </div>

        {parts.map((part, index) => {
          const selectedPart = partOptions.find((item) => item.id === part.partCatalogItemId);

          return (
            <div key={`${part.partCatalogItemId}-${index}`} className="grid gap-3 rounded-xl border border-slate-200 p-3">
              <div className="grid gap-3 md:grid-cols-[1.6fr_0.7fr_0.9fr]">
                <div className="grid content-start gap-2">
                  <Label htmlFor={`part-${index}`}>Material do catálogo</Label>
                  <Select id={`part-${index}`} value={part.partCatalogItemId} onChange={(event) => setParts(handlePartSelection(parts, index, event.target.value))}>
                    <option value="">Selecione um material</option>
                    {partOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.code ? `${item.name} (${item.code})` : item.name}
                      </option>
                    ))}
                  </Select>
                  {selectedPart ? (
                    <p className="text-xs text-slate-500">
                      {selectedPart.code ? `Código: ${selectedPart.code} · ` : ""}
                      Venda: {formatCurrency(selectedPart.unitPrice)}
                      {selectedPart.resalePrice != null ? ` · Revenda: ${formatCurrency(selectedPart.resalePrice)}` : ""}
                    </p>
                  ) : null}
                </div>
                <div className="grid content-start gap-2">
                  <Label htmlFor={`quantity-${index}`}>Qtd ({selectedPart?.unit ?? "un"})</Label>
                  <Input id={`quantity-${index}`} inputMode="decimal" value={part.quantity} onChange={(event) => setParts(updatePartDraft(parts, index, { quantity: event.target.value }))} placeholder="1" />
                </div>
                <div className="grid content-start gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`unit-price-${index}`}>Valor de referência</Label>
                    {selectedPart?.resalePrice != null ? (
                      <button type="button" className="text-xs text-sky-600 hover:underline" onClick={() => setParts(updatePartDraft(parts, index, { unitPrice: formatCurrencyInput(selectedPart.resalePrice!) }))}>
                        Revenda
                      </button>
                    ) : null}
                  </div>
                  <Input
                    id={`unit-price-${index}`}
                    value={part.unitPrice}
                    onChange={(event) => setParts(updatePartDraft(parts, index, { unitPrice: event.target.value }))}
                    onBlur={() => setParts(updatePartDraft(parts, index, { unitPrice: formatCurrencyInput(parseCurrencyInput(parts[index]?.unitPrice ?? "0")) }))}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`part-notes-${index}`}>Observações</Label>
                <Textarea id={`part-notes-${index}`} value={part.notes} onChange={(event) => setParts(updatePartDraft(parts, index, { notes: event.target.value }))} placeholder="Ex.: item aplicado na bancada ou trocado em garantia" />
              </div>

              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={() => setParts(parts.length === 1 ? [emptyPartDraft()] : parts.filter((_, currentIndex) => currentIndex !== index))}>
                  Remover material
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function createServiceOrder() {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/tickets/${ticket.id}/service-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: createFields.serviceType,
          servicePrice: parseCurrencyInput(createFields.servicePrice) || undefined,
          assignedTechnicianId: createFields.assignedTechnicianId,
          scheduledStartAt: createFields.scheduledStartAt ? new Date(createFields.scheduledStartAt).toISOString() : "",
          executionNotes: createFields.executionNotes,
          parts: buildPartPayload(createParts)
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: result.message ?? "Não foi possível criar a ordem de serviço." });
        return;
      }

      resetCreateForm();
      setMessage({ type: "success", text: "Ordem de serviço criada com sucesso." });
      syncAndRefresh(result.data as ServiceOrder);
    });
  }

  function saveServiceOrder(serviceOrderId: string) {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/tickets/${ticket.id}/service-orders/${serviceOrderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editFields.status,
          serviceType: editFields.serviceType,
          servicePrice: parseCurrencyInput(editFields.servicePrice) || undefined,
          assignedTechnicianId: editFields.assignedTechnicianId,
          scheduledStartAt: editFields.scheduledStartAt ? new Date(editFields.scheduledStartAt).toISOString() : "",
          startedAt: editFields.startedAt ? new Date(editFields.startedAt).toISOString() : "",
          finishedAt: editFields.finishedAt ? new Date(editFields.finishedAt).toISOString() : "",
          executionNotes: editFields.executionNotes,
          customerApprovalName: editFields.customerApprovalName,
          customerApprovalAt: editFields.customerApprovalAt ? new Date(editFields.customerApprovalAt).toISOString() : "",
          parts: buildPartPayload(editParts)
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: result.message ?? "Não foi possível atualizar a ordem de serviço." });
        return;
      }

      setEditingId(null);
      setMessage({ type: "success", text: "Ordem de serviço atualizada com sucesso." });
      syncAndRefresh(result.data as ServiceOrder);
    });
  }

  function deleteServiceOrder(serviceOrderId: string) {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/tickets/${ticket.id}/service-orders/${serviceOrderId}`, {
        method: "DELETE"
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: result.message ?? "Não foi possível excluir a ordem de serviço." });
        return;
      }

      setServiceOrders((current) => current.filter((serviceOrder) => serviceOrder.id !== serviceOrderId));
      setMessage({ type: "success", text: "Ordem de serviço excluída." });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {message ? <FormMessage type={message.type} message={message.text} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Ordens de serviço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {serviceOrders.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              A ordem de serviço é opcional neste fluxo. Use quando houver atendimento físico, planejamento ou controle de materiais.
            </div>
          ) : null}

          {serviceOrders.length > 0 ? (
            serviceOrders.map((serviceOrder) => {
              const isEditing = editingId === serviceOrder.id;

              return (
                <div key={serviceOrder.id} className="space-y-4 rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{serviceOrder.number}</p>
                      <p className="text-sm text-slate-600">{serviceOrder.serviceType || "Serviço sem tipo definido"}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[serviceOrder.status]}`}>
                      {statusLabels[serviceOrder.status]}
                    </span>
                  </div>

                  {!isEditing ? (
                    <div className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-4">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Técnico</p>
                          <p className="mt-1 text-sm text-slate-900">{serviceOrder.assignedTechnicianName ?? "Não definido"}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Agendamento</p>
                          <p className="mt-1 text-sm text-slate-900">{serviceOrder.scheduledStartAt ? formatDate(serviceOrder.scheduledStartAt) : "Não agendado"}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Valor</p>
                          <p className="mt-1 text-sm text-slate-900">{serviceOrder.servicePrice != null ? formatCurrency(serviceOrder.servicePrice) : "Não informado"}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Materiais</p>
                          <p className="mt-1 text-sm text-slate-900">{serviceOrder.parts.length} item(ns)</p>
                        </div>
                      </div>

                      {serviceOrder.executionNotes ? (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Observações</p>
                          <p className="mt-1 text-sm leading-6 text-slate-700">{serviceOrder.executionNotes}</p>
                        </div>
                      ) : null}

                      {serviceOrder.parts.length > 0 ? (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Materiais vinculados</p>
                          <div className="mt-2 space-y-2">
                            {serviceOrder.parts.map((part) => (
                              <div key={part.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                <p className="font-medium text-slate-900">
                                  {part.partName}
                                  {part.partCode ? ` (${part.partCode})` : ""}
                                </p>
                                <p>
                                  Quantidade: {part.quantity} · Valor de referência: {formatCurrency(part.unitPrice)}
                                </p>
                                {part.notes ? <p className="mt-1 text-slate-600">{part.notes}</p> : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid items-start gap-4 md:grid-cols-2">
                        <div className="grid content-start gap-2">
                          <Label htmlFor={`status-${serviceOrder.id}`}>Status</Label>
                          <Select id={`status-${serviceOrder.id}`} value={editFields.status} onChange={(event) => setEditFields((current) => ({ ...current, status: event.target.value as ServiceOrderStatus }))}>
                            <option value="PLANNED">Planejada</option>
                            <option value="IN_EXECUTION">Em execução</option>
                            {serviceOrder.status === "PAUSED" ? <option value="PAUSED">Em pausa (legado)</option> : null}
                            <option value="COMPLETED">Concluída</option>
                            <option value="CANCELED">Cancelada</option>
                          </Select>
                        </div>
                        <div className="grid content-start gap-2">
                          <Label htmlFor={`serviceCatalog-${serviceOrder.id}`}>Serviço do catálogo</Label>
                          <Select
                            id={`serviceCatalog-${serviceOrder.id}`}
                            value={editServiceSelection}
                            onChange={(event) => {
                              if (event.target.value === MANUAL_SERVICE_OPTION) {
                                return;
                              }

                              applyCatalogServiceToEdit(event.target.value);
                            }}
                          >
                            <option value={MANUAL_SERVICE_OPTION}>Digitar manualmente</option>
                            {serviceCatalogItems.map((item) => (
                              <option key={item.id} value={item.name}>
                                {getCatalogOptionLabel(item)}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>
                      {editServiceSelection === MANUAL_SERVICE_OPTION ? (
                        <div className="grid gap-2">
                          <Label htmlFor={`serviceType-${serviceOrder.id}`}>Tipo de serviço</Label>
                          <Input id={`serviceType-${serviceOrder.id}`} value={editFields.serviceType} onChange={(event) => setEditFields((current) => ({ ...current, serviceType: event.target.value }))} placeholder="Ex.: bancada, visita, diagnóstico" />
                        </div>
                      ) : null}
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="grid content-start gap-2">
                          <Label htmlFor={`servicePrice-${serviceOrder.id}`}>
                            Valor do serviço <span className="text-slate-400">(opcional)</span>
                            {isReseller && <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Revenda</span>}
                          </Label>
                          <Input id={`servicePrice-${serviceOrder.id}`} value={editFields.servicePrice} onChange={(event) => setEditFields((current) => ({ ...current, servicePrice: event.target.value }))} onBlur={() => setEditFields((current) => ({ ...current, servicePrice: current.servicePrice ? formatCurrencyInput(parseCurrencyInput(current.servicePrice)) : "" }))} placeholder="R$ 0,00" />
                        </div>
                        <div className="grid content-start gap-2">
                          <Label htmlFor={`technician-${serviceOrder.id}`}>Técnico</Label>
                          <Select id={`technician-${serviceOrder.id}`} value={editFields.assignedTechnicianId} onChange={(event) => setEditFields((current) => ({ ...current, assignedTechnicianId: event.target.value }))}>
                            <option value="">Definir depois</option>
                            {technicianOptions.map((user) => (
                              <option key={user.id} value={user.id}>
                                {formatUserWithRole(user)}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="grid content-start gap-2">
                          <Label htmlFor={`scheduled-${serviceOrder.id}`}>Agendada para</Label>
                          <Input id={`scheduled-${serviceOrder.id}`} type="date" value={editFields.scheduledStartAt} onChange={(event) => setEditFields((current) => ({ ...current, scheduledStartAt: event.target.value }))} />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`notes-${serviceOrder.id}`}>Observações</Label>
                        <Textarea id={`notes-${serviceOrder.id}`} value={editFields.executionNotes} onChange={(event) => setEditFields((current) => ({ ...current, executionNotes: event.target.value }))} placeholder="Descreva o escopo ou o resultado principal da OS" />
                      </div>

                      {renderPartsEditor(editParts, setEditParts)}
                    </div>
                  )}

                  {canManage ? (
                    <div className="flex flex-col gap-2 md:flex-row">
                      {isEditing ? (
                        <>
                          <Button type="button" className="md:flex-1" disabled={isPending} onClick={() => saveServiceOrder(serviceOrder.id)}>
                            {isPending ? "Salvando..." : "Salvar OS"}
                          </Button>
                          <Button type="button" variant="outline" className="md:flex-1" disabled={isPending} onClick={cancelEdit}>
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button type="button" variant="outline" className="flex-1" disabled={isPending} onClick={() => startEdit(serviceOrder)}>
                            Editar
                          </Button>
                          {serviceOrder.status === "PLANNED" ? (
                            <Button type="button" variant="outline" className="flex-1 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800" disabled={isPending} onClick={() => deleteServiceOrder(serviceOrder.id)}>
                              Excluir
                            </Button>
                          ) : null}
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              Nenhuma ordem de serviço vinculada a este chamado ainda.
            </div>
          )}
        </CardContent>
      </Card>

      {canManage && !ticketIsFinished ? (
        showCreateForm ? (
          <Card>
            <CardHeader>
              <CardTitle>Nova ordem de serviço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid content-start gap-2">
                  <Label htmlFor="new-service-catalog">Serviço do catálogo</Label>
                  <Select
                    id="new-service-catalog"
                    value={createServiceSelection}
                    onChange={(event) => {
                      if (event.target.value === MANUAL_SERVICE_OPTION) {
                        setCreateFields((current) => ({ ...current, serviceType: "" }));
                        return;
                      }

                      applyCatalogServiceToCreate(event.target.value);
                    }}
                  >
                    <option value={MANUAL_SERVICE_OPTION}>Digitar manualmente</option>
                    {serviceCatalogItems.map((item) => (
                      <option key={item.id} value={item.name}>
                        {getCatalogOptionLabel(item)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid content-start gap-2">
                  <Label htmlFor="new-technician">Técnico</Label>
                  <Select id="new-technician" value={createFields.assignedTechnicianId} onChange={(event) => setCreateFields((current) => ({ ...current, assignedTechnicianId: event.target.value }))}>
                    <option value="">Definir depois</option>
                    {technicianOptions.map((user) => (
                      <option key={user.id} value={user.id}>
                        {formatUserWithRole(user)}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              {createServiceSelection === MANUAL_SERVICE_OPTION ? (
                <div className="grid gap-2">
                  <Label htmlFor="new-service-type">Tipo de serviço</Label>
                  <Input id="new-service-type" value={createFields.serviceType} onChange={(event) => setCreateFields((current) => ({ ...current, serviceType: event.target.value }))} placeholder="Ex.: bancada, visita, diagnóstico" />
                </div>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="new-service-price">
                    Valor do serviço <span className="text-slate-400">(opcional)</span>
                    {isReseller && <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Revenda</span>}
                  </Label>
                  <Input id="new-service-price" value={createFields.servicePrice} onChange={(event) => setCreateFields((current) => ({ ...current, servicePrice: event.target.value }))} onBlur={() => setCreateFields((current) => ({ ...current, servicePrice: current.servicePrice ? formatCurrencyInput(parseCurrencyInput(current.servicePrice)) : "" }))} placeholder="R$ 0,00" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-scheduled">Agendada para</Label>
                  <Input id="new-scheduled" type="date" value={createFields.scheduledStartAt} onChange={(event) => setCreateFields((current) => ({ ...current, scheduledStartAt: event.target.value }))} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-notes">Observações</Label>
                <Textarea id="new-notes" value={createFields.executionNotes} onChange={(event) => setCreateFields((current) => ({ ...current, executionNotes: event.target.value }))} placeholder="Descreva apenas o escopo principal desta OS" />
              </div>

              {renderPartsEditor(createParts, setCreateParts)}

              <div className="flex gap-2">
                <Button type="button" className="flex-1" disabled={isPending} onClick={createServiceOrder}>
                  {isPending ? "Criando..." : "Criar ordem de serviço"}
                </Button>
                <Button type="button" variant="outline" className="flex-1" disabled={isPending} onClick={() => { resetCreateForm(); setShowCreateForm(false); }}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button type="button" variant="outline" className="w-full" onClick={() => setShowCreateForm(true)}>
            + Nova ordem de serviço
          </Button>
        )
      ) : null}
    </div>
  );
}
