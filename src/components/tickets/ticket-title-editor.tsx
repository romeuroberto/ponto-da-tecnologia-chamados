"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function TicketTitleEditor({ ticketId, title }: { ticketId: string; title: string }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function cancel() {
    setValue(title);
    setIsEditing(false);
  }

  async function save() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === title) {
      cancel();
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed })
      });

      if (res.ok) {
        setIsEditing(false);
        router.refresh();
      } else {
        cancel();
      }
    } catch {
      cancel();
    } finally {
      setIsSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          autoFocus
          className="w-full rounded-lg border border-sky-300 bg-white px-2 py-1 text-xl font-bold text-slate-950 shadow-sm outline-none ring-2 ring-sky-200 focus:ring-sky-300 disabled:opacity-60"
          maxLength={200}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      title="Clique para editar o título"
      className="group flex items-center gap-2 rounded-lg px-1 -mx-1 text-left transition hover:bg-slate-100"
    >
      <span className="text-xl font-bold text-slate-950 leading-tight">{value}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-slate-400 opacity-0 transition group-hover:opacity-100"
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
      </svg>
    </button>
  );
}
