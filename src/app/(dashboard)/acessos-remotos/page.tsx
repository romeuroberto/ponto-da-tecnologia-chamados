import { notFound } from "next/navigation";

import { RemoteAccessDirectory } from "@/components/clients/remote-access-directory";
import { PageHeader } from "@/components/layout/page-header";
import { canViewClientComputers } from "@/server/auth/permissions";
import { requireUser } from "@/server/auth/session";
import { clientComputerService } from "@/server/services/client-computer-service";

export default async function RemoteAccessPage() {
  const currentUser = await requireUser();

  if (!canViewClientComputers(currentUser.role)) {
    notFound();
  }

  const accesses = await clientComputerService.listRemoteAccessDirectory();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Acessos remotos"
        description="Consulta rápida dos computadores cadastrados nos clientes."
      />
      <RemoteAccessDirectory accesses={accesses} />
    </div>
  );
}
