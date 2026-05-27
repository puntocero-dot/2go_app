/**
 * Logger estructurado para produccion.
 * En produccion emite JSON para integracion con servicios de logging.
 * En desarrollo usa console con formato legible.
 *
 * Redacta automáticamente campos sensibles (password, token, cookie,
 * authorization, etc.) antes de loguear `data` o stack traces.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

// === Redacción de campos sensibles ===
// Cualquier key cuyo nombre matchee estos patrones se reemplaza por "[REDACTED]"
// antes de serializar el log. Defensa contra PII / secretos en stdout.
const SENSITIVE_KEY_PATTERNS: RegExp[] = [
  /password/i,
  /token/i,
  /secret/i,
  /^auth$/i,
  /authorization/i,
  /cookie/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /p256dh/i,
  /vapid/i,
];

const MAX_REDACT_DEPTH = 5;

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((re) => re.test(key));
}

function redact(value: unknown, depth = 0): unknown {
  if (depth >= MAX_REDACT_DEPTH) return "[max-depth]";
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));

  const obj = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    result[key] = isSensitiveKey(key) ? "[REDACTED]" : redact(obj[key], depth + 1);
  }
  return result;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
  error?: string;
  stack?: string;
}

const IS_PROD = process.env.NODE_ENV === "production";
const LOG_LEVEL = (process.env.LOG_LEVEL as LogLevel) || (IS_PROD ? "info" : "debug");

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[LOG_LEVEL];
}

function formatEntry(entry: LogEntry): string {
  if (IS_PROD) {
    return JSON.stringify(entry);
  }
  const prefix = {
    debug: "🔍",
    info: "ℹ️ ",
    warn: "⚠️ ",
    error: "❌",
  }[entry.level];
  const ctx = entry.context ? `[${entry.context}] ` : "";
  const data = entry.data ? ` ${JSON.stringify(entry.data)}` : "";
  return `${prefix} ${ctx}${entry.message}${data}`;
}

function log(
  level: LogLevel,
  message: string,
  context?: string,
  data?: unknown,
  err?: unknown
): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context && { context }),
    ...(data !== undefined && { data: redact(data) }),
    ...(err instanceof Error && {
      error: err.message,
      stack: IS_PROD ? undefined : err.stack,
    }),
  };

  const formatted = formatEntry(entry);

  switch (level) {
    case "debug":
      console.debug(formatted);
      break;
    case "info":
      console.info(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "error":
      console.error(formatted);
      break;
  }
}

export const logger = {
  debug: (message: string, context?: string, data?: unknown) =>
    log("debug", message, context, data),

  info: (message: string, context?: string, data?: unknown) =>
    log("info", message, context, data),

  warn: (message: string, context?: string, data?: unknown) =>
    log("warn", message, context, data),

  error: (message: string, context?: string, err?: unknown, data?: unknown) =>
    log("error", message, context, data, err),
};

export type Logger = typeof logger;
