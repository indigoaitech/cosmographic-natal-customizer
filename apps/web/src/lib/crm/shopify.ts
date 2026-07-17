import crypto from "node:crypto";

export function verifyShopifyWebhookHmac(
  rawBody: Buffer | string,
  hmacHeader: string | null,
  secret: string,
): boolean {
  if (!hmacHeader || !secret) return false;
  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");
  const a = Buffer.from(digest);
  const b = Buffer.from(hmacHeader);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export type ShopifyLineItemProperty = { name?: string; value?: string };

export type ShopifyOrderWebhook = {
  id?: number | string;
  name?: string;
  email?: string;
  contact_email?: string;
  customer?: {
    id?: number | string;
    email?: string;
    first_name?: string;
    last_name?: string;
    accepts_marketing?: boolean;
  };
  billing_address?: { first_name?: string; last_name?: string };
  note_attributes?: Array<{ name?: string; value?: string }>;
  line_items?: Array<{
    properties?: ShopifyLineItemProperty[];
  }>;
};

function propsMap(
  items: ShopifyOrderWebhook["line_items"],
  notes: ShopifyOrderWebhook["note_attributes"],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const note of notes || []) {
    if (note?.name && note.value != null) out[note.name] = String(note.value);
  }
  for (const item of items || []) {
    for (const prop of item.properties || []) {
      if (prop?.name && prop.value != null) out[prop.name] = String(prop.value);
    }
  }
  return out;
}

export function extractBirthDataFromOrder(order: ShopifyOrderWebhook): {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  timeOfBirth: string | null;
  birthCity: string | null;
  birthCountry: string | null;
  designOption: string | null;
  sessionId: string | null;
  printFrontUrl: string | null;
  printBackUrl: string | null;
  visualId: string | null;
  marketingOptIn: boolean;
  shopifyCustomerId: string | null;
  shopifyOrderId: string | null;
} {
  const props = propsMap(order.line_items, order.note_attributes);
  const email =
    order.email ||
    order.contact_email ||
    order.customer?.email ||
    null;

  return {
    email,
    firstName:
      order.customer?.first_name ||
      order.billing_address?.first_name ||
      null,
    lastName:
      order.customer?.last_name ||
      order.billing_address?.last_name ||
      null,
    dateOfBirth:
      props._date_of_birth ||
      props.date_of_birth ||
      props["Date of Birth"] ||
      null,
    timeOfBirth:
      props._time_of_birth ||
      props.time_of_birth ||
      props["Time of Birth"] ||
      null,
    birthCity: props._birth_city || props.birth_city || null,
    birthCountry: props._birth_country || props.birth_country || null,
    designOption: props._design_option || props.design_option || null,
    sessionId: props._session_id || props.session_id || null,
    printFrontUrl: props._print_front_url || props.print_front_url || null,
    printBackUrl: props._print_back_url || props.print_back_url || null,
    visualId: props._visual_id || props.visual_id || null,
    marketingOptIn: Boolean(order.customer?.accepts_marketing),
    shopifyCustomerId: order.customer?.id != null ? String(order.customer.id) : null,
    shopifyOrderId: order.id != null ? String(order.id) : null,
  };
}
