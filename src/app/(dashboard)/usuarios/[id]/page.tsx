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

  return (
    <div className="space-y-6">
      <PageHeader title={user.name} description={user.email} />
      <UserForm user={user} />
    </div>
  );
}
