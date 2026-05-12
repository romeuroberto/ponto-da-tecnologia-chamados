import Link from "next/link";
import type { Route } from "next";

import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ResultsSummary } from "@/components/ui/results-summary";
import { canCreateClient, canEditClient } from "@/server/auth/permissions";
import { getParam } from "@/server/search-params";
import { clientService } from "@/server/services/client-service";

export default async function ClientsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const params = await searchParams;
  const q = getParam(params.q) ?? "";
  const sort = getParam(params.sort) ?? "name_asc";
  const page = getParam(params.page) ?? "1";
  const result = await clientService.searchClients({
    query: q || undefined,
    sort: (sort || undefined) as Parameters<typeof clientService.searchClients>[0]["sort"],
    page
  });
  const role = session?.user?.role;
  const canCreate = role ? canCreateClient(role) : false;
  const canEdit = role ? canEditClient(role) : false;
  const hasActiveFilters = q || sort !== "name_asc";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Cadastro central dos clientes atendidos pela operação."
        action={
          canCreate ? (
            <Link href="/clientes/novo" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">Novo cliente</Button>
            </Link>
          ) : null
        }
      />
      <ResultsSummary label="clientes" total={result.total} page={result.page} totalPages={result.totalPages} />

      <form action="/clientes" className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por cliente, contato ou e-mail..."
          className="h-9 flex-1 min-w-48 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />
        <select
          name="sort"
          defaultValue={sort}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500"
        >
          <option value="name_asc">Nome A-Z</option>
          <option value="name_desc">Nome Z-A</option>
          <option value="tickets_desc">Mais chamados</option>
          <option value="tickets_asc">Menos chamados</option>
        </select>
        <input type="hidden" name="page" value="1" />
        <button type="submit" className="h-9 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700">
          Buscar
        </button>
        {hasActiveFilters ? (
          <Link href="/clientes" className="flex h-9 items-center rounded-lg border border-slate-200 px-4 text-sm text-slate-600 hover:bg-slate-50">
            Limpar
          </Link>
        ) : null}
      </form>
      {result.items.length === 0 ? (
        <div className="mt-2">
          <EmptyState title="Nenhum cliente encontrado" description="Tente outro termo de busca ou limpe os filtros aplicados." />
        </div>
      ) : (
        <div className="mt-2 grid gap-4 xl:grid-cols-2">
          {result.items.map((client) => (
            <Card key={client.id} className="overflow-hidden">
              <CardContent className="space-y-4 p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                        Cliente
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {client.ticketCount} chamado{client.ticketCount === 1 ? "" : "s"}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-950">{client.name}</h3>
                    <p className="text-sm text-slate-600">
                      Contato principal: {client.contactName || "Não informado"}
                    </p>
                  </div>
                  <Link href={`/clientes/${client.id}` as Route} className="text-sm font-semibold text-sky-700">
                    {canEdit ? "Editar" : "Visualizar"}
                  </Link>
                </div>
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">E-mail</p>
                    <p className="mt-1 break-words">{client.email ?? "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Telefone</p>
                    <p className="mt-1">{client.phone ?? "Não informado"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <PaginationControls pathname="/clientes" page={result.page} totalPages={result.totalPages} params={{ q, sort }} />
    </div>
  );
}
