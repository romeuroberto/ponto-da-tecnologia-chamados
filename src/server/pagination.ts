export function normalizePage(value?: string | number | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

export function normalizePageSize(value?: string | number | null, fallback = 10) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), 100) : fallback;
}

export function getPagination(page?: string | number | null, pageSize?: string | number | null, fallback = 10) {
  const currentPage = normalizePage(page);
  const currentPageSize = normalizePageSize(pageSize, fallback);
  const skip = (currentPage - 1) * currentPageSize;

  return {
    page: currentPage,
    pageSize: currentPageSize,
    skip
  };
}

export function buildPaginationResult<T>(items: T[], total: number, page: number, pageSize: number) {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}
