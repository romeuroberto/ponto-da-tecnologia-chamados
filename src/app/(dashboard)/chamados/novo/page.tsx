import { TicketForm } from "@/components/forms/ticket-form";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/server/auth/session";
import { clientService } from "@/server/services/client-service";
import { userService } from "@/server/services/user-service";

export default async function NewTicketPage() {
  await requireRole(["ADMIN", "ATTENDANT"]);
  const [clients, users] = await Promise.all([clientService.listClients(), userService.listAssignableUsers()]);

  return (
    <div className="space-y-6">
      <PageHeader title="Novo chamado" description="Registro rapido de atendimento com os campos essenciais do MVP." />
      <TicketForm clients={clients} users={users} />
    </div>
  );
}
