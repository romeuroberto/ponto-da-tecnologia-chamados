import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(2, "Nome obrigatorio"),
  document: z.string().optional(),
  contactName: z.string().min(2, "Contato principal obrigatorio"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional()
});

export type ClientInput = z.infer<typeof clientSchema>;

