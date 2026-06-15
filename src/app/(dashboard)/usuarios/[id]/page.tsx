import { notFound } from "next/navigation";

import { UserForm } from "@/components/forms/user-form";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/server/auth/session";
import { userService } from "@/server/services/user-service";

export default async function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["ADMIN"]);
  const { id } = await params;
  const user = await userService.getUser(id);

  if (!user) {
    notFound();
  }

  if (user.role === "CLIENT") {
    return (
      <div className="space-y-6">
        <PageHeader title={user.name} description={user.email} />
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
          Este usuário é um acesso do portal do cliente e não pode ser editado por aqui. Acesse o cadastro do cliente para alterar os dados de acesso ao portal.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={user.name} description={user.email} />
      <UserForm user={user} />
    </div>
  );
}
