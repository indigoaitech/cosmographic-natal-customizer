import { NextResponse } from "next/server";

import { getShopifyConfigStatus } from "@/lib/shopify/config";

export const runtime = "nodejs";

/**
 * Non-secret status for the customizer UI (never returns the token).
 */
export async function GET() {
  const status = getShopifyConfigStatus();
  return NextResponse.json({
    store: "www.cosmographic.store",
    shopApi: status.apiDomain,
    configured: status.configured,
    hasToken: status.hasToken,
    hasVariantId: status.hasVariantId,
    missing: status.missing,
    publicDomain: status.publicDomain,
  });
}
