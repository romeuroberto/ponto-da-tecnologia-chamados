import { cn } from "@/lib/utils";
import { getTicketFlowSummary } from "@/lib/ticket-flow";
import type { Ticket } from "@/types";

function stageDot(state: "done" | "current" | "upcoming") {
  if (state === "done") return "bg-emerald-500 ring-emerald-100";
  if (state === "current") return "bg-blue-600 ring-blue-100";
  return "bg-slate-300 ring-transparent";
}

function stageLabel(state: "done" | "current" | "upcoming") {
  if (state === "done") return "text-emerald-700";
  if (state === "current") return "text-blue-700 font-semibold";
  return "text-slate-400";
}

function connector(state: "done" | "upcoming") {
  return state === "done" ? "bg-emerald-300" : "bg-slate-200";
}

export function TicketFlowBar({ ticket }: { ticket: Ticket }) {
  const flow = getTicketFlowSummary(ticket);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center gap-1">
        {flow.stages.map((stage, index) => (
          <div key={stage.id} className="flex min-w-0 flex-1 items-center gap-1">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "h-2.5 w-2.5 flex-shrink-0 rounded-full ring-4",
                  stageDot(stage.state)
                )}
              />
              <span className={cn("hidden text-[11px] leading-tight sm:block", stageLabel(stage.state))}>
                {stage.label}
              </span>
            </div>
            {index < flow.stages.length - 1 && (
              <div
                className={cn(
                  "mb-4 h-px flex-1",
                  connector(stage.state === "done" ? "done" : "upcoming")
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {flow.currentStageLabel}
          </span>
          <span className="text-xs text-slate-500">{flow.nextAction}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
            {flow.technicalStatusLabel}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
            {flow.financialStatusLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
