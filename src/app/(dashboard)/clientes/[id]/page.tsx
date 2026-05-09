import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { ClientForm } from "@/components/forms/client-form";
import { PageHeader } from "@/components/layout/page-header";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import { StatusBadge } from "@/components/tickets/status-badge";
import { ClientPortalAccessSection } from "@/components/clients/client-portal-access-section";
import { ContractList } from "@/components/contracts/contract-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { canEditClient } from "@/server/auth/permissions";
import { clientService } from "@/server/services/client-service";
import { contractRepository } from "@/server/repositories/contract-repository";
import { ticketService } from "@/server/services/ticket-service";
import { userService } from "@/server/services/user-service";

export default async function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const client = await clientService.getClient(id);

  if (!client) {
    notFound();
  }

  const [tickets, portalUser, contracts] = await Promise.all([
    ticketService.listTickets(),
    userService.getPortalUserByClientId(id),
    contractRepository.findByClientId(id)
  ]);
  const clientTickets = tickets.filter((ticket) => ticket.clientId === client.id);
  const canEdit = session?.user ? canEditClient(session.user.role) : false;

  return (
    <div className="space-y-6">
      <PageHeader title={client.name} description={`Contato principal: ${client.contactName}`} />
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
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
                <p><span className="font-semibold text-slate-950">Obs. financeiras:</span> {client.billingProfile?.contractNotes ?? "Sem observações financeiras"}</p>
              </div>
            </CardContent>
          </Card>
        )}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chamados do cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {clientTickets.length > 0 ? (
                clientTickets.map((ticket) => (
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
                ))
              ) : (
                <p className="text-sm text-slate-500">Nenhum chamado registrado para este cliente.</p>
              )}
            </CardContent>
          </Card>

          <ClientPortalAccessSection clientId={client.id} portalUser={portalUser} canEdit={canEdit} />

          <ContractList clientId={client.id} initialContracts={contracts} canEdit={canEdit} />
        </div>
      </div>
    </div>
  );
}
