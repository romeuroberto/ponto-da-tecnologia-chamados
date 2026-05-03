import Link from "next/link";
import type { Route } from "next";

import { auth } from "@/auth";
import { ActiveFilters } from "@/components/ui/active-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ResultsSummary } from "@/components/ui/results-summary";
import { Select } from "@/components/ui/select";
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
  const activeFilters = [
    q ? { label: "Busca", value: q } : null,
    sort !== "name_asc" ? { label: "Ordenação", value: sort } : null
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Cadastro central dos clientes atendidos pela operação."
        action={canCreate ? (
          <Link href="/clientes/novo">
            <Button>Novo cliente</Button>
          </Link>
        ) : null}
      />
      <ResultsSummary label="clientes" total={result.total} page={result.page} totalPages={result.totalPages} />
      <ActiveFilters pathname="/clientes" filters={activeFilters} />
      <form action="/clientes" >
        <Card>
          <CardContent className="grid gap-4 p-4 md:grid-cols-[2fr_1fr_auto]">
            <Input name="q" defaultValue={q} placeholder="Buscar cliente por nome, contato ou e-mail" />
            <Select name="sort" defaultValue={sort}>
              <option value="name_asc">Nome A-Z</option>
              <option value="name_desc">Nome Z-A</option>
              <option value="tickets_desc">Mais chamados</option>
              <option value="tickets_asc">Menos chamados</option>
            </Select>
            <input type="hidden" name="page" value="1" />
            <div className="flex gap-2">
              <Button type="submit" variant="secondary">Filtrar</Button>
              <Link href="/clientes">
                <Button type="button" variant="outline">Limpar</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
      {result.items.length === 0 ? (
        <div className="mt-2">
          <EmptyState title="Nenhum cliente encontrado" description="Tente outro termo de busca ou limpe os filtros aplicados." />
        </div>
      ) : (
      <div className="mt-2 grid gap-4 xl:grid-cols-2">
        {result.items.map((client) => (
          <Card key={client.id}>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">{client.name}</h3>
                  <p className="text-sm text-slate-600">{client.contactName}</p>
                </div>
                {canEdit ? (
                  <Link href={`/clientes/${client.id}` as Route} className="text-sm font-semibold text-sky-700">
                    Editar
                  </Link>
                ) : (
                  <Link href={`/clientes/${client.id}` as Route} className="text-sm font-semibold text-sky-700">
                    Visualizar
                  </Link>
                )}
              </div>
              <div className="grid gap-2 text-sm text-slate-600">
                <p>E-mail: {client.email ?? "Não informado"}</p>
                <p>Telefone: {client.phone ?? "Não informado"}</p>
                <p>Total de chamados: {client.ticketCount}</p>
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
