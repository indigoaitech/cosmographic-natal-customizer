/**
 * Server-side classic natal SVG serializer.
 *
 * Ephemeris JSON (longitudes) → polar coordinates → complete SVG document.
 * Matches Astrotheme-style SSR: deliver `image/svg+xml`, not client-only drawing.
 */

import {
  CLASSIC_PRINT_R as R,
  CLASSIC_PRINT_SIZES as S,
} from "@/lib/chart/classicPrintLayout";
import {
  CHART_CX,
  CHART_CY,
  CHART_SIZE,
  lonToPoint,
  midLongitude,
  norm360,
  polarLine,
  spreadLongitudes,
} from "@/lib/chart/geometry";
import {
  PLANET_PATHS,
  SIGN_PATHS,
  type GlyphDef,
} from "@/lib/chart/glyphPaths";
import { SIGN_ORDER } from "@/lib/chart/glyphs";
import {
  planetPrintColors,
  printAspectColors,
  printTheme,
  signPrintColors,
} from "@/lib/chart/printTheme";
import type { ChartPayload } from "@/lib/chart/types";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatDms(signDegree: number): { deg: string; min: string } {
  const d = Math.floor(signDegree);
  const m = Math.floor((signDegree - d) * 60);
  return { deg: `${d}°`, min: `${String(m).padStart(2, "0")}'` };
}

function lonGap(a: number, b: number): number {
  const d = Math.abs(norm360(a) - norm360(b));
  return d > 180 ? 360 - d : d;
}

function isMajorAspect(type: string): boolean {
  return ["conjunction", "opposition", "trine", "square", "sextile"].includes(
    type,
  );
}

function glyphMarkup(
  def: GlyphDef,
  x: number,
  y: number,
  size: number,
  color: string,
  strokeWidth: number,
  id: string,
): string {
  const half = size / 2;
  const parts: string[] = [
    `<g data-glyph="${esc(id)}" transform="translate(${x},${y})">`,
    `<svg x="${-half}" y="${-half}" width="${size}" height="${size}" viewBox="0 0 100 100" overflow="visible">`,
  ];

  for (const d of def.paths) {
    const closed = /\bZ\s*$/i.test(d.trim());
    parts.push(
      `<path d="${esc(d)}" fill="${closed ? color : "none"}" stroke="${color}" stroke-width="${closed ? strokeWidth * 0.35 : strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`,
    );
  }
  for (const [x1, y1, x2, y2] of def.lines ?? []) {
    parts.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/>`,
    );
  }
  for (const c of def.circles ?? []) {
    parts.push(
      `<circle cx="${c.cx}" cy="${c.cy}" r="${c.r}" fill="${c.fill ? color : "none"}" stroke="${color}" stroke-width="${strokeWidth}"/>`,
    );
  }

  parts.push("</svg></g>");
  return parts.join("");
}

function angleArrow(lon: number, asc: number): string {
  const tip = lonToPoint(lon, asc, R.outer + 6);
  const angle = Math.atan2(tip.y - CHART_CY, tip.x - CHART_CX);
  const ah = 11;
  const left = {
    x: tip.x - ah * Math.cos(angle - 0.5),
    y: tip.y - ah * Math.sin(angle - 0.5),
  };
  const right = {
    x: tip.x - ah * Math.cos(angle + 0.5),
    y: tip.y - ah * Math.sin(angle + 0.5),
  };
  return `<polygon points="${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}" fill="${printTheme.acMc}"/>`;
}

function angleMarker(
  lon: number,
  asc: number,
  label: string,
  kind: "asc" | "mc",
): string {
  const tip = lonToPoint(lon, asc, R.outer + 10);
  const base = lonToPoint(lon, asc, R.aspect);
  const labelPt = lonToPoint(lon, asc, R.acMcLabel);
  const angle = Math.atan2(tip.y - CHART_CY, tip.x - CHART_CX);
  const ah = 13;
  const left = {
    x: tip.x - ah * Math.cos(angle - 0.42),
    y: tip.y - ah * Math.sin(angle - 0.42),
  };
  const right = {
    x: tip.x - ah * Math.cos(angle + 0.42),
    y: tip.y - ah * Math.sin(angle + 0.42),
  };

  let labelSvg: string;
  if (kind === "mc") {
    labelSvg = [
      `<circle cx="${labelPt.x}" cy="${labelPt.y}" r="17" fill="${printTheme.bg}" stroke="${printTheme.acMc}" stroke-width="2.2"/>`,
      `<text x="${labelPt.x}" y="${labelPt.y}" text-anchor="middle" dominant-baseline="central" font-size="13" font-weight="800" fill="${printTheme.acMc}" font-family="ui-sans-serif,system-ui,sans-serif">MC</text>`,
    ].join("");
  } else {
    labelSvg = `<text x="${labelPt.x}" y="${labelPt.y}" text-anchor="middle" dominant-baseline="central" font-size="16" font-weight="800" fill="${printTheme.acMc}" font-family="ui-sans-serif,system-ui,sans-serif">${esc(label)}</text>`;
  }

  return [
    `<g data-angle="${esc(label)}">`,
    `<line x1="${base.x}" y1="${base.y}" x2="${tip.x}" y2="${tip.y}" stroke="${printTheme.acMc}" stroke-width="3.4"/>`,
    `<polygon points="${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}" fill="${printTheme.acMc}"/>`,
    labelSvg,
    `</g>`,
  ].join("");
}

/**
 * Build a complete natal-wheel SVG from Swiss Ephemeris chart JSON.
 */
export function renderClassicNatalSvg(chart: ChartPayload): string {
  const asc = chart.angles.asc;
  const mc = chart.angles.mc;
  const dsc = chart.angles.dsc;
  const ic = chart.angles.ic;

  const placed = spreadLongitudes(
    chart.planets.map((p) => ({ id: p.id, lon: p.lon })),
    S.spreadGap,
  );
  const byId = new Map(chart.planets.map((p) => [p.id, p]));
  const lonById = new Map(chart.planets.map((p) => [p.id, p.lon]));

  const sorted = [...placed].sort(
    (a, b) => norm360(a.displayLon) - norm360(b.displayLon),
  );
  const planetRadii = new Map<string, number>();
  sorted.forEach((pl, i) => {
    planetRadii.set(pl.id, i % 2 === 0 ? R.planet : R.planetAlt);
  });

  const majorAspects = chart.aspects.filter((a) =>
    isMajorAspect(String(a.type)),
  );

  const layers: string[] = [];

  layers.push(
    `<rect x="0" y="0" width="${CHART_SIZE}" height="${CHART_SIZE}" fill="${printTheme.bg}"/>`,
  );

  // Rings (Astrotheme): aspect → house band → zodiac → ruler → bold outer
  layers.push(`<g id="layer-rings" fill="none" stroke="${printTheme.ring}">`);
  layers.push(
    `<circle cx="${CHART_CX}" cy="${CHART_CY}" r="${R.aspect}" stroke-width="2"/>`,
  );
  layers.push(
    `<circle cx="${CHART_CX}" cy="${CHART_CY}" r="${R.zodiacInner}" stroke-width="1.2"/>`,
  );
  layers.push(
    `<circle cx="${CHART_CX}" cy="${CHART_CY}" r="${R.zodiacOuter}" stroke-width="1.2"/>`,
  );
  layers.push(
    `<circle cx="${CHART_CX}" cy="${CHART_CY}" r="${R.tickOuter}" stroke-width="1.2"/>`,
  );
  layers.push(
    `<circle cx="${CHART_CX}" cy="${CHART_CY}" r="${R.outer}" stroke-width="3"/>`,
  );
  layers.push(`</g>`);

  // Aspects
  layers.push(`<g id="layer-aspects" fill="none" stroke-linecap="round">`);
  for (let i = 0; i < majorAspects.length; i++) {
    const asp = majorAspects[i];
    const aLon = lonById.get(asp.a);
    const bLon = lonById.get(asp.b);
    if (aLon === undefined || bLon === undefined) continue;
    const a = lonToPoint(aLon, asc, R.aspect);
    const b = lonToPoint(bLon, asc, R.aspect);
    const hard = asp.type === "square" || asp.type === "opposition";
    const soft = asp.type === "trine" || asp.type === "sextile";
    const color =
      printAspectColors[String(asp.type)] ?? printTheme.aspectNeutral;
    const sw = hard ? 2.6 : soft ? 2.3 : 2;
    layers.push(
      `<line class="aspect-${esc(String(asp.type))}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${color}" stroke-width="${sw}" opacity="0.95"/>`,
    );
  }
  layers.push(`</g>`);

  // House cusps + small numbers in the narrow band (Astrotheme format)
  layers.push(`<g id="layer-houses">`);
  for (const h of chart.houses) {
    const isAngle = h.house === 1 || h.house === 4 || h.house === 7 || h.house === 10;
    const spoke = polarLine(h.cusp, asc, R.aspect, R.zodiacOuter);
    const next = chart.houses.find((x) => x.house === (h.house % 12) + 1);
    const nextCusp = next ? next.cusp : norm360(h.cusp + 30);
    const numLon = midLongitude(h.cusp, nextCusp);
    const num = lonToPoint(numLon, asc, R.houseNum);
    layers.push(
      `<line x1="${spoke.x1}" y1="${spoke.y1}" x2="${spoke.x2}" y2="${spoke.y2}" stroke="${printTheme.ring}" stroke-width="${isAngle ? 2.4 : 1.1}"/>`,
    );
    layers.push(
      `<text x="${num.x}" y="${num.y}" text-anchor="middle" dominant-baseline="central" font-size="${S.house}" fill="${printTheme.inkSoft}" font-family="ui-sans-serif,system-ui,sans-serif" font-weight="700">${h.house}</text>`,
    );
  }
  layers.push(`</g>`);

  // Zodiac
  layers.push(`<g id="layer-zodiac">`);
  SIGN_ORDER.forEach((sign, i) => {
    const start = i * 30;
    const mid = midLongitude(start, start + 30);
    const div = polarLine(start, asc, R.zodiacInner, R.zodiacOuter);
    const g = lonToPoint(mid, asc, (R.zodiacInner + R.zodiacOuter) / 2);
    const color = signPrintColors[sign] ?? printTheme.ink;
    const def = SIGN_PATHS[sign];
    layers.push(
      `<line x1="${div.x1}" y1="${div.y1}" x2="${div.x2}" y2="${div.y2}" stroke="${printTheme.ring}" stroke-width="2"/>`,
    );
    if (def) {
      layers.push(
        glyphMarkup(def, g.x, g.y, S.sign, color, S.signStroke, sign),
      );
    }
  });
  layers.push(`</g>`);

  // Degree ticks
  layers.push(`<g id="layer-ticks" stroke="${printTheme.tick}">`);
  for (let d = 0; d < 360; d++) {
    const major = d % 10 === 0;
    const medium = d % 5 === 0 && !major;
    const inset = major ? 14 : medium ? 9 : 5;
    const line = polarLine(d, asc, R.tickOuter - inset, R.tickOuter);
    layers.push(
      `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke-width="${major ? 1.6 : medium ? 1.1 : 0.55}" opacity="${major ? 1 : medium ? 0.8 : 0.55}"/>`,
    );
  }
  layers.push(`</g>`);

  // Angle spokes
  layers.push(`<g id="layer-angle-spokes" stroke="${printTheme.ring}">`);
  for (const houseNum of [1, 4, 7, 10]) {
    const h = chart.houses.find((x) => x.house === houseNum);
    if (!h) continue;
    const spoke = polarLine(h.cusp, asc, R.houseOuter, R.outer);
    layers.push(
      `<line x1="${spoke.x1}" y1="${spoke.y1}" x2="${spoke.x2}" y2="${spoke.y2}" stroke-width="3"/>`,
    );
  }
  layers.push(`</g>`);

  // Exterior planets
  layers.push(`<g id="layer-planets">`);
  for (const pl of placed) {
    const p = byId.get(pl.id);
    if (!p) continue;
    const color = planetPrintColors[p.id] ?? printTheme.ink;
    const displayR = planetRadii.get(pl.id) ?? R.planet;
    const anchor = lonToPoint(p.lon, asc, R.tickOuter);
    const glyph = lonToPoint(pl.displayLon, asc, displayR);
    const gap = lonGap(p.lon, pl.displayLon);
    const useElbow = gap > 1.5 && gap < 358;
    const elbow = lonToPoint(pl.displayLon, asc, R.planetElbow);
    const { deg, min } = formatDms(p.signDegree);
    const leader = useElbow
      ? `${anchor.x},${anchor.y} ${elbow.x},${elbow.y} ${glyph.x},${glyph.y}`
      : `${anchor.x},${anchor.y} ${glyph.x},${glyph.y}`;

    const vx = glyph.x - CHART_CX;
    const vy = glyph.y - CHART_CY;
    const len = Math.hypot(vx, vy) || 1;
    const lx = glyph.x + (vx / len) * S.degreeLabelOffset;
    const ly = glyph.y + (vy / len) * S.degreeLabelOffset;

    const def =
      PLANET_PATHS[p.id] ?? PLANET_PATHS[p.id.replace("mean_", "true_")];

    layers.push(`<g data-planet="${esc(p.id)}" data-lon="${p.lon}">`);
    layers.push(
      `<polyline points="${leader}" fill="none" stroke="${color}" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>`,
    );
    layers.push(
      `<circle cx="${anchor.x}" cy="${anchor.y}" r="3.2" fill="${color}" stroke="${printTheme.bg}" stroke-width="1"/>`,
    );
    if (def) {
      layers.push(
        glyphMarkup(def, glyph.x, glyph.y, S.planet, color, S.planetStroke, p.id),
      );
    }
    if (p.retrograde) {
      layers.push(
        `<text x="${glyph.x + 16}" y="${glyph.y + 14}" font-size="12" fill="${printTheme.retrograde}" font-family="ui-sans-serif,system-ui,sans-serif" font-weight="800">R</text>`,
      );
    }
    layers.push(
      `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="central" fill="${color}" font-family="ui-sans-serif,system-ui,sans-serif"><tspan font-size="${S.deg}" font-weight="700">${esc(deg)}</tspan><tspan font-size="${S.min}" font-weight="600" dx="2">${esc(min)}</tspan></text>`,
    );
    layers.push(`</g>`);
  }
  layers.push(`</g>`);

  layers.push(angleMarker(asc, asc, "ASC", "asc"));
  layers.push(angleMarker(mc, asc, "MC", "mc"));
  layers.push(angleArrow(dsc, asc));
  layers.push(angleArrow(ic, asc));

  const meta = esc(
    `${chart.meta.placeLabel} · ${chart.meta.utc} · Swiss Ephemeris`,
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CHART_SIZE} ${CHART_SIZE}" width="100%" height="100%" role="img" aria-label="Natal chart" data-design="classic-print-ssr" data-chart-type="natal" data-utc="${esc(chart.meta.utc)}">`,
    `<title>Natal Chart — Print Ready</title>`,
    `<desc>${meta}</desc>`,
    ...layers,
    `</svg>`,
  ].join("\n");
}

/**
 * Astrotheme-aligned document view of chart JSON (for APIs / debugging).
 */
export function toChartDocument(chart: ChartPayload) {
  return {
    chart_metadata: {
      type: "natal" as const,
      timestamp: chart.meta.utc,
      place: chart.meta.placeLabel,
      timezone: chart.meta.timezone,
      houseSystem: chart.meta.houseSystem,
    },
    planets: chart.planets.map((p) => ({
      name: p.name,
      id: p.id,
      longitude: p.lon,
      latitude: p.lat,
      velocity: p.speed,
      is_retrograde: p.retrograde,
      sign: p.sign,
      sign_degree: p.signDegree,
      house: p.house,
    })),
    houses: chart.houses,
    angles: chart.angles,
    aspects: chart.aspects.map((a) => ({
      p1: a.a,
      p2: a.b,
      type: a.type,
      color: printAspectColors[String(a.type)] ?? printTheme.aspectNeutral,
      orb: a.orb,
      applying: a.applying,
    })),
  };
}
