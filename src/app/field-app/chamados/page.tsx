import type { Route } from "next";
import Link from "next/link";
import { Clock3, LifeBuoy, MapPinned, TimerReset } from "lucide-react";

import { FieldAppClaimTicketButton } from "@/components/field-app/field-app-claim-ticket-button";
import { FieldAppTicketCard } from "@/components/field-app/field-app-ticket-card";
import { PortalAppEmptyState } from "@/components/portal-app/portal-app-empty-state";
import { getAttendanceTypeLabel } from "@/lib/ticket-attendance";
import { cn } from "@/lib/utils";
import { getParam } from "@/server/search-params";
import { requireRole } from "@/server/auth/session";
import { ticketService } from "@/server/services/ticket-service";
import type { TicketAttendanceType, TicketStatus } from "@/types";

const filters: Array<{ label: string; value: "" | TicketStatus }> = [
  { label: "Todos", value: "" },
  { label: "Abertos", value: "OPEN" },
  { label: "Em atendimento", value: "IN_PROGRESS" },
  { label: "Aguardando", value: "WAITING_CUSTOMER" },
  { label: "Resolvidos", value: "RESOLVED" },
  { label: "Encerrados", value: "CLOSED" }
];

const attendanceFilters: Array<{ label: string; value: "" | TicketAttendanceType }> = [
  { label: "Todos os tipos", value: "" },
  { label: "Visita técnica", value: "FIELD_VISIT" },
  { label: "Remoto", value: "REMOTE" },
  { label: "Balcão", value: "BALCAO" },
  { label: "Equipamento", value: "IN_STORE_EQUIPMENT" }
];

export default async function FieldAppTicketsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const currentUser = await requireRole(["TECHNICIAN"]);
  const params = await searchParams;
  const scope = getParam(params.scope) ?? "mine";
  const status = getParam(params.status) ?? "";
  const attendanceType = getParam(params.attendanceType) ?? "";

  const result = await ticketService.searchTickets({
    assigneeId: scope === "mine" ? currentUser.id : undefined,
    unassigned: scope === "available",
    status: (status || undefined) as TicketStatus | undefined,
    attendanceType: (attendanceType || undefined) as TicketAttendanceType | undefined,
    sort: "updated_desc",
    pageSize: 30
  });
  const inProgressCount = result.items.filter((ticket) => ticket.status === "IN_PROGRESS").length;
  const waitingCustomerCount = result.items.filter((ticket) => ticket.status === "WAITING_CUSTOMER").length;
  const fieldVisitCount = result.items.filter((ticket) => ticket.attendanceType === "FIELD_VISIT").length;
  const summaryLabel = attendanceType ? getAttendanceTypeLabel(attendanceType as TicketAttendanceType) : "Todos os atendimentos";
  const scopeLabel = scope === "available" ? "Chamados em aberto sem responsável" : "Chamados atribuídos ao seu usuário";

  return (
    <div className="space-y-5">
      <section className="rounded-[1.8rem] border border-slate-200 bg-white px-4 py-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Chamados do técnico</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">Sua fila operacional</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Alterne entre sua fila pessoal e os chamados disponíveis para assumir, sempre com foco em operação mobile.
        </p>
      </section>

      <section className="flex gap-2 overflow-x-auto pb-1">
        {[
          { label: "Minha fila", value: "mine" },
          { label: "Disponíveis", value: "available" }
        ].map((item) => {
          const isActive = scope === item.value;
          const href = (
            item.value === "mine"
              ? `/field-app/chamados${status || attendanceType ? "?" : ""}${status ? `status=${status}` : ""}${status && attendanceType ? "&" : ""}${attendanceType ? `attendanceType=${attendanceType}` : ""}`
              : `/field-app/chamados?scope=available${status ? `&status=${status}` : ""}${attendanceType ? `&attendanceType=${attendanceType}` : ""}`
          ) as Route;

          return (
            <Link
              key={item.value}
              href={href}
              className={cn(
                "whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-semibold transition",
                isActive
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </section>

      <section className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => {
          const isActive = status === filter.value;
          const href = (
            filter.value
              ? `/field-app/chamados?${scope !== "mine" ? `scope=${scope}&` : ""}status=${filter.value}${attendanceType ? `&attendanceType=${attendanceType}` : ""}`
              : `/field-app/chamados${scope !== "mine" || attendanceType ? "?" : ""}${scope !== "mine" ? `scope=${scope}` : ""}${scope !== "mine" && attendanceType ? "&" : ""}${attendanceType ? `attendanceType=${attendanceType}` : ""}`
          ) as Route;

          return (
            <Link
              key={filter.label}
              href={href}
              className={cn(
                "whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-semibold transition",
                isActive
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </section>

      <section className="flex gap-2 overflow-x-auto pb-1">
        {attendanceFilters.map((filter) => {
          const isActive = attendanceType === filter.value;
          const href = (
            filter.value
              ? `/field-app/chamados?${scope !== "mine" ? `scope=${scope}&` : ""}attendanceType=${filter.value}${status ? `&status=${status}` : ""}`
              : `/field-app/chamados${scope !== "mine" || status ? "?" : ""}${scope !== "mine" ? `scope=${scope}` : ""}${scope !== "mine" && status ? "&" : ""}${status ? `status=${status}` : ""}`
          ) as Route;

          return (
            <Link
              key={filter.label}
              href={href}
              className={cn(
                "whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-semibold transition",
                isActive
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </section>

      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50 px-4 py-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <TimerReset className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-emerald-950">{inProgressCount}</p>
          <p className="mt-1 text-xs text-emerald-800">Em atendimento</p>
        </div>
        <div className="rounded-[1.6rem] border border-amber-200 bg-amber-50 px-4 py-4">
          <div className="flex items-center gap-2 text-amber-700">
            <Clock3 className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-amber-950">{waitingCustomerCount}</p>
          <p className="mt-1 text-xs text-amber-800">Aguardando</p>
        </div>
        <div className="rounded-[1.6rem] border border-sky-200 bg-sky-50 px-4 py-4">
          <div className="flex items-center gap-2 text-sky-700">
            <MapPinned className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-sky-950">{fieldVisitCount}</p>
          <p className="mt-1 text-xs text-sky-800">Visitas</p>
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Resumo</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">{result.total} chamado(s)</p>
            <p className="mt-1 text-sm text-slate-500">{summaryLabel}</p>
            <p className="mt-1 text-sm text-slate-500">{scopeLabel}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <MapPinned className="h-5 w-5" />
          </div>
        </div>
      </section>

      {result.items.length > 0 ? (
        <div className="space-y-3">
          {result.items.map((ticket) => (
            <FieldAppTicketCard
              key={ticket.id}
              ticket={ticket}
              href={scope === "mine" ? (`/field-app/chamados/${ticket.id}` as Route) : undefined}
              showPreview={scope === "available"}
              footer={scope === "available" ? <FieldAppClaimTicketButton ticketId={ticket.id} /> : undefined}
            />
          ))}
        </div>
      ) : (
        <PortalAppEmptyState
          icon={LifeBuoy}
          title={scope === "available" ? "Nenhum chamado disponível" : "Nenhum chamado nesta fila"}
          description={
            scope === "available"
              ? "Quando houver chamados abertos sem responsável, eles aparecerão aqui para você assumir."
              : "Ajuste o filtro acima ou aguarde novas atribuições da equipe de atendimento."
          }
        />
      )}
    </div>
  );
}
