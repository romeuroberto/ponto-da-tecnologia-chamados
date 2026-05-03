import Link from "next/link";

import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { TicketCard } from "@/components/tickets/ticket-card";
import { TicketTable } from "@/components/tickets/ticket-table";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import { StatusBadge } from "@/components/tickets/status-badge";
import { ActiveFilters } from "@/components/ui/active-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ResultsSummary } from "@/components/ui/results-summary";
import { Select } from "@/components/ui/select";
import { getSlaInfo } from "@/lib/sla";
import { canCreateTicket } from "@/server/auth/permissions";
import { getParam } from "@/server/search-params";
import { clientService } from "@/server/services/client-service";
import { ticketService } from "@/server/services/ticket-service";

export default async function TicketsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const params = await searchParams;
  const q = getParam(params.q) ?? "";
  const status = getParam(params.status) ?? "";
  const priority = getParam(params.priority) ?? "";
  const client = getParam(params.client) ?? "";
  const from = getParam(params.from) ?? "";
  const to = getParam(params.to) ?? "";
  const sort = getParam(params.sort) ?? "updated_desc";
  const page = getParam(params.page) ?? "1";

  const [result, clients] = await Promise.all([
    ticketService.searchTickets({
      query: q || undefined,
      status: (status || undefined) as Parameters<typeof ticketService.searchTickets>[0]["status"],
      priority: (priority || undefined) as Parameters<typeof ticketService.searchTickets>[0]["priority"],
      client: client || undefined,
      from: from || undefined,
      to: to || undefined,
      sort: (sort || undefined) as Parameters<typeof ticketService.searchTickets>[0]["sort"],
      page
    }),
    clientService.listClients()
  ]);

  const canCreate = session?.user ? canCreateTicket(session.user.role) : false;
  const currentPageSlaBreached = result.items.filter((ticket) => getSlaInfo(ticket).state === "breached").length;
  const currentPageSlaWarning = result.items.filter((ticket) => getSlaInfo(ticket).state === "warning").length;
  const activeFilters = [
    q ? { label: "Busca", value: q } : null,
    status ? { label: "Status", value: status } : null,
    priority ? { label: "Prioridade", value: priority } : null,
    client ? { label: "Cliente", value: clients.find((item) => item.id === client)?.name ?? client } : null,
    from ? { label: "De", value: from } : null,
    to ? { label: "Até", value: to } : null
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Chamados"
        description="Tela principal da operação com foco em busca, filtros e acompanhamento."
        action={
          canCreate ? (
            <Link href="/chamados/novo">
              <Button>Novo chamado</Button>
            </Link>
          ) : null
        }
      />
      <ResultsSummary label="chamados" total={result.total} page={result.page} totalPages={result.totalPages} />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-rose-200 bg-rose-50/60">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-rose-700">SLA vencido nesta página</p>
            <p className="mt-2 text-3xl font-semibold text-rose-950">{currentPageSlaBreached}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-amber-700">SLA em risco nesta página</p>
            <p className="mt-2 text-3xl font-semibold text-amber-950">{currentPageSlaWarning}</p>
          </CardContent>
        </Card>
        <Card className="border-sky-200 bg-sky-50/60">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-sky-700">Atalhos operacionais</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/chamados?priority=CRITICAL&sort=priority_desc" className="text-sm font-semibold text-sky-700">
                Críticos
              </Link>
              <span className="text-slate-300">|</span>
              <Link href="/chamados?status=OPEN&sort=updated_desc" className="text-sm font-semibold text-sky-700">
                Abertos
              </Link>
              <span className="text-slate-300">|</span>
              <Link href="/chamados?status=WAITING_CUSTOMER&sort=updated_desc" className="text-sm font-semibold text-sky-700">
                Aguardando cliente
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      <ActiveFilters pathname="/chamados" filters={activeFilters} />
      <form action="/chamados">
        <Card>
          <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-7">
            <Input name="q" defaultValue={q} placeholder="Buscar por número, título ou cliente" />
            <Select name="status" defaultValue={status}>
              <option value="">Todos os status</option>
              <option value="OPEN">Aberto</option>
              <option value="IN_PROGRESS">Em atendimento</option>
              <option value="WAITING_CUSTOMER">Aguardando cliente</option>
              <option value="RESOLVED">Resolvido</option>
              <option value="CLOSED">Encerrado</option>
            </Select>
            <Select name="priority" defaultValue={priority}>
              <option value="">Todas as prioridades</option>
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica</option>
            </Select>
            <Select name="client" defaultValue={client}>
              <option value="">Todos os clientes</option>
              {clients.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Input name="from" type="date" defaultValue={from} />
            <Input name="to" type="date" defaultValue={to} />
            <Select name="sort" defaultValue={sort}>
              <option value="updated_desc">Atualização mais recente</option>
              <option value="updated_asc">Atualização mais antiga</option>
              <option value="created_desc">Abertura mais recente</option>
              <option value="created_asc">Abertura mais antiga</option>
              <option value="priority_desc">Maior prioridade</option>
              <option value="priority_asc">Menor prioridade</option>
            </Select>
            <div className="flex gap-2">
              <input type="hidden" name="page" value="1" />
              <Button type="submit" variant="secondary">
                Aplicar filtros
              </Button>
              <Link href="/chamados">
                <Button type="button" variant="outline">
                  Limpar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
      <div className="space-y-4 lg:hidden">
        {result.items.length > 0 ? (
          result.items.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)
        ) : (
          <EmptyState title="Nenhum chamado encontrado" description="Ajuste os filtros ou limpe a busca para ver outros resultados." />
        )}
      </div>
      {result.items.length > 0 ? <TicketTable tickets={result.items} currentSort={sort} params={{ q, status, priority, client, from, to }} /> : null}
      <PaginationControls pathname="/chamados" page={result.page} totalPages={result.totalPages} params={{ q, status, priority, client, from, to, sort }} />
      <Card className="bg-slate-950 text-white">
        <CardContent className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-300">Leitura rápida da fila</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <PriorityBadge priority="CRITICAL" />
              <PriorityBadge priority="HIGH" />
              <StatusBadge status="WAITING_CUSTOMER" />
            </div>
          </div>
          <p className="max-w-xl text-sm text-slate-300">
            Esta primeira versão prioriza visualização e navegação. O próximo passo é ligar filtros e ações aos dados reais.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
