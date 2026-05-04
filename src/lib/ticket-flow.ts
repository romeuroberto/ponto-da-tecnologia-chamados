import type { FinancialStatus, Ticket } from "@/types";

export type TicketFlowStageId =
  | "opening"
  | "execution"
  | "technical_closure"
  | "financial"
  | "invoicing"
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
  RESOLVED: "Resolvido",
  CLOSED: "Encerrado",
  CANCELED: "Cancelado"
};

const financialStatusLabels: Record<FinancialStatus, string> = {
  PENDENTE: "Pendente",
  EM_ANALISE: "Em análise",
  APROVADO: "Aprovado",
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
      label: "Execução técnica",
      description: "Triagem, atendimento, interações e tratativa do chamado."
    },
    {
      id: "technical_closure",
      label: "Encerramento técnico",
      description: "Solução aplicada e validação do fechamento técnico."
    },
    {
      id: "financial",
      label: "Financeiro",
      description: "Resumo financeiro, lançamentos e definição da cobrança."
    },
    {
      id: "invoicing",
      label: "Faturamento",
      description: "Aprovação e emissão da cobrança para o cliente."
    },
    {
      id: "payment",
      label: "Recebimento",
      description: "Confirmação do pagamento e conclusão total do fluxo."
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
  let nextAction = "Atribuir um responsável e iniciar o atendimento técnico.";
  let currentStageId: TicketFlowStageId = "opening";

  if (ticket.status === "CANCELED") {
    overallLabel = "Cancelado";
    overallDescription = "O chamado foi encerrado sem continuidade do fluxo técnico e financeiro.";
    nextAction = "Nenhuma ação obrigatória. Reabra o chamado se precisar retomar o atendimento.";
    currentStageId = "technical_closure";
  } else if (ticket.status === "OPEN") {
    overallLabel = "Aberto";
    overallDescription = "Chamado criado e aguardando triagem ou início do atendimento técnico.";
    nextAction = "Definir responsável, revisar prioridade e mover para atendimento.";
    currentStageId = "opening";
  } else if (ticket.status === "IN_PROGRESS") {
    overallLabel = "Em atendimento";
    overallDescription = "Equipe técnica atuando no chamado e registrando tratativas.";
    nextAction = "Concluir a tratativa técnica ou mover para aguardando cliente, se necessário.";
    currentStageId = "execution";
  } else if (ticket.status === "WAITING_CUSTOMER") {
    overallLabel = "Aguardando cliente";
    overallDescription = "A equipe depende de retorno, teste ou validação do cliente para seguir.";
    nextAction = "Cobrar retorno do cliente ou retomar o atendimento assim que houver resposta.";
    currentStageId = "execution";
  } else if (ticket.status === "RESOLVED") {
    overallLabel = "Resolvido aguardando encerramento";
    overallDescription = "A solução técnica foi aplicada, mas o chamado ainda não foi formalmente encerrado.";
    nextAction = "Validar com o cliente e encerrar tecnicamente o chamado.";
    currentStageId = "technical_closure";
  } else if (ticket.status === "CLOSED" && !ticket.billing) {
    overallLabel = "Encerrado aguardando financeiro";
    overallDescription = "O atendimento técnico foi encerrado, mas a etapa financeira ainda não foi iniciada.";
    nextAction = "Criar o resumo financeiro e registrar os lançamentos do chamado.";
    currentStageId = "financial";
  } else if (ticket.status === "CLOSED" && financialStatus && ["PENDENTE", "EM_ANALISE", "APROVADO"].includes(financialStatus)) {
    overallLabel = "Concluído aguardando faturamento";
    overallDescription = "O chamado está fechado tecnicamente e o financeiro foi iniciado, mas ainda não foi faturado.";
    nextAction =
      financialStatus === "APROVADO"
        ? "Faturar o chamado e registrar a cobrança enviada ao cliente."
        : "Revisar valores, validar o financeiro e avançar para aprovação ou faturamento.";
    currentStageId = financialStatus === "APROVADO" ? "invoicing" : "financial";
  } else if (ticket.status === "CLOSED" && financialStatus === "FATURADO") {
    overallLabel = "Faturado aguardando recebimento";
    overallDescription = "A cobrança já foi emitida e o fluxo aguarda apenas a confirmação de pagamento.";
    nextAction = "Registrar o recebimento assim que o pagamento for confirmado.";
    currentStageId = "payment";
  } else if (ticket.status === "CLOSED" && financialStatus === "PAGO") {
    overallLabel = "Finalizado";
    overallDescription = "Chamado concluído tecnicamente e financeiramente, com recebimento confirmado.";
    nextAction = "Nenhuma ação pendente. O fluxo deste chamado está totalmente concluído.";
    currentStageId = "payment";
  } else if (ticket.status === "CLOSED" && financialStatus === "CANCELADO") {
    overallLabel = "Encerrado com financeiro cancelado";
    overallDescription = "Chamado encerrado tecnicamente e com trilha financeira cancelada.";
    nextAction = "Nenhuma ação obrigatória, a menos que seja necessário revisar a cobrança.";
    currentStageId = "invoicing";
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
