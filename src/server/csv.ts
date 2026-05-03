export function toCsv(rows: Array<Record<string, string>>) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const escapeValue = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escapeValue).join(";"),
    ...rows.map((row) => headers.map((header) => escapeValue(row[header] ?? "")).join(";"))
  ];

  return lines.join("\n");
}
