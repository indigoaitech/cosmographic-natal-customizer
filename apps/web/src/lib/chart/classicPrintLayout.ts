/**
 * Shared layout constants for classic print natal wheel
 * (client React preview + server SVG serializer stay in sync).
 *
 * Measured from Astrotheme reference (510×510 rings at 85 / 142 / 155),
 * scaled so the bold outer ring = 330 on a 1000 canvas.
 *
 * Stack: aspect → house-number band → zodiac → 1° ruler → outer → planets.
 */

export const CLASSIC_PRINT_R = {
  aspect: 181,
  houseNum: 190,
  houseOuter: 200,
  zodiacInner: 200,
  zodiacOuter: 302,
  tickInner: 302,
  tickOuter: 322,
  outer: 330,
  planetElbow: 352,
  planet: 392,
  planetAlt: 438,
  acMcLabel: 462,
} as const;

/** Glyph sizes matched to the Astrotheme reference. */
export const CLASSIC_PRINT_SIZES = {
  sign: 68,
  planet: 44,
  deg: 22,
  min: 15,
  house: 14,
  spreadGap: 15,
  signStroke: 9,
  planetStroke: 9,
  degreeLabelOffset: 42,
} as const;
