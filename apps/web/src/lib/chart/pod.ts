/**
 * Printify DTG production canvas — fixed 15" × 19" @ 300 DPI.
 * Chart vertical dominance: core wheel diameter = 85% of canvas height.
 */

export const POD = {
  /** Physical print zone (inches) */
  widthIn: 15,
  heightIn: 19,
  dpi: 300,
  /** Pixel artboard */
  get widthPx() {
    return this.widthIn * this.dpi; // 4500
  },
  get heightPx() {
    return this.heightIn * this.dpi; // 5700
  },
  /**
   * Core circular chart diameter in px.
   * Spec: exactly 85% of vertical canvas. On a 15×19 portrait this
   * slightly exceeds width — we center and clip to the Printify zone
   * for an oversized streetwear focal print.
   */
  get chartDiameterPx() {
    return this.heightPx * 0.85; // 4845
  },
  get chartRadiusPx() {
    return this.chartDiameterPx / 2;
  },
  get cx() {
    return this.widthPx / 2;
  },
  get cy() {
    return this.heightPx / 2;
  },
} as const;

/**
 * Minimum stroke weights in artboard pixels for black-fabric DTG.
 * ~1.25–2 pt @ 300 DPI prevents neon bleed/fade (1 pt ≈ 4.17 px).
 */
export const DTG_STROKE = {
  /** Outer structural rings / neon tubes core */
  tubeCore: 7,
  /** Soft glow companion (drawn under core) */
  tubeGlow: 18,
  /** House / zodiac division tubes */
  division: 5.5,
  /** Aspect neon tubes */
  aspectCore: 6,
  aspectGlow: 16,
  /** Planetary glyph halo ring */
  glyphHalo: 4.5,
  /** Degree ticks */
  tick: 4,
  /** Angle rays (ASC/MC) */
  angleRay: 8,
  /** Structural matrix polyhedron edges */
  matrix: 5,
  /** Fluid energy underlay */
  energy: 4.5,
} as const;

/** Local chart coordinate radius before POD + 3D transforms */
export const LOCAL_R = 500;
