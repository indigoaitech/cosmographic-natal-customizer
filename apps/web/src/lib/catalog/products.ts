/**
 * Extensible product catalog — maps garment kinds to Shopify variant IDs.
 * Future: posters, canvas, cases, jewelry via the same ProductDefinition shape.
 */

export type ProductKind =
  | "tee"
  | "hoodie"
  | "crew"
  | "poster"
  | "canvas"
  | "phone_case"
  | "jewelry";

export type ProductDefinition = {
  kind: ProductKind;
  title: string;
  subtitle: string;
  printSides: Array<"front" | "back">;
  /** Env var holding Shopify Product Variant ID */
  variantEnvKey: string;
  /** Printify blueprint / catalog hint (documentation) */
  printifyHint?: string;
  enabled: boolean;
};

export const PRODUCT_CATALOG: ProductDefinition[] = [
  {
    kind: "tee",
    title: "Natal Chart Tee",
    subtitle: "Front wheel · back planet table",
    printSides: ["front", "back"],
    variantEnvKey: "SHOPIFY_VARIANT_TEE",
    printifyHint: "DTG tee — chest + upper back",
    enabled: true,
  },
  {
    kind: "hoodie",
    title: "Cosmic Hoodie",
    subtitle: "Chest print · soft fleece",
    printSides: ["front", "back"],
    variantEnvKey: "SHOPIFY_VARIANT_HOODIE",
    printifyHint: "DTG hoodie",
    enabled: true,
  },
  {
    kind: "crew",
    title: "Birth Map Crewneck",
    subtitle: "Premium midweight sweatshirt",
    printSides: ["front", "back"],
    variantEnvKey: "SHOPIFY_VARIANT_CREW",
    printifyHint: "DTG sweatshirt",
    enabled: true,
  },
  {
    kind: "poster",
    title: "Chart Poster",
    subtitle: "Museum print · 300 DPI",
    printSides: ["front"],
    variantEnvKey: "SHOPIFY_VARIANT_POSTER",
    printifyHint: "Poster / fine art",
    enabled: true,
  },
  {
    kind: "canvas",
    title: "Canvas Print",
    subtitle: "Gallery wrap (coming soon)",
    printSides: ["front"],
    variantEnvKey: "SHOPIFY_VARIANT_CANVAS",
    enabled: false,
  },
  {
    kind: "phone_case",
    title: "Phone Case",
    subtitle: "Coming soon",
    printSides: ["front"],
    variantEnvKey: "SHOPIFY_VARIANT_PHONE_CASE",
    enabled: false,
  },
  {
    kind: "jewelry",
    title: "Celestial Jewelry",
    subtitle: "Coming soon",
    printSides: ["front"],
    variantEnvKey: "SHOPIFY_VARIANT_JEWELRY",
    enabled: false,
  },
];

export function resolveVariantId(kind: ProductKind): string | null {
  const def = PRODUCT_CATALOG.find((p) => p.kind === kind);
  if (!def) return null;
  const specific = process.env[def.variantEnvKey]?.trim();
  if (specific) return specific;
  // Fallback to legacy single-variant env for tee-like apparel
  if (kind === "tee" || kind === "hoodie" || kind === "crew") {
    return process.env.SHOPIFY_PRODUCT_VARIANT_ID?.trim() || null;
  }
  return null;
}

export function listEnabledProducts(): Array<
  ProductDefinition & { variantId: string | null }
> {
  return PRODUCT_CATALOG.filter((p) => p.enabled).map((p) => ({
    ...p,
    variantId: resolveVariantId(p.kind),
  }));
}
