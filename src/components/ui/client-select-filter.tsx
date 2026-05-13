"use client";

import { useRef } from "react";
import { ClientCombobox } from "@/components/ui/client-combobox";
import type { Client } from "@/types";

interface ClientSelectFilterProps {
  clients: Client[];
  selectedClientId: string;
  action: string;
}

export function ClientSelectFilter({ clients, selectedClientId, action }: ClientSelectFilterProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  function handleChange(clientId: string) {
    if (hiddenRef.current) hiddenRef.current.value = clientId;
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={action}>
      <div className="grid w-full max-w-sm gap-2">
        <label className="text-sm font-medium text-slate-700">Cliente</label>
        <ClientCombobox clients={clients} value={selectedClientId} onChange={handleChange} />
        <input ref={hiddenRef} type="hidden" name="clientId" defaultValue={selectedClientId} />
      </div>
    </form>
  );
}
