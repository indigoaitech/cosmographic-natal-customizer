"use client";

import { buildBriefExplanation } from "@/lib/chart/briefExplanation";
import type { ChartPayload } from "@/lib/chart/types";

type ChartExplanationProps = {
  chart: ChartPayload;
};

export function ChartExplanation({ chart }: ChartExplanationProps) {
  const { headline, paragraphs, highlights } = buildBriefExplanation(chart);

  return (
    <section className="panel animate-fade-up p-6 sm:p-8" aria-labelledby="reading-title">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-cyan)]">
        Brief reading
      </p>
      <h2
        id="reading-title"
        className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-star)] sm:text-2xl"
      >
        {headline || "Your birth map"}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        From Swiss Ephemeris positions · {chart.meta.placeLabel}
      </p>

      <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-[var(--color-star)]/90">
        {paragraphs.map((p, i) => (
          <p key={`${i}-${p.slice(0, 32)}`}>{p}</p>
        ))}
      </div>

      {highlights.length > paragraphs.length && (
        <ul className="mt-6 space-y-3 border-t border-[var(--color-panel-border)] pt-5">
          {highlights.slice(paragraphs.length).map((row) => (
            <li key={row.key}>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-gold-soft)]">
                {row.label}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">
                {row.summary}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
