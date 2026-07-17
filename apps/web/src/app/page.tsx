"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import { DesignPreview, type ChartStyle } from "@/components/chart/DesignPreview";
import { PlacementSummaryTable } from "@/components/chart/PlacementSummaryTable";
import { CheckoutPanel } from "@/components/checkout/CheckoutPanel";
import {
  TShirtMockup,
  type PrintSide,
} from "@/components/mockup/TShirtMockup";
import type { ChartPayload } from "@/lib/chart/types";

type BirthFields = {
  dateOfBirth: string;
  timeOfBirth: string;
  city: string;
  country: string;
};

function HomePageInner() {
  const searchParams = useSearchParams();
  const productVariantId = searchParams.get("variant")?.trim() || undefined;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chart, setChart] = useState<ChartPayload | null>(null);
  const [crmNote, setCrmNote] = useState<string | null>(null);
  const [printSide, setPrintSide] = useState<PrintSide>("front");
  const [chartStyle, setChartStyle] = useState<ChartStyle>("print");
  const [birth, setBirth] = useState<BirthFields>({
    dateOfBirth: "",
    timeOfBirth: "",
    city: "",
    country: "",
  });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCrmNote(null);
    setChart(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const dateOfBirth = String(fd.get("dateOfBirth") || "");
    const timeOfBirth = String(fd.get("timeOfBirth") || "");
    const city = String(fd.get("city") || "");
    const country = String(fd.get("country") || "");
    const email = String(fd.get("email") || "").trim();
    const firstName = String(fd.get("firstName") || "").trim();
    const lastName = String(fd.get("lastName") || "").trim();
    const marketingOptIn = fd.get("marketingOptIn") === "on";

    setBirth({ dateOfBirth, timeOfBirth, city, country });

    const payload = {
      dateOfBirth,
      timeOfBirth,
      location: { city, country },
      houseSystem: "P",
    };

    try {
      const res = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Chart calculation failed",
        );
      }
      setChart(data as ChartPayload);

      if (marketingOptIn && email) {
        const leadRes = await fetch("/api/crm/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            dateOfBirth,
            timeOfBirth,
            birthCity: city,
            birthCountry: country,
            marketingOptIn: true,
          }),
        });
        const leadData = await leadRes.json().catch(() => ({}));
        if (leadRes.ok) {
          setCrmNote("Saved securely for birthday updates from Cosmographic.");
        } else {
          setCrmNote(
            typeof leadData.detail === "string"
              ? leadData.detail
              : "Chart ready — CRM save skipped.",
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="starfield" aria-hidden />
      <div className="nebula-orb nebula-orb--blue" aria-hidden />
      <div className="nebula-orb nebula-orb--pink" aria-hidden />

      <main className="page-shell mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-5 py-10 sm:px-6 sm:py-14">
        <header className="animate-fade-up space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-panel-border)] bg-[rgba(11,31,74,0.45)] px-3 py-1">
            <span
              className="h-1.5 w-1.5 rounded-full bg-[var(--color-electric-blue)]"
              style={{ boxShadow: "var(--glow-blue)" }}
            />
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-electric-blue)]">
              Cosmographic Store
            </p>
          </div>
          <h1 className="text-glow-blue max-w-3xl text-4xl font-semibold tracking-tight text-[var(--color-star)] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            Natal Chart T-Shirt Customizer
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--color-muted)]">
            Map your sky with Swiss Ephemeris, preview your flat natal
            astrolabe, then flip FRONT / BACK apparel placement.
          </p>
        </header>

        <section className="panel-glass grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,340px)_1fr]">
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-neon-pink-soft)]">
                Step 01
              </p>
              <h2 className="mt-1 text-lg font-medium text-[var(--color-electric-blue)]">
                Birth details
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="cg-label">
                <span>First name</span>
                <input name="firstName" autoComplete="given-name" className="cg-input" />
              </label>
              <label className="cg-label">
                <span>Last name</span>
                <input name="lastName" autoComplete="family-name" className="cg-input" />
              </label>
            </div>

            <label className="cg-label">
              <span>Email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                className="cg-input"
              />
            </label>

            <label className="cg-label">
              <span>Date of birth</span>
              <input required name="dateOfBirth" type="date" className="cg-input" />
            </label>

            <label className="cg-label">
              <span>Exact time of birth</span>
              <input required name="timeOfBirth" type="time" step={1} className="cg-input" />
            </label>

            <label className="cg-label">
              <span>City</span>
              <input required name="city" placeholder="Athens" className="cg-input" />
            </label>

            <label className="cg-label">
              <span>Country</span>
              <input required name="country" placeholder="Greece" className="cg-input" />
            </label>

            <label className="flex items-start gap-2 text-xs leading-relaxed text-[var(--color-muted)]">
              <input
                name="marketingOptIn"
                type="checkbox"
                className="mt-0.5 accent-[var(--color-electric-blue)]"
              />
              <span>
                Save my name, email, and birth date securely for Cosmographic birthday
                updates. Emails from{" "}
                <span className="text-[var(--color-electric-blue)]">
                  info@cosmographic.store
                </span>
                .
              </span>
            </label>

            <button type="submit" disabled={loading} className="cg-btn-primary mt-1">
              {loading ? "Computing chart…" : "Generate natal chart"}
            </button>

            {error && (
              <p className="text-sm text-[var(--color-neon-pink)]" role="alert">
                {error}
              </p>
            )}
            {crmNote && (
              <p className="text-xs text-[var(--color-electric-blue-dim)]">{crmNote}</p>
            )}

            {chart && (
              <div className="mt-1 space-y-2 border-t border-[var(--color-panel-border)] pt-4 font-mono text-[10px] leading-relaxed text-[var(--color-muted)]">
                <p className="line-clamp-2 text-[var(--color-electric-blue)]">
                  {chart.meta.placeLabel}
                </p>
                <p>
                  UTC {chart.meta.utc} · {chart.meta.timezone}
                </p>
                <p>
                  ASC {chart.angles.asc.toFixed(2)}° · MC{" "}
                  {chart.angles.mc.toFixed(2)}° · {chart.aspects.length} aspects
                </p>
              </div>
            )}
          </form>

          <div className="flex min-h-[320px] flex-col gap-6">
            {!chart && !loading && (
              <div className="flex flex-1 flex-col justify-center gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--color-panel-border)] bg-[rgba(3,7,18,0.35)] p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-electric-blue)]">
                  Preview idle
                </p>
                <h2 className="text-lg font-medium text-[var(--color-neon-pink-soft)]">
                  Chart + mock-up await your birth data
                </h2>
                <p className="max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
                  Generate to unlock the Option A SVG, placement summaries, and the
                  interactive FRONT / BACK t-shirt stage.
                </p>
              </div>
            )}
            {loading && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3">
                <div className="animate-spin-slow h-10 w-10 rounded-full border-2 border-[var(--color-panel-border)] border-t-[var(--color-electric-blue)]" />
                <p className="text-sm text-[var(--color-electric-blue)]">
                  Resolving location & computing Swiss Ephemeris…
                </p>
              </div>
            )}
            {chart && (
              <div className="animate-fade-up space-y-8">
                <DesignPreview
                  chart={chart}
                  compact
                  style={chartStyle}
                  onStyleChange={setChartStyle}
                />
                <TShirtMockup
                  chart={chart}
                  printSide={printSide}
                  onPrintSideChange={setPrintSide}
                />
                <CheckoutPanel
                  chart={chart}
                  printSide={printSide}
                  onPrintSideChange={setPrintSide}
                  birth={birth}
                  productVariantId={productVariantId}
                />
              </div>
            )}
          </div>
        </section>

        {chart?.interpretations && chart.interpretations.length > 0 && (
          <PlacementSummaryTable rows={chart.interpretations} />
        )}

        <footer className="border-t border-[var(--color-panel-border)] pt-6 text-center text-xs text-[var(--color-muted)]">
          <a
            className="text-[var(--color-electric-blue)] hover:underline"
            href="https://www.cosmographic.store"
            target="_blank"
            rel="noreferrer"
          >
            www.cosmographic.store
          </a>
          {" · "}
          <a className="hover:underline" href="mailto:info@cosmographic.store">
            info@cosmographic.store
          </a>
        </footer>
      </main>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-6xl p-8 text-sm text-[var(--color-muted)]">Loading…</main>}>
      <HomePageInner />
    </Suspense>
  );
}
