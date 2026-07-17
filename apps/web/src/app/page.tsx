"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { ProductCatalog } from "@/components/catalog/ProductCatalog";
import { BackPlacementPrint } from "@/components/chart/BackPlacementPrint";
import { DesignPreview, type ChartStyle } from "@/components/chart/DesignPreview";
import { PlacementSummaryTable } from "@/components/chart/PlacementSummaryTable";
import { CheckoutPanel } from "@/components/checkout/CheckoutPanel";
import { PersonalizeProductsCTA } from "@/components/checkout/PersonalizeProductsCTA";
import { ProductShowcase } from "@/components/landing/ProductShowcase";
import {
  GarmentPreview,
  type GarmentKind,
  type PrintSide,
} from "@/components/mockup/GarmentPreview";
import { track } from "@/lib/analytics/track";
import type { ProductKind } from "@/lib/catalog/products";
import type { ChartPayload } from "@/lib/chart/types";
import {
  formatValidationError,
  validateBirthInput,
} from "@/lib/validation/birth";

type BirthFields = {
  dateOfBirth: string;
  timeOfBirth: string;
  city: string;
  country: string;
};

function productToGarment(kind: ProductKind): GarmentKind {
  if (kind === "hoodie" || kind === "crew") return kind;
  return "tee";
}

function HomePageInner() {
  const searchParams = useSearchParams();
  const productVariantId = searchParams.get("variant")?.trim() || undefined;
  const resumeSession = searchParams.get("session_id")?.trim() || undefined;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<string | null>(null);
  const [chart, setChart] = useState<ChartPayload | null>(null);
  const [crmNote, setCrmNote] = useState<string | null>(null);
  const [printSide, setPrintSide] = useState<PrintSide>("front");
  const [chartStyle, setChartStyle] = useState<ChartStyle>("print");
  const [productKind, setProductKind] = useState<ProductKind>("tee");
  const [showAdvancedCheckout, setShowAdvancedCheckout] = useState(false);
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
    setRecovery(null);
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

    const birthFields = { dateOfBirth, timeOfBirth, city, country };
    setBirth(birthFields);

    const clientErrors = validateBirthInput(birthFields);
    if (clientErrors.length) {
      setError(formatValidationError(clientErrors));
      setRecovery(clientErrors[0]?.recovery || null);
      setLoading(false);
      return;
    }

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
        throw Object.assign(
          new Error(
            typeof data.detail === "string"
              ? data.detail
              : "Chart calculation failed",
          ),
          { recovery: typeof data.recovery === "string" ? data.recovery : null },
        );
      }
      setChart(data as ChartPayload);
      track("chart_generate_succeeded");

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
      setRecovery(
        err && typeof err === "object" && "recovery" in err
          ? String((err as { recovery?: string }).recovery || "")
          : "Check birth city/country spelling and retry.",
      );
      track("chart_generate_failed");
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
              Cosmographic · Personalized POD Engine
            </p>
          </div>
          <h1 className="text-glow-blue max-w-3xl text-4xl font-semibold tracking-tight text-[var(--color-star)] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            Birth data → your sky → your products
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--color-muted)]">
            Validated birth details · Swiss Ephemeris · print-ready front wheel +
            back table @ 300 DPI · realistic garment preview · personalized
            Shopify catalog. Zero manual uploads.
          </p>
          {resumeSession && (
            <p className="font-mono text-[10px] text-[var(--color-electric-blue)]">
              Resuming session · {resumeSession}
            </p>
          )}
        </header>

        {!chart && <ProductShowcase />}

        <section
          id="birth-form"
          className="panel-glass grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,340px)_1fr]"
        >
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-neon-pink-soft)]">
                Step 01
              </p>
              <h2 className="mt-1 text-lg font-medium text-[var(--color-electric-blue)]">
                Birth details
              </h2>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Timezone is derived from birthplace via Swiss Ephemeris pipeline
                (Nominatim + timezonefinder).
              </p>
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
                updates. See{" "}
                <Link href="/privacy" className="text-[var(--color-electric-blue)] hover:underline">
                  Privacy
                </Link>
                .
              </span>
            </label>

            <button type="submit" disabled={loading} className="cg-btn-primary mt-1">
              {loading ? "Computing chart…" : "Generate natal chart"}
            </button>

            {error && (
              <div role="alert" className="space-y-1">
                <p className="text-sm text-[var(--color-neon-pink)]">{error}</p>
                {recovery && (
                  <p className="text-xs text-[var(--color-muted)]">{recovery}</p>
                )}
              </div>
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
                  TZ {chart.meta.timezone} · UTC {chart.meta.utc} · offset{" "}
                  {chart.meta.utcOffsetHours}h
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
                  Chart + apparel await your birth data
                </h2>
                <p className="max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
                  Generate to unlock natal wheel, back planet table, multi-product
                  previews, and one-click personalized catalog.
                </p>
              </div>
            )}
            {loading && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3">
                <div className="animate-spin-slow h-10 w-10 rounded-full border-2 border-[var(--color-panel-border)] border-t-[var(--color-electric-blue)]" />
                <p className="text-sm text-[var(--color-electric-blue)]">
                  Validating · geocoding · Swiss Ephemeris…
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
                <div className="sr-only" aria-hidden>
                  <BackPlacementPrint chart={chart} />
                </div>
                <ProductCatalog
                  selected={productKind}
                  onSelect={setProductKind}
                />
                <GarmentPreview
                  chart={chart}
                  printSide={printSide}
                  onPrintSideChange={setPrintSide}
                  garment={productToGarment(productKind)}
                  onGarmentChange={(g) => setProductKind(g)}
                />
                <PersonalizeProductsCTA chart={chart} birth={birth} />

                <div className="border-t border-[var(--color-panel-border)] pt-4">
                  <button
                    type="button"
                    className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)] hover:text-[var(--color-electric-blue)]"
                    onClick={() => setShowAdvancedCheckout((v) => !v)}
                  >
                    {showAdvancedCheckout ? "Hide" : "Show"} advanced single-variant checkout
                  </button>
                  {showAdvancedCheckout && (
                    <div className="mt-4">
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
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
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
