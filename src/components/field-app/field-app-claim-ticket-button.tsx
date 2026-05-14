"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";

export function FieldAppClaimTicketButton({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleClaim() {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/tickets/${ticketId}/claim`, {
        method: "POST"
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: result.message ?? "Não foi possível assumir este chamado."
        });
        return;
      }

      router.push(`/field-app/chamados/${ticketId}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {message ? <FormMessage type={message.type} message={message.text} /> : null}
      <Button type="button" className="w-full" disabled={isPending} onClick={handleClaim}>
        {isPending ? "Assumindo..." : "Assumir chamado"}
      </Button>
    </div>
  );
}
