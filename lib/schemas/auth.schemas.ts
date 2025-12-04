import { z } from "zod";
import { zodSanitizeEmail } from "../sanitize";

// Schema para login de usuario
export const LoginSchema = z.object({
  email: z.string().email().transform(zodSanitizeEmail),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof LoginSchema>;
