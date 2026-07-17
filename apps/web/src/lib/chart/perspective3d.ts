/**
 * 3D perspective tilt for Cosmographic natal wheel.
 * Local chart coords (origin at center) → projected SVG artboard coords.
 */

import { LOCAL_R, POD } from "@/lib/chart/pod";

export type Vec3 = { x: number; y: number; z: number };
export type Vec2 = { x: number; y: number; depth: number };

/** Fixed luxury cyberpunk camera — do not vary per chart (shell stays locked). */
export const GALACTIC_CAMERA = {
  /** Pitch toward viewer (degrees) */
  tiltXDeg: 28,
  /** Yaw for organic asymmetry (degrees) */
  tiltYDeg: -16,
  /** Roll micro-twist (degrees) */
  tiltZDeg: 4,
  /** Perspective focal length in local units */
  focal: 980,
  /** Extra Z lift so wheel sits in neon tunnel */
  zBias: 40,
} as const;

function degToRad(d: number): number {
  return (d * Math.PI) / 180;
}

function rotateX(v: Vec3, rad: number): Vec3 {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
}

function rotateY(v: Vec3, rad: number): Vec3 {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
}

function rotateZ(v: Vec3, rad: number): Vec3 {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c, z: v.z };
}

/** Scale local chart units → POD pixels (diameter = 85% of canvas height). */
export function localToPodScale(): number {
  return POD.chartDiameterPx / (LOCAL_R * 2);
}

/**
 * Project a point on the natal disc (polar radius in local units, z≈0 plane)
 * through the fixed Cosmographic camera onto the POD artboard.
 */
export function projectDiscPoint(
  localX: number,
  localY: number,
  localZ = 0,
): Vec2 {
  const cam = GALACTIC_CAMERA;
  let v: Vec3 = { x: localX, y: localY, z: localZ + cam.zBias };
  v = rotateZ(v, degToRad(cam.tiltZDeg));
  v = rotateX(v, degToRad(cam.tiltXDeg));
  v = rotateY(v, degToRad(cam.tiltYDeg));

  const w = cam.focal / (cam.focal + v.z);
  const scale = localToPodScale();
  return {
    x: POD.cx + v.x * w * scale,
    y: POD.cy + v.y * w * scale,
    depth: v.z,
  };
}

/** Flat polar → local cartesian (ASC-left convention), then 3D project. */
export function projectLon(
  lon: number,
  ascendant: number,
  radiusLocal: number,
  z = 0,
): Vec2 {
  const theta = ((ascendant - lon) * Math.PI) / 180;
  const lx = -radiusLocal * Math.cos(theta);
  const ly = radiusLocal * Math.sin(theta);
  return projectDiscPoint(lx, ly, z);
}

/** Sample a projected circle as a closed polygon (for neon rings). */
export function projectedRingPath(
  radiusLocal: number,
  segments = 96,
  z = 0,
): string {
  const pts: string[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const p = projectDiscPoint(
      radiusLocal * Math.cos(a),
      radiusLocal * Math.sin(a),
      z,
    );
    pts.push(`${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`);
  }
  return `${pts.join(" ")} Z`;
}

/**
 * Organic neon tube between two longitudes (quadratic bulge toward center).
 */
export function organicTubePath(
  lonA: number,
  lonB: number,
  ascendant: number,
  radiusLocal: number,
  bulge = 0.18,
  z = 0,
): string {
  const a = projectLon(lonA, ascendant, radiusLocal, z);
  const b = projectLon(lonB, ascendant, radiusLocal, z);
  const midLon = (() => {
    const d = ((lonB - lonA + 540) % 360) - 180;
    return (lonA + d / 2 + 360) % 360;
  })();
  const midR = radiusLocal * (1 - bulge);
  const c = projectLon(midLon, ascendant, midR, z + 12);
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} Q ${c.x.toFixed(2)} ${c.y.toFixed(2)} ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

/** Radial spoke from r0→r1 with slight S-curve for tube energy. */
export function organicSpokePath(
  lon: number,
  ascendant: number,
  r0: number,
  r1: number,
  z = 0,
): string {
  const a = projectLon(lon, ascendant, r0, z);
  const b = projectLon(lon, ascendant, r1, z);
  const mid = projectLon(lon, ascendant, (r0 + r1) / 2, z + 8);
  // Perpendicular nudge in screen space for organic feel
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const amp = len * 0.06;
  const cx = mid.x + nx * amp;
  const cy = mid.y + ny * amp;
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}
