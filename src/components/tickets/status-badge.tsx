import { Badge } from "@/components/ui/badge";
import type { TicketStatus } from "@/types";

const labels: Record<TicketStatus, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em atendimento",
  WAITING_CUSTOMER: "Aguardando cliente",
  RESOLVED: "Resolvido",
  CLOSED: "Encerrado",
  CANCELED: "Cancelado"
};

const classes: Record<TicketStatus, string> = {
  OPEN: "bg-sky-100 text-sky-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  WAITING_CUSTOMER: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-200 text-slate-700",
  CANCELED: "bg-rose-100 text-rose-700"
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <Badge className={classes[status]}>{labels[status]}</Badge>;
}

