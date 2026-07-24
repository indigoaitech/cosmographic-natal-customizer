/**
 * Shared layout constants for classic print natal wheel
 * (client React preview + server SVG serializer stay in sync).
 *
 * Astrotheme reference proportions (outer bold ring = 330 in a 1000 canvas):
 *   aspect web r162 → house-number band 162–190 → zodiac band 190–289
 *   → 1° degree ruler 289–322 → bold outer ring 330 → exterior planets.
 */

export const CLASSIC_PRINT_R = {
  aspect: 162,
  houseNum: 176,
  houseOuter: 190,
  zodiacInner: 190,
  zodiacOuter: 289,
  tickInner: 289,
  tickOuter: 322,
  outer: 330,
  planetElbow: 348,
  planet: 375,
  planetAlt: 424,
  acMcLabel: 462,
} as const;

/** Glyph sizes matched to the reference (planets slightly smaller than signs). */
export const CLASSIC_PRINT_SIZES = {
  sign: 56,
  planet: 40,
  deg: 20,
  min: 15,
  house: 15,
  spreadGap: 16,
  signStroke: 8,
  planetStroke: 8.5,
  /** Radial offset from planet glyph center to degree label */
  degreeLabelOffset: 46,
} as const;
