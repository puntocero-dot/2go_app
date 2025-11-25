import { z } from "zod";

// Tipos de archivo permitidos
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Tamaño máximo: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Schema para validar metadata de upload (no el archivo en sí)
export const UploadMetadataSchema = z.object({
  folder: z.string().min(1).max(100).regex(/^[a-z0-9\-_]+$/i).optional(),
  fileName: z.string().max(255).optional(),
});

// Helper para validar archivo (se usa en el route handler)
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}

// Types
export type UploadMetadataInput = z.infer<typeof UploadMetadataSchema>;
