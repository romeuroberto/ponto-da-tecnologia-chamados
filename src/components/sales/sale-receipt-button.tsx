"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function SaleReceiptButton({ saleId }: { saleId: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/sales/${saleId}/recibo`, { method: "POST" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError((json as { message?: string }).message ?? "Erro ao gerar o recibo.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setReceiptUrl(url);
    } catch {
      setError("Falha na conexão. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" className="w-full" disabled={isGenerating} onClick={handleGenerate}>
        {isGenerating ? "Gerando recibo..." : "Gerar recibo (PDF)"}
      </Button>
      {receiptUrl ? (
        <a
          href={receiptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Abrir PDF
        </a>
      ) : null}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
