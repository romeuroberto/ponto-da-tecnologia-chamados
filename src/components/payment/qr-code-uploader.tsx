"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";

export function QrCodeUploader({
  instructionId,
  currentPath
}: {
  instructionId: string;
  currentPath?: string | null;
}) {
  const [path, setPath] = useState<string | null>(currentPath ?? null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setError("");
    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/financeiro/pagamentos/${instructionId}/qrcode`, {
        method: "POST",
        body: fd
      });
      const result = await res.json();
      if (result.success) {
        setPath(result.qrCodeImagePath + `?t=${Date.now()}`);
      } else {
        setError(result.message ?? "Erro ao enviar arquivo.");
      }
    });
  }

  function handleRemove() {
    setError("");
    startTransition(async () => {
      const res = await fetch(`/api/financeiro/pagamentos/${instructionId}/qrcode`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        setPath(null);
      } else {
        setError(result.message ?? "Erro ao remover.");
      }
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-2">
      {path ? (
        <div className="flex items-start gap-3">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <Image src={path} alt="QR Code" fill className="object-contain p-1" unoptimized />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-500 break-all">{path.split("?")[0]}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isPending}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Substituir
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isPending}
                className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
              >
                {isPending ? "Removendo..." : "Remover"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 bg-white text-sm text-slate-400 transition-colors hover:border-sky-400 hover:bg-sky-50 hover:text-sky-600"
        >
          {isPending ? (
            <span>Enviando...</span>
          ) : (
            <>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span>Clique ou arraste uma imagem</span>
              <span className="text-xs">PNG, JPG ou WEBP · máx. 2 MB</span>
            </>
          )}
        </div>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
    </div>
  );
}
