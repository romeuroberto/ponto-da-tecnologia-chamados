"use client";

import { useEffect, useRef, useState } from "react";
import type { Client } from "@/types";

interface ClientComboboxProps {
  clients: Client[];
  value: string;
  onChange: (clientId: string) => void;
  disabled?: boolean;
}

export function ClientCombobox({ clients, value, onChange, disabled }: ClientComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [highlighted, setHighlighted] = useState(0);

  const selected = clients.find((c) => c.id === value);

  const filtered = query.trim()
    ? clients.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        (c.document ?? "").toLowerCase().includes(query.toLowerCase()) ||
        (c.contactName ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : clients;

  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputFocus() {
    setOpen(true);
    setQuery("");
  }

  function handleSelect(client: Client) {
    onChange(client.id);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setQuery("");
    setOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlighted]) handleSelect(filtered[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  useEffect(() => {
    if (!open || !listRef.current) return;
    const item = listRef.current.children[highlighted] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlighted, open]);

  const displayValue = open ? query : (selected?.name ?? "");

  return (
    <div ref={containerRef} className="relative">
      <div className={`flex items-center rounded-lg border bg-white transition-colors ${open ? "border-sky-400 ring-1 ring-sky-300" : "border-slate-300"} ${disabled ? "pointer-events-none opacity-50" : ""}`}>
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder="Buscar cliente..."
          disabled={disabled}
          autoComplete="off"
          className="flex-1 rounded-lg bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
        {value && !open ? (
          <button
            type="button"
            onClick={handleClear}
            className="px-2 text-slate-400 hover:text-slate-700"
            tabIndex={-1}
            title="Limpar seleção"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        ) : (
          <span className="px-2 text-slate-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        )}
      </div>

      {open && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-500">Nenhum cliente encontrado.</li>
          ) : (
            filtered.map((client, i) => (
              <li
                key={client.id}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(client); }}
                onMouseEnter={() => setHighlighted(i)}
                className={`flex cursor-pointer flex-col px-4 py-2.5 ${i === highlighted ? "bg-sky-50" : "hover:bg-slate-50"} ${client.id === value ? "font-semibold" : ""}`}
              >
                <span className="text-sm text-slate-900">
                  {client.id === value && (
                    <svg className="mr-1 inline-block text-sky-600" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {client.name}
                  {client.isReseller && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">Revenda</span>
                  )}
                </span>
                {(client.document || client.contactName) && (
                  <span className="text-xs text-slate-400">
                    {[client.document, client.contactName !== client.name ? client.contactName : ""].filter(Boolean).join(" · ")}
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
