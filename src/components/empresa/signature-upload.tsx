"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function SignatureUpload({ currentSignaturePath }: { currentSignaturePath?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview(URL.createObjectURL(file));
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/empresa/assinatura", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Erro ao enviar a assinatura.");
        setPreview(null);
      } else {
        router.refresh();
      }
    } catch {
      setError("Falha na conexão. Tente novamente.");
      setPreview(null);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setError(null);
    setIsRemoving(true);
    try {
      const res = await fetch("/api/empresa/assinatura", { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        setError(json.message ?? "Erro ao remover a assinatura.");
      } else {
        setPreview(null);
        router.refresh();
      }
    } catch {
      setError("Falha na conexão. Tente novamente.");
    } finally {
      setIsRemoving(false);
    }
  }

  const signatureSrc = preview ?? currentSignaturePath ?? null;

  return (
    <div className="grid gap-3">
      <p className="text-sm font-medium text-slate-700">Assinatura do responsável</p>

      <div className="flex items-center gap-4">
        <div className="flex h-20 w-48 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {signatureSrc ? (
            <Image
              src={signatureSrc}
              alt="Assinatura"
              width={192}
              height={80}
              className="h-full w-full object-contain p-2"
              unoptimized
            />
          ) : (
            <span className="text-xs text-slate-400">Sem assinatura</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading || isRemoving}
              onClick={() => inputRef.current?.click()}
            >
              {isUploading ? "Enviando..." : signatureSrc ? "Trocar assinatura" : "Enviar assinatura"}
            </Button>
            {(currentSignaturePath || preview) && !isUploading ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isRemoving}
                onClick={handleRemove}
                className="border-rose-200 text-rose-700 hover:bg-rose-50"
              >
                {isRemoving ? "Removendo..." : "Remover"}
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-slate-500">PNG, JPG ou WEBP · fundo transparente recomendado · máx. 2 MB</p>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
