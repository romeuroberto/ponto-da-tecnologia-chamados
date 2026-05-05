import { CatalogManager } from "@/components/catalog/catalog-manager";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/server/auth/session";
import { catalogService } from "@/server/services/catalog-service";

export default async function ServiceCatalogPage() {
  await requireRole(["ADMIN"]);

  const serviceItems = await catalogService.listServiceItems(true);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo de serviços"
        description="Cadastre serviços com código automático e valor padrão para reutilizar no atendimento e no financeiro."
      />
      <CatalogManager initialServiceItems={serviceItems} mode="services" />
    </div>
  );
}
