export function ResultsSummary({
  label,
  total,
  page,
  totalPages
}: {
  label: string;
  total: number;
  page: number;
  totalPages: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
      {total} {label} encontrados • página {page} de {totalPages}
    </div>
  );
}
