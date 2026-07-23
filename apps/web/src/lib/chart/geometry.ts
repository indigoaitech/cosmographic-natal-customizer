/**
 * Western chart geometry: ASC fixed at left (9 o'clock), zodiac CCW.
 */

export const CHART_SIZE = 1000;
export const CHART_CX = CHART_SIZE / 2;
export const CHART_CY = CHART_SIZE / 2;

/** Concentric radii — center → out: aspect → houses → zodiac → ticks → planets */
export const RADII = {
  aspect: 155,
  houseOuter: 255,
  zodiacInner: 255,
  zodiacOuter: 375,
  outer: 405,
  planet: 445,
  angleLabel: 492,
} as const;

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function norm360(deg: number): number {
  const n = deg % 360;
  return n < 0 ? n + 360 : n;
}

/**
 * Ecliptic longitude → SVG point.
 * When lon === ascendant, point sits on the left (west).
 */
export function lonToPoint(
  lon: number,
  ascendant: number,
  radius: number,
  cx = CHART_CX,
  cy = CHART_CY,
): { x: number; y: number; theta: number } {
  const theta = degToRad(ascendant - lon);
  return {
    x: cx - radius * Math.cos(theta),
    y: cy + radius * Math.sin(theta),
    theta,
  };
}

export function polarLine(
  lon: number,
  ascendant: number,
  r0: number,
  r1: number,
  cx = CHART_CX,
  cy = CHART_CY,
): { x1: number; y1: number; x2: number; y2: number } {
  const a = lonToPoint(lon, ascendant, r0, cx, cy);
  const b = lonToPoint(lon, ascendant, r1, cx, cy);
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
}

/** Mid-longitude along the shorter arc (for sign glyph centers). */
export function midLongitude(a: number, b: number): number {
  const start = norm360(a);
  let span = norm360(b - a);
  if (span === 0) span = 30;
  return norm360(start + span / 2);
}

export type PlacedBody = {
  id: string;
  lon: number;
  displayLon: number;
};

/**
 * Fan overlapping bodies apart in longitude so glyphs sit side-by-side.
 * Uses more passes + slight outward bias so clusters open cleanly.
 */
export function spreadLongitudes(
  bodies: Array<{ id: string; lon: number }>,
  minGapDeg = 7,
): PlacedBody[] {
  const sorted = bodies
    .map((b) => ({ ...b, lon: norm360(b.lon) }))
    .sort((a, b) => a.lon - b.lon);

  if (sorted.length === 0) return [];

  const display = sorted.map((b) => b.lon);
  const n = display.length;
  const maxNeeded = minGapDeg * n;
  // Cap gap so a full circle can still hold every body
  const gap = maxNeeded > 350 ? 350 / n : minGapDeg;

  for (let pass = 0; pass < 14; pass++) {
    for (let i = 1; i < n; i++) {
      const d = norm360(display[i]! - display[i - 1]!);
      if (d < gap) {
        const push = (gap - d) / 2;
        display[i - 1] = norm360(display[i - 1]! - push);
        display[i] = norm360(display[i]! + push);
      }
    }
    const wrapGap = norm360(display[0]! + 360 - display[n - 1]!);
    if (wrapGap < gap) {
      const push = (gap - wrapGap) / 2;
      display[n - 1] = norm360(display[n - 1]! - push);
      display[0] = norm360(display[0]! + push);
    }
  }

  // Keep display order matching sorted longitude order after nudges
  for (let i = 1; i < n; i++) {
    if (norm360(display[i]! - display[i - 1]!) > 180) {
      // rare wrap inversion — leave as-is; leader lines still point to true lon
    }
  }

  return sorted.map((b, i) => ({
    id: b.id,
    lon: b.lon,
    displayLon: display[i]!,
  }));
}
