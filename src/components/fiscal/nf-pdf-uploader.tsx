"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface ExtractedData {
  type?: string;
  number?: string;
  series?: string | null;
  issueDate?: string;
  totalAmount?: number | null;
}

interface NfPdfUploaderProps {
  onExtracted: (data: ExtractedData & { filePath: string; fileName: string }) => void;
}

export function NfPdfUploader({ onExtracted }: NfPdfUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") {
      setError("Selecione um arquivo PDF.");
      return;
    }

    setLoading(true);
    setError(null);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/financeiro/documentos/parse-pdf", {
        method: "POST",
        body: formData
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.message ?? "Falha ao processar o PDF.");
        setFileName(null);
        return;
      }

      onExtracted({
        filePath: json.filePath,
        fileName: json.fileName,
        ...json.extracted
      });
    } catch {
      setError("Falha ao enviar o arquivo.");
      setFileName(null);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-2">
      <div
        className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          dragging
            ? "border-sky-400 bg-sky-50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
        } ${loading ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleInputChange}
        />

        {loading ? (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600" />
            <p className="text-sm font-medium text-slate-600">Lendo documento com IA...</p>
          </>
        ) : fileName ? (
          <>
            <svg className="h-8 w-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="text-sm font-medium text-slate-800">{fileName}</p>
              <p className="text-xs text-slate-500">Dados extraídos. Confira os campos abaixo.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            >
              Trocar arquivo
            </Button>
          </>
        ) : (
          <>
            <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div>
              <p className="text-sm font-medium text-slate-700">Arraste a NF aqui ou clique para selecionar</p>
              <p className="text-xs text-slate-500">PDF até 10 MB — os dados serão preenchidos automaticamente</p>
            </div>
          </>
        )}
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
