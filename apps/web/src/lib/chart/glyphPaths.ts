/**
 * High-resolution SVG path glyphs for natal charts (viewBox 0 0 100 100).
 * Stroke-based classic astrology symbols — sharp at any print scale.
 */

export type GlyphDef = {
  /** SVG path `d` attributes drawn with stroke (and optional fill) */
  paths: string[];
  /** Prefer stroke rendering (default true) */
  stroke?: boolean;
  /** Optional filled circles / discs */
  circles?: Array<{ cx: number; cy: number; r: number; fill?: boolean }>;
  /** Optional extra lines as [x1,y1,x2,y2] */
  lines?: Array<[number, number, number, number]>;
};

/** Zodiac — bold, recognizable, textile-friendly */
export const SIGN_PATHS: Record<string, GlyphDef> = {
  Aries: {
    paths: [
      "M22 78 C22 42 38 22 50 22 C62 22 78 42 78 78",
      "M22 78 C28 58 38 48 50 48 C62 48 72 58 78 78",
    ],
  },
  Taurus: {
    paths: ["M28 38 C28 22 72 22 72 38"],
    circles: [{ cx: 50, cy: 62, r: 22 }],
  },
  Gemini: {
    paths: [],
    lines: [
      [32, 18, 32, 82],
      [68, 18, 68, 82],
      [26, 22, 74, 22],
      [26, 78, 74, 78],
    ],
  },
  Cancer: {
    paths: [
      "M30 44 C30 30 42 26 50 38 C58 26 70 30 70 44 C70 56 60 64 50 64 C40 64 30 56 30 44",
      "M30 56 C30 70 42 74 50 62 C58 74 70 70 70 56",
    ],
  },
  Leo: {
    paths: [
      "M38 70 C28 70 24 58 32 50 C40 42 48 48 52 40 C58 28 72 32 72 46 C72 62 58 72 46 72",
    ],
    circles: [{ cx: 36, cy: 72, r: 10 }],
  },
  Virgo: {
    paths: [
      "M22 20 L22 70 C22 82 34 86 42 78",
      "M38 20 L38 70 C38 82 50 86 58 78",
      "M54 20 L54 62 C54 78 70 82 78 68 L78 78",
    ],
  },
  Libra: {
    paths: [],
    lines: [
      [20, 62, 80, 62],
      [20, 78, 80, 78],
    ],
    circles: [{ cx: 50, cy: 40, r: 18 }],
  },
  Scorpio: {
    paths: [
      "M22 20 L22 70 C22 82 34 86 42 78",
      "M38 20 L38 70 C38 82 50 86 58 78",
      "M54 20 L54 62 C54 74 66 74 72 64 L78 72 L72 78 L78 72 L84 66",
    ],
  },
  Sagittarius: {
    paths: [],
    lines: [
      [28, 72, 72, 28],
      [52, 28, 72, 28],
      [72, 28, 72, 48],
      [38, 48, 58, 68],
    ],
  },
  Capricorn: {
    paths: [
      "M22 28 L22 58 C22 78 42 82 52 68 C60 56 70 58 74 68",
      "M22 28 C34 18 48 22 52 36 L52 58",
    ],
    circles: [{ cx: 74, cy: 74, r: 9 }],
  },
  Aquarius: {
    paths: [
      "M18 40 C28 28 38 52 48 40 C58 28 68 52 82 40",
      "M18 62 C28 50 38 74 48 62 C58 50 68 74 82 62",
    ],
  },
  Pisces: {
    paths: [
      "M28 22 C18 40 18 60 28 78",
      "M72 22 C82 40 82 60 72 78",
    ],
    lines: [[22, 50, 78, 50]],
  },
};

/** Planets — classic astronomy glyphs */
export const PLANET_PATHS: Record<string, GlyphDef> = {
  sun: {
    paths: [],
    circles: [
      { cx: 50, cy: 50, r: 28 },
      { cx: 50, cy: 50, r: 8, fill: true },
    ],
  },
  moon: {
    paths: [
      "M64 18 C36 22 22 44 22 60 C22 82 42 94 66 86 C50 88 36 72 36 54 C36 36 50 22 64 18 Z",
    ],
  },
  mercury: {
    paths: [
      "M50 38 L50 78",
      "M36 64 L64 64",
      "M36 22 C36 12 64 12 64 22 C64 34 50 38 50 38 C50 38 36 34 36 22",
    ],
    circles: [{ cx: 50, cy: 50, r: 14 }],
  },
  venus: {
    paths: ["M50 58 L50 86", "M36 72 L64 72"],
    circles: [{ cx: 50, cy: 38, r: 20 }],
  },
  mars: {
    paths: ["M58 42 L78 22", "M60 22 L78 22", "M78 22 L78 40"],
    circles: [{ cx: 44, cy: 58, r: 22 }],
  },
  jupiter: {
    paths: [
      "M32 28 L68 28",
      "M50 18 L50 82",
      "M28 48 C28 28 52 22 62 36 C70 48 58 62 42 62",
    ],
  },
  saturn: {
    paths: [
      "M36 28 L64 28",
      "M50 18 L50 55",
      "M32 55 C32 78 68 78 68 55",
      "M50 78 L50 88",
    ],
  },
  uranus: {
    paths: [
      "M50 22 L50 78",
      "M28 38 L28 58",
      "M72 38 L72 58",
      "M28 48 L42 48",
      "M58 48 L72 48",
    ],
    circles: [{ cx: 50, cy: 82, r: 8, fill: true }],
  },
  neptune: {
    paths: [
      "M50 18 L50 82",
      "M32 28 C32 48 50 52 50 52 C50 52 68 48 68 28",
      "M36 70 L64 70",
    ],
  },
  pluto: {
    paths: [
      "M50 48 L50 86",
      "M36 70 L64 70",
      "M34 22 C34 12 66 12 66 22 C66 36 50 40 50 40 C50 40 34 36 34 22",
    ],
    circles: [{ cx: 50, cy: 48, r: 10 }],
  },
  true_node: {
    paths: [
      "M22 62 C22 38 40 28 50 28 C60 28 78 38 78 62",
      "M22 62 L14 54 M22 62 L30 54",
      "M78 62 L70 54 M78 62 L86 54",
    ],
    circles: [
      { cx: 28, cy: 68, r: 8 },
      { cx: 72, cy: 68, r: 8 },
    ],
  },
  mean_node: {
    paths: [
      "M22 62 C22 38 40 28 50 28 C60 28 78 38 78 62",
      "M22 62 L14 54 M22 62 L30 54",
      "M78 62 L70 54 M78 62 L86 54",
    ],
    circles: [
      { cx: 28, cy: 68, r: 8 },
      { cx: 72, cy: 68, r: 8 },
    ],
  },
  chiron: {
    paths: [
      "M50 18 L50 82",
      "M36 48 L64 48",
      "M36 32 L50 48 L64 32",
    ],
  },
  lilith: {
    paths: [
      "M50 20 L50 55",
      "M36 32 C36 20 64 20 64 32 C64 44 50 48 50 48",
    ],
    circles: [{ cx: 50, cy: 72, r: 14 }],
  },
};
