/**
 * Option A chart palette — mirrors CSS variables in globals.css
 * so SVG exports stay Illustrator-friendly with explicit hex fills/strokes.
 */
export const chartTheme = {
  void: "#030712",
  neonDarkBlue: "#0b1f4a",
  deepBlue: "#061428",
  electricBlue: "#1ee0ff",
  electricBlueDim: "#0ea5c6",
  neonPink: "#ff2d95",
  neonPinkSoft: "#ff6bb5",
  star: "#e8f4ff",
  muted: "#8ba3c7",
  ringStroke: "#1ee0ff",
  houseStroke: "#0ea5c6",
  cuspStroke: "rgba(30, 224, 255, 0.55)",
  signStroke: "rgba(232, 244, 255, 0.35)",
} as const;

export type ChartTheme = typeof chartTheme;

/** Aspect stroke colors for Option A */
export const aspectColors: Record<string, string> = {
  conjunction: chartTheme.electricBlue,
  opposition: chartTheme.neonPink,
  square: chartTheme.neonPink,
  trine: chartTheme.electricBlueDim,
  sextile: chartTheme.muted,
};

export const aspectStrokeWidths: Record<string, number> = {
  /** Legacy flat map — Cosmographic POD uses DTG_STROKE instead */
  conjunction: 6,
  opposition: 6,
  square: 6,
  trine: 5.5,
  sextile: 5,
};
