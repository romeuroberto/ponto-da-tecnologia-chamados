import { TicketForm } from "@/components/forms/ticket-form";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/server/auth/session";
import { clientService } from "@/server/services/client-service";
import { ticketCategoryService } from "@/server/services/ticket-category-service";
import { userService } from "@/server/services/user-service";

export default async function NewTicketPage() {
  await requireRole(["ADMIN", "ATTENDANT"]);
  const [clients, users, categories] = await Promise.all([
    clientService.listClients(),
    userService.listAssignableUsers(),
    ticketCategoryService.listCategories(true)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Novo chamado" description="Registro rápido de atendimento com os campos essenciais do MVP." />
      <TicketForm clients={clients} users={users} categories={categories} />
    </div>
  );
}
