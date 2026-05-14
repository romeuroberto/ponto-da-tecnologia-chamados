"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { CheckSquare2, Crosshair, MapPin } from "lucide-react";

import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { Ticket } from "@/types";

const checklistItems = [
  { id: "arrival", label: "Chegada ao local confirmada" },
  { id: "diagnosis", label: "Diagnóstico validado no ambiente" },
  { id: "execution", label: "Ação técnica executada ou orientada" },
  { id: "customer", label: "Cliente orientado sobre o atendimento" }
] as const;

type ChecklistState = Record<(typeof checklistItems)[number]["id"], boolean>;

function buildInitialChecklist(): ChecklistState {
  return {
    arrival: false,
    diagnosis: false,
    execution: false,
    customer: false
  };
}

export function FieldAppVisitReportPanel({ ticket }: { ticket: Ticket }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState<ChecklistState>(buildInitialChecklist());
  const [locationLabel, setLocationLabel] = useState<string>("");
  const [locationError, setLocationError] = useState("");
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const checkedCount = useMemo(
    () => checklistItems.filter((item) => checklist[item.id]).length,
    [checklist]
  );

  if (ticket.attendanceType !== "FIELD_VISIT") {
    return null;
  }

  function captureLocation() {
    setLocationError("");

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("A localização do aparelho não está disponível neste dispositivo.");
      return;
    }

    setIsCapturingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocationLabel(
          `${latitude.toFixed(5)}, ${longitude.toFixed(5)}${accuracy ? ` · precisão ${Math.round(accuracy)}m` : ""}`
        );
        setIsCapturingLocation(false);
      },
      () => {
        setLocationError("Não foi possível capturar a localização atual. Verifique a permissão do navegador.");
        setIsCapturingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );
  }

  function toggleChecklistItem(id: keyof ChecklistState) {
    setChecklist((current) => ({
      ...current,
      [id]: !current[id]
    }));
  }

  function resetForm() {
    setNotes("");
    setChecklist(buildInitialChecklist());
    setLocationLabel("");
    setLocationError("");
  }

  function submitVisitReport() {
    setMessage(null);

    const lines = [
      "Checklist de visita técnica:",
      ...checklistItems.map((item) => `- ${item.label}: ${checklist[item.id] ? "Sim" : "Não"}`),
      locationLabel ? `- Localização registrada: ${locationLabel}` : "- Localização registrada: Não informada",
      notes.trim() ? `- Observações: ${notes.trim()}` : null
    ].filter((line): line is string => Boolean(line));

    startTransition(async () => {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: lines.join("\n")
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: result.message ?? "Não foi possível registrar o checklist de visita." });
        return;
      }

      resetForm();
      setMessage({ type: "success", text: "Checklist de visita registrado no histórico." });
      router.refresh();
    });
  }

  return (
    <Card className="border-emerald-200 bg-emerald-50/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-950">
          <CheckSquare2 className="h-5 w-5" />
          Checklist da visita
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {message ? <FormMessage type={message.type} message={message.text} /> : null}

        <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-900">
          <p className="font-semibold">{checkedCount} de {checklistItems.length} etapas marcadas</p>
          <p className="mt-1 text-emerald-800">Use este bloco para registrar a visita sem depender de texto livre em toda interação.</p>
        </div>

        <div className="space-y-2">
          {checklistItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleChecklistItem(item.id)}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                checklist[item.id]
                  ? "border-emerald-300 bg-emerald-100 text-emerald-950"
                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50"
              }`}
            >
              <span>{item.label}</span>
              <span className="font-semibold">{checklist[item.id] ? "OK" : "Pendente"}</span>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Localização atual</p>
              <p className="mt-1 text-sm text-slate-500">
                Capture a posição do aparelho para registrar onde a visita foi executada.
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <MapPin className="h-4 w-4" />
            </div>
          </div>

          {locationLabel ? (
            <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{locationLabel}</p>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Nenhuma localização capturada ainda.</p>
          )}

          {locationError ? <p className="mt-2 text-sm text-rose-600">{locationError}</p> : null}

          <Button type="button" variant="outline" className="mt-3 w-full" disabled={isCapturingLocation} onClick={captureLocation}>
            <Crosshair className="mr-2 h-4 w-4" />
            {isCapturingLocation ? "Capturando..." : "Capturar localização"}
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-950">Observações da visita</p>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ex.: equipamento acessado, peça validada, teste executado, retorno combinado com o cliente."
          />
        </div>

        <Button
          type="button"
          className="w-full"
          disabled={isPending}
          onClick={submitVisitReport}
        >
          {isPending ? "Registrando..." : "Registrar checklist no histórico"}
        </Button>
      </CardContent>
    </Card>
  );
}
