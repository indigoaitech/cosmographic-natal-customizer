/**
 * Shared layout constants for classic print natal wheel
 * (client React preview + server SVG serializer stay in sync).
 */

export const CLASSIC_PRINT_R = {
  aspect: 118,
  houseOuter: 192,
  houseNum: 155,
  zodiacInner: 192,
  zodiacOuter: 298,
  tickInner: 298,
  tickOuter: 320,
  outer: 328,
  planetElbow: 342,
  planet: 395,
  planetAlt: 438,
  acMcLabel: 462,
} as const;

export const CLASSIC_PRINT_SIZES = {
  sign: 54,
  planet: 38,
  deg: 13,
  min: 11,
  house: 16,
  spreadGap: 16,
  signStroke: 7.5,
  planetStroke: 8,
} as const;
