"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";

import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { Ticket, UserRole } from "@/types";
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

const FINANCIAL_PENDING_STATUSES = ["RESOLVED", "CLOSED"] as const;

function FinancialBadge({ ticket, userRole }: { ticket: Ticket; userRole: UserRole }) {
  if (userRole !== "ADMIN" && userRole !== "ATTENDANT") return null;
  if (!ticket.billing) return null;

  const { financialStatus } = ticket.billing;

  if (financialStatus === "PENDENTE" && FINANCIAL_PENDING_STATUSES.includes(ticket.status as typeof FINANCIAL_PENDING_STATUSES[number])) {
    return (
      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
        $ Fin. pendente
      </span>
    );
  }

  if (financialStatus === "EM_ANALISE") {
    return (
      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-800">
        $ Em análise
      </span>
    );
  }

  if (financialStatus === "APROVADO") {
    return (
      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
        $ Aprovado
      </span>
    );
  }

  if (financialStatus === "FATURADO") {
    return (
      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-800">
        $ Aguard. pagto
      </span>
    );
  }

  if (financialStatus === "PAGO") {
    return (
      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
        $ Pago
      </span>
    );
  }

  if (financialStatus === "CANCELADO") {
    return (
      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
        $ Fin. cancelado
      </span>
    );
  }

  return null;
}

export function TicketTable({
  tickets,
  currentSort,
  params,
  userRole
}: {
  tickets: Ticket[];
  currentSort: string;
  params: Record<string, string | undefined>;
  userRole: UserRole;
}) {
  const router = useRouter();

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
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50 last:border-b-0"
                onClick={() => router.push(`/chamados/${ticket.id}` as Route)}
              >
                <td className="px-6 py-4 font-semibold text-slate-950">{ticket.number}</td>
                <td className="px-6 py-4">{ticket.clientName}</td>
                <td className="px-6 py-4">{ticket.title}</td>
                <td className="px-6 py-4">
                  <PriorityBadge priority={ticket.priority} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col items-start">
                    <StatusBadge status={ticket.status} />
                    <FinancialBadge ticket={ticket} userRole={userRole} />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <TicketSlaBadge ticket={ticket} />
                </td>
                <td className="px-6 py-4">{ticket.assigneeName ?? "Não atribuído"}</td>
                <td className="px-6 py-4 text-slate-500">{formatDate(ticket.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
