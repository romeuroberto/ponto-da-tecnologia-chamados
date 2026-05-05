"use client";

import { useState, useTransition } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from "@/lib/utils";
import type { PartCatalogItem, ServiceCatalogItem } from "@/types";

type ServiceFormState = {
  name: string;
  code: string;
  description: string;
  active: boolean;
};

type PartFormState = ServiceFormState & {
  unitPrice: string;
};

type ApiError = {
  message: string;
  field?: "code";
};

const emptyServiceForm: ServiceFormState = {
  name: "",
  code: "",
  description: "",
  active: true
};

const emptyPartForm: PartFormState = {
  name: "",
  code: "",
  description: "",
  unitPrice: formatCurrencyInput(0),
  active: true
};

function buildFieldError(message: string): ApiError {
  return {
    message,
    field: message.toLowerCase().includes("código") ? "code" : undefined
  };
}

export function CatalogManager({
  initialServiceItems,
  initialPartItems
}: {
  initialServiceItems: ServiceCatalogItem[];
  initialPartItems: PartCatalogItem[];
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [serviceItems, setServiceItems] = useState(initialServiceItems);
  const [partItems, setPartItems] = useState(initialPartItems);
  const [newService, setNewService] = useState<ServiceFormState>(emptyServiceForm);
  const [newPart, setNewPart] = useState<PartFormState>(emptyPartForm);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [newServiceError, setNewServiceError] = useState<ApiError | null>(null);
  const [newPartError, setNewPartError] = useState<ApiError | null>(null);
  const [serviceEditErrors, setServiceEditErrors] = useState<Record<string, ApiError | null>>({});
  const [partEditErrors, setPartEditErrors] = useState<Record<string, ApiError | null>>({});
  const [serviceDrafts, setServiceDrafts] = useState<Record<string, ServiceFormState>>(
    Object.fromEntries(
      initialServiceItems.map((item) => [
        item.id,
        {
          name: item.name,
          code: item.code ?? "",
          description: item.description ?? "",
          active: item.active
        }
      ])
    )
  );
  const [partDrafts, setPartDrafts] = useState<Record<string, PartFormState>>(
    Object.fromEntries(
      initialPartItems.map((item) => [
        item.id,
        {
          name: item.name,
          code: item.code ?? "",
          description: item.description ?? "",
          unitPrice: formatCurrencyInput(item.unitPrice),
          active: item.active
        }
      ])
    )
  );

  function sortServices(items: ServiceCatalogItem[]) {
    return [...items].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));
  }

  function sortParts(items: PartCatalogItem[]) {
    return [...items].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));
  }

  async function postJson(url: string, method: "POST" | "PUT", body: object) {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message ?? "Não foi possível salvar.");
    }

    return result.data;
  }

  function saveServiceItem(id?: string) {
    const draft = id ? serviceDrafts[id] : newService;

    startTransition(async () => {
      try {
        setMessage(null);
        if (id) {
          setServiceEditErrors((current) => ({ ...current, [id]: null }));
        } else {
          setNewServiceError(null);
        }

        const data = (await postJson(id ? `/api/catalog/service-items/${id}` : "/api/catalog/service-items", id ? "PUT" : "POST", draft)) as ServiceCatalogItem;

        if (id) {
          setServiceItems((current) => sortServices(current.map((item) => (item.id === id ? data : item))));
          setServiceDrafts((current) => ({
            ...current,
            [id]: {
              name: data.name,
              code: data.code ?? "",
              description: data.description ?? "",
              active: data.active
            }
          }));
          setEditingServiceId(null);
          setMessage({ type: "success", text: "Serviço atualizado com sucesso." });
          return;
        }

        setServiceItems((current) => sortServices([data, ...current]));
        setServiceDrafts((current) => ({
          ...current,
          [data.id]: {
            name: data.name,
            code: data.code ?? "",
            description: data.description ?? "",
            active: data.active
          }
        }));
        setNewService(emptyServiceForm);
        setMessage({ type: "success", text: "Serviço cadastrado com sucesso." });
      } catch (error) {
        const nextError = buildFieldError(error instanceof Error ? error.message : "Não foi possível salvar o serviço.");
        if (id) {
          setServiceEditErrors((current) => ({ ...current, [id]: nextError }));
        } else {
          setNewServiceError(nextError);
        }
        setMessage({ type: "error", text: nextError.message });
      }
    });
  }

  function savePartItem(id?: string) {
    const draft = id ? partDrafts[id] : newPart;
    const payload = {
      ...draft,
      unitPrice: parseCurrencyInput(draft.unitPrice)
    };

    startTransition(async () => {
      try {
        setMessage(null);
        if (id) {
          setPartEditErrors((current) => ({ ...current, [id]: null }));
        } else {
          setNewPartError(null);
        }

        const data = (await postJson(id ? `/api/catalog/part-items/${id}` : "/api/catalog/part-items", id ? "PUT" : "POST", payload)) as PartCatalogItem;

        if (id) {
          setPartItems((current) => sortParts(current.map((item) => (item.id === id ? data : item))));
          setPartDrafts((current) => ({
            ...current,
            [id]: {
              name: data.name,
              code: data.code ?? "",
              description: data.description ?? "",
              unitPrice: formatCurrencyInput(data.unitPrice),
              active: data.active
            }
          }));
          setEditingPartId(null);
          setMessage({ type: "success", text: "Peça atualizada com sucesso." });
          return;
        }

        setPartItems((current) => sortParts([data, ...current]));
        setPartDrafts((current) => ({
          ...current,
          [data.id]: {
            name: data.name,
            code: data.code ?? "",
            description: data.description ?? "",
            unitPrice: formatCurrencyInput(data.unitPrice),
            active: data.active
          }
        }));
        setNewPart(emptyPartForm);
        setMessage({ type: "success", text: "Peça cadastrada com sucesso." });
      } catch (error) {
        const nextError = buildFieldError(error instanceof Error ? error.message : "Não foi possível salvar a peça.");
        if (id) {
          setPartEditErrors((current) => ({ ...current, [id]: nextError }));
        } else {
          setNewPartError(nextError);
        }
        setMessage({ type: "error", text: nextError.message });
      }
    });
  }

  return (
    <div className="space-y-6">
      {message ? <FormMessage type={message.type} message={message.text} /> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Serviços</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="service-name">Nome</Label>
                  <Input id="service-name" value={newService.name} onChange={(event) => setNewService((current) => ({ ...current, name: event.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="service-code">Código</Label>
                  <Input id="service-code" value={newService.code} onChange={(event) => setNewService((current) => ({ ...current, code: event.target.value }))} />
                  {newServiceError?.field === "code" ? <p className="text-xs text-rose-600">{newServiceError.message}</p> : null}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="service-description">Descrição</Label>
                <Textarea id="service-description" value={newService.description} onChange={(event) => setNewService((current) => ({ ...current, description: event.target.value }))} />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={newService.active} onChange={(event) => setNewService((current) => ({ ...current, active: event.target.checked }))} />
                Serviço ativo
              </label>
              <Button type="button" disabled={isPending} onClick={() => saveServiceItem()}>
                {isPending ? "Salvando..." : "Cadastrar serviço"}
              </Button>
            </div>

            <div className="space-y-3">
              {serviceItems.map((item) => {
                const isEditing = editingServiceId === item.id;
                const draft = serviceDrafts[item.id];
                const fieldError = serviceEditErrors[item.id];

                return (
                  <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <Input value={draft.name} onChange={(event) => setServiceDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], name: event.target.value } }))} />
                          <div className="grid gap-2">
                            <Input value={draft.code} onChange={(event) => setServiceDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], code: event.target.value } }))} />
                            {fieldError?.field === "code" ? <p className="text-xs text-rose-600">{fieldError.message}</p> : null}
                          </div>
                        </div>
                        <Textarea value={draft.description} onChange={(event) => setServiceDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], description: event.target.value } }))} />
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                          <input type="checkbox" checked={draft.active} onChange={(event) => setServiceDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], active: event.target.checked } }))} />
                          Serviço ativo
                        </label>
                        <div className="flex gap-2">
                          <Button type="button" className="flex-1" disabled={isPending} onClick={() => saveServiceItem(item.id)}>
                            Salvar
                          </Button>
                          <Button type="button" variant="outline" className="flex-1" disabled={isPending} onClick={() => setEditingServiceId(null)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-950">{item.name}</p>
                          <p className="mt-1 text-sm text-slate-600">
                            {item.code ?? "Sem código"} · {item.active ? "Ativo" : "Inativo"}
                          </p>
                          {item.description ? <p className="mt-2 text-sm text-slate-600">{item.description}</p> : null}
                        </div>
                        <Button type="button" variant="outline" disabled={isPending} onClick={() => setEditingServiceId(item.id)}>
                          Editar
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peças</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="part-name">Nome</Label>
                  <Input id="part-name" value={newPart.name} onChange={(event) => setNewPart((current) => ({ ...current, name: event.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="part-code">Código</Label>
                  <Input id="part-code" value={newPart.code} onChange={(event) => setNewPart((current) => ({ ...current, code: event.target.value }))} />
                  {newPartError?.field === "code" ? <p className="text-xs text-rose-600">{newPartError.message}</p> : null}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="part-price">Valor padrão</Label>
                  <Input
                    id="part-price"
                    value={newPart.unitPrice}
                    onChange={(event) => setNewPart((current) => ({ ...current, unitPrice: event.target.value }))}
                    onBlur={() => setNewPart((current) => ({ ...current, unitPrice: formatCurrencyInput(parseCurrencyInput(current.unitPrice)) }))}
                  />
                </div>
                <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
                  <input type="checkbox" checked={newPart.active} onChange={(event) => setNewPart((current) => ({ ...current, active: event.target.checked }))} />
                  Peça ativa
                </label>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="part-description">Descrição</Label>
                <Textarea id="part-description" value={newPart.description} onChange={(event) => setNewPart((current) => ({ ...current, description: event.target.value }))} />
              </div>
              <Button type="button" disabled={isPending} onClick={() => savePartItem()}>
                {isPending ? "Salvando..." : "Cadastrar peça"}
              </Button>
            </div>

            <div className="space-y-3">
              {partItems.map((item) => {
                const isEditing = editingPartId === item.id;
                const draft = partDrafts[item.id];
                const fieldError = partEditErrors[item.id];

                return (
                  <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <Input value={draft.name} onChange={(event) => setPartDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], name: event.target.value } }))} />
                          <div className="grid gap-2">
                            <Input value={draft.code} onChange={(event) => setPartDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], code: event.target.value } }))} />
                            {fieldError?.field === "code" ? <p className="text-xs text-rose-600">{fieldError.message}</p> : null}
                          </div>
                        </div>
                        <Input
                          value={draft.unitPrice}
                          onChange={(event) => setPartDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], unitPrice: event.target.value } }))}
                          onBlur={() =>
                            setPartDrafts((current) => ({
                              ...current,
                              [item.id]: { ...current[item.id], unitPrice: formatCurrencyInput(parseCurrencyInput(current[item.id].unitPrice)) }
                            }))
                          }
                        />
                        <Textarea value={draft.description} onChange={(event) => setPartDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], description: event.target.value } }))} />
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                          <input type="checkbox" checked={draft.active} onChange={(event) => setPartDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], active: event.target.checked } }))} />
                          Peça ativa
                        </label>
                        <div className="flex gap-2">
                          <Button type="button" className="flex-1" disabled={isPending} onClick={() => savePartItem(item.id)}>
                            Salvar
                          </Button>
                          <Button type="button" variant="outline" className="flex-1" disabled={isPending} onClick={() => setEditingPartId(null)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-950">{item.name}</p>
                          <p className="mt-1 text-sm text-slate-600">
                            {item.code ?? "Sem código"} · {item.active ? "Ativa" : "Inativa"} · {formatCurrency(item.unitPrice)}
                          </p>
                          {item.description ? <p className="mt-2 text-sm text-slate-600">{item.description}</p> : null}
                        </div>
                        <Button type="button" variant="outline" disabled={isPending} onClick={() => setEditingPartId(item.id)}>
                          Editar
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
