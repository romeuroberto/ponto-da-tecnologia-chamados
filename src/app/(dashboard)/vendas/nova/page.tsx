import { PageHeader } from "@/components/layout/page-header";
import { SaleForm } from "@/components/sales/sale-form";
import { requireRole } from "@/server/auth/session";
import { clientService } from "@/server/services/client-service";
import { saleService } from "@/server/services/sale-service";

export default async function NovaVendaPage() {
  await requireRole(["ADMIN", "ATTENDANT"]);

  const [clients, parts] = await Promise.all([
    clientService.listClients(),
    saleService.listActiveParts()
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Nova venda" description="Registre a venda de peças para um cliente." />
      <SaleForm clients={clients} parts={parts} />
    </div>
  );
}
