import type { TicketAttendanceType } from "@/types";

export const attendanceTypeLabels: Record<TicketAttendanceType, string> = {
  REMOTE: "Atendimento remoto",
  INTERNAL: "Atendimento interno",
  IN_STORE_EQUIPMENT: "Equipamento recebido na assistencia",
  FIELD_VISIT: "Visita tecnica"
};

export const attendanceTypeDescriptions: Record<TicketAttendanceType, string> = {
  REMOTE: "Para suporte sem deslocamento, com tratativa remota e historico mais simples.",
  INTERNAL: "Para execucao interna da equipe, sem visita tecnica e sem entrada fisica de equipamento.",
  IN_STORE_EQUIPMENT: "Para registrar entrada de equipamento na assistencia e orientar eventual fluxo de bancada.",
  FIELD_VISIT: "Para atendimentos com deslocamento, visita presencial ou execucao em campo."
};

export function getAttendanceTypeLabel(attendanceType: TicketAttendanceType) {
  return attendanceTypeLabels[attendanceType];
}
