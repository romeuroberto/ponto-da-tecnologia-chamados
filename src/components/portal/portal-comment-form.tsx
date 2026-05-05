"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface PortalCommentFormProps {
  ticketId: string;
}

export function PortalCommentForm({ ticketId }: PortalCommentFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    startTransition(async () => {
      const res = await fetch(`/api/portal/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      if (!res.ok) {
        setError("Erro ao enviar mensagem. Tente novamente.");
        return;
      }

      setMessage("");
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">Mensagem enviada com sucesso.</p> : null}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        required
        placeholder="Escreva sua mensagem..."
        className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      />
      <button
        type="submit"
        disabled={isPending || !message.trim()}
        className="inline-flex h-11 items-center justify-center rounded-full bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
      >
        {isPending ? "Enviando..." : "Enviar mensagem"}
      </button>
    </form>
  );
}
