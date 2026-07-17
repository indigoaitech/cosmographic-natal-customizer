/**
 * Printify API client — fulfillment after Shopify orders/create.
 *
 * Safety: when PRINTIFY_DRY_RUN=true (default if unset in non-production),
 * credentials may be present but no production order is created.
 */

import { fetchWithTimeout } from "@/lib/http/fetchWithTimeout";
import { log } from "@/lib/logging/logger";

export type PrintifyConfig = {
  apiToken: string;
  shopId: string;
  baseUrl: string;
  dryRun: boolean;
};

export function getPrintifyConfig(): PrintifyConfig | null {
  const apiToken = process.env.PRINTIFY_API_TOKEN?.trim() || "";
  const shopId = process.env.PRINTIFY_SHOP_ID?.trim() || "";
  if (!apiToken || !shopId) return null;
  const dryEnv = process.env.PRINTIFY_DRY_RUN?.trim().toLowerCase();
  const dryRun =
    dryEnv === "1" ||
    dryEnv === "true" ||
    (dryEnv !== "0" &&
      dryEnv !== "false" &&
      process.env.NODE_ENV !== "production");
  return {
    apiToken,
    shopId,
    baseUrl: "https://api.printify.com/v1",
    dryRun,
  };
}

export function isPrintifyConfigured(): boolean {
  return getPrintifyConfig() !== null;
}

export type PrintifyArtworkPayload = {
  sessionId: string;
  printFrontUrl: string;
  printBackUrl: string;
  shopifyOrderId?: string;
  variantSku?: string;
};

export type PrintifySubmitResult =
  | { ok: false; reason: string; dryRun?: boolean }
  | { ok: true; printifyOrderId: string; dryRun?: boolean };

/**
 * Create / enqueue a Printify order with personalized front/back artwork URLs.
 * Full product mapping (blueprint/provider IDs) must be configured per SKU.
 */
export async function submitPersonalizedPrintifyOrder(
  payload: PrintifyArtworkPayload,
): Promise<PrintifySubmitResult> {
  const cfg = getPrintifyConfig();
  if (!cfg) {
    return {
      ok: false,
      reason: "Printify not configured (PRINTIFY_API_TOKEN / PRINTIFY_SHOP_ID)",
    };
  }

  if (!payload.printFrontUrl || !payload.printBackUrl) {
    return { ok: false, reason: "Missing printFrontUrl or printBackUrl" };
  }

  if (cfg.dryRun) {
    log.info("printify.dry_run", {
      sessionId: payload.sessionId,
      shopifyOrderId: payload.shopifyOrderId || null,
    });
    return {
      ok: true,
      printifyOrderId: `dryrun_${payload.sessionId.slice(0, 8)}`,
      dryRun: true,
    };
  }

  // Production path: upload remote images then create order.
  // Blueprint/variant IDs are shop-specific — require PRINTIFY_BLUEPRINT_ID.
  const blueprintId = process.env.PRINTIFY_BLUEPRINT_ID?.trim();
  if (!blueprintId) {
    return {
      ok: false,
      reason:
        "PRINTIFY_BLUEPRINT_ID required for live order create. Set PRINTIFY_DRY_RUN=true until mapped.",
    };
  }

  try {
    const res = await fetchWithTimeout(
      `${cfg.baseUrl}/shops/${cfg.shopId}/orders.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.apiToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          external_id: payload.shopifyOrderId || payload.sessionId,
          line_items: [
            {
              product_id: blueprintId,
              // Printify expects uploaded image IDs in production;
              // URLs are passed for operator follow-up until upload step is wired.
              metadata: {
                session_id: payload.sessionId,
                print_front_url: payload.printFrontUrl,
                print_back_url: payload.printBackUrl,
              },
            },
          ],
        }),
      },
      { timeoutMs: 20_000, retries: 1, label: "printify.orders" },
    );

    const data = (await res.json().catch(() => ({}))) as {
      id?: string | number;
      error?: string;
      errors?: unknown;
    };

    if (!res.ok) {
      log.error("printify.order_failed", { status: res.status });
      return {
        ok: false,
        reason: `Printify HTTP ${res.status}: ${data.error || "order create failed"}`,
      };
    }

    return {
      ok: true,
      printifyOrderId: String(data.id ?? "unknown"),
    };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "Printify request failed",
    };
  }
}
