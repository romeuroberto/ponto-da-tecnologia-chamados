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
  EM_ANALISE: "Em analise",
  APROVADO: "Aprovado",
  FATURADO: "Faturado",
  PAGO: "Pago",
  CANCELADO: "Cancelado"
};

function getFinancialStatusLabel(ticket: Ticket) {
  if (!ticket.billing) {
    return "Nao iniciado";
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
      label: "Execucao tecnica",
      description: "Triagem, atendimento, interacoes e tratativa do chamado."
    },
    {
      id: "technical_closure",
      label: "Encerramento tecnico",
      description: "Solucao aplicada e validacao do fechamento tecnico."
    },
    {
      id: "financial",
      label: "Financeiro",
      description: "Resumo financeiro, lancamentos e definicao da cobranca."
    },
    {
      id: "invoicing",
      label: "Faturamento",
      description: "Aprovacao e emissao da cobranca para o cliente."
    },
    {
      id: "payment",
      label: "Recebimento",
      description: "Confirmacao do pagamento e conclusao total do fluxo."
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
  let overallDescription = "Chamado registrado e aguardando inicio do atendimento.";
  let nextAction = "Atribuir um responsavel e iniciar o atendimento tecnico.";
  let currentStageId: TicketFlowStageId = "opening";

  if (ticket.status === "CANCELED") {
    overallLabel = "Cancelado";
    overallDescription = "O chamado foi encerrado sem continuidade do fluxo tecnico e financeiro.";
    nextAction = "Nenhuma acao obrigatoria. Reabra o chamado se precisar retomar o atendimento.";
    currentStageId = "technical_closure";
  } else if (ticket.status === "OPEN") {
    overallLabel = "Aberto";
    overallDescription = "Chamado criado e aguardando triagem ou inicio do atendimento tecnico.";
    nextAction = "Definir responsavel, revisar prioridade e mover para atendimento.";
    currentStageId = "opening";
  } else if (ticket.status === "IN_PROGRESS") {
    overallLabel = "Em atendimento";
    overallDescription = "Equipe tecnica atuando no chamado e registrando tratativas.";
    nextAction = "Concluir a tratativa tecnica ou mover para aguardando cliente, se necessario.";
    currentStageId = "execution";
  } else if (ticket.status === "WAITING_CUSTOMER") {
    overallLabel = "Aguardando cliente";
    overallDescription = "A equipe depende de retorno, teste ou validacao do cliente para seguir.";
    nextAction = "Cobrar retorno do cliente ou retomar o atendimento assim que houver resposta.";
    currentStageId = "execution";
  } else if (ticket.status === "RESOLVED") {
    overallLabel = "Resolvido aguardando encerramento";
    overallDescription = "A solucao tecnica foi aplicada, mas o chamado ainda nao foi formalmente encerrado.";
    nextAction = "Validar com o cliente e encerrar tecnicamente o chamado.";
    currentStageId = "technical_closure";
  } else if (ticket.status === "CLOSED" && !ticket.billing) {
    overallLabel = "Encerrado aguardando financeiro";
    overallDescription = "O atendimento tecnico foi encerrado, mas a etapa financeira ainda nao foi iniciada.";
    nextAction = "Criar o resumo financeiro e registrar os lancamentos do chamado.";
    currentStageId = "financial";
  } else if (ticket.status === "CLOSED" && financialStatus && ["PENDENTE", "EM_ANALISE", "APROVADO"].includes(financialStatus)) {
    overallLabel = "Concluido aguardando faturamento";
    overallDescription = "O chamado esta fechado tecnicamente e o financeiro foi iniciado, mas ainda nao foi faturado.";
    nextAction =
      financialStatus === "APROVADO"
        ? "Faturar o chamado e registrar a cobranca enviada ao cliente."
        : "Revisar valores, validar o financeiro e avancar para aprovacao ou faturamento.";
    currentStageId = financialStatus === "APROVADO" ? "invoicing" : "financial";
  } else if (ticket.status === "CLOSED" && financialStatus === "FATURADO") {
    overallLabel = "Faturado aguardando recebimento";
    overallDescription = "A cobranca ja foi emitida e o fluxo aguarda apenas a confirmacao de pagamento.";
    nextAction = "Registrar o recebimento assim que o pagamento for confirmado.";
    currentStageId = "payment";
  } else if (ticket.status === "CLOSED" && financialStatus === "PAGO") {
    overallLabel = "Finalizado";
    overallDescription = "Chamado concluido tecnicamente e financeiramente, com recebimento confirmado.";
    nextAction = "Nenhuma acao pendente. O fluxo deste chamado esta totalmente concluido.";
    currentStageId = "payment";
  } else if (ticket.status === "CLOSED" && financialStatus === "CANCELADO") {
    overallLabel = "Encerrado com financeiro cancelado";
    overallDescription = "Chamado encerrado tecnicamente e com trilha financeira cancelada.";
    nextAction = "Nenhuma acao obrigatoria, a menos que seja necessario revisar a cobranca.";
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
