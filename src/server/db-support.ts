export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function normalizeOptionalString(value?: string | null) {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function normalizeOptionalNumber(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return undefined;
  }

  return value;
}
