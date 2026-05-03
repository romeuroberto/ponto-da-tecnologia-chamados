import { Badge } from "@/components/ui/badge";
import { getSlaInfo, getSlaLabel } from "@/lib/sla";
import type { Ticket } from "@/types";

export function TicketSlaBadge({ ticket }: { ticket: Pick<Ticket, "priority" | "status" | "createdAt"> }) {
  const info = getSlaInfo(ticket);

  if (info.state === "stopped") {
    return null;
  }

  const tones = {
    on_track: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    breached: "bg-rose-50 text-rose-700",
    stopped: "bg-slate-100 text-slate-600"
  };

  return <Badge className={tones[info.state]}>{getSlaLabel(ticket)}</Badge>;
}
