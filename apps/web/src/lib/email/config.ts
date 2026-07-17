/**
 * Official Cosmographic transactional email configuration.
 * All store mail must send from the brand domain — never personal Gmail.
 */

export const STORE_EMAIL = {
  fromAddress: "info@cosmographic.store",
  fromName: "Cosmographic Store",
  replyTo: "info@cosmographic.store",
  support: "info@cosmographic.store",
  brandUrl: "https://www.cosmographic.store",
} as const;

export function getMailFromHeader(): string {
  return `${STORE_EMAIL.fromName} <${STORE_EMAIL.fromAddress}>`;
}

export type MailEnv = {
  resendApiKey: string | undefined;
  dryRun: boolean;
};

export function getMailEnv(): MailEnv {
  const resendApiKey = process.env.RESEND_API_KEY?.trim() || undefined;
  const dryRun =
    process.env.EMAIL_DRY_RUN === "1" ||
    process.env.EMAIL_DRY_RUN === "true" ||
    !resendApiKey;
  return { resendApiKey, dryRun };
}
