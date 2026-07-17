import { NextRequest, NextResponse } from "next/server";

import { getDesignAsset } from "@/lib/design/storage";
import {
  createCheckoutCart,
  type DesignOption,
  type PrintSide,
} from "@/lib/shopify/cart";
import {
  buildCartPermalink,
  canUsePermalinkCheckout,
  canUseStorefrontApi,
} from "@/lib/shopify/permalink";
import { ShopifyStorefrontError } from "@/lib/shopify/storefront";

export const runtime = "nodejs";

type CartBody = {
  designOption?: DesignOption;
  printSide?: PrintSide;
  visualId?: string;
  chartSummary?: string;
  dateOfBirth?: string;
  timeOfBirth?: string;
  birthCity?: string;
  birthCountry?: string;
  quantity?: number;
  productVariantId?: string;
  sessionId?: string;
  printFrontUrl?: string;
  printBackUrl?: string;
};

/**
 * Create Shopify cart (Storefront API if token set, else cart permalink).
 */
export async function POST(req: NextRequest) {
  let body: CartBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
  }

  const visualId = body.visualId?.trim();
  if (!visualId) {
    return NextResponse.json({ detail: "visualId is required" }, { status: 422 });
  }

  const design = getDesignAsset(visualId);
  if (!design) {
    return NextResponse.json(
      { detail: "Unknown visualId — generate & save design first" },
      { status: 404 },
    );
  }

  const printSide: PrintSide =
    body.printSide === "back" || design.printSide === "back" ? "back" : "front";
  const designOption: DesignOption =
    body.designOption === "B" || design.designOption === "B" ? "B" : "A";

  const customization = {
    designOption,
    printSide,
    visualId,
    chartSummary: body.chartSummary || design.chartSummary,
    dateOfBirth: body.dateOfBirth,
    timeOfBirth: body.timeOfBirth,
    birthCity: body.birthCity,
    birthCountry: body.birthCountry,
    quantity: body.quantity,
    productVariantId: body.productVariantId?.trim() || undefined,
    sessionId: body.sessionId?.trim() || undefined,
    printFrontUrl: body.printFrontUrl?.trim() || undefined,
    printBackUrl: body.printBackUrl?.trim() || undefined,
  };

  try {
    if (canUseStorefrontApi()) {
      const cart = await createCheckoutCart(customization);
      return NextResponse.json({
        ok: true,
        mode: "storefront",
        cartId: cart.cartId,
        checkoutUrl: cart.checkoutUrl,
        totalQuantity: cart.totalQuantity,
        visualId,
        designOption,
        printSide,
      });
    }

    if (canUsePermalinkCheckout()) {
      const cart = buildCartPermalink(customization);
      return NextResponse.json({
        ok: true,
        mode: cart.mode,
        cartId: cart.cartId,
        checkoutUrl: cart.checkoutUrl,
        totalQuantity: cart.totalQuantity,
        visualId,
        designOption,
        printSide,
      });
    }

    return NextResponse.json(
      {
        detail:
          "Shopify henüz bağlı değil. Admin’de tişört ürünü oluşturup SHOPIFY_PRODUCT_VARIANT_ID’yi .env.local’a ekleyin.",
        code: "SHOPIFY_NOT_CONFIGURED",
        missing: ["SHOPIFY_PRODUCT_VARIANT_ID"],
      },
      { status: 503 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Shopify cart creation failed";
    const status = err instanceof ShopifyStorefrontError ? 502 : 500;
    return NextResponse.json(
      {
        detail: message,
        code: "SHOPIFY_CART_FAILED",
      },
      { status },
    );
  }
}
