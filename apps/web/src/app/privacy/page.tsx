import Link from "next/link";

export const metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-[var(--color-star)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-cyan)]">
        Cosmographi
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold">
        Privacy
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
        Birth data you submit is used only to compute your natal chart via Swiss
        Ephemeris (date, time, and place). We do not sell personal birth data.
        Generated charts are created for your session; do not share sensitive
        birth details on public surfaces if you prefer to keep them private.
      </p>
      <p className="mt-6">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-wider text-[var(--color-gold-soft)] hover:underline"
        >
          ← Back to birth map
        </Link>
      </p>
    </main>
  );
}
