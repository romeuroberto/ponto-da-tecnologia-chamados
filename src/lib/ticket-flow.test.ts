import { describe, expect, it } from "vitest";
import { getTicketFlowSummary } from "@/lib/ticket-flow";
import type { FinancialStatus, Ticket, TicketStatus } from "@/types";

function makeTicket(status: TicketStatus, financialStatus?: FinancialStatus): Ticket {
  return {
    status,
    billing: financialStatus ? { financialStatus } : undefined
  } as Ticket;
}

function currentStage(ticket: Ticket) {
  return getTicketFlowSummary(ticket).stages.find((stage) => stage.state === "current")?.id;
}

describe("getTicketFlowSummary", () => {
  it("começa na etapa de abertura", () => {
    const summary = getTicketFlowSummary(makeTicket("OPEN"));
    expect(summary.overallLabel).toBe("Aberto");
    expect(summary.currentStageLabel).toBe("Abertura");
    expect(summary.financialStatusLabel).toBe("Não iniciado");
    expect(summary.stages.map((stage) => stage.state)).toEqual([
      "current",
      "upcoming",
      "upcoming",
      "upcoming",
      "upcoming"
    ]);
  });

  it.each<TicketStatus>(["IN_PROGRESS", "WAITING_CUSTOMER", "WAITING_PARTS"])(
    "mantém %s na etapa de atendimento",
    (status) => {
      expect(currentStage(makeTicket(status))).toBe("execution");
    }
  );

  it("marca as etapas anteriores como concluídas", () => {
    const summary = getTicketFlowSummary(makeTicket("CLOSED", "FATURADO"));
    expect(summary.stages.map((stage) => stage.state)).toEqual(["done", "done", "done", "done", "current"]);
  });

  it("chamado concluído sem financeiro fica na conclusão técnica", () => {
    const summary = getTicketFlowSummary(makeTicket("CLOSED"));
    expect(summary.overallLabel).toBe("Concluído tecnicamente");
    expect(currentStage(makeTicket("CLOSED"))).toBe("technical_closure");
  });

  it.each<FinancialStatus>(["PENDENTE", "EM_ANALISE", "APROVADO"])(
    "chamado concluído com financeiro %s aguarda cobrança",
    (financialStatus) => {
      const ticket = makeTicket("CLOSED", financialStatus);
      expect(getTicketFlowSummary(ticket).overallLabel).toBe("Concluído aguardando financeiro");
      expect(currentStage(ticket)).toBe("financial");
    }
  );

  it("chamado faturado aguarda recebimento", () => {
    expect(getTicketFlowSummary(makeTicket("CLOSED", "FATURADO")).overallLabel).toBe(
      "Faturado aguardando recebimento"
    );
  });

  it("chamado pago está finalizado sem ações pendentes", () => {
    const summary = getTicketFlowSummary(makeTicket("CLOSED", "PAGO"));
    expect(summary.overallLabel).toBe("Finalizado");
    expect(summary.nextAction).toBe("Nenhuma ação pendente neste chamado.");
  });

  it("financeiro cancelado encerra o chamado sem cobrança", () => {
    expect(getTicketFlowSummary(makeTicket("CLOSED", "CANCELADO")).overallLabel).toBe("Concluído sem cobrança");
  });

  it("chamado cancelado não segue para o financeiro", () => {
    const ticket = makeTicket("CANCELED");
    expect(getTicketFlowSummary(ticket).overallLabel).toBe("Cancelado");
    expect(currentStage(ticket)).toBe("technical_closure");
  });
});
