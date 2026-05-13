"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SendHorizonal } from "lucide-react";

interface PortalCommentFormProps {
  ticketId: string;
  variant?: "default" | "chat" | "chat-sticky";
}

export function PortalCommentForm({ ticketId, variant = "default" }: PortalCommentFormProps) {
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

  if (variant === "chat" || variant === "chat-sticky") {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}
        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Mensagem enviada. A conversa foi atualizada.
          </div>
        ) : null}

        <div
          className={
            variant === "chat-sticky"
              ? "rounded-[1.8rem] border border-slate-200 bg-white/96 p-3 shadow-[0_-12px_28px_-20px_rgba(15,23,42,0.38)] backdrop-blur"
              : "rounded-[1.6rem] border border-slate-200 bg-slate-50 p-3"
          }
        >
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={variant === "chat-sticky" ? 3 : 4}
            required
            placeholder="Escreva sua resposta ou complemente informações do chamado..."
            className="w-full resize-none rounded-2xl border-0 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none ring-1 ring-slate-200 transition placeholder:text-slate-400 focus:ring-2 focus:ring-sky-200"
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {variant === "chat-sticky"
                ? "Resposta rápida no histórico."
                : "Nossa equipe verá sua mensagem no histórico deste chamado."}
            </p>
            <button
              type="submit"
              disabled={isPending || !message.trim()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SendHorizonal className="h-4 w-4" />
              {isPending ? "Enviando..." : "Responder"}
            </button>
          </div>
        </div>
      </form>
    );
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
