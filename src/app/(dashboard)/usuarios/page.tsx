import Link from "next/link";
import type { Route } from "next";

import { ActiveFilters } from "@/components/ui/active-filters";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ResultsSummary } from "@/components/ui/results-summary";
import { Select } from "@/components/ui/select";
import { requireRole } from "@/server/auth/session";
import { getParam } from "@/server/search-params";
import { userService } from "@/server/services/user-service";

const roleLabels = {
  ADMIN: "Administrador",
  ATTENDANT: "Atendente",
  TECHNICIAN: "Técnico"
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
    role ? { label: "Perfil", value: role } : null,
    sort !== "name_asc" ? { label: "Ordenação", value: sort } : null
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        description="Gestão de acesso da equipe interna."
        action={
          <Link href="/usuarios/novo">
            <Button>Novo usuário</Button>
          </Link>
        }
      />
      <ResultsSummary label="usuários" total={result.total} page={result.page} totalPages={result.totalPages} />
      <ActiveFilters pathname="/usuarios" filters={activeFilters} />
      <form action="/usuarios">
        <Card>
          <CardContent className="grid gap-4 p-4 md:grid-cols-[2fr_1fr_1fr_auto]">
            <Input name="q" defaultValue={q} placeholder="Buscar por nome ou e-mail" />
            <Select name="role" defaultValue={role}>
              <option value="">Todos os perfis</option>
              <option value="ADMIN">Administrador</option>
              <option value="ATTENDANT">Atendente</option>
              <option value="TECHNICIAN">Técnico</option>
            </Select>
            <Select name="sort" defaultValue={sort}>
              <option value="name_asc">Nome A-Z</option>
              <option value="name_desc">Nome Z-A</option>
              <option value="role_asc">Perfil A-Z</option>
              <option value="role_desc">Perfil Z-A</option>
            </Select>
            <input type="hidden" name="page" value="1" />
            <div className="flex gap-2">
              <Button type="submit" variant="secondary">
                Filtrar
              </Button>
              <Link href="/usuarios">
                <Button type="button" variant="outline">
                  Limpar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
      {result.items.length === 0 ? (
        <div className="mt-2">
          <EmptyState title="Nenhum usuário encontrado" description="Ajuste a busca ou limpe os filtros para visualizar outros usuários." />
        </div>
      ) : (
        <div className="mt-2 grid gap-4">
          {result.items.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-950">{user.name}</h3>
                  <p className="text-sm text-slate-600">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{roleLabels[user.role]}</span>
                  <Link href={`/usuarios/${user.id}` as Route} className="text-sm font-semibold text-sky-700">
                    Editar
                  </Link>
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
