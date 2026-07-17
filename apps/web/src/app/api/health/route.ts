import { NextRequest, NextResponse } from "next/server";

import { fetchWithTimeout } from "@/lib/http/fetchWithTimeout";
import { getPrintifyConfig } from "@/lib/printify/client";
import { getShopifyConfigStatus } from "@/lib/shopify/config";
import { isCloudStorageConfigured, isS3Configured } from "@/lib/storage/cloud";

export const runtime = "nodejs";

const EPHEMERIS_API_URL =
  process.env.EPHEMERIS_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

/**
 * Liveness / dependency probe for load balancers and uptime monitors.
 * Does not expose secrets.
 */
export async function GET(_req: NextRequest) {
  const shopify = getShopifyConfigStatus();
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

  const printify = Boolean(getPrintifyConfig());
  const body = {
    ok: ephemeris.ok && shopify.hasVariantId,
    service: "cosmographic-web",
    ts: new Date().toISOString(),
    checks: {
      ephemeris,
      shopify: {
        configured: shopify.configured,
        hasVariantId: shopify.hasVariantId,
        hasToken: shopify.hasToken,
        missing: shopify.missing,
      },
      printify: { configured: printify },
      storage: {
        cloudinary: isCloudStorageConfigured(),
        s3: isS3Configured(),
        localFs: true,
      },
    },
  };

  return NextResponse.json(body, {
    status: body.ok ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
