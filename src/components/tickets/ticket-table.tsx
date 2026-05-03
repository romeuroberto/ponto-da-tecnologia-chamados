import Link from "next/link";
import type { Route } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { Ticket } from "@/types";
import { PriorityBadge } from "./priority-badge";
import { StatusBadge } from "./status-badge";
import { TicketSlaBadge } from "./ticket-sla-badge";

function buildSortHref(sort: string, params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries({ ...params, sort, page: "1" }).forEach(([key, value]) => {
    if (value && value.length > 0) {
      searchParams.set(key, value);
    }
  });

  return (`/chamados?${searchParams.toString()}`) as Route;
}

export function TicketTable({
  tickets,
  currentSort,
  params
}: {
  tickets: Ticket[];
  currentSort: string;
  params: Record<string, string | undefined>;
}) {
  return (
    <Card className="hidden lg:block">
      <CardContent className="overflow-x-auto p-0">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-4 font-medium">Número</th>
              <th className="px-6 py-4 font-medium">Cliente</th>
              <th className="px-6 py-4 font-medium">Título</th>
              <th className="px-6 py-4 font-medium">
                <Link href={buildSortHref(currentSort === "priority_desc" ? "priority_asc" : "priority_desc", params)} className="hover:text-slate-900">
                  Prioridade {currentSort.startsWith("priority_") ? "•" : ""}
                </Link>
              </th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">SLA</th>
              <th className="px-6 py-4 font-medium">Responsável</th>
              <th className="px-6 py-4 font-medium">
                <Link href={buildSortHref(currentSort === "updated_desc" ? "updated_asc" : "updated_desc", params)} className="hover:text-slate-900">
                  Atualizado {currentSort.startsWith("updated_") ? "•" : ""}
                </Link>
              </th>
              <th className="px-6 py-4 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b border-slate-100 last:border-b-0">
                <td className="px-6 py-4 font-semibold text-slate-950">{ticket.number}</td>
                <td className="px-6 py-4">{ticket.clientName}</td>
                <td className="px-6 py-4">{ticket.title}</td>
                <td className="px-6 py-4">
                  <PriorityBadge priority={ticket.priority} />
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="px-6 py-4">
                  <TicketSlaBadge ticket={ticket} />
                </td>
                <td className="px-6 py-4">{ticket.assigneeName ?? "Não atribuído"}</td>
                <td className="px-6 py-4 text-slate-500">{formatDate(ticket.updatedAt)}</td>
                <td className="px-6 py-4">
                  <Link href={`/chamados/${ticket.id}`} className="font-semibold text-sky-700">
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
