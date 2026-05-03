import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(2, "Nome obrigatorio"),
  email: z.string().email("E-mail invalido"),
  password: z.union([z.string().min(6, "Senha deve ter no minimo 6 caracteres"), z.literal(""), z.undefined()]),
  role: z.enum(["ADMIN", "ATTENDANT", "TECHNICIAN"])
});

export type UserInput = z.infer<typeof userSchema>;
