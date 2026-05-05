import Link from "next/link";
import type { Route } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { UserFilters } from "@/components/users/user-filters";
import { ActiveFilters } from "@/components/ui/active-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ResultsSummary } from "@/components/ui/results-summary";
import { requireRole } from "@/server/auth/session";
import { getParam } from "@/server/search-params";
import { userService } from "@/server/services/user-service";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  ATTENDANT: "Atendente",
  TECHNICIAN: "Técnico",
  CLIENT: "Cliente (portal)"
};

export default async function UsersPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["ADMIN"]);
  const params = await searchParams;
  const q = getParam(params.q) ?? "";
  const role = getParam(params.role) ?? "";
  const sort = getParam(params.sort) ?? "name_asc";
  const page = getParam(params.page) ?? "1";

  const result = await userService.searchUsers({
    query: q || undefined,
    role: (role || undefined) as Parameters<typeof userService.searchUsers>[0]["role"],
    sort: (sort || undefined) as Parameters<typeof userService.searchUsers>[0]["sort"],
    page
  });

  const activeFilters = [
    q ? { label: "Busca", value: q } : null,
    role ? { label: "Perfil", value: roleLabels[role] ?? role } : null,
    sort !== "name_asc" ? { label: "Ordenação", value: sort } : null
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        description="Gestão de acesso da equipe interna."
        action={
          <Link href="/usuarios/novo" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">Novo usuário</Button>
          </Link>
        }
      />
      <ResultsSummary label="usuários" total={result.total} page={result.page} totalPages={result.totalPages} />
      <ActiveFilters pathname="/usuarios" filters={activeFilters} />
      <UserFilters defaults={{ q, role, sort }} activeFiltersCount={activeFilters.length} />
      {result.items.length === 0 ? (
        <div className="mt-2">
          <EmptyState title="Nenhum usuário encontrado" description="Ajuste a busca ou limpe os filtros para visualizar outros usuários." />
        </div>
      ) : (
        <div className="mt-2 grid gap-4 xl:grid-cols-2">
          {result.items.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <CardContent className="space-y-4 p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {roleLabels[user.role]}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {user.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-950">{user.name}</h3>
                    <p className="break-words text-sm text-slate-600">{user.email}</p>
                  </div>
                  <Link href={`/usuarios/${user.id}` as Route} className="text-sm font-semibold text-sky-700">
                    Editar
                  </Link>
                </div>
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Perfil</p>
                    <p className="mt-1">{roleLabels[user.role]}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Acesso</p>
                    <p className="mt-1">{user.active ? "Liberado" : "Bloqueado"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <PaginationControls pathname="/usuarios" page={result.page} totalPages={result.totalPages} params={{ q, role, sort }} />
    </div>
  );
}
