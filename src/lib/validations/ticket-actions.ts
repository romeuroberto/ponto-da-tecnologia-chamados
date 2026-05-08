import { z } from "zod";

export const ticketUpdateSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED", "CANCELED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  assigneeId: z.string().optional().or(z.literal("")),
  closingReason: z.string().trim().max(500, "Motivo muito longo").optional().or(z.literal("")),
  title: z.string().trim().min(2, "Título muito curto").max(200, "Título muito longo").optional()
}).superRefine((data, ctx) => {
  if (data.status === "CANCELED" && !data.closingReason?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["closingReason"],
      message: "Informe o motivo do cancelamento."
    });
  }
});

export const ticketCommentSchema = z.object({
  message: z.string().min(3, "Comentário obrigatório")
});
