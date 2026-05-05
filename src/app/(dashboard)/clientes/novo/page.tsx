import { ClientForm } from "@/components/forms/client-form";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/server/auth/session";
import { ticketCategoryService } from "@/server/services/ticket-category-service";

export default async function NewClientPage() {
  await requireRole(["ADMIN", "ATTENDANT"]);
  const categories = await ticketCategoryService.listCategories(true);

  return (
    <div className="space-y-6">
      <PageHeader title="Novo cliente" description="Cadastro enxuto para iniciar o atendimento rapidamente." />
      <ClientForm categories={categories} />
    </div>
  );
}
