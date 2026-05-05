"use client";

import Link from "next/link";
import { Filter, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface UserFiltersProps {
  defaults: {
    q: string;
    role: string;
    sort: string;
  };
  activeFiltersCount: number;
}

function FilterFields({ defaults }: Omit<UserFiltersProps, "activeFiltersCount">) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Input name="q" defaultValue={defaults.q} placeholder="Buscar por nome ou e-mail" />
        <Select name="role" defaultValue={defaults.role}>
          <option value="">Todos os perfis</option>
          <option value="ADMIN">Administrador</option>
          <option value="ATTENDANT">Atendente</option>
          <option value="TECHNICIAN">Técnico</option>
        </Select>
        <Select name="sort" defaultValue={defaults.sort}>
          <option value="name_asc">Nome A-Z</option>
          <option value="name_desc">Nome Z-A</option>
          <option value="role_asc">Perfil A-Z</option>
          <option value="role_desc">Perfil Z-A</option>
        </Select>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <input type="hidden" name="page" value="1" />
        <Button type="submit" variant="secondary" className="w-full sm:w-auto">
          Aplicar filtros
        </Button>
        <Link href="/usuarios" className="w-full sm:w-auto">
          <Button type="button" variant="outline" className="w-full sm:w-auto">
            Limpar
          </Button>
        </Link>
      </div>
    </>
  );
}

export function UserFilters({ defaults, activeFiltersCount }: UserFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <div className="lg:hidden">
        <div className="flex items-center gap-3">
          <form action="/usuarios" className="min-w-0 flex-1">
            <Input name="q" defaultValue={defaults.q} placeholder="Buscar por nome ou e-mail" />
            <input type="hidden" name="role" value={defaults.role} />
            <input type="hidden" name="sort" value={defaults.sort} />
            <input type="hidden" name="page" value="1" />
          </form>
          <Button type="button" variant="outline" className="shrink-0 gap-2" onClick={() => setIsOpen(true)}>
            <Filter className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 ? (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                {activeFiltersCount}
              </span>
            ) : null}
          </Button>
        </div>
      </div>

      <form action="/usuarios" className="hidden lg:block">
        <Card>
          <CardContent className="grid gap-3 p-4">
            <FilterFields defaults={defaults} />
          </CardContent>
        </Card>
      </form>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/45 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setIsOpen(false)}
      />

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 max-h-[88vh] rounded-t-[2rem] bg-white shadow-2xl transition-transform duration-200 lg:hidden",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-950">Filtros</p>
            <p className="text-xs text-slate-500">Refine a busca para localizar a pessoa certa.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            aria-label="Fechar filtros"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action="/usuarios" className="grid gap-4 overflow-y-auto px-4 py-4">
          <FilterFields defaults={defaults} />
        </form>
      </div>
    </>
  );
}
