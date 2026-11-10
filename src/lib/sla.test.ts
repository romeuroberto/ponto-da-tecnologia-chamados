import { describe, expect, it } from "vitest";
import { formatSlaTime, getSlaInfo, getSlaLabel, getSlaTargetHours } from "@/lib/sla";

const HOUR = 60 * 60 * 1000;
const createdAt = "2026-01-05T08:00:00.000Z";
const at = (hours: number) => new Date(new Date(createdAt).getTime() + hours * HOUR);

describe("getSlaTargetHours", () => {
  it("define o prazo de acordo com a prioridade", () => {
    expect(getSlaTargetHours("LOW")).toBe(48);
    expect(getSlaTargetHours("MEDIUM")).toBe(24);
    expect(getSlaTargetHours("HIGH")).toBe(8);
    expect(getSlaTargetHours("CRITICAL")).toBe(4);
  });
});

describe("getSlaInfo", () => {
  const ticket = { priority: "MEDIUM" as const, status: "OPEN" as const, createdAt };

  it("fica dentro do prazo no início do atendimento", () => {
    expect(getSlaInfo(ticket, at(1)).state).toBe("on_track");
  });

  it("entra em risco a partir de 75% do prazo", () => {
    expect(getSlaInfo(ticket, at(17.9)).state).toBe("on_track");
    expect(getSlaInfo(ticket, at(18)).state).toBe("warning");
  });

  it("vence quando o prazo é ultrapassado", () => {
    const info = getSlaInfo(ticket, at(25));
    expect(info.state).toBe("breached");
    expect(info.remainingMs).toBe(-1 * HOUR);
  });

  it("para de contar em chamados encerrados ou cancelados", () => {
    expect(getSlaInfo({ ...ticket, status: "CLOSED" }, at(100)).state).toBe("stopped");
    expect(getSlaInfo({ ...ticket, status: "CANCELED" }, at(100)).state).toBe("stopped");
  });

  it("pausa enquanto aguarda peças e desconta o tempo parado", () => {
    const waiting = getSlaInfo(
      { ...ticket, status: "WAITING_PARTS", waitingPartsStartedAt: at(10).toISOString() },
      at(30)
    );
    expect(waiting.state).toBe("paused");
    expect(waiting.elapsedMs).toBe(10 * HOUR);
  });

  it("desconta esperas anteriores e adia o vencimento", () => {
    const info = getSlaInfo({ ...ticket, slaWaitingPartsMs: 10 * HOUR }, at(25));
    expect(info.state).toBe("on_track");
    expect(info.elapsedMs).toBe(15 * HOUR);
    expect(info.deadline.toISOString()).toBe(at(34).toISOString());
  });
});

describe("formatSlaTime", () => {
  it("formata horas e minutos restantes", () => {
    expect(formatSlaTime(90 * 60 * 1000)).toBe("1h 30min restante");
    expect(formatSlaTime(2 * HOUR)).toBe("2h restante");
  });

  it("indica atraso quando o tempo é negativo", () => {
    expect(formatSlaTime(-30 * 60 * 1000)).toBe("30min atrasado");
  });

  it("nunca mostra zero minutos", () => {
    expect(formatSlaTime(0)).toBe("1min restante");
  });
});

describe("getSlaLabel", () => {
  it("monta o texto exibido na interface", () => {
    const ticket = { priority: "HIGH" as const, status: "IN_PROGRESS" as const, createdAt };
    expect(getSlaLabel(ticket, at(2))).toBe("SLA dentro - 6h restante");
    expect(getSlaLabel(ticket, at(9))).toBe("SLA vencido - 1h atrasado");
    expect(getSlaLabel({ ...ticket, status: "CLOSED" }, at(9))).toBe("SLA encerrado");
  });
});
