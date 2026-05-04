import { CatalogManager } from "@/components/catalog/catalog-manager";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/server/auth/session";
import { catalogService } from "@/server/services/catalog-service";

export default async function PartCatalogPage() {
  await requireRole(["ADMIN"]);

  const partItems = await catalogService.listPartItems(true);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalogo de pecas"
        description="Cadastre pecas com codigo automatico, custo, valor de venda e saldo inicial para alimentar vendas e estoque."
      />
      <CatalogManager initialPartItems={partItems} mode="parts" />
    </div>
  );
}
