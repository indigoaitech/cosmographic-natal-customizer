/**
 * Shopify cart URL without Storefront API / Headless.
 * Works on Shopify Basic when plan blocks Headless channel.
 */

import { getShopifyConfig, toVariantGid } from "@/lib/shopify/config";
import type { LineItemCustomization } from "@/lib/shopify/cart";

function numericVariantId(id: string): string {
  const gid = toVariantGid(id);
  const match = gid.match(/ProductVariant\/(\d+)/);
  if (match) return match[1];
  if (/^\d+$/.test(id.trim())) return id.trim();
  throw new Error(`Geçersiz SHOPIFY_PRODUCT_VARIANT_ID: ${id}`);
}

export function canUseStorefrontApi(): boolean {
  const cfg = getShopifyConfig();
  return Boolean(
    (cfg.storefrontToken || cfg.storefrontPrivateToken) && cfg.productVariantId,
  );
}

export function canUsePermalinkCheckout(): boolean {
  return Boolean(getShopifyConfig().productVariantId);
}

/**
 * Redirect customer to cosmographic.store cart with line-item properties.
 * Payment still handled by Shopify Checkout / Ödemeler.
 */
export function buildCartPermalink(c: LineItemCustomization): {
  cartId: string;
  checkoutUrl: string;
  totalQuantity: number;
  mode: "permalink";
} {
  const cfg = getShopifyConfig();
  const rawVariant = c.productVariantId || cfg.productVariantId;
  if (!rawVariant) {
    throw new Error(
      "SHOPIFY_PRODUCT_VARIANT_ID eksik. Admin → Ürünler → varyant ID’yi .env.local’a ekleyin.",
    );
  }

  const variantId = numericVariantId(rawVariant);
  const quantity = Math.max(1, Math.min(10, c.quantity ?? 1));
  const host =
    process.env.SHOPIFY_CHECKOUT_ON_MYSHOPIFY === "1" ||
    process.env.SHOPIFY_CHECKOUT_ON_MYSHOPIFY === "true"
      ? cfg.apiDomain || "wtx6n6-gu.myshopify.com"
      : cfg.publicDomain || "www.cosmographic.store";

  // /cart/{variant}:{qty} reliably opens checkout on Online Store.
  const params = new URLSearchParams();
  params.set("properties[_design_option]", c.designOption);
  params.set("properties[_print_side]", c.printSide);
  params.set("properties[_visual_id]", c.visualId);
  if (c.chartSummary) {
    params.set("properties[_chart_summary]", c.chartSummary.slice(0, 240));
  }
  if (c.dateOfBirth) params.set("properties[_date_of_birth]", c.dateOfBirth);
  if (c.timeOfBirth) params.set("properties[_time_of_birth]", c.timeOfBirth);
  if (c.birthCity) params.set("properties[_birth_city]", c.birthCity);
  if (c.birthCountry) params.set("properties[_birth_country]", c.birthCountry);

  const qs = params.toString();
  const path = `/cart/${variantId}:${quantity}${qs ? `?${qs}` : ""}`;

  return {
    cartId: `permalink:${c.visualId}`,
    checkoutUrl: `https://${host}${path}`,
    totalQuantity: quantity,
    mode: "permalink",
  };
}
