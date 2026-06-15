import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TicketBillingPanel } from "@/components/tickets/ticket-billing-panel";
import { PageHeader } from "@/components/layout/page-header";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import { StatusBadge } from "@/components/tickets/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { getSafeReturnPath } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { requireRole } from "@/server/auth/session";
import { catalogService } from "@/server/services/catalog-service";
import { clientService } from "@/server/services/client-service";
import { ticketService } from "@/server/services/ticket-service";

export default async function TicketFinancialPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const currentUser = await requireRole(["ADMIN", "ATTENDANT"]);
  const { id } = await params;
  const query = await searchParams;
  const ticket = await ticketService.getTicket(id);

  if (!ticket) {
    notFound();
  }

  const [client, partCatalogItems] = await Promise.all([
    clientService.getClient(ticket.clientId),
    catalogService.listPartItems()
  ]);
  const returnTo = getSafeReturnPath(query.returnTo, `/chamados/${id}`);
  const returnLabel = returnTo.includes("/financeiro") ? "← Voltar ao extrato" : "← Voltar ao chamado";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        description={`${ticket.number} — ${ticket.title}`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
            <Link
              href={returnTo as Route}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              {returnLabel}
            </Link>
          </div>
        }
      />
      <TicketBillingPanel
        ticketId={ticket.id}
        ticketStatus={ticket.status}
        initialBilling={ticket.billing}
        clientBillingProfile={client?.billingProfile}
        role={currentUser.role}
        partCatalogItems={partCatalogItems}
      />
    </div>
  );
}
