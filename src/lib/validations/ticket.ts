import { z } from "zod";

export const ticketSchema = z.object({
  clientId: z.string().min(1, "Cliente obrigatorio"),
  title: z.string().min(3, "Título obrigatório"),
  description: z.string().min(10, "Descrição obrigatória"),
  category: z.string().optional(),
  attendanceType: z.enum(["REMOTE", "BALCAO", "IN_STORE_EQUIPMENT", "FIELD_VISIT"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  requesterName: z.string().min(2, "Solicitante obrigatorio"),
  requesterEmail: z.string().email().optional().or(z.literal("")),
  assigneeId: z.string().optional()
});

export type TicketInput = z.infer<typeof ticketSchema>;
