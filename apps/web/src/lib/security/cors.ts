/**
 * CORS allowlist for session / design asset APIs (GDPR — no wildcard in prod).
 */

export function allowedOrigins(): string[] {
  const raw =
    process.env.CORS_ALLOWED_ORIGINS ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
    "";
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((h) => {
      if (h.startsWith("http://") || h.startsWith("https://")) return h.replace(/\/$/, "");
      return `https://${h.replace(/\/$/, "")}`;
    });

  const app = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (app && !list.includes(app)) list.push(app);

  // Local dev defaults
  for (const local of ["http://localhost:3000", "http://127.0.0.1:3000"]) {
    if (!list.includes(local)) list.push(local);
  }

  return list;
}

export function corsHeaders(requestOrigin: string | null): Record<string, string> {
  const allowed = allowedOrigins();
  const origin =
    requestOrigin && allowed.includes(requestOrigin)
      ? requestOrigin
      : allowed[0] || "https://www.cosmographic.store";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

export function isOriginAllowed(requestOrigin: string | null): boolean {
  if (!requestOrigin) return true; // same-origin / server-side
  return allowedOrigins().includes(requestOrigin);
}
