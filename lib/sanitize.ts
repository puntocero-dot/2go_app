import DOMPurify from "isomorphic-dompurify";

/**
 * Configuración de DOMPurify para diferentes contextos
 */
const SANITIZE_CONFIG = {
  // Configuración estricta: solo texto plano
  STRICT: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  },
  // Configuración básica: permite formato básico
  BASIC: {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "u", "br", "p"],
    ALLOWED_ATTR: [],
  },
  // Configuración para HTML rico (emails, descripciones)
  RICH: {
    ALLOWED_TAGS: [
      "b",
      "i",
      "em",
      "strong",
      "u",
      "br",
      "p",
      "ul",
      "ol",
      "li",
      "a",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "code",
      "pre",
    ],
    ALLOWED_ATTR: ["href", "title", "target"],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  },
};

/**
 * Sanitiza texto plano (elimina todo HTML)
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, SANITIZE_CONFIG.STRICT);
}

/**
 * Sanitiza HTML básico (permite formato básico)
 */
export function sanitizeHTML(input: string | null | undefined): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, SANITIZE_CONFIG.BASIC);
}

/**
 * Sanitiza HTML rico (permite más tags para contenido editorial)
 */
export function sanitizeRichHTML(input: string | null | undefined): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, SANITIZE_CONFIG.RICH);
}

/**
 * Sanitiza un objeto recursivamente
 * Útil para sanitizar payloads completos de APIs
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: {
    mode?: "strict" | "basic" | "rich";
    excludeKeys?: string[];
  } = {}
): T {
  const { mode = "strict", excludeKeys = [] } = options;

  const sanitizeValue = (value: any, key: string): any => {
    // No sanitizar keys excluidas
    if (excludeKeys.includes(key)) {
      return value;
    }

    // Sanitizar strings
    if (typeof value === "string") {
      switch (mode) {
        case "basic":
          return sanitizeHTML(value);
        case "rich":
          return sanitizeRichHTML(value);
        default:
          return sanitizeText(value);
      }
    }

    // Recursión para objetos
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return sanitizeObject(value, options);
    }

    // Recursión para arrays
    if (Array.isArray(value)) {
      return value.map((item, index) =>
        sanitizeValue(item, `${key}[${index}]`)
      );
    }

    // Otros tipos (números, booleanos, null) no se sanitizan
    return value;
  };

  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(value, key);
  }

  return sanitized as T;
}

/**
 * Escapa caracteres especiales para prevenir inyección SQL
 * (Aunque Prisma ya protege contra esto, es una capa adicional)
 */
export function escapeSQLString(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\x00/g, "\\0")
    .replace(/\x1a/g, "\\Z");
}

/**
 * Valida y sanitiza un email
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return "";

  // Sanitizar primero
  const sanitized = sanitizeText(email).toLowerCase().trim();

  // Validar formato básico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return "";
  }

  return sanitized;
}

/**
 * Valida y sanitiza un teléfono
 */
export function sanitizePhone(phone: string | null | undefined): string {
  if (!phone) return "";

  // Sanitizar y mantener solo números, +, -, (, ), espacios
  const sanitized = sanitizeText(phone).replace(/[^0-9+\-() ]/g, "");

  return sanitized.trim();
}

/**
 * Sanitiza una URL
 */
export function sanitizeURL(url: string | null | undefined): string {
  if (!url) return "";

  const sanitized = sanitizeText(url).trim();

  // Validar que sea una URL válida
  try {
    const parsed = new URL(sanitized);
    // Solo permitir http y https
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

/**
 * Sanitiza un nombre de archivo
 */
export function sanitizeFileName(fileName: string | null | undefined): string {
  if (!fileName) return "";

  // Sanitizar y eliminar caracteres peligrosos
  const sanitized = sanitizeText(fileName)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".") // Prevenir path traversal
    .substring(0, 255); // Limitar longitud

  return sanitized;
}

/**
 * Wrapper para Zod transform - sanitiza texto
 */
export const zodSanitizeText = (value: string) => sanitizeText(value);

/**
 * Wrapper para Zod transform - sanitiza HTML básico
 */
export const zodSanitizeHTML = (value: string) => sanitizeHTML(value);

/**
 * Wrapper para Zod transform - sanitiza email
 */
export const zodSanitizeEmail = (value: string) => sanitizeEmail(value);

/**
 * Wrapper para Zod transform - sanitiza teléfono
 */
export const zodSanitizePhone = (value: string) => sanitizePhone(value);

/**
 * Wrapper para Zod transform - sanitiza URL
 */
export const zodSanitizeURL = (value: string) => sanitizeURL(value);
