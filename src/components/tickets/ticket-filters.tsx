"use client";

import Link from "next/link";
import { Filter, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { Client } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TicketFiltersProps {
  clients: Client[];
  defaults: {
    q: string;
    status: string;
    priority: string;
    client: string;
    from: string;
    to: string;
    sort: string;
  };
  activeFiltersCount: number;
}

function FilterFields({ clients, defaults }: Omit<TicketFiltersProps, "activeFiltersCount">) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Input name="q" defaultValue={defaults.q} placeholder="Buscar por número, título ou cliente" />
        <Select name="status" defaultValue={defaults.status}>
          <option value="">Todos os status</option>
          <option value="OPEN">Aberto</option>
          <option value="IN_PROGRESS">Em atendimento</option>
          <option value="WAITING_CUSTOMER">Aguardando cliente</option>
          <option value="WAITING_PARTS">Aguardando peças</option>
          <option value="CLOSED">Encerrado</option>
        </Select>
        <Select name="priority" defaultValue={defaults.priority}>
          <option value="">Todas as prioridades</option>
          <option value="LOW">Baixa</option>
          <option value="MEDIUM">Média</option>
          <option value="HIGH">Alta</option>
          <option value="CRITICAL">Crítica</option>
        </Select>
        <Select name="client" defaultValue={defaults.client}>
          <option value="">Todos os clientes</option>
          {clients.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Input name="from" type="date" defaultValue={defaults.from} />
        <Input name="to" type="date" defaultValue={defaults.to} />
        <Select name="sort" defaultValue={defaults.sort}>
          <option value="updated_desc">Atualização mais recente</option>
          <option value="updated_asc">Atualização mais antiga</option>
          <option value="created_desc">Abertura mais recente</option>
          <option value="created_asc">Abertura mais antiga</option>
          <option value="priority_desc">Maior prioridade</option>
          <option value="priority_asc">Menor prioridade</option>
        </Select>
        <div className="flex items-center gap-2">
          <input type="hidden" name="page" value="1" />
          <Button type="submit" variant="secondary" className="flex-1">
            Aplicar filtros
          </Button>
          <Link href="/chamados">
            <Button type="button" variant="outline">
              Limpar
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}

export function TicketFilters({ clients, defaults, activeFiltersCount }: TicketFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <div className="lg:hidden">
        <div className="flex items-center gap-3">
          <form action="/chamados" className="min-w-0 flex-1">
            <Input name="q" defaultValue={defaults.q} placeholder="Buscar por número, título ou cliente" />
            <input type="hidden" name="status" value={defaults.status} />
            <input type="hidden" name="priority" value={defaults.priority} />
            <input type="hidden" name="client" value={defaults.client} />
            <input type="hidden" name="from" value={defaults.from} />
            <input type="hidden" name="to" value={defaults.to} />
            <input type="hidden" name="sort" value={defaults.sort} />
            <input type="hidden" name="page" value="1" />
          </form>
          <Button type="button" variant="outline" className="shrink-0 gap-2" onClick={() => setIsOpen(true)}>
            <Filter className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 ? (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                {activeFiltersCount}
              </span>
            ) : null}
          </Button>
        </div>
      </div>

      <form action="/chamados" className="hidden lg:block">
        <Card>
          <CardContent className="grid gap-3 p-4">
            <FilterFields clients={clients} defaults={defaults} />
          </CardContent>
        </Card>
      </form>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/45 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setIsOpen(false)}
      />

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 max-h-[88vh] rounded-t-[2rem] bg-white shadow-2xl transition-transform duration-200 lg:hidden",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-950">Filtros</p>
            <p className="text-xs text-slate-500">Ajuste a busca para encontrar o chamado certo.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            aria-label="Fechar filtros"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action="/chamados" className="grid gap-4 overflow-y-auto px-4 py-4">
          <FilterFields clients={clients} defaults={defaults} />
        </form>
      </div>
    </>
  );
}
