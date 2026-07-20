import { NextResponse } from "next/server";

import { fetchWithTimeout } from "@/lib/http/fetchWithTimeout";

export const runtime = "nodejs";

const EPHEMERIS_API_URL =
  process.env.EPHEMERIS_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

/**
 * Liveness probe — Swiss Ephemeris only (birth map app).
 */
export async function GET() {
  let ephemeris: { ok: boolean; detail?: string; swissEphemeris?: string } = {
    ok: false,
  };

  try {
    const res = await fetchWithTimeout(
      `${EPHEMERIS_API_URL}/v1/health`,
      { method: "GET", cache: "no-store" },
      { timeoutMs: 5_000, retries: 1, label: "ephemeris.health" },
    );
    const data = (await res.json().catch(() => ({}))) as {
      status?: string;
      swissEphemeris?: string;
    };
    ephemeris = {
      ok: res.ok && data.status === "ok",
      swissEphemeris: data.swissEphemeris,
      detail: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    ephemeris = {
      ok: false,
      detail: err instanceof Error ? err.message : "unreachable",
    };
  }

  const body = {
    ok: ephemeris.ok,
    service: "cosmographi-birth-map",
    ts: new Date().toISOString(),
    checks: { ephemeris },
  };

  return NextResponse.json(body, {
    status: body.ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
