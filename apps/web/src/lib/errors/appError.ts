/**
 * Structured application errors with recovery paths (spec § Error Handling).
 */

export type ErrorCode =
  | "VALIDATION_FAILED"
  | "GEOCODE_FAILED"
  | "GEOCODE_AMBIGUOUS"
  | "EPHEMERIS_UNAVAILABLE"
  | "EPHEMERIS_CALC_FAILED"
  | "RENDER_FAILED"
  | "SESSION_NOT_FOUND"
  | "SESSION_EXPIRED"
  | "SHOPIFY_NOT_CONFIGURED"
  | "SHOPIFY_CART_FAILED"
  | "PRINTIFY_NOT_CONFIGURED"
  | "PRINTIFY_FAILED"
  | "STORAGE_FAILED"
  | "UNAUTHORIZED"
  | "INTERNAL";

export type AppErrorBody = {
  detail: string;
  code: ErrorCode;
  recovery?: string;
  fields?: Array<{ field: string; message: string }>;
  retryable?: boolean;
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly recovery?: string;
  readonly fields?: AppErrorBody["fields"];
  readonly retryable: boolean;

  constructor(
    code: ErrorCode,
    detail: string,
    opts?: {
      status?: number;
      recovery?: string;
      fields?: AppErrorBody["fields"];
      retryable?: boolean;
    },
  ) {
    super(detail);
    this.name = "AppError";
    this.code = code;
    this.status = opts?.status ?? statusForCode(code);
    this.recovery = opts?.recovery;
    this.fields = opts?.fields;
    this.retryable = opts?.retryable ?? false;
  }

  toJSON(): AppErrorBody {
    return {
      detail: this.message,
      code: this.code,
      recovery: this.recovery,
      fields: this.fields,
      retryable: this.retryable,
    };
  }
}

function statusForCode(code: ErrorCode): number {
  switch (code) {
    case "VALIDATION_FAILED":
      return 422;
    case "GEOCODE_FAILED":
    case "SESSION_NOT_FOUND":
      return 404;
    case "GEOCODE_AMBIGUOUS":
      return 409;
    case "SESSION_EXPIRED":
      return 410;
    case "UNAUTHORIZED":
      return 401;
    case "EPHEMERIS_UNAVAILABLE":
    case "SHOPIFY_CART_FAILED":
    case "PRINTIFY_FAILED":
    case "STORAGE_FAILED":
      return 502;
    case "SHOPIFY_NOT_CONFIGURED":
    case "PRINTIFY_NOT_CONFIGURED":
      return 503;
    case "EPHEMERIS_CALC_FAILED":
    case "RENDER_FAILED":
      return 500;
    default:
      return 500;
  }
}

export function toErrorResponse(err: unknown): {
  status: number;
  body: AppErrorBody;
} {
  if (err instanceof AppError) {
    return { status: err.status, body: err.toJSON() };
  }
  const message = err instanceof Error ? err.message : "Unexpected server error";
  return {
    status: 500,
    body: {
      detail: message,
      code: "INTERNAL",
      recovery: "Retry in a moment. If it persists, contact info@cosmographic.store.",
      retryable: true,
    },
  };
}
