"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function SaleReceiptButton({ saleId }: { saleId: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/sales/${saleId}/recibo`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Erro ao gerar o recibo.");
        return;
      }
      window.open(json.data.filePath, "_blank");
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
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
