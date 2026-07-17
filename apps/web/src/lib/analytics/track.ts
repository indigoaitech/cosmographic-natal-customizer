/**
 * Lightweight analytics events — pluggable (console / future Segment / GA).
 * Never send raw birth PII.
 */

import { log } from "@/lib/logging/logger";

export type AnalyticsEvent =
  | "chart_generate_started"
  | "chart_generate_succeeded"
  | "chart_generate_failed"
  | "session_created"
  | "catalog_redirect"
  | "cart_created"
  | "checkout_started"
  | "privacy_delete_requested";

export function track(
  event: AnalyticsEvent,
  props?: Record<string, string | number | boolean>,
) {
  log.info(`analytics.${event}`, {
    event,
    ...props,
  });

  // Optional browser beacon
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
    const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
    void fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, props, ts: Date.now() }),
      keepalive: true,
    }).catch(() => undefined);
  }
}
