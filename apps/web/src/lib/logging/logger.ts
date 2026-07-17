/**
 * Structured logging — never log raw birth PII (GDPR).
 */

type LogLevel = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, string | number | boolean | null | undefined>;

const REDACT_KEYS = new Set([
  "dateOfBirth",
  "timeOfBirth",
  "email",
  "firstName",
  "lastName",
  "city",
  "country",
  "birthCity",
  "birthCountry",
  "svg",
  "frontSvg",
  "backSvg",
]);

function sanitize(fields?: LogFields): LogFields | undefined {
  if (!fields) return undefined;
  const out: LogFields = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = REDACT_KEYS.has(k) ? "[redacted]" : v;
  }
  return out;
}

function write(level: LogLevel, message: string, fields?: LogFields) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    service: "cosmographic-web",
    ...sanitize(fields),
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (message: string, fields?: LogFields) => write("debug", message, fields),
  info: (message: string, fields?: LogFields) => write("info", message, fields),
  warn: (message: string, fields?: LogFields) => write("warn", message, fields),
  error: (message: string, fields?: LogFields) => write("error", message, fields),
};
