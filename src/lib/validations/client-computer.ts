import { z } from "zod";

export const remoteAccessToolSchema = z.enum([
  "ANYDESK",
  "TEAMVIEWER",
  "RUSTDESK",
  "CHROME_REMOTE_DESKTOP",
  "WINDOWS_RDP",
  "OTHER"
]);

export const clientComputerSchema = z.object({
  name: z.string().trim().min(2, "Nome obrigatório").max(120, "Nome muito longo"),
  location: z.string().trim().max(120, "Local muito longo").optional().or(z.literal("")),
  responsibleName: z.string().trim().max(120, "Responsável muito longo").optional().or(z.literal("")),
  remoteTool: remoteAccessToolSchema,
  remoteCode: z.string().trim().max(120, "Código de acesso muito longo").optional().or(z.literal("")),
  remotePassword: z.string().trim().max(120, "Senha muito longa").optional().or(z.literal("")),
  notes: z.string().trim().max(1000, "Observações muito longas").optional().or(z.literal("")),
  active: z.boolean().default(true)
});

export type ClientComputerInput = z.infer<typeof clientComputerSchema>;
