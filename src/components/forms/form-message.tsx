export function FormMessage({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <div
      className={
        type === "success"
          ? "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          : "rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
      }
    >
      {message}
    </div>
  );
}
