/**
 * Classic technical print palette — textile-optimized
 * (vivid sign/planet colors, bold aspect red/blue/green, heavy black rings).
 */

export const printTheme = {
  bg: "#ffffff",
  ink: "#0d0d0d",
  inkSoft: "#222222",
  inkMuted: "#444444",
  ring: "#0a0a0a",
  tick: "#1a1a1a",
  acMc: "#0a0a0a",
  retrograde: "#c0392b",
  aspectHard: "#e74c3c",
  aspectSoft: "#2980b9",
  aspectNeutral: "#8e44ad",
} as const;

/** Planet colors matched to the Astrotheme reference wheel */
export const planetPrintColors: Record<string, string> = {
  sun: "#F2A007",
  moon: "#C9A227",
  mercury: "#8E44AD",
  venus: "#E86AA6",
  mars: "#E23B2E",
  jupiter: "#E8862D",
  saturn: "#A0522D",
  uranus: "#8B1A1A",
  neptune: "#0E9E97",
  pluto: "#9C2C13",
  true_node: "#555555",
  mean_node: "#555555",
  chiron: "#777777",
  lilith: "#444444",
};

/** Element scheme: fire red, earth olive, air teal, water blue (Astrotheme) */
export const signPrintColors: Record<string, string> = {
  Aries: "#E23B2E",
  Leo: "#E23B2E",
  Sagittarius: "#E23B2E",
  Taurus: "#8B8000",
  Virgo: "#8B8000",
  Capricorn: "#8B8000",
  Gemini: "#0E9E97",
  Libra: "#0E9E97",
  Aquarius: "#0E9E97",
  Cancer: "#1E6FD9",
  Scorpio: "#1E6FD9",
  Pisces: "#1E6FD9",
};

/** Astrotheme aspect convention: red = hard, blue = soft */
export const printAspectColors: Record<string, string> = {
  conjunction: "#3BA13B",
  opposition: "#E53935",
  square: "#E53935",
  trine: "#1E88E5",
  sextile: "#1E88E5",
};
