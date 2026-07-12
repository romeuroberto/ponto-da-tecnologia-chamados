import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { ClientForm } from "@/components/forms/client-form";
import { PageHeader } from "@/components/layout/page-header";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import { StatusBadge } from "@/components/tickets/status-badge";
import { ClientComputersSection } from "@/components/clients/client-computers-section";
import { ClientPortalAccessSection } from "@/components/clients/client-portal-access-section";
import { ContractList } from "@/components/contracts/contract-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { canEditClient, canManageClientComputers } from "@/server/auth/permissions";
import { clientService } from "@/server/services/client-service";
import { clientComputerService } from "@/server/services/client-computer-service";
import { contractRepository } from "@/server/repositories/contract-repository";
import { ticketCategoryService } from "@/server/services/ticket-category-service";
import { ticketService } from "@/server/services/ticket-service";
import { userService } from "@/server/services/user-service";

export default async function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const client = await clientService.getClient(id);

  if (!client) {
    notFound();
  }

  const canEdit = session?.user ? canEditClient(session.user.role) : false;
  const canManageComputers = session?.user ? canManageClientComputers(session.user.role) : false;

  const [tickets, portalUser, contracts, nextContractNumber, categories, computers] = await Promise.all([
    ticketService.listTickets(),
    userService.getPortalUserByClientId(id),
    contractRepository.findByClientId(id),
    contractRepository.nextNumber(),
    ticketCategoryService.listCategories(true),
    clientComputerService.listClientComputers(id, { includeInactive: canManageComputers })
  ]);
  const clientTickets = tickets.filter((ticket) => ticket.clientId === client.id);

  const recentTickets = clientTickets.slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        description={`Contato principal: ${client.contactName}`}
        action={
          <Link href={`/clientes/${client.id}/financeiro` as Route}>
            <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400">
              Ver débitos
            </Button>
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div>
          {canEdit ? (
            <ClientForm client={client} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Dados do cliente</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 p-6 text-sm text-slate-700">
                <p><span className="font-semibold text-slate-950">Nome:</span> {client.name}</p>
                <p><span className="font-semibold text-slate-950">Contato:</span> {client.contactName}</p>
                <p><span className="font-semibold text-slate-950">E-mail:</span> {client.email ?? "Não informado"}</p>
                <p><span className="font-semibold text-slate-950">Telefone:</span> {client.phone ?? "Não informado"}</p>
                <p><span className="font-semibold text-slate-950">Observações:</span> {client.notes ?? "Sem observações"}</p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p><span className="font-semibold text-slate-950">Tipo padrão:</span> {client.billingProfile?.defaultBillingType ?? "Não definido"}</p>
                  <p><span className="font-semibold text-slate-950">Valor/hora:</span> {client.billingProfile?.hourlyRate !== undefined ? formatCurrency(client.billingProfile.hourlyRate) : "Não definido"}</p>
                  <p><span className="font-semibold text-slate-950">Deslocamento:</span> {client.billingProfile?.travelRate !== undefined ? formatCurrency(client.billingProfile.travelRate) : "Não definido"}</p>
                  <p><span className="font-semibold text-slate-950">Desconto padrão:</span> {client.billingProfile?.defaultDiscountPercent !== undefined ? `${client.billingProfile.defaultDiscountPercent}%` : "Não definido"}</p>
                  <p><span className="font-semibold text-slate-950">Obs. financeiras:</span> {client.billingProfile?.billingInstructions ?? "Sem observações financeiras"}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <ClientPortalAccessSection clientId={client.id} portalUser={portalUser} canEdit={canEdit} />
        </div>

        <div>
          <ContractList clientId={client.id} initialContracts={contracts} canEdit={canEdit} nextContractNumber={nextContractNumber} categories={categories} />
        </div>
      </div>

      <ClientComputersSection clientId={client.id} initialComputers={computers} canManage={canManageComputers} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Chamados do cliente</CardTitle>
          {clientTickets.length > 5 ? (
            <Link
              href={`/chamados?client=${client.id}` as Route}
              className="text-sm font-medium text-sky-600 hover:text-sky-800"
            >
              Ver todos ({clientTickets.length})
            </Link>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {recentTickets.length > 0 ? (
            <>
              {recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/chamados/${ticket.id}` as Route}
                  className="block rounded-xl border border-slate-200 p-4 transition-colors hover:border-slate-400 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{ticket.number}</p>
                      <p className="mt-1 font-semibold text-slate-950">{ticket.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                  </div>
                </Link>
              ))}
              {clientTickets.length > 5 ? (
                <Link
                  href={`/chamados?client=${client.id}` as Route}
                  className="block rounded-xl border border-dashed border-slate-200 p-3 text-center text-sm text-slate-500 transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700"
                >
                  Ver todos os {clientTickets.length} chamados
                </Link>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-slate-500">Nenhum chamado registrado para este cliente.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
