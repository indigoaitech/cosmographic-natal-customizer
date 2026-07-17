import Link from "next/link";

export const metadata = {
  title: "Privacy · Cosmographic",
  description: "How Cosmographic handles birth data (GDPR-oriented).",
};

export default function PrivacyPage() {
  return (
    <main className="page-shell mx-auto max-w-2xl px-5 py-14 text-[var(--color-star)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-electric-blue)]">
        Privacy
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Birth data & your rights</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-[var(--color-muted)]">
        <p>
          Cosmographic processes birth date, time, and place solely to calculate
          your natal chart via Swiss Ephemeris and to personalize print-on-demand
          products. We do not sell birth data.
        </p>
        <p>
          Chart sessions expire automatically (default 72 hours). You may request
          erasure of a session by calling{" "}
          <code className="text-[var(--color-electric-blue)]">
            DELETE /api/session/&#123;session_id&#125;
          </code>{" "}
          or emailing{" "}
          <a className="text-[var(--color-electric-blue)]" href="mailto:info@cosmographic.store">
            info@cosmographic.store
          </a>
          .
        </p>
        <p>
          Marketing emails are sent only with explicit opt-in. Shopify checkout
          data is processed under Shopify’s and our processor agreements.
        </p>
        <p>
          Session APIs are CORS-restricted to configured storefront origins.
          Full chart snapshots are not stored by default.
        </p>
      </div>
      <p className="mt-10">
        <Link href="/" className="text-[var(--color-electric-blue)] hover:underline">
          ← Back to customizer
        </Link>
      </p>
    </main>
  );
}
