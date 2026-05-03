import { ClientForm } from "@/components/forms/client-form";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/server/auth/session";

export default async function NewClientPage() {
  await requireRole(["ADMIN", "ATTENDANT"]);

  return (
    <div className="space-y-6">
      <PageHeader title="Novo cliente" description="Cadastro enxuto para iniciar o atendimento rapidamente." />
      <ClientForm />
    </div>
  );
}
