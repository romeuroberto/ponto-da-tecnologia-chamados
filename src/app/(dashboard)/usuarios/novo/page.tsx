import { UserForm } from "@/components/forms/user-form";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/server/auth/session";

export default async function NewUserPage() {
  await requireRole(["ADMIN"]);

  return (
    <div className="space-y-6">
      <PageHeader title="Novo usuario" description="Criacao de acesso interno para administradores, atendentes e tecnicos." />
      <UserForm />
    </div>
  );
}
