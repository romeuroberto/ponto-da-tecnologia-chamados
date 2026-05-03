import Link from "next/link";
import type { Route } from "next";

import { Button } from "@/components/ui/button";

function buildHref(pathname: string, params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value && value.length > 0) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return (query ? `${pathname}?${query}` : pathname) as Route;
}

export function PaginationControls({
  pathname,
  page,
  totalPages,
  params
}: {
  pathname: string;
  page: number;
  totalPages: number;
  params: Record<string, string | undefined>;
}) {
  const previousHref = buildHref(pathname, { ...params, page: String(Math.max(1, page - 1)) });
  const nextHref = buildHref(pathname, { ...params, page: String(Math.min(totalPages, page + 1)) });

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-slate-600">
        Pagina {page} de {totalPages}
      </p>
      <div className="flex gap-2">
        <Link href={previousHref} aria-disabled={page <= 1} className={page <= 1 ? "pointer-events-none opacity-50" : ""}>
          <Button variant="outline">Anterior</Button>
        </Link>
        <Link href={nextHref} aria-disabled={page >= totalPages} className={page >= totalPages ? "pointer-events-none opacity-50" : ""}>
          <Button variant="outline">Proxima</Button>
        </Link>
      </div>
    </div>
  );
}
