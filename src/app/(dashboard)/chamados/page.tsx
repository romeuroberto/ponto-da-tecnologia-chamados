import Link from "next/link";

import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { TicketCard } from "@/components/tickets/ticket-card";
import { TicketFilters } from "@/components/tickets/ticket-filters";
import { TicketTable } from "@/components/tickets/ticket-table";
import { ActiveFilters } from "@/components/ui/active-filters";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ResultsSummary } from "@/components/ui/results-summary";
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
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Chamados"
        description="Tela principal da operação com foco em busca, filtros e acompanhamento."
        action={
          canCreate ? (
            <Link href="/chamados/novo">
              <Button className="w-full sm:w-auto">Novo chamado</Button>
            </Link>
          ) : null
        }
      />

      <ResultsSummary label="chamados" total={result.total} page={result.page} totalPages={result.totalPages} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">SLA vencido</p>
          <p className="mt-2 text-3xl font-semibold text-rose-950">{currentPageSlaBreached}</p>
          <p className="mt-1 text-sm text-rose-700">Chamados desta página fora do prazo.</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">SLA em risco</p>
          <p className="mt-2 text-3xl font-semibold text-amber-950">{currentPageSlaWarning}</p>
          <p className="mt-1 text-sm text-amber-700">Acompanhe antes de estourar o prazo.</p>
        </div>
      </div>

      <ActiveFilters pathname="/chamados" filters={activeFilters} />

      <TicketFilters
        clients={clients}
        defaults={{ q, status, priority, client, from, to, sort }}
        activeFiltersCount={activeFilters.length}
      />

      <div className="space-y-4 lg:hidden">
        {result.items.length > 0 ? (
          result.items.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)
        ) : (
          <EmptyState title="Nenhum chamado encontrado" description="Ajuste os filtros ou limpe a busca para ver outros resultados." />
        )}
      </div>

      {result.items.length > 0 ? (
        <TicketTable tickets={result.items} currentSort={sort} params={{ q, status, priority, client, from, to }} />
      ) : null}

      <PaginationControls pathname="/chamados" page={result.page} totalPages={result.totalPages} params={{ q, status, priority, client, from, to, sort }} />
    </div>
  );
}
