import { z } from "zod";

export const ticketSchema = z.object({
  clientId: z.string().min(1, "Cliente obrigatorio"),
  title: z.string().min(3, "Titulo obrigatorio"),
  description: z.string().min(10, "Descricao obrigatoria"),
  category: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  requesterName: z.string().min(2, "Solicitante obrigatorio"),
  requesterEmail: z.string().email().optional().or(z.literal("")),
  assigneeId: z.string().optional()
});

export type TicketInput = z.infer<typeof ticketSchema>;

