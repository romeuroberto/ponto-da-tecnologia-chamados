"use client";

import { useState, useTransition } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from "@/lib/utils";
import type { PartCatalogItem, ServiceCatalogItem } from "@/types";

const UNIT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "un", label: "un — Unidade" },
  { value: "m", label: "m — Metro" },
  { value: "kg", label: "kg — Quilograma" },
  { value: "l", label: "l — Litro" },
  { value: "cx", label: "cx — Caixa" },
  { value: "pc", label: "pc — Pacote" },
  { value: "rolo", label: "rolo — Rolo" },
  { value: "par", label: "par — Par" }
];

type Mode = "services" | "parts" | "all";

type ServiceFormState = {
  name: string;
  description: string;
  defaultPrice: string;
  resalePrice: string;
  active: boolean;
};

type PartFormState = {
  name: string;
  description: string;
  unit: string;
  costPrice: string;
  unitPrice: string;
  resalePrice: string;
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
  resalePrice: "",
  active: true
};

const emptyPartForm: PartFormState = {
  name: "",
  description: "",
  unit: "un",
  costPrice: formatCurrencyInput(0),
  unitPrice: formatCurrencyInput(0),
  resalePrice: "",
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
          resalePrice: item.resalePrice != null ? formatCurrencyInput(item.resalePrice) : "",
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
          unit: item.unit,
          costPrice: formatCurrencyInput(item.costPrice),
          unitPrice: formatCurrencyInput(item.unitPrice),
          resalePrice: item.resalePrice != null ? formatCurrencyInput(item.resalePrice) : "",
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
    const payload = {
      ...draft,
      defaultPrice: parseCurrencyInput(draft.defaultPrice),
      resalePrice: draft.resalePrice ? parseCurrencyInput(draft.resalePrice) : null
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
              resalePrice: data.resalePrice != null ? formatCurrencyInput(data.resalePrice) : "",
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
            description: data.description ?? "",
            defaultPrice: formatCurrencyInput(data.defaultPrice),
            resalePrice: data.resalePrice != null ? formatCurrencyInput(data.resalePrice) : "",
            active: data.active
          }
        }));
        setNewService(emptyServiceForm);
        setMessage({ type: "success", text: `Serviço cadastrado com sucesso. Código gerado: ${data.code}.` });
      } catch (error) {
        const nextError = { message: error instanceof Error ? error.message : "Não foi possível salvar o serviço." };
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
      resalePrice: draft.resalePrice ? parseCurrencyInput(draft.resalePrice) : null,
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
              unit: data.unit,
              costPrice: formatCurrencyInput(data.costPrice),
              unitPrice: formatCurrencyInput(data.unitPrice),
              resalePrice: data.resalePrice != null ? formatCurrencyInput(data.resalePrice) : "",
              active: data.active
            }
          }));
          setEditingPartId(null);
          setMessage({ type: "success", text: "Material atualizado com sucesso." });
          return;
        }

        setPartItems((current) => sortParts([data, ...current]));
        setPartDrafts((current) => ({
          ...current,
          [data.id]: {
            name: data.name,
            description: data.description ?? "",
            unit: data.unit,
            costPrice: formatCurrencyInput(data.costPrice),
            unitPrice: formatCurrencyInput(data.unitPrice),
            resalePrice: data.resalePrice != null ? formatCurrencyInput(data.resalePrice) : "",
            active: data.active
          }
        }));
        setNewPart(emptyPartForm);
        setMessage({ type: "success", text: `Material cadastrado com sucesso. Código gerado: ${data.code}.` });
      } catch (error) {
        const nextError = { message: error instanceof Error ? error.message : "Não foi possível salvar o material." };
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
                    <Label>Código</Label>
                    <div className="flex h-10 items-center rounded-lg border border-dashed border-slate-300 bg-white px-3 text-sm text-slate-500">
                      Gerado automaticamente no cadastro
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="service-price">Valor padrão</Label>
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
                  <div className="grid gap-2">
                    <Label htmlFor="service-resale-price">Preço revenda <span className="text-slate-400 font-normal">(opcional)</span></Label>
                    <Input
                      id="service-resale-price"
                      placeholder="—"
                      value={newService.resalePrice}
                      onChange={(event) => setNewService((current) => ({ ...current, resalePrice: event.target.value }))}
                      onBlur={() =>
                        setNewService((current) => ({
                          ...current,
                          resalePrice: current.resalePrice ? formatCurrencyInput(parseCurrencyInput(current.resalePrice)) : ""
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={newService.active} onChange={(event) => setNewService((current) => ({ ...current, active: event.target.checked }))} />
                    Serviço ativo
                  </label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="service-description">Descrição</Label>
                  <Textarea id="service-description" value={newService.description} onChange={(event) => setNewService((current) => ({ ...current, description: event.target.value }))} />
                  {newServiceError ? <p className="text-xs text-rose-600">{newServiceError.message}</p> : null}
                </div>
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
                            <div className="flex h-10 items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 text-sm text-slate-500">
                              {item.code ?? "Código indisponível"}
                            </div>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <Input
                              placeholder="Valor padrão"
                              value={draft.defaultPrice}
                              onChange={(event) => setServiceDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], defaultPrice: event.target.value } }))}
                              onBlur={() =>
                                setServiceDrafts((current) => ({
                                  ...current,
                                  [item.id]: { ...current[item.id], defaultPrice: formatCurrencyInput(parseCurrencyInput(current[item.id].defaultPrice)) }
                                }))
                              }
                            />
                            <Input
                              placeholder="Preço revenda (opcional)"
                              value={draft.resalePrice}
                              onChange={(event) => setServiceDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], resalePrice: event.target.value } }))}
                              onBlur={() =>
                                setServiceDrafts((current) => ({
                                  ...current,
                                  [item.id]: {
                                    ...current[item.id],
                                    resalePrice: current[item.id].resalePrice ? formatCurrencyInput(parseCurrencyInput(current[item.id].resalePrice)) : ""
                                  }
                                }))
                              }
                            />
                          </div>
                          <Textarea value={draft.description} onChange={(event) => setServiceDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], description: event.target.value } }))} />
                          {fieldError ? <p className="text-xs text-rose-600">{fieldError.message}</p> : null}
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
                              {item.code ?? "Sem código"} · {item.active ? "Ativo" : "Inativo"} · {formatCurrency(item.defaultPrice)}
                              {item.resalePrice != null ? <span className="ml-2 text-slate-400">· revenda {formatCurrency(item.resalePrice)}</span> : null}
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
              <CardTitle>Materiais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="part-name">Nome</Label>
                    <Input id="part-name" value={newPart.name} onChange={(event) => setNewPart((current) => ({ ...current, name: event.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Código</Label>
                    <div className="flex h-10 items-center rounded-lg border border-dashed border-slate-300 bg-white px-3 text-sm text-slate-500">
                      Gerado automaticamente no cadastro
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="part-unit">Unidade</Label>
                    <Select id="part-unit" value={newPart.unit} onChange={(event) => setNewPart((current) => ({ ...current, unit: event.target.value }))}>
                      {UNIT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </Select>
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
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="part-cost">Custo padrão</Label>
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
                    <Label htmlFor="part-resale-price">Preço revenda <span className="text-slate-400 font-normal">(opcional)</span></Label>
                    <Input
                      id="part-resale-price"
                      placeholder="—"
                      value={newPart.resalePrice}
                      onChange={(event) => setNewPart((current) => ({ ...current, resalePrice: event.target.value }))}
                      onBlur={() =>
                        setNewPart((current) => ({
                          ...current,
                          resalePrice: current.resalePrice ? formatCurrencyInput(parseCurrencyInput(current.resalePrice)) : ""
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="part-description">Descrição</Label>
                  <Textarea id="part-description" value={newPart.description} onChange={(event) => setNewPart((current) => ({ ...current, description: event.target.value }))} />
                  {newPartError ? <p className="text-xs text-rose-600">{newPartError.message}</p> : null}
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={newPart.active} onChange={(event) => setNewPart((current) => ({ ...current, active: event.target.checked }))} />
                  Material ativo
                </label>
                <Button type="button" disabled={isPending} onClick={() => savePartItem()}>
                  {isPending ? "Salvando..." : "Cadastrar material"}
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
                              {item.code ?? "Código indisponível"}
                            </div>
                          </div>
                          <div className="grid gap-4 md:grid-cols-3">
                            <Input
                              placeholder="Custo padrão"
                              value={draft.costPrice}
                              onChange={(event) => setPartDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], costPrice: event.target.value } }))}
                              onBlur={() =>
                                setPartDrafts((current) => ({
                                  ...current,
                                  [item.id]: { ...current[item.id], costPrice: formatCurrencyInput(parseCurrencyInput(current[item.id].costPrice)) }
                                }))
                              }
                            />
                            <Input
                              placeholder="Valor de venda"
                              value={draft.unitPrice}
                              onChange={(event) => setPartDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], unitPrice: event.target.value } }))}
                              onBlur={() =>
                                setPartDrafts((current) => ({
                                  ...current,
                                  [item.id]: { ...current[item.id], unitPrice: formatCurrencyInput(parseCurrencyInput(current[item.id].unitPrice)) }
                                }))
                              }
                            />
                            <Input
                              placeholder="Preço revenda (opcional)"
                              value={draft.resalePrice}
                              onChange={(event) => setPartDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], resalePrice: event.target.value } }))}
                              onBlur={() =>
                                setPartDrafts((current) => ({
                                  ...current,
                                  [item.id]: {
                                    ...current[item.id],
                                    resalePrice: current[item.id].resalePrice ? formatCurrencyInput(parseCurrencyInput(current[item.id].resalePrice)) : ""
                                  }
                                }))
                              }
                            />
                          </div>
                          <Select
                            value={draft.unit}
                            onChange={(event) => setPartDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], unit: event.target.value } }))}
                          >
                            {UNIT_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </Select>
                          <Textarea value={draft.description} onChange={(event) => setPartDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], description: event.target.value } }))} />
                          {fieldError ? <p className="text-xs text-rose-600">{fieldError.message}</p> : null}
                          <p className="text-xs text-slate-500">Saldo atual: {item.stockQuantity} {item.unit}. Ajustes de estoque continuam sendo feitos no módulo de estoque.</p>
                          <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input type="checkbox" checked={draft.active} onChange={(event) => setPartDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], active: event.target.checked } }))} />
                            Material ativo
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
                              {item.code ?? "Sem código"} · {item.active ? "Ativo" : "Inativo"} · {item.unit} · venda {formatCurrency(item.unitPrice)}
                              {item.resalePrice != null ? <span className="ml-1 text-slate-400">· revenda {formatCurrency(item.resalePrice)}</span> : null}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              custo {formatCurrency(item.costPrice)} · estoque {item.stockQuantity} {item.unit}
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
