import {
  assertShopifyConfigured,
  getShopifyConfig,
  storefrontEndpoint,
} from "@/lib/shopify/config";

type GraphQlError = { message: string };

export class ShopifyStorefrontError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ShopifyStorefrontError";
  }
}

export async function storefrontRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const cfg = getShopifyConfig();
  assertShopifyConfigured(cfg);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Headless: public token and/or private server token
  if (cfg.storefrontToken) {
    headers["X-Shopify-Storefront-Access-Token"] = cfg.storefrontToken;
  }
  if (cfg.storefrontPrivateToken) {
    headers["Shopify-Storefront-Private-Token"] = cfg.storefrontPrivateToken;
  }
  if (!cfg.storefrontToken && !cfg.storefrontPrivateToken) {
    throw new ShopifyStorefrontError(
      "Storefront token eksik (SHOPIFY_STOREFRONT_TOKEN veya PRIVATE).",
    );
  }

  const res = await fetch(storefrontEndpoint(cfg), {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const json = (await res.json().catch(() => ({}))) as {
    data?: T;
    errors?: GraphQlError[];
  };

  if (!res.ok) {
    throw new ShopifyStorefrontError(
      `Storefront HTTP ${res.status}`,
      res.status,
      json,
    );
  }

  if (json.errors?.length) {
    throw new ShopifyStorefrontError(
      json.errors.map((e) => e.message).join("; "),
      res.status,
      json.errors,
    );
  }

  if (!json.data) {
    throw new ShopifyStorefrontError("Empty Storefront response", res.status);
  }

  return json.data;
}
