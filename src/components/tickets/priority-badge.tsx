import { Badge } from "@/components/ui/badge";
import type { TicketPriority } from "@/types";

const labels: Record<TicketPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Critica"
};

const classes: Record<TicketPriority, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-sky-100 text-sky-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-rose-100 text-rose-700"
};

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <Badge className={classes[priority]}>{labels[priority]}</Badge>;
}

