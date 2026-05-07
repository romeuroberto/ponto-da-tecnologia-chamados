"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function LogoUpload({ currentLogoPath }: { currentLogoPath?: string }) {
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
      const res = await fetch("/api/empresa/logo", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Erro ao enviar a logo.");
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
      const res = await fetch("/api/empresa/logo", { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        setError(json.message ?? "Erro ao remover a logo.");
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

  const logoSrc = preview ?? currentLogoPath ?? null;

  return (
    <div className="grid gap-3">
      <p className="text-sm font-medium text-slate-700">Logo da empresa</p>

      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt="Logo da empresa"
              width={80}
              height={80}
              className="h-full w-full object-contain p-1"
              unoptimized
            />
          ) : (
            <span className="text-xs text-slate-400">Sem logo</span>
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
              {isUploading ? "Enviando..." : logoSrc ? "Trocar logo" : "Enviar logo"}
            </Button>
            {(currentLogoPath || preview) && !isUploading ? (
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
          <p className="text-xs text-slate-500">PNG, JPG, WEBP ou SVG · máx. 2 MB</p>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
