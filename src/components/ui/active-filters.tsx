import Link from "next/link";
import type { Route } from "next";

type FilterItem = {
  label: string;
  value: string;
};

function buildResetHref(pathname: string) {
  return pathname as Route;
}

export function ActiveFilters({
  pathname,
  filters
}: {
  pathname: string;
  filters: FilterItem[];
}) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-slate-600">Filtros ativos:</span>
      {filters.map((filter) => (
        <span key={`${filter.label}-${filter.value}`} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
          {filter.label}: {filter.value}
        </span>
      ))}
      <Link href={buildResetHref(pathname)} className="text-sm font-semibold text-sky-700">
        Limpar tudo
      </Link>
    </div>
  );
}
