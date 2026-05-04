"use client";

import { useState, useTransition } from "react";

interface PortalCommentFormProps {
  ticketId: string;
}

export function PortalCommentForm({ ticketId }: PortalCommentFormProps) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

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
      setTimeout(() => {
        window.location.reload();
      }, 800);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">Mensagem enviada!</p>}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        required
        placeholder="Escreva sua mensagem…"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none"
      />
      <button
        type="submit"
        disabled={isPending || !message.trim()}
        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
      >
        {isPending ? "Enviando..." : "Enviar"}
      </button>
    </form>
  );
}
