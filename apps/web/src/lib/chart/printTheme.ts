/**
 * Classic technical print palette — matches reference natal chart
 * (vivid sign/planet colors, red/blue aspects, bold black rings).
 */

export const printTheme = {
  bg: "#ffffff",
  ink: "#111111",
  inkSoft: "#333333",
  inkMuted: "#555555",
  ring: "#1a1a1a",
  tick: "#333333",
  acMc: "#111111",
  retrograde: "#c0392b",
  aspectHard: "#c0392b",
  aspectSoft: "#1a5276",
  aspectNeutral: "#5d6d7e",
} as const;

export const planetPrintColors: Record<string, string> = {
  sun: "#e67e22",
  moon: "#f1c40f",
  mercury: "#8e44ad",
  venus: "#ff2d95",
  mars: "#e74c3c",
  jupiter: "#1abc9c",
  saturn: "#c0392b",
  uranus: "#922b21",
  neptune: "#0e6655",
  pluto: "#e91e63",
  true_node: "#7f8c8d",
  mean_node: "#7f8c8d",
  chiron: "#95a5a6",
  lilith: "#5d6d7e",
};

export const signPrintColors: Record<string, string> = {
  Aries: "#e74c3c",
  Taurus: "#c9a227",
  Gemini: "#5dade2",
  Cancer: "#2874a6",
  Leo: "#e74c3c",
  Virgo: "#7d8c3a",
  Libra: "#5dade2",
  Scorpio: "#1a5276",
  Sagittarius: "#e67e22",
  Capricorn: "#1e8449",
  Aquarius: "#3498db",
  Pisces: "#1a5276",
};

export const printAspectColors: Record<string, string> = {
  conjunction: printTheme.aspectNeutral,
  opposition: printTheme.aspectHard,
  square: printTheme.aspectHard,
  trine: printTheme.aspectSoft,
  sextile: printTheme.aspectSoft,
};
