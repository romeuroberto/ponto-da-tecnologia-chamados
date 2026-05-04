import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getTicketFlowSummary } from "@/lib/ticket-flow";
import type { Ticket } from "@/types";

function stageTone(state: "done" | "current" | "upcoming") {
  if (state === "done") {
    return {
      dot: "bg-emerald-500",
      border: "border-emerald-200",
      bg: "bg-emerald-50/70",
      text: "text-emerald-900"
    };
  }

  if (state === "current") {
    return {
      dot: "bg-blue-600",
      border: "border-blue-200",
      bg: "bg-blue-50/80",
      text: "text-blue-950"
    };
  }

  return {
    dot: "bg-slate-300",
    border: "border-slate-200",
    bg: "bg-slate-50",
    text: "text-slate-700"
  };
}

export function TicketFlowOverview({ ticket }: { ticket: Ticket }) {
  const flow = getTicketFlowSummary(ticket);

  return (
    <Card className="border-blue-100 bg-gradient-to-br from-white via-slate-50 to-blue-50/60">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Fluxo do chamado</CardTitle>
            <p className="mt-2 text-sm leading-6 text-slate-600">{flow.overallDescription}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status geral</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{flow.overallLabel}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Técnico</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{flow.technicalStatusLabel}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Financeiro</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{flow.financialStatusLabel}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Próxima ação recomendada</p>
          <p className="mt-1 text-sm font-medium text-amber-950">{flow.nextAction}</p>
        </div>

        <div className="grid gap-3 xl:grid-cols-6">
          {flow.stages.map((stage) => {
            const tone = stageTone(stage.state);

            return (
              <div
                key={stage.id}
                className={cn("rounded-2xl border p-4 transition-colors", tone.border, tone.bg)}
              >
                <div className="flex items-center gap-3">
                  <span className={cn("h-3 w-3 rounded-full", tone.dot)} />
                  <p className={cn("text-sm font-semibold", tone.text)}>{stage.label}</p>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">{stage.description}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
