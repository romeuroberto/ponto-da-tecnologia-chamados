import type { FinancialStatus, FiscalDocumentType, TicketPriority, TicketStatus } from "@/types";

export const portalTicketStatusLabel: Record<TicketStatus, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em atendimento",
  WAITING_CUSTOMER: "Aguardando você",
  WAITING_PARTS: "Aguardando peças",
  CLOSED: "Encerrado",
  CANCELED: "Cancelado"
};

export const portalTicketStatusClass: Record<TicketStatus, string> = {
  OPEN: "bg-sky-100 text-sky-800 border-sky-200",
  IN_PROGRESS: "bg-indigo-100 text-indigo-800 border-indigo-200",
  WAITING_CUSTOMER: "bg-amber-100 text-amber-900 border-amber-200",
  WAITING_PARTS: "bg-purple-100 text-purple-800 border-purple-200",
  CLOSED: "bg-slate-100 text-slate-700 border-slate-200",
  CANCELED: "bg-rose-100 text-rose-800 border-rose-200"
};

export const portalPriorityLabel: Record<TicketPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica"
};

export const financialStatusLabel: Record<FinancialStatus, string> = {
  PENDENTE: "Pendente",
  EM_ANALISE: "Em análise",
  APROVADO: "Aprovado",
  FATURADO: "Faturado",
  PAGO: "Pago",
  CANCELADO: "Cancelado"
};

export const financialStatusClass: Record<FinancialStatus, string> = {
  PENDENTE: "bg-amber-100 text-amber-900 border-amber-200",
  EM_ANALISE: "bg-blue-100 text-blue-800 border-blue-200",
  APROVADO: "bg-emerald-100 text-emerald-800 border-emerald-200",
  FATURADO: "bg-violet-100 text-violet-800 border-violet-200",
  PAGO: "bg-green-100 text-green-900 border-green-200",
  CANCELADO: "bg-rose-100 text-rose-800 border-rose-200"
};

export const fiscalDocumentTypeLabel: Record<FiscalDocumentType, string> = {
  NFSE: "NFS-e",
  NFE: "NF-e",
  RECIBO: "Recibo",
  OUTRO: "Documento"
};
