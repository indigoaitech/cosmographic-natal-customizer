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

export const planetPrintColors: Record<string, string> = {
  sun: "#d4a017",
  moon: "#a8b2c1",
  mercury: "#9b59b6",
  venus: "#ff2d95",
  mars: "#e74c3c",
  jupiter: "#16a085",
  saturn: "#c0392b",
  uranus: "#922b21",
  neptune: "#1abc9c",
  pluto: "#e91e63",
  true_node: "#7f8c8d",
  mean_node: "#7f8c8d",
  chiron: "#95a5a6",
  lilith: "#5d6d7e",
};

export const signPrintColors: Record<string, string> = {
  Aries: "#e74c3c",
  Taurus: "#c9a227",
  Gemini: "#3498db",
  Cancer: "#2980b9",
  Leo: "#e74c3c",
  Virgo: "#7d8c3a",
  Libra: "#3498db",
  Scorpio: "#1a5276",
  Sagittarius: "#e67e22",
  Capricorn: "#1e8449",
  Aquarius: "#2980b9",
  Pisces: "#1a5276",
};

/** High-contrast aspect colors for apparel print readability */
export const printAspectColors: Record<string, string> = {
  conjunction: "#8e44ad",
  opposition: "#e74c3c",
  square: "#e74c3c",
  trine: "#2980b9",
  sextile: "#27ae60",
};
