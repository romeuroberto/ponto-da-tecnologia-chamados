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
  PAUSED: "Pausada",
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
  partCatalogItems
}: {
  ticket: Ticket;
  users: AppUser[];
  role: AppUser["role"];
  currentUserId: string;
  serviceCatalogItems: ServiceCatalogItem[];
  partCatalogItems: PartCatalogItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(ticket.serviceOrders ?? []);
  const [createFields, setCreateFields] = useState({
    serviceType: "",
    assignedTechnicianId: "",
    scheduledStartAt: "",
    executionNotes: ""
  });
  const [createParts, setCreateParts] = useState<PartDraft[]>([emptyPartDraft()]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({
    status: "PLANNED" as ServiceOrderStatus,
    serviceType: "",
    assignedTechnicianId: "",
    scheduledStartAt: "",
    startedAt: "",
    finishedAt: "",
    executionNotes: "",
    customerApprovalName: "",
    customerApprovalAt: ""
  });
  const [editParts, setEditParts] = useState<PartDraft[]>([emptyPartDraft()]);

  const technicianOptions = useMemo(
    () => users.filter((user) => user.role === "TECHNICIAN" && user.active).sort((a, b) => a.name.localeCompare(b.name)),
    [users]
  );

  const partOptions = useMemo(() => [...partCatalogItems].sort((a, b) => a.name.localeCompare(b.name)), [partCatalogItems]);

  if (ticket.attendanceType === "REMOTE") return null;

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

  function applyCatalogServiceToCreate(serviceName: string) {
    const selectedItem = serviceCatalogItems.find((item) => item.name === serviceName);

    setCreateFields((current) => ({
      ...current,
      serviceType: serviceName,
      executionNotes: current.executionNotes || selectedItem?.description || ""
    }));
  }

  function applyCatalogServiceToEdit(serviceName: string) {
    const selectedItem = serviceCatalogItems.find((item) => item.name === serviceName);

    setEditFields((current) => ({
      ...current,
      serviceType: serviceName,
      executionNotes: current.executionNotes || selectedItem?.description || ""
    }));
  }

  function updatePartDraft(parts: PartDraft[], index: number, nextValues: Partial<PartDraft>) {
    return parts.map((part, currentIndex) => (currentIndex === index ? { ...part, ...nextValues } : part));
  }

  function handlePartSelection(parts: PartDraft[], index: number, partCatalogItemId: string) {
    const selectedPart = partOptions.find((item) => item.id === partCatalogItemId);

    return updatePartDraft(parts, index, {
      partCatalogItemId,
      unitPrice: formatCurrencyInput(selectedPart?.unitPrice ?? 0),
      notes: parts[index]?.notes || selectedPart?.description || ""
    });
  }

  function renderPartsEditor(parts: PartDraft[], setParts: (parts: PartDraft[]) => void) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">Materiais da OS</p>
            <p className="text-xs text-slate-500">Use o catálogo para registrar material previsto ou aplicado nesta ordem.</p>
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
                <div className="grid gap-2">
                  <Label htmlFor={`part-${index}`}>Material do catálogo</Label>
                  <Select
                    id={`part-${index}`}
                    value={part.partCatalogItemId}
                    onChange={(event) => setParts(handlePartSelection(parts, index, event.target.value))}
                  >
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
                <div className="grid gap-2">
                  <Label htmlFor={`quantity-${index}`}>Qtd ({selectedPart?.unit ?? "un"})</Label>
                  <Input
                    id={`quantity-${index}`}
                    inputMode="decimal"
                    value={part.quantity}
                    onChange={(event) => setParts(updatePartDraft(parts, index, { quantity: event.target.value }))}
                    placeholder="1"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`unit-price-${index}`}>Valor de referência</Label>
                    {selectedPart?.resalePrice != null ? (
                      <button
                        type="button"
                        className="text-xs text-sky-600 hover:underline"
                        onClick={() => setParts(updatePartDraft(parts, index, { unitPrice: formatCurrencyInput(selectedPart.resalePrice!) }))}
                      >
                        Revenda
                      </button>
                    ) : null}
                  </div>
                  <Input
                    id={`unit-price-${index}`}
                    value={part.unitPrice}
                    onChange={(event) => setParts(updatePartDraft(parts, index, { unitPrice: event.target.value }))}
                    onBlur={() =>
                      setParts(
                        updatePartDraft(parts, index, {
                          unitPrice: formatCurrencyInput(parseCurrencyInput(parts[index]?.unitPrice ?? "0"))
                        })
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`part-notes-${index}`}>Observações do material</Label>
                <Textarea
                  id={`part-notes-${index}`}
                  value={part.notes}
                  onChange={(event) => setParts(updatePartDraft(parts, index, { notes: event.target.value }))}
                  placeholder="Ex.: aplicado em bancada, trocado em garantia, item aprovado pelo cliente"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setParts(parts.length === 1 ? [emptyPartDraft()] : parts.filter((_, currentIndex) => currentIndex !== index))}
                >
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

  return (
    <div className="space-y-6">
      {message ? <FormMessage type={message.type} message={message.text} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Ordens de serviço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {serviceOrders.length > 0 ? (
            serviceOrders.map((serviceOrder) => {
              const isEditing = editingId === serviceOrder.id;

              return (
                <div key={serviceOrder.id} className="space-y-4 rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{serviceOrder.number}</p>
                      <p className="text-sm text-slate-600">{serviceOrder.serviceType || "Sem tipo definido"}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[serviceOrder.status]}`}>
                      {statusLabels[serviceOrder.status]}
                    </span>
                  </div>

                  {!isEditing ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Técnico</p>
                        <p className="mt-1 text-sm text-slate-900">{serviceOrder.assignedTechnicianName ?? "Não definido"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Criada por</p>
                        <p className="mt-1 text-sm text-slate-900">{serviceOrder.createdByName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agendamento</p>
                        <p className="mt-1 text-sm text-slate-900">
                          {serviceOrder.scheduledStartAt ? formatDate(serviceOrder.scheduledStartAt) : "Não agendado"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Atualizada</p>
                        <p className="mt-1 text-sm text-slate-900">{formatDate(serviceOrder.updatedAt)}</p>
                      </div>
                      {serviceOrder.executionNotes ? (
                        <div className="md:col-span-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Observações</p>
                          <p className="mt-1 text-sm leading-6 text-slate-700">{serviceOrder.executionNotes}</p>
                        </div>
                      ) : null}
                      {serviceOrder.parts.length > 0 ? (
                        <div className="md:col-span-2">
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
                      {serviceOrder.customerApprovalName ? (
                        <div className="md:col-span-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Aprovação do cliente</p>
                          <p className="mt-1 text-sm text-slate-700">
                            {serviceOrder.customerApprovalName}
                            {serviceOrder.customerApprovalAt ? ` em ${formatDate(serviceOrder.customerApprovalAt)}` : ""}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor={`status-${serviceOrder.id}`}>Status</Label>
                          <Select
                            id={`status-${serviceOrder.id}`}
                            value={editFields.status}
                            onChange={(event) => setEditFields((current) => ({ ...current, status: event.target.value as ServiceOrderStatus }))}
                          >
                            <option value="PLANNED">Planejada</option>
                            <option value="IN_EXECUTION">Em execução</option>
                            <option value="PAUSED">Pausada</option>
                            <option value="COMPLETED">Concluída</option>
                            <option value="CANCELED">Cancelada</option>
                          </Select>
                        </div>
                        <div className="grid gap-2">
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
                          {selectedEditCatalogItem ? <p className="text-xs text-slate-500">{getCatalogMeta(selectedEditCatalogItem)}</p> : null}
                        </div>
                        {editServiceSelection === MANUAL_SERVICE_OPTION ? (
                          <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor={`serviceType-${serviceOrder.id}`}>Tipo de serviço</Label>
                            <Input
                              id={`serviceType-${serviceOrder.id}`}
                              value={editFields.serviceType}
                              onChange={(event) => setEditFields((current) => ({ ...current, serviceType: event.target.value }))}
                              placeholder="Ex.: bancada, visita, diagnóstico"
                            />
                          </div>
                        ) : null}
                        <div className="grid gap-2">
                          <Label htmlFor={`technician-${serviceOrder.id}`}>Técnico</Label>
                          <Select
                            id={`technician-${serviceOrder.id}`}
                            value={editFields.assignedTechnicianId}
                            onChange={(event) => setEditFields((current) => ({ ...current, assignedTechnicianId: event.target.value }))}
                          >
                            <option value="">Definir depois</option>
                            {technicianOptions.map((user) => (
                              <option key={user.id} value={user.id}>
                                {formatUserWithRole(user)}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`scheduled-${serviceOrder.id}`}>Agendada para</Label>
                          <Input
                            id={`scheduled-${serviceOrder.id}`}
                            type="date"
                            value={editFields.scheduledStartAt}
                            onChange={(event) => setEditFields((current) => ({ ...current, scheduledStartAt: event.target.value }))}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`started-${serviceOrder.id}`}>Início</Label>
                          <Input
                            id={`started-${serviceOrder.id}`}
                            type="date"
                            value={editFields.startedAt}
                            onChange={(event) => setEditFields((current) => ({ ...current, startedAt: event.target.value }))}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`finished-${serviceOrder.id}`}>Fim</Label>
                          <Input
                            id={`finished-${serviceOrder.id}`}
                            type="date"
                            value={editFields.finishedAt}
                            onChange={(event) => setEditFields((current) => ({ ...current, finishedAt: event.target.value }))}
                          />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                          <Label htmlFor={`notes-${serviceOrder.id}`}>Observações</Label>
                          <Textarea
                            id={`notes-${serviceOrder.id}`}
                            value={editFields.executionNotes}
                            onChange={(event) => setEditFields((current) => ({ ...current, executionNotes: event.target.value }))}
                            placeholder="Descreva a execução planejada ou realizada"
                          />
                        </div>
                      </div>

                      {renderPartsEditor(editParts, setEditParts)}

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor={`approvalName-${serviceOrder.id}`}>Aprovação do cliente</Label>
                          <Input
                            id={`approvalName-${serviceOrder.id}`}
                            value={editFields.customerApprovalName}
                            onChange={(event) => setEditFields((current) => ({ ...current, customerApprovalName: event.target.value }))}
                            placeholder="Nome do aprovador"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`approvalAt-${serviceOrder.id}`}>Data da aprovação</Label>
                          <Input
                            id={`approvalAt-${serviceOrder.id}`}
                            type="date"
                            value={editFields.customerApprovalAt}
                            onChange={(event) => setEditFields((current) => ({ ...current, customerApprovalAt: event.target.value }))}
                          />
                        </div>
                      </div>
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
                        <Button type="button" variant="outline" className="w-full" disabled={isPending} onClick={() => startEdit(serviceOrder)}>
                          Editar ordem de serviço
                        </Button>
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

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Nova ordem de serviço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
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
                {selectedCreateCatalogItem ? <p className="text-xs text-slate-500">{getCatalogMeta(selectedCreateCatalogItem)}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-technician">Técnico</Label>
                <Select
                  id="new-technician"
                  value={createFields.assignedTechnicianId}
                  onChange={(event) => setCreateFields((current) => ({ ...current, assignedTechnicianId: event.target.value }))}
                >
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
                <Input
                  id="new-service-type"
                  value={createFields.serviceType}
                  onChange={(event) => setCreateFields((current) => ({ ...current, serviceType: event.target.value }))}
                  placeholder="Ex.: bancada, visita, diagnóstico"
                />
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="new-scheduled">Agendada para</Label>
                <Input
                  id="new-scheduled"
                  type="date"
                  value={createFields.scheduledStartAt}
                  onChange={(event) => setCreateFields((current) => ({ ...current, scheduledStartAt: event.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-notes">Observações</Label>
              <Textarea
                id="new-notes"
                value={createFields.executionNotes}
                onChange={(event) => setCreateFields((current) => ({ ...current, executionNotes: event.target.value }))}
                placeholder="Descreva o escopo inicial da OS"
              />
            </div>

            {renderPartsEditor(createParts, setCreateParts)}

            <Button type="button" className="w-full" disabled={isPending} onClick={createServiceOrder}>
              {isPending ? "Criando..." : "Criar ordem de serviço"}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
