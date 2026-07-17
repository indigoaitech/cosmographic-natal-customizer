/**
 * Cosmographic apparel palette — matches reference PNG natal charts
 * (black ground, vivid element-coded signs & planets, red/blue/green aspects).
 */

export const cosmographicTheme = {
  bg: "#000000",
  ink: "#e8ecf0",
  muted: "#8b95a5",
  angle: "#9aa5b4",
  retrograde: "#e74c3c",
  aspectHard: "#e74c3c",
  aspectSoft: "#2471a3",
  aspectSextile: "#27ae60",
  aspectNeutral: "#7f8c8d",
  aspectMinor: "#9b59b6",
  aspectNode: "#27ae60",
} as const;

/** Zodiac glyphs — fire / earth / air / water */
export const signCosmoColors: Record<string, string> = {
  Aries: "#e74c3c",
  Taurus: "#c9a227",
  Gemini: "#5dade2",
  Cancer: "#2874a6",
  Leo: "#e74c3c",
  Virgo: "#9a8f3c",
  Libra: "#5dade2",
  Scorpio: "#1a5276",
  Sagittarius: "#e67e22",
  Capricorn: "#7d8c3a",
  Aquarius: "#3498db",
  Pisces: "#1a5276",
};

export const planetCosmoColors: Record<string, string> = {
  sun: "#e67e22",
  moon: "#f1c40f",
  mercury: "#8e44ad",
  venus: "#ff2d95",
  mars: "#e74c3c",
  jupiter: "#1ee0ff",
  saturn: "#c0392b",
  uranus: "#922b21",
  neptune: "#1abc9c",
  pluto: "#e74c3c",
  true_node: "#bdc3c7",
  mean_node: "#bdc3c7",
  chiron: "#95a5a6",
};

export const cosmoAspectColors: Record<string, string> = {
  conjunction: cosmographicTheme.aspectNeutral,
  opposition: cosmographicTheme.aspectHard,
  square: cosmographicTheme.aspectHard,
  trine: cosmographicTheme.aspectSoft,
  sextile: cosmographicTheme.aspectSextile,
};
