import { NextRequest, NextResponse } from "next/server";

import { listEnabledProducts } from "@/lib/catalog/products";

export const runtime = "nodejs";

/** Public product catalog + which Shopify variants are configured. */
export async function GET(_req: NextRequest) {
  const products = listEnabledProducts().map((p) => ({
    kind: p.kind,
    title: p.title,
    subtitle: p.subtitle,
    printSides: p.printSides,
    enabled: p.enabled,
    variantConfigured: Boolean(p.variantId),
  }));

  return NextResponse.json({
    products,
    note: "Set SHOPIFY_VARIANT_TEE / HOODIE / CREW / POSTER (or legacy SHOPIFY_PRODUCT_VARIANT_ID) in env.",
  });
}
