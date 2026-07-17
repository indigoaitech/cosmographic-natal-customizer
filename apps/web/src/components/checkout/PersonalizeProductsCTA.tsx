"use client";

import { useCallback, useState } from "react";

import { BACK_PRINT_SVG_ID } from "@/components/chart/BackPlacementPrint";
import { PRINT_SVG_ID } from "@/components/chart/DesignPreview";
import type { ChartPayload } from "@/lib/chart/types";

type BirthFields = {
  dateOfBirth: string;
  timeOfBirth: string;
  city: string;
  country: string;
};

type PersonalizeProductsCTAProps = {
  chart: ChartPayload;
  birth: BirthFields;
};

function serializeSvgById(id: string): string | null {
  const el = document.getElementById(id);
  if (!el) return null;
  const clone = el.cloneNode(true) as SVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return `<?xml version="1.0" encoding="UTF-8"?>\n${clone.outerHTML}`;
}

/**
 * Primary commerce CTA: persist front+back print assets under a session UUID,
 * then redirect to the Shopify personalized collection.
 */
export function PersonalizeProductsCTA({
  chart,
  birth,
}: PersonalizeProductsCTAProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const chartSummary = [
    chart.meta.placeLabel.split(",")[0],
    `ASC ${chart.angles.asc.toFixed(1)}°`,
    `MC ${chart.angles.mc.toFixed(1)}°`,
    birth.dateOfBirth,
  ]
    .filter(Boolean)
    .join(" · ");

  const onCreate = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const frontSvg = serializeSvgById(PRINT_SVG_ID);
      const backSvg = serializeSvgById(BACK_PRINT_SVG_ID);
      if (!frontSvg) {
        throw new Error("Front natal chart SVG not ready — wait for preview.");
      }
      if (!backSvg) {
        throw new Error("Back planet table SVG not ready — wait for preview.");
      }

      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frontSvg,
          backSvg,
          chartSummary,
          birth,
          chart,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const recovery =
          typeof data.recovery === "string" ? ` ${data.recovery}` : "";
        throw new Error(
          `${data.detail || "Could not create personalization session"}${recovery}`,
        );
      }

      setSessionId(data.sessionId as string);
      const catalogUrl = data.catalogUrl as string;
      window.location.href = catalogUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Personalization failed");
      setBusy(false);
    }
  }, [birth, chart, chartSummary]);

  return (
    <section className="panel-glass space-y-4 border-[var(--color-electric-blue)]/40 p-5 sm:p-7">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-neon-pink-soft)]">
          Personalized catalog
        </p>
        <h3 className="mt-1 text-xl font-medium text-[var(--color-star)] sm:text-2xl">
          Create My Personalized Products
        </h3>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--color-muted)]">
          We save your print-ready front wheel and back planet table, then open
          the Cosmographic Shopify catalog with your chart applied to every
          compatible product — no manual uploads.
        </p>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={onCreate}
        className="cg-btn-primary w-full py-4 text-base sm:text-lg"
      >
        {busy
          ? "Preparing your personalized catalog…"
          : "Create My Personalized Products"}
      </button>

      {sessionId && (
        <p className="font-mono text-[10px] text-[var(--color-muted)]">
          session_id ·{" "}
          <span className="text-[var(--color-electric-blue)]">{sessionId}</span>
        </p>
      )}

      {error && (
        <p className="text-sm text-[var(--color-neon-pink)]" role="alert">
          {error}
        </p>
      )}

      <ul className="grid gap-1 font-mono text-[10px] text-[var(--color-muted)] sm:grid-cols-2">
        <li>Front · natal chart wheel SVG</li>
        <li>Back · logo + planet table + aspect grid</li>
        <li>Handoff · ?session_id=UUID</li>
        <li>Line items · _print_front_url / _print_back_url</li>
      </ul>
    </section>
  );
}
