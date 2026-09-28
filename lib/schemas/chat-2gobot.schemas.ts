import { z } from "zod";
import { zodSanitizeText } from "../sanitize";

const MensajeSchema = z.object({
  rol: z.enum(["usuario", "bot"]),
  texto: z.string().min(1).max(2000).transform(zodSanitizeText),
});

export const Chat2GoBotSchema = z.object({
  mensaje: z.string().min(1).max(2000).transform(zodSanitizeText),
  historial: z.array(MensajeSchema).max(20).optional(),
});

export type Chat2GoBotInput = z.infer<typeof Chat2GoBotSchema>;
