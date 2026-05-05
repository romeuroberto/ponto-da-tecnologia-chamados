"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { AppUser, Ticket } from "@/types";

function formatDuration(from: string, to: string): string {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

export function FieldVisitCheckin({
  ticket,
  role,
  currentUserId
}: {
  ticket: Ticket;
  role: AppUser["role"];
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const canManage =
    ticket.attendanceType === "FIELD_VISIT" &&
    (role === "ADMIN" || role === "ATTENDANT" || (role === "TECHNICIAN" && currentUserId === ticket.assigneeId));

  if (!canManage) return null;

  function handleCheckIn() {
    startTransition(async () => {
      await fetch(`/api/tickets/${ticket.id}/checkin`, { method: "POST" });
      router.refresh();
    });
  }

  function handleCheckOut() {
    startTransition(async () => {
      await fetch(`/api/tickets/${ticket.id}/checkin`, { method: "DELETE" });
      router.refresh();
    });
  }

  const checkedIn = Boolean(ticket.checkedInAt);
  const checkedOut = Boolean(ticket.checkedOutAt);

  return (
    <Card className="border-sky-200 bg-sky-50/40">
      <CardHeader>
        <CardTitle className="text-sky-900">Visita técnica</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Check-in</span>
            <span className={checkedIn ? "font-medium text-slate-900" : "text-slate-400"}>
              {ticket.checkedInAt ? formatDate(ticket.checkedInAt) : "Não registrado"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Check-out</span>
            <span className={checkedOut ? "font-medium text-slate-900" : "text-slate-400"}>
              {ticket.checkedOutAt ? formatDate(ticket.checkedOutAt) : "Não registrado"}
            </span>
          </div>
          {checkedIn && checkedOut ? (
            <div className="flex items-center justify-between border-t border-sky-200 pt-2">
              <span className="font-medium text-slate-700">Tempo em campo</span>
              <span className="font-semibold text-sky-800">
                {formatDuration(ticket.checkedInAt!, ticket.checkedOutAt!)}
              </span>
            </div>
          ) : null}
        </div>

        {!checkedIn ? (
          <Button type="button" className="w-full" disabled={isPending} onClick={handleCheckIn}>
            {isPending ? "Registrando..." : "Registrar check-in"}
          </Button>
        ) : !checkedOut ? (
          <Button type="button" variant="outline" className="w-full" disabled={isPending} onClick={handleCheckOut}>
            {isPending ? "Registrando..." : "Registrar check-out"}
          </Button>
        ) : (
          <p className="text-center text-xs text-slate-500">Visita encerrada.</p>
        )}
      </CardContent>
    </Card>
  );
}
