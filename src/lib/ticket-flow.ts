import type { FinancialStatus, Ticket } from "@/types";

export type TicketFlowStageId =
  | "opening"
  | "execution"
  | "technical_closure"
  | "financial"
  | "payment";

export type TicketFlowStageState = "done" | "current" | "upcoming";

export type TicketFlowStage = {
  id: TicketFlowStageId;
  label: string;
  description: string;
  state: TicketFlowStageState;
};

export type TicketFlowSummary = {
  overallLabel: string;
  overallDescription: string;
  nextAction: string;
  technicalStatusLabel: string;
  financialStatusLabel: string;
  currentStageLabel: string;
  stages: TicketFlowStage[];
};

const technicalStatusLabels: Record<Ticket["status"], string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em atendimento",
  WAITING_CUSTOMER: "Aguardando cliente",
  RESOLVED: "Concluído tecnicamente",
  CLOSED: "Concluído tecnicamente",
  CANCELED: "Cancelado"
};

const financialStatusLabels: Record<FinancialStatus, string> = {
  PENDENTE: "Pendente",
  EM_ANALISE: "Em revisão interna",
  APROVADO: "Pronto para faturar",
  FATURADO: "Faturado",
  PAGO: "Pago",
  CANCELADO: "Cancelado"
};

function getFinancialStatusLabel(ticket: Ticket) {
  if (!ticket.billing) {
    return "Não iniciado";
  }

  return financialStatusLabels[ticket.billing.financialStatus];
}

function getStageState(order: number, currentIndex: number): TicketFlowStageState {
  if (order < currentIndex) {
    return "done";
  }

  if (order === currentIndex) {
    return "current";
  }

  return "upcoming";
}

function buildStages(currentStageId: TicketFlowStageId) {
  const stages: Array<Omit<TicketFlowStage, "state">> = [
    {
      id: "opening",
      label: "Abertura",
      description: "Registro da demanda, cliente, prioridade e solicitante."
    },
    {
      id: "execution",
      label: "Atendimento",
      description: "Triagem, execução técnica, interações e acompanhamento."
    },
    {
      id: "technical_closure",
      label: "Conclusão técnica",
      description: "Solução aplicada e atendimento tecnicamente concluído."
    },
    {
      id: "financial",
      label: "Financeiro",
      description: "Montagem dos valores e definição da cobrança quando aplicável."
    },
    {
      id: "payment",
      label: "Finalização",
      description: "Registro da cobrança emitida ou do pagamento para concluir o fluxo."
    }
  ];

  const currentIndex = stages.findIndex((stage) => stage.id === currentStageId);

  return stages.map((stage, index) => ({
    ...stage,
    state: getStageState(index, currentIndex)
  }));
}

export function getTicketFlowSummary(ticket: Ticket): TicketFlowSummary {
  const financialStatus = ticket.billing?.financialStatus;
  let overallLabel = "Aberto";
  let overallDescription = "Chamado registrado e aguardando início do atendimento.";
  let nextAction = "Definir responsável e iniciar o atendimento técnico.";
  let currentStageId: TicketFlowStageId = "opening";

  if (ticket.status === "CANCELED") {
    overallLabel = "Cancelado";
    overallDescription = "O chamado foi encerrado sem continuidade técnica ou financeira.";
    nextAction = "Nenhuma ação obrigatória. Reabra o chamado se precisar retomar o atendimento.";
    currentStageId = "technical_closure";
  } else if (ticket.status === "OPEN") {
    overallLabel = "Aberto";
    overallDescription = "Chamado criado e aguardando triagem ou início do atendimento técnico.";
    nextAction = "Definir responsável, revisar prioridade e iniciar o atendimento.";
    currentStageId = "opening";
  } else if (ticket.status === "IN_PROGRESS") {
    overallLabel = "Em atendimento";
    overallDescription = "Equipe técnica atuando no chamado e registrando tratativas.";
    nextAction = "Concluir o atendimento quando a solução estiver pronta ou aguardar retorno do cliente, se necessário.";
    currentStageId = "execution";
  } else if (ticket.status === "WAITING_CUSTOMER") {
    overallLabel = "Aguardando cliente";
    overallDescription = "O atendimento depende de retorno, teste ou validação do cliente para seguir.";
    nextAction = "Retomar o atendimento assim que houver resposta ou concluir se a validação já ocorreu.";
    currentStageId = "execution";
  } else if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
    const hasBilling = Boolean(ticket.billing);
    const financialDone = financialStatus === "PAGO" || financialStatus === "CANCELADO";

    if (!hasBilling) {
      overallLabel = "Concluído tecnicamente";
      overallDescription = "O atendimento técnico foi concluído e o financeiro só precisa ser iniciado se houver cobrança.";
      nextAction = "Iniciar o financeiro se houver cobrança. Caso contrário, o chamado já está operacionalmente concluído.";
      currentStageId = "technical_closure";
    } else if (financialStatus && ["PENDENTE", "EM_ANALISE", "APROVADO"].includes(financialStatus)) {
      overallLabel = "Concluído aguardando financeiro";
      overallDescription = "O trabalho técnico terminou, mas a definição financeira ainda está em andamento.";
      nextAction = "Revisar os valores e registrar a cobrança quando estiver tudo pronto.";
      currentStageId = "financial";
    } else if (financialStatus === "FATURADO") {
      overallLabel = "Faturado aguardando recebimento";
      overallDescription = "O atendimento técnico terminou e a cobrança já foi registrada.";
      nextAction = "Confirmar o pagamento assim que o recebimento acontecer.";
      currentStageId = "payment";
    } else if (financialDone) {
      overallLabel = financialStatus === "PAGO" ? "Finalizado" : "Concluído sem cobrança";
      overallDescription =
        financialStatus === "PAGO"
          ? "Chamado concluído tecnicamente e financeiramente, com recebimento confirmado."
          : "Chamado concluído tecnicamente e com ciclo financeiro encerrado sem cobrança.";
      nextAction = "Nenhuma ação pendente neste chamado.";
      currentStageId = "payment";
    } else {
      overallLabel = "Concluído tecnicamente";
      overallDescription = "O atendimento técnico foi concluído.";
      nextAction = "Revise se ainda existe alguma pendência financeira neste chamado.";
      currentStageId = "technical_closure";
    }
  }

  const stages = buildStages(currentStageId);
  const currentStageLabel = stages.find((stage) => stage.state === "current")?.label ?? "Abertura";

  return {
    overallLabel,
    overallDescription,
    nextAction,
    technicalStatusLabel: technicalStatusLabels[ticket.status],
    financialStatusLabel: getFinancialStatusLabel(ticket),
    currentStageLabel,
    stages
  };
}
