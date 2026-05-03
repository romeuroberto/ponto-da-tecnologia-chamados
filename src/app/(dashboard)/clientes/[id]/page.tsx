import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { ClientForm } from "@/components/forms/client-form";
import { PageHeader } from "@/components/layout/page-header";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { canEditClient } from "@/server/auth/permissions";
import { clientService } from "@/server/services/client-service";
import { ticketService } from "@/server/services/ticket-service";

export default async function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const client = await clientService.getClient(id);

  if (!client) {
    notFound();
  }

  const tickets = await ticketService.listTickets();
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
                <p><span className="font-semibold text-slate-950">Contrato ativo:</span> {client.billingProfile?.hasActiveContract ? "Sim" : "Não"}</p>
                <p><span className="font-semibold text-slate-950">Valor/hora:</span> {client.billingProfile?.hourlyRate !== undefined ? formatCurrency(client.billingProfile.hourlyRate) : "Não definido"}</p>
                <p><span className="font-semibold text-slate-950">Deslocamento:</span> {client.billingProfile?.travelRate !== undefined ? formatCurrency(client.billingProfile.travelRate) : "Não definido"}</p>
                <p><span className="font-semibold text-slate-950">Desconto padrão:</span> {client.billingProfile?.defaultDiscountPercent !== undefined ? `${client.billingProfile.defaultDiscountPercent}%` : "Não definido"}</p>
                <p><span className="font-semibold text-slate-950">Obs. financeiras:</span> {client.billingProfile?.contractNotes ?? "Sem observações financeiras"}</p>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Chamados do cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {clientTickets.map((ticket) => (
              <div key={ticket.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{ticket.number}</p>
                    <p className="mt-1 font-semibold text-slate-950">{ticket.title}</p>
                  </div>
                  <PriorityBadge priority={ticket.priority} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
