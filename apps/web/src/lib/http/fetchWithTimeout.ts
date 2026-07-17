/**
 * Shared HTTP client — timeouts + bounded retries for external services.
 * Prefers reliability over speed; does not retry non-idempotent 4xx (except 408/429).
 */

import { log } from "@/lib/logging/logger";

export type FetchRetryOptions = {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  label?: string;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function shouldRetryStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  opts: FetchRetryOptions = {},
): Promise<Response> {
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const retries = opts.retries ?? 2;
  const retryDelayMs = opts.retryDelayMs ?? 400;
  const label = opts.label || "http";

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok && shouldRetryStatus(res.status) && attempt < retries) {
        log.warn("http.retry", {
          label,
          status: res.status,
          attempt: attempt + 1,
        });
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      const aborted =
        err instanceof Error &&
        (err.name === "AbortError" || err.message.includes("aborted"));
      if (attempt < retries) {
        log.warn("http.retry", {
          label,
          attempt: attempt + 1,
          aborted: aborted ? 1 : 0,
        });
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }
      throw err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`${label} request failed`);
}
