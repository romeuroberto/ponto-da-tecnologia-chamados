import { PageHeader } from "@/components/layout/page-header";
import { CategoryManager } from "@/components/catalog/category-manager";
import { requireRole } from "@/server/auth/session";
import { ticketCategoryService } from "@/server/services/ticket-category-service";

export default async function CategoriesPage() {
  await requireRole(["ADMIN"]);
  const categories = await ticketCategoryService.listCategories();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias de chamado"
        description="Gerencie as categorias disponíveis na abertura de chamados. Defina qual perfil é sugerido para atribuição."
      />
      <CategoryManager initialCategories={categories} />
    </div>
  );
}
