import {
  brandCheckoutUrl,
  getShopifyConfig,
  toVariantGid,
} from "@/lib/shopify/config";
import { storefrontRequest } from "@/lib/shopify/storefront";

export type DesignOption = "A" | "B";
export type PrintSide = "front" | "back";

export type LineItemCustomization = {
  designOption: DesignOption;
  printSide: PrintSide;
  visualId: string;
  chartSummary?: string;
  dateOfBirth?: string;
  timeOfBirth?: string;
  birthCity?: string;
  birthCountry?: string;
  quantity?: number;
  /** Optional override from product-page CTA (?variant=) */
  productVariantId?: string;
  /** Personalization session UUID for catalog + Printify fulfillment */
  sessionId?: string;
  /** High-res front wheel URL (Printify / theme) */
  printFrontUrl?: string;
  /** High-res back table URL */
  printBackUrl?: string;
};

export type CartResult = {
  cartId: string;
  checkoutUrl: string;
  totalQuantity: number;
};

type Attribute = { key: string; value: string };

type CartCreateData = {
  cartCreate: {
    cart: {
      id: string;
      checkoutUrl: string;
      totalQuantity: number;
    } | null;
    userErrors: Array<{ field?: string[]; message: string }>;
  };
};

const CART_CREATE = `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        totalQuantity
      }
      userErrors {
        field
        message
      }
    }
  }
`;

function buildAttributes(c: LineItemCustomization): Attribute[] {
  const attrs: Attribute[] = [
    { key: "_design_option", value: c.designOption },
    { key: "_print_side", value: c.printSide },
    { key: "_visual_id", value: c.visualId },
  ];

  if (c.sessionId) attrs.push({ key: "_session_id", value: c.sessionId });
  if (c.printFrontUrl) {
    attrs.push({ key: "_print_front_url", value: c.printFrontUrl });
  }
  if (c.printBackUrl) {
    attrs.push({ key: "_print_back_url", value: c.printBackUrl });
  }
  if (c.chartSummary) attrs.push({ key: "_chart_summary", value: c.chartSummary });
  if (c.dateOfBirth) attrs.push({ key: "_date_of_birth", value: c.dateOfBirth });
  if (c.timeOfBirth) attrs.push({ key: "_time_of_birth", value: c.timeOfBirth });
  if (c.birthCity) attrs.push({ key: "_birth_city", value: c.birthCity });
  if (c.birthCountry) attrs.push({ key: "_birth_country", value: c.birthCountry });

  return attrs;
}

/**
 * Create a Shopify cart with natal-customizer line-item attributes,
 * then return checkout URL branded for cosmographic.store.
 */
export async function createCheckoutCart(
  customization: LineItemCustomization,
): Promise<CartResult> {
  const cfg = getShopifyConfig();
  const merchandiseId = toVariantGid(
    customization.productVariantId || cfg.productVariantId,
  );
  const quantity = Math.max(1, Math.min(10, customization.quantity ?? 1));

  const data = await storefrontRequest<CartCreateData>(CART_CREATE, {
    input: {
      lines: [
        {
          merchandiseId,
          quantity,
          attributes: buildAttributes(customization),
        },
      ],
      attributes: [
        { key: "_source", value: "natal_customizer" },
        { key: "_visual_id", value: customization.visualId },
        ...(customization.sessionId
          ? [{ key: "_session_id", value: customization.sessionId }]
          : []),
      ],
    },
  });

  const { cart, userErrors } = data.cartCreate;
  if (userErrors?.length) {
    throw new Error(userErrors.map((e) => e.message).join("; "));
  }
  if (!cart?.checkoutUrl) {
    throw new Error("Shopify cart oluşturulamadı (checkoutUrl yok).");
  }

  return {
    cartId: cart.id,
    checkoutUrl: brandCheckoutUrl(cart.checkoutUrl, cfg.publicDomain),
    totalQuantity: cart.totalQuantity,
  };
}
