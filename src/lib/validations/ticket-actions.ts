import { z } from "zod";

export const ticketUpdateSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED", "CANCELED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  assigneeId: z.string().optional().or(z.literal("")),
  closingReason: z.string().trim().max(500, "Motivo muito longo").optional().or(z.literal(""))
}).superRefine((data, ctx) => {
  if ((data.status === "CLOSED" || data.status === "CANCELED") && !data.closingReason?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["closingReason"],
      message: "Informe o motivo do encerramento ou cancelamento."
    });
  }
});

export const ticketCommentSchema = z.object({
  message: z.string().min(3, "Comentario obrigatorio")
});
