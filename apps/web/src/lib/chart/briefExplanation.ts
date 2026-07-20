import type { ChartPayload, InterpretationRow } from "@/lib/chart/types";

/**
 * Build a short reading from Swiss Ephemeris interpretations,
 * with a deterministic fallback from Sun / Moon / ASC when needed.
 */
export function buildBriefExplanation(chart: ChartPayload): {
  headline: string;
  paragraphs: string[];
  highlights: InterpretationRow[];
} {
  const sun = chart.planets.find((p) => p.id === "sun");
  const moon = chart.planets.find((p) => p.id === "moon");
  const risingSign = chart.houses.find((h) => h.house === 1)?.sign;

  const headline = [
    sun ? `Sun in ${sun.sign}` : null,
    moon ? `Moon in ${moon.sign}` : null,
    risingSign ? `Rising ${risingSign}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const fromApi = (chart.interpretations || []).filter(
    (r) => r.kind === "planet_sign" || r.kind === "house_sign",
  );

  const highlights = fromApi.slice(0, 6);

  const paragraphs: string[] = [];

  if (sun) {
    paragraphs.push(
      `Your Sun in ${sun.sign}${sun.house != null ? ` (house ${sun.house})` : ""} marks the core of identity and vitality in this chart.`,
    );
  }
  if (moon) {
    paragraphs.push(
      `The Moon in ${moon.sign}${moon.house != null ? ` (house ${moon.house})` : ""} describes emotional needs and instinctive responses.`,
    );
  }
  if (risingSign) {
    paragraphs.push(
      `With ${risingSign} rising, the Ascendant shapes first impressions and the lens through which you meet the world.`,
    );
  }

  const majorAspects = chart.aspects
    .filter((a) =>
      ["conjunction", "opposition", "trine", "square", "sextile"].includes(
        String(a.type),
      ),
    )
    .slice(0, 3);

  if (majorAspects.length) {
    const bits = majorAspects.map(
      (a) => `${titleCase(a.a)} ${a.type} ${titleCase(a.b)}`,
    );
    paragraphs.push(
      `Key aspects in this sky: ${bits.join("; ")}. These links color how planetary themes interact in your birth map.`,
    );
  }

  if (highlights.length) {
    // Prefer API summaries when present — replace generic openers with richer text
    const rich = highlights.slice(0, 3).map((h) => h.summary);
    if (rich.length >= 2) {
      return { headline, paragraphs: rich, highlights };
    }
  }

  return { headline, paragraphs, highlights };
}

function titleCase(id: string): string {
  if (!id) return id;
  return id.charAt(0).toUpperCase() + id.slice(1);
}
