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

type Mode = "services" | "parts" | "all";

type ServiceFormState = {
  name: string;
  description: string;
  defaultPrice: string;
  active: boolean;
};

type PartFormState = {
  name: string;
  description: string;
  costPrice: string;
  unitPrice: string;
  initialQuantity: string;
  active: boolean;
};

type ApiError = {
  message: string;
};

const emptyServiceForm: ServiceFormState = {
  name: "",
  description: "",
  defaultPrice: formatCurrencyInput(0),
  active: true
};

const emptyPartForm: PartFormState = {
  name: "",
  description: "",
  costPrice: formatCurrencyInput(0),
  unitPrice: formatCurrencyInput(0),
  initialQuantity: "0",
  active: true
};

export function CatalogManager({
  initialServiceItems = [],
  initialPartItems = [],
  mode = "all"
}: {
  initialServiceItems?: ServiceCatalogItem[];
  initialPartItems?: PartCatalogItem[];
  mode?: Mode;
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
          description: item.description ?? "",
          defaultPrice: formatCurrencyInput(item.defaultPrice),
          active: item.active
        }
      ])
    )
  );
  const [partDrafts, setPartDrafts] = useState<Record<string, Omit<PartFormState, "initialQuantity">>>(
    Object.fromEntries(
      initialPartItems.map((item) => [
        item.id,
        {
          name: item.name,
          description: item.description ?? "",
          costPrice: formatCurrencyInput(item.costPrice),
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
      throw new Error(result.message ?? "Nao foi possivel salvar.");
    }

    return result.data;
  }

  function saveServiceItem(id?: string) {
    const draft = id ? serviceDrafts[id] : newService;
    const payload = {
      ...draft,
      defaultPrice: parseCurrencyInput(draft.defaultPrice)
    };

    startTransition(async () => {
      try {
        setMessage(null);
        if (id) {
          setServiceEditErrors((current) => ({ ...current, [id]: null }));
        } else {
          setNewServiceError(null);
        }

        const data = (await postJson(
          id ? `/api/catalog/service-items/${id}` : "/api/catalog/service-items",
          id ? "PUT" : "POST",
          payload
        )) as ServiceCatalogItem;

        if (id) {
          setServiceItems((current) => sortServices(current.map((item) => (item.id === id ? data : item))));
          setServiceDrafts((current) => ({
            ...current,
            [id]: {
              name: data.name,
              description: data.description ?? "",
              defaultPrice: formatCurrencyInput(data.defaultPrice),
              active: data.active
            }
          }));
          setEditingServiceId(null);
          setMessage({ type: "success", text: "Servico atualizado com sucesso." });
          return;
        }

        setServiceItems((current) => sortServices([data, ...current]));
        setServiceDrafts((current) => ({
          ...current,
          [data.id]: {
            name: data.name,
            description: data.description ?? "",
            defaultPrice: formatCurrencyInput(data.defaultPrice),
            active: data.active
          }
        }));
        setNewService(emptyServiceForm);
        setMessage({ type: "success", text: `Servico cadastrado com sucesso. Codigo gerado: ${data.code}.` });
      } catch (error) {
        const nextError = { message: error instanceof Error ? error.message : "Nao foi possivel salvar o servico." };
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
      costPrice: parseCurrencyInput(draft.costPrice),
      unitPrice: parseCurrencyInput(draft.unitPrice),
      ...(id ? {} : { initialQuantity: Number(newPart.initialQuantity || "0") })
    };

    startTransition(async () => {
      try {
        setMessage(null);
        if (id) {
          setPartEditErrors((current) => ({ ...current, [id]: null }));
        } else {
          setNewPartError(null);
        }

        const data = (await postJson(
          id ? `/api/catalog/part-items/${id}` : "/api/catalog/part-items",
          id ? "PUT" : "POST",
          payload
        )) as PartCatalogItem;

        if (id) {
          setPartItems((current) => sortParts(current.map((item) => (item.id === id ? data : item))));
          setPartDrafts((current) => ({
            ...current,
            [id]: {
              name: data.name,
              description: data.description ?? "",
              costPrice: formatCurrencyInput(data.costPrice),
              unitPrice: formatCurrencyInput(data.unitPrice),
              active: data.active
            }
          }));
          setEditingPartId(null);
          setMessage({ type: "success", text: "Peca atualizada com sucesso." });
          return;
        }

        setPartItems((current) => sortParts([data, ...current]));
        setPartDrafts((current) => ({
          ...current,
          [data.id]: {
            name: data.name,
            description: data.description ?? "",
            costPrice: formatCurrencyInput(data.costPrice),
            unitPrice: formatCurrencyInput(data.unitPrice),
            active: data.active
          }
        }));
        setNewPart(emptyPartForm);
        setMessage({ type: "success", text: `Peca cadastrada com sucesso. Codigo gerado: ${data.code}.` });
      } catch (error) {
        const nextError = { message: error instanceof Error ? error.message : "Nao foi possivel salvar a peca." };
        if (id) {
          setPartEditErrors((current) => ({ ...current, [id]: nextError }));
        } else {
          setNewPartError(nextError);
        }
        setMessage({ type: "error", text: nextError.message });
      }
    });
  }

  const showServices = mode === "all" || mode === "services";
  const showParts = mode === "all" || mode === "parts";

  return (
    <div className="space-y-6">
      {message ? <FormMessage type={message.type} message={message.text} /> : null}

      <div className={`grid gap-6 ${showServices && showParts ? "xl:grid-cols-2" : ""}`}>
        {showServices ? (
          <Card>
            <CardHeader>
              <CardTitle>Servicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="service-name">Nome</Label>
                    <Input id="service-name" value={newService.name} onChange={(event) => setNewService((current) => ({ ...current, name: event.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Codigo</Label>
                    <div className="flex h-10 items-center rounded-lg border border-dashed border-slate-300 bg-white px-3 text-sm text-slate-500">
                      Gerado automaticamente no cadastro
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="service-price">Valor padrao</Label>
                    <Input
                      id="service-price"
                      value={newService.defaultPrice}
                      onChange={(event) => setNewService((current) => ({ ...current, defaultPrice: event.target.value }))}
                      onBlur={() =>
                        setNewService((current) => ({
                          ...current,
                          defaultPrice: formatCurrencyInput(parseCurrencyInput(current.defaultPrice))
                        }))
                      }
                    />
                  </div>
                  <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
                    <input type="checkbox" checked={newService.active} onChange={(event) => setNewService((current) => ({ ...current, active: event.target.checked }))} />
                    Servico ativo
                  </label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="service-description">Descricao</Label>
                  <Textarea id="service-description" value={newService.description} onChange={(event) => setNewService((current) => ({ ...current, description: event.target.value }))} />
                  {newServiceError ? <p className="text-xs text-rose-600">{newServiceError.message}</p> : null}
                </div>
                <Button type="button" disabled={isPending} onClick={() => saveServiceItem()}>
                  {isPending ? "Salvando..." : "Cadastrar servico"}
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
                            <div className="flex h-10 items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 text-sm text-slate-500">
                              {item.code ?? "Codigo indisponivel"}
                            </div>
                          </div>
                          <Input
                            value={draft.defaultPrice}
                            onChange={(event) => setServiceDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], defaultPrice: event.target.value } }))}
                            onBlur={() =>
                              setServiceDrafts((current) => ({
                                ...current,
                                [item.id]: {
                                  ...current[item.id],
                                  defaultPrice: formatCurrencyInput(parseCurrencyInput(current[item.id].defaultPrice))
                                }
                              }))
                            }
                          />
                          <Textarea value={draft.description} onChange={(event) => setServiceDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], description: event.target.value } }))} />
                          {fieldError ? <p className="text-xs text-rose-600">{fieldError.message}</p> : null}
                          <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input type="checkbox" checked={draft.active} onChange={(event) => setServiceDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], active: event.target.checked } }))} />
                            Servico ativo
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
                              {item.code ?? "Sem codigo"} · {item.active ? "Ativo" : "Inativo"} · {formatCurrency(item.defaultPrice)}
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
        ) : null}

        {showParts ? (
          <Card>
            <CardHeader>
              <CardTitle>Pecas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="part-name">Nome</Label>
                    <Input id="part-name" value={newPart.name} onChange={(event) => setNewPart((current) => ({ ...current, name: event.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Codigo</Label>
                    <div className="flex h-10 items-center rounded-lg border border-dashed border-slate-300 bg-white px-3 text-sm text-slate-500">
                      Gerado automaticamente no cadastro
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="part-cost">Custo padrao</Label>
                    <Input
                      id="part-cost"
                      value={newPart.costPrice}
                      onChange={(event) => setNewPart((current) => ({ ...current, costPrice: event.target.value }))}
                      onBlur={() =>
                        setNewPart((current) => ({
                          ...current,
                          costPrice: formatCurrencyInput(parseCurrencyInput(current.costPrice))
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="part-price">Valor de venda</Label>
                    <Input
                      id="part-price"
                      value={newPart.unitPrice}
                      onChange={(event) => setNewPart((current) => ({ ...current, unitPrice: event.target.value }))}
                      onBlur={() =>
                        setNewPart((current) => ({
                          ...current,
                          unitPrice: formatCurrencyInput(parseCurrencyInput(current.unitPrice))
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="part-quantity">Quantidade inicial</Label>
                    <Input
                      id="part-quantity"
                      inputMode="decimal"
                      value={newPart.initialQuantity}
                      onChange={(event) => setNewPart((current) => ({ ...current, initialQuantity: event.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="part-description">Descricao</Label>
                  <Textarea id="part-description" value={newPart.description} onChange={(event) => setNewPart((current) => ({ ...current, description: event.target.value }))} />
                  {newPartError ? <p className="text-xs text-rose-600">{newPartError.message}</p> : null}
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={newPart.active} onChange={(event) => setNewPart((current) => ({ ...current, active: event.target.checked }))} />
                  Peca ativa
                </label>
                <Button type="button" disabled={isPending} onClick={() => savePartItem()}>
                  {isPending ? "Salvando..." : "Cadastrar peca"}
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
                            <div className="flex h-10 items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 text-sm text-slate-500">
                              {item.code ?? "Codigo indisponivel"}
                            </div>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <Input
                              value={draft.costPrice}
                              onChange={(event) => setPartDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], costPrice: event.target.value } }))}
                              onBlur={() =>
                                setPartDrafts((current) => ({
                                  ...current,
                                  [item.id]: {
                                    ...current[item.id],
                                    costPrice: formatCurrencyInput(parseCurrencyInput(current[item.id].costPrice))
                                  }
                                }))
                              }
                            />
                            <Input
                              value={draft.unitPrice}
                              onChange={(event) => setPartDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], unitPrice: event.target.value } }))}
                              onBlur={() =>
                                setPartDrafts((current) => ({
                                  ...current,
                                  [item.id]: {
                                    ...current[item.id],
                                    unitPrice: formatCurrencyInput(parseCurrencyInput(current[item.id].unitPrice))
                                  }
                                }))
                              }
                            />
                          </div>
                          <Textarea value={draft.description} onChange={(event) => setPartDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], description: event.target.value } }))} />
                          {fieldError ? <p className="text-xs text-rose-600">{fieldError.message}</p> : null}
                          <p className="text-xs text-slate-500">Saldo atual: {item.stockQuantity}. Ajustes de estoque continuam sendo feitos no modulo de estoque.</p>
                          <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input type="checkbox" checked={draft.active} onChange={(event) => setPartDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], active: event.target.checked } }))} />
                            Peca ativa
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
                              {item.code ?? "Sem codigo"} · {item.active ? "Ativa" : "Inativa"} · venda {formatCurrency(item.unitPrice)}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              custo {formatCurrency(item.costPrice)} · estoque {item.stockQuantity}
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
        ) : null}
      </div>
    </div>
  );
}
