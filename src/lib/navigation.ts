export function isSafeReturnPath(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return !!raw && raw.startsWith("/") && !raw.startsWith("//");
}

export function getSafeReturnPath(value: string | string[] | undefined, fallback: string) {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }

  return fallback;
}

export function withReturnTo(path: string, returnTo: string) {
  return `${path}?returnTo=${encodeURIComponent(returnTo)}`;
}
