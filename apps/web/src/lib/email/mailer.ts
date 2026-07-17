import { STORE_EMAIL, getMailEnv, getMailFromHeader } from "@/lib/email/config";

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  tags?: Array<{ name: string; value: string }>;
};

export type SendMailResult =
  | { ok: true; id: string; dryRun: boolean }
  | { ok: false; error: string; dryRun: boolean };

/**
 * Send transactional mail from info@cosmographic.store via Resend.
 * When RESEND_API_KEY is unset, runs in dry-run (logs payload, no send).
 */
export async function sendStoreEmail(input: SendMailInput): Promise<SendMailResult> {
  const env = getMailEnv();
  const from = getMailFromHeader();

  if (env.dryRun) {
    console.info("[email:dry-run]", {
      from,
      replyTo: STORE_EMAIL.replyTo,
      to: input.to,
      subject: input.subject,
    });
    return { ok: true, id: `dry-run-${Date.now()}`, dryRun: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        reply_to: STORE_EMAIL.replyTo,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        tags: input.tags,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
    };

    if (!res.ok) {
      return {
        ok: false,
        error: data.message || data.name || `Resend HTTP ${res.status}`,
        dryRun: false,
      };
    }

    return { ok: true, id: data.id || "unknown", dryRun: false };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Mail send failed",
      dryRun: false,
    };
  }
}

export function buildOrderConfirmationEmail(params: {
  firstName?: string | null;
  orderName?: string | null;
  designOption?: string | null;
  dateOfBirth?: string | null;
}): { subject: string; html: string; text: string } {
  const name = params.firstName?.trim() || "friend";
  const order = params.orderName ? ` (${params.orderName})` : "";
  const subject = `Your Cosmographic natal chart order${order}`;

  const html = `
  <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;background:#030712;color:#e8f4ff;padding:32px">
    <p style="color:#1ee0ff;letter-spacing:0.2em;font-size:11px;text-transform:uppercase">Cosmographic Store</p>
    <h1 style="font-size:22px;margin:8px 0 16px">Thank you, ${escapeHtml(name)}</h1>
    <p style="color:#8ba3c7;line-height:1.6">
      Your personalized natal chart apparel order is confirmed.
      We'll prepare your print from the chart data you shared at checkout.
    </p>
    <ul style="color:#e8f4ff;line-height:1.8">
      ${params.orderName ? `<li>Order: ${escapeHtml(params.orderName)}</li>` : ""}
      ${params.designOption ? `<li>Design: Option ${escapeHtml(params.designOption)}</li>` : ""}
      ${params.dateOfBirth ? `<li>Birth date on file: ${escapeHtml(params.dateOfBirth)}</li>` : ""}
    </ul>
    <p style="color:#8ba3c7;line-height:1.6;margin-top:24px">
      Questions? Reply to this email or write
      <a href="mailto:${STORE_EMAIL.support}" style="color:#1ee0ff">${STORE_EMAIL.support}</a>.
    </p>
    <p style="margin-top:28px">
      <a href="${STORE_EMAIL.brandUrl}" style="color:#ff2d95">${STORE_EMAIL.brandUrl}</a>
    </p>
  </div>`.trim();

  const text = [
    `Thank you, ${name}.`,
    `Your Cosmographic natal chart order${order} is confirmed.`,
    params.designOption ? `Design: Option ${params.designOption}` : "",
    params.dateOfBirth ? `Birth date on file: ${params.dateOfBirth}` : "",
    `Support: ${STORE_EMAIL.support}`,
    STORE_EMAIL.brandUrl,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
