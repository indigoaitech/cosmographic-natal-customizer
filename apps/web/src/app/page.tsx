"use client";

import Image from "next/image";
import { FormEvent, useCallback, useState } from "react";

import { ChartExplanation } from "@/components/chart/ChartExplanation";
import { ClassicPrintNatalChart } from "@/components/chart/ClassicPrintNatalChart";
import type { ChartPayload } from "@/lib/chart/types";
import {
  formatValidationError,
  normalizeBirthTime,
  validateBirthInput,
} from "@/lib/validation/birth";

const PRINT_SVG_ID = "classic-print-natal-chart";

function downloadBlob(payload: string, filename: string) {
  const blob = new Blob([payload], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Fallback: clone client SVG if SSR endpoint fails. */
function downloadClientSvg(filename: string) {
  const el = document.getElementById(PRINT_SVG_ID);
  if (!el) return;
  const clone = el.cloneNode(true) as SVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  downloadBlob(
    `<?xml version="1.0" encoding="UTF-8"?>\n${clone.outerHTML}`,
    filename,
  );
}

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chart, setChart] = useState<ChartPayload | null>(null);
  const [downloading, setDownloading] = useState(false);

  const onDownload = useCallback(async () => {
    if (!chart) return;
    const stamp = chart.meta.utc.replace(/[:.]/g, "-");
    const filename = `cosmographi-birth-map-${stamp}.svg`;
    setDownloading(true);
    try {
      // Server-side SVG (print-ready) — Astrotheme-style SSR
      const res = await fetch("/api/chart/svg?print=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chart }),
      });
      if (!res.ok) throw new Error("SVG render failed");
      const svg = await res.text();
      if (!svg.includes("<svg")) throw new Error("Invalid SVG");
      downloadBlob(svg, filename);
    } catch {
      downloadClientSvg(filename);
    } finally {
      setDownloading(false);
    }
  }, [chart]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setChart(null);

    const fd = new FormData(e.currentTarget);
    const dateOfBirth = String(fd.get("dateOfBirth") || "");
    const timeRaw = String(fd.get("timeOfBirth") || "");
    const city = String(fd.get("city") || "").trim();
    const country = String(fd.get("country") || "").trim();
    const timeOfBirth = normalizeBirthTime(timeRaw);

    const fieldErrors = validateBirthInput({
      dateOfBirth,
      timeOfBirth,
      city,
      country,
    });
    if (fieldErrors.length) {
      setError(formatValidationError(fieldErrors));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateOfBirth,
          timeOfBirth,
          location: { city, country },
          houseSystem: "P",
        }),
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <header className="mb-10 flex flex-col items-center text-center">
        <Image
          src="/brand/cosmographi-logo.png"
          alt="Cosmographi — Cosmic Cartography & Data Design"
          width={420}
          height={280}
          priority
          className="h-auto w-full max-w-[280px] sm:max-w-[340px]"
        />
        <h1 className="sr-only">Cosmographi Birth Map Generator</h1>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
          Enter birth date, time, and place. We compute your sky with Swiss
          Ephemeris and render one classic, print-ready birth map.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start">
        <form
          id="birth-form"
          onSubmit={onSubmit}
          className="panel animate-fade-up space-y-4 p-5 sm:p-6"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-gold-soft)]">
              Birth data
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-cyan)]">
              Generate your map
            </h2>
          </div>

          <div>
            <label className="cg-label" htmlFor="dateOfBirth">
              Date of birth
            </label>
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              required
              className="cg-input"
            />
          </div>

          <div>
            <label className="cg-label" htmlFor="timeOfBirth">
              Time of birth
            </label>
            <input
              id="timeOfBirth"
              name="timeOfBirth"
              type="time"
              step={60}
              required
              className="cg-input"
            />
            <p className="mt-1 text-[11px] text-[var(--color-muted)]">
              Hours and minutes only
            </p>
          </div>

          <div>
            <label className="cg-label" htmlFor="city">
              City
            </label>
            <input
              id="city"
              name="city"
              type="text"
              required
              placeholder="Athens"
              autoComplete="address-level2"
              className="cg-input"
            />
          </div>

          <div>
            <label className="cg-label" htmlFor="country">
              Country
            </label>
            <input
              id="country"
              name="country"
              type="text"
              required
              placeholder="Greece"
              autoComplete="country-name"
              className="cg-input"
            />
          </div>

          <button type="submit" className="cg-btn-primary" disabled={loading}>
            {loading ? "Computing…" : "Generate"}
          </button>

          {error && (
            <p
              role="alert"
              className="rounded-[var(--radius-sm)] border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
            >
              {error}
            </p>
          )}

          {chart && (
            <p className="font-mono text-[10px] leading-relaxed text-[var(--color-cyan-dim)]">
              {chart.meta.placeLabel}
              <br />
              TZ {chart.meta.timezone} · UTC {chart.meta.utc}
              <br />
              ASC {chart.angles.asc.toFixed(2)}° · MC{" "}
              {chart.angles.mc.toFixed(2)}° · {chart.aspects.length} aspects
            </p>
          )}
        </form>

        <div className="space-y-6">
          {!chart && !loading && (
            <div className="panel flex min-h-[320px] items-center justify-center border-dashed p-8 text-center">
              <p className="max-w-xs text-sm text-[var(--color-muted)]">
                Your classic birth map will appear here — one print-ready chart,
                no extra styles.
              </p>
            </div>
          )}

          {loading && (
            <div className="panel flex min-h-[320px] items-center justify-center p-8">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)]">
                Geocoding · Swiss Ephemeris…
              </p>
            </div>
          )}

          {chart && (
            <>
              <section className="panel animate-fade-up overflow-hidden p-4 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-gold-soft)]">
                      Birth map
                    </p>
                    <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-star)]">
                      Classic natal chart
                    </h2>
                    <p className="text-xs text-[var(--color-muted)]">
                      Print-ready SVG · Swiss Ephemeris
                    </p>
                  </div>
                  <button
                    type="button"
                    className="cg-btn-ghost"
                    onClick={() => void onDownload()}
                    disabled={downloading}
                  >
                    {downloading ? "Preparing SVG…" : "Download SVG"}
                  </button>
                </div>

                <div className="mx-auto w-full max-w-[640px] overflow-hidden rounded-[var(--radius-md)] bg-white shadow-[0_0_40px_rgba(0,242,255,0.08)]">
                  <ClassicPrintNatalChart
                    chart={chart}
                    svgId={PRINT_SVG_ID}
                    className="h-auto w-full"
                  />
                </div>
              </section>

              <ChartExplanation chart={chart} />
            </>
          )}
        </div>
      </div>

      <footer className="mt-14 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted)]">
        Cosmographi · Cosmic Cartography &amp; Data Design
      </footer>
    </main>
  );
}
