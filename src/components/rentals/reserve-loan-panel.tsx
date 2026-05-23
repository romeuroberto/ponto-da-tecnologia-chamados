"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import type { Client, Equipment, EquipmentLoan } from "@/types";

interface Props {
  activeLoans: EquipmentLoan[];
  reserveEquipment: Equipment[];
  allEquipment: Equipment[];
  clients: Client[];
  isAdmin: boolean;
}

interface LoanForm {
  reserveEquipmentId: string;
  mainEquipmentId: string;
  clientId: string;
  loanedAt: string;
  notes: string;
}

const emptyForm: LoanForm = {
  reserveEquipmentId: "",
  mainEquipmentId: "",
  clientId: "",
  loanedAt: new Date().toISOString().slice(0, 10),
  notes: ""
};

function DaysOnLoanBadge({ days }: { days: number }) {
  const color = days > 30 ? "bg-rose-100 text-rose-700" : days > 14 ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {days} dia{days !== 1 ? "s" : ""}
    </span>
  );
}

export function ReserveLoanPanel({ activeLoans, reserveEquipment, allEquipment, clients, isAdmin }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<LoanForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [returnConfirm, setReturnConfirm] = useState<string | null>(null);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 10));

  const availableReserves = reserveEquipment.filter((e) => e.status === "DISPONIVEL");
  const mainEquipmentOptions = allEquipment.filter((e) => !e.isReserve && e.status === "MANUTENCAO");

  function handleFormChange(field: keyof LoanForm, value: string) {
    setForm((s) => ({ ...s, [field]: value }));
  }

  function handleSubmit() {
    if (!form.reserveEquipmentId) { setError("Selecione a impressora reserva."); return; }
    if (!form.clientId) { setError("Selecione o cliente."); return; }
    if (!form.loanedAt) { setError("Informe a data de saída."); return; }
    setError(null);

    startTransition(async () => {
      const res = await fetch(`/api/equipment/${form.reserveEquipmentId}/loans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mainEquipmentId: form.mainEquipmentId || undefined,
          clientId: form.clientId,
          loanedAt: form.loanedAt,
          notes: form.notes || undefined
        })
      });
      const json = await res.json();
      if (!json.success) { setError(json.message ?? "Erro ao registrar empréstimo."); return; }
      setForm(emptyForm);
      setShowForm(false);
      router.refresh();
    });
  }

  function handleReturn(loanId: string) {
    startTransition(async () => {
      const res = await fetch(`/api/equipment/loans/${loanId}/return`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnedAt: returnDate })
      });
      const json = await res.json();
      if (!json.success) { setError(json.message ?? "Erro ao registrar retorno."); return; }
      setReturnConfirm(null);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base">Impressoras em empréstimo</CardTitle>
          <p className="mt-0.5 text-xs text-slate-500">
            Reservas alocadas temporariamente enquanto a principal está em manutenção
          </p>
        </div>
        {isAdmin && !showForm && availableReserves.length > 0 && (
          <Button size="sm" onClick={() => { setShowForm(true); setError(null); }}>
            + Novo empréstimo
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Formulário de novo empréstimo */}
        {showForm && (
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-sky-800">Registrar saída de impressora reserva</p>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Impressora reserva *</Label>
                <select
                  value={form.reserveEquipmentId}
                  onChange={(e) => handleFormChange("reserveEquipmentId", e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-sky-500"
                >
                  <option value="">Selecione...</option>
                  {availableReserves.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.model}{eq.patrimonyCode ? ` — ${eq.patrimonyCode}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Impressora principal em manutenção</Label>
                <select
                  value={form.mainEquipmentId}
                  onChange={(e) => handleFormChange("mainEquipmentId", e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-sky-500"
                >
                  <option value="">Não informada</option>
                  {mainEquipmentOptions.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.model}{eq.patrimonyCode ? ` — ${eq.patrimonyCode}` : ""}
                    </option>
                  ))}
                  {/* também listar as disponíveis que podem ter acabado de entrar em manutenção */}
                  {allEquipment.filter((e) => !e.isReserve && e.status === "DISPONIVEL").map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.model}{eq.patrimonyCode ? ` — ${eq.patrimonyCode}` : ""} (disponível)
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Cliente *</Label>
                <select
                  value={form.clientId}
                  onChange={(e) => handleFormChange("clientId", e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-sky-500"
                >
                  <option value="">Selecione...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Data de saída *</Label>
                <Input
                  type="date"
                  value={form.loanedAt}
                  onChange={(e) => handleFormChange("loanedAt", e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Observações</Label>
                <Input
                  placeholder="Ex: substituindo impressora do setor financeiro"
                  value={form.notes}
                  onChange={(e) => handleFormChange("notes", e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? "Registrando..." : "Registrar saída"}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setError(null); }}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Lista de empréstimos ativos */}
        {activeLoans.length === 0 && !showForm ? (
          <p className="py-4 text-center text-sm text-slate-400">
            Nenhuma impressora reserva em campo no momento.
          </p>
        ) : activeLoans.length > 0 ? (
          <div className="space-y-2">
            <div className="hidden grid-cols-[2fr_2fr_2fr_1fr_auto] gap-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400 lg:grid">
              <span>Reserva</span>
              <span>Principal (em manutenção)</span>
              <span>Cliente</span>
              <span>Tempo</span>
              <span />
            </div>
            {activeLoans.map((loan) => (
              <div
                key={loan.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                {/* Mobile */}
                <div className="lg:hidden space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{loan.reserveEquipmentModel}</p>
                      {loan.reserveEquipmentPatrimony && (
                        <p className="text-xs text-slate-400">{loan.reserveEquipmentPatrimony}</p>
                      )}
                    </div>
                    <DaysOnLoanBadge days={loan.daysOnLoan} />
                  </div>
                  <p className="text-xs text-slate-500">
                    Cliente: <span className="font-medium text-slate-700">{loan.clientName}</span>
                  </p>
                  {loan.mainEquipmentModel && (
                    <p className="text-xs text-slate-500">
                      Substituindo: <span className="font-medium text-slate-700">{loan.mainEquipmentModel}</span>
                      {loan.mainEquipmentPatrimony ? ` (${loan.mainEquipmentPatrimony})` : ""}
                    </p>
                  )}
                  <p className="text-xs text-slate-400">Saiu em {formatDate(loan.loanedAt)}</p>
                  {loan.notes && <p className="text-xs text-slate-400 italic">{loan.notes}</p>}
                </div>

                {/* Desktop */}
                <div className="hidden grid-cols-[2fr_2fr_2fr_1fr_auto] items-center gap-3 lg:grid">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{loan.reserveEquipmentModel}</p>
                    <p className="text-xs text-slate-400">
                      {loan.reserveEquipmentPatrimony ?? "—"} · saiu {formatDate(loan.loanedAt)}
                    </p>
                  </div>
                  <div>
                    {loan.mainEquipmentModel ? (
                      <>
                        <p className="text-sm text-slate-700">{loan.mainEquipmentModel}</p>
                        <p className="text-xs text-slate-400">{loan.mainEquipmentPatrimony ?? "—"}</p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-400">—</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{loan.clientName}</p>
                    {loan.notes && <p className="text-xs text-slate-400 italic truncate">{loan.notes}</p>}
                  </div>
                  <DaysOnLoanBadge days={loan.daysOnLoan} />
                  {isAdmin && (
                    <div>
                      {returnConfirm === loan.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="date"
                            value={returnDate}
                            onChange={(e) => setReturnDate(e.target.value)}
                            className="h-7 w-36 text-xs"
                          />
                          <button
                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                            onClick={() => handleReturn(loan.id)}
                            disabled={isPending}
                          >
                            Confirmar
                          </button>
                          <button
                            className="text-xs text-slate-400 hover:text-slate-600"
                            onClick={() => setReturnConfirm(null)}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          className="text-xs font-semibold text-sky-600 hover:text-sky-800 whitespace-nowrap"
                          onClick={() => { setReturnConfirm(loan.id); setReturnDate(new Date().toISOString().slice(0, 10)); }}
                        >
                          Registrar retorno →
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Mobile return button */}
                {isAdmin && (
                  <div className="mt-3 lg:hidden">
                    {returnConfirm === loan.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          className="h-7 flex-1 text-xs"
                        />
                        <button
                          className="text-xs font-semibold text-emerald-700"
                          onClick={() => handleReturn(loan.id)}
                          disabled={isPending}
                        >
                          Confirmar
                        </button>
                        <button
                          className="text-xs text-slate-400"
                          onClick={() => setReturnConfirm(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        className="text-xs font-semibold text-sky-600"
                        onClick={() => { setReturnConfirm(loan.id); setReturnDate(new Date().toISOString().slice(0, 10)); }}
                      >
                        Registrar retorno →
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
