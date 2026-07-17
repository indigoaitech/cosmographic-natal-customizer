/**
 * Shopify config for www.cosmographic.store
 *
 * - Storefront GraphQL must hit the *.myshopify.com host (not always the custom domain).
 * - Checkout still lands on the branded custom domain when the shop has it attached.
 */

export type ShopifyConfig = {
  /** Customer-facing domain, e.g. www.cosmographic.store */
  publicDomain: string;
  /** API host, e.g. cosmographic.myshopify.com */
  apiDomain: string;
  /** Public Storefront API token (X-Shopify-Storefront-Access-Token) */
  storefrontToken: string;
  /** Private Headless token (Shopify-Storefront-Private-Token) */
  storefrontPrivateToken: string;
  productVariantId: string;
  apiVersion: string;
};

function cleanHost(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .toLowerCase();
}

export function getShopifyConfig(): ShopifyConfig {
  const publicDomain = cleanHost(
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "www.cosmographic.store",
  );

  // Prefer explicit myshopify.com shop; fall back to public domain if unset
  const apiDomain = cleanHost(
    process.env.SHOPIFY_SHOP_DOMAIN ||
      process.env.SHOPIFY_STORE_DOMAIN ||
      publicDomain,
  );

  const storefrontToken = process.env.SHOPIFY_STOREFRONT_TOKEN?.trim() || "";
  const storefrontPrivateToken =
    process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN?.trim() || "";
  const productVariantId = process.env.SHOPIFY_PRODUCT_VARIANT_ID?.trim() || "";
  const apiVersion = process.env.SHOPIFY_API_VERSION?.trim() || "2025-01";

  return {
    publicDomain,
    apiDomain,
    storefrontToken,
    storefrontPrivateToken,
    productVariantId,
    apiVersion,
  };
}

export type ShopifyConfigStatus = {
  configured: boolean;
  publicDomain: string;
  apiDomain: string;
  hasToken: boolean;
  hasVariantId: boolean;
  missing: string[];
};

export function getShopifyConfigStatus(): ShopifyConfigStatus {
  const cfg = getShopifyConfig();
  const missing: string[] = [];
  // Permalink checkout only needs variant ID (no Headless / Storefront token).
  if (!cfg.productVariantId) missing.push("SHOPIFY_PRODUCT_VARIANT_ID");

  return {
    configured: missing.length === 0,
    publicDomain: cfg.publicDomain,
    apiDomain: cfg.apiDomain,
    hasToken: Boolean(cfg.storefrontToken || cfg.storefrontPrivateToken),
    hasVariantId: Boolean(cfg.productVariantId),
    missing,
  };
}

export function assertShopifyConfigured(cfg: ShopifyConfig): void {
  const status = getShopifyConfigStatus();
  if (!status.configured) {
    throw new Error(
      `Shopify yapılandırması eksik (${status.missing.join(", ")}). ` +
        `www.cosmographic.store için apps/web/.env.local dosyasını doldurun.`,
    );
  }
  void cfg;
}

/** Normalize variant id to Shopify GID. */
export function toVariantGid(id: string): string {
  const trimmed = id.trim();
  if (trimmed.startsWith("gid://shopify/ProductVariant/")) return trimmed;
  if (/^\d+$/.test(trimmed)) return `gid://shopify/ProductVariant/${trimmed}`;
  return trimmed;
}

export function storefrontEndpoint(cfg: ShopifyConfig): string {
  return `https://${cfg.apiDomain}/api/${cfg.apiVersion}/graphql.json`;
}

/**
 * Prefer branded checkout host when Shopify returns a myshopify checkout URL.
 * When the Next.js customizer owns www (Vercel), set
 * SHOPIFY_CHECKOUT_HOST=myshopify so /cart|/checkouts stay on Shopify.
 */
export function brandCheckoutUrl(checkoutUrl: string, publicDomain: string): string {
  try {
    const url = new URL(checkoutUrl);
    const checkoutHost = cleanHost(
      process.env.SHOPIFY_CHECKOUT_HOST ||
        process.env.SHOPIFY_SHOP_DOMAIN ||
        "",
    );
    const forceMyshopify =
      process.env.SHOPIFY_CHECKOUT_ON_MYSHOPIFY === "1" ||
      process.env.SHOPIFY_CHECKOUT_ON_MYSHOPIFY === "true";

    if (forceMyshopify && checkoutHost.endsWith(".myshopify.com")) {
      url.hostname = checkoutHost;
      return url.toString();
    }

    if (
      url.hostname.endsWith(".myshopify.com") &&
      publicDomain &&
      !publicDomain.endsWith(".myshopify.com")
    ) {
      url.hostname = publicDomain;
    }
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}
