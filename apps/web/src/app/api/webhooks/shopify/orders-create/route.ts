import { NextRequest, NextResponse } from "next/server";

import { upsertCustomer } from "@/lib/crm/db";
import {
  extractBirthDataFromOrder,
  verifyShopifyWebhookHmac,
  type ShopifyOrderWebhook,
} from "@/lib/crm/shopify";
import {
  buildOrderConfirmationEmail,
  sendStoreEmail,
} from "@/lib/email/mailer";
import { submitPersonalizedPrintifyOrder } from "@/lib/printify/client";

export const runtime = "nodejs";

/**
 * Shopify `orders/create` webhook.
 * - Verifies HMAC
 * - Upserts CRM row (name, email, birth data from line-item properties)
 * - Attempts Printify personalized fulfillment (stub until API keys set)
 * - Sends post-purchase mail from info@cosmographic.store
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { detail: "SHOPIFY_WEBHOOK_SECRET is not configured" },
      { status: 503 },
    );
  }

  const raw = Buffer.from(await req.arrayBuffer());
  const hmac = req.headers.get("x-shopify-hmac-sha256");
  if (!verifyShopifyWebhookHmac(raw, hmac, secret)) {
    return NextResponse.json({ detail: "Invalid HMAC" }, { status: 401 });
  }

  let order: ShopifyOrderWebhook;
  try {
    order = JSON.parse(raw.toString("utf8")) as ShopifyOrderWebhook;
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  const extracted = extractBirthDataFromOrder(order);
  if (!extracted.email) {
    return NextResponse.json(
      { ok: true, skipped: true, reason: "no_email" },
      { status: 200 },
    );
  }

  const customer = upsertCustomer({
    email: extracted.email,
    firstName: extracted.firstName,
    lastName: extracted.lastName,
    dateOfBirth: extracted.dateOfBirth,
    timeOfBirth: extracted.timeOfBirth,
    birthCity: extracted.birthCity,
    birthCountry: extracted.birthCountry,
    marketingOptIn: extracted.marketingOptIn,
    shopifyCustomerId: extracted.shopifyCustomerId,
    shopifyOrderId: extracted.shopifyOrderId,
    source: "shopify_order",
  });

  let printify: Awaited<ReturnType<typeof submitPersonalizedPrintifyOrder>> | null =
    null;
  if (
    extracted.sessionId &&
    extracted.printFrontUrl &&
    extracted.printBackUrl
  ) {
    printify = await submitPersonalizedPrintifyOrder({
      sessionId: extracted.sessionId,
      printFrontUrl: extracted.printFrontUrl,
      printBackUrl: extracted.printBackUrl,
      shopifyOrderId: extracted.shopifyOrderId || undefined,
    });
  }

  const mailContent = buildOrderConfirmationEmail({
    firstName: extracted.firstName,
    orderName: order.name,
    designOption: extracted.designOption,
    dateOfBirth: extracted.dateOfBirth,
  });

  const mail = await sendStoreEmail({
    to: extracted.email,
    subject: mailContent.subject,
    html: mailContent.html,
    text: mailContent.text,
    tags: [
      { name: "flow", value: "order_confirmation" },
      { name: "channel", value: "shopify_webhook" },
    ],
  });

  return NextResponse.json({
    ok: true,
    customerId: customer.id,
    email: customer.email,
    sessionId: extracted.sessionId,
    printify,
    mail,
  });
}
