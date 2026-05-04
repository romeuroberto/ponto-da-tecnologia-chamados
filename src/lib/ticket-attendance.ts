import type { TicketAttendanceType } from "@/types";

export const attendanceTypeLabels: Record<TicketAttendanceType, string> = {
  REMOTE: "Atendimento remoto",
  BALCAO: "Atendimento no balcão",
  IN_STORE_EQUIPMENT: "Equipamento recebido na assistência",
  FIELD_VISIT: "Visita técnica"
};

export const attendanceTypeDescriptions: Record<TicketAttendanceType, string> = {
  REMOTE: "Para suporte sem deslocamento, com tratativa remota e histórico mais simples.",
  BALCAO: "Cliente comparece presencialmente ao estabelecimento para suporte, sem deixar equipamento.",
  IN_STORE_EQUIPMENT: "Para registrar entrada de equipamento na assistência e orientar eventual fluxo de bancada.",
  FIELD_VISIT: "Para atendimentos com deslocamento, visita presencial ou execução em campo."
};

export function getAttendanceTypeLabel(attendanceType: TicketAttendanceType) {
  return attendanceTypeLabels[attendanceType];
}
