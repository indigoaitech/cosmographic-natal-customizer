"use client";

import { useMemo } from "react";

import {
  PLANET_GLYPHS,
  SIGN_GLYPHS,
  SIGN_ORDER,
} from "@/lib/chart/glyphs";
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
  planetPrintColors,
  printAspectColors,
  printTheme,
  signPrintColors,
} from "@/lib/chart/printTheme";
import type { ChartPayload } from "@/lib/chart/types";

/**
 * Textile-optimized classic natal wheel.
 *
 * Compact wheel + wide outer margin so large exterior planet glyphs print
 * cleanly on apparel. Hierarchy (center → out):
 *   aspect core → houses → zodiac → degree ruler → exterior planets
 */
const R = {
  /** Compact inner chart — leaves wide margin for exterior labels */
  aspect: 118,
  houseOuter: 192,
  houseNum: 155,
  zodiacInner: 192,
  zodiacOuter: 298,
  tickInner: 298,
  tickOuter: 320,
  outer: 328,
  /** Exterior planets in the wide white margin */
  planetElbow: 342,
  planet: 395,
  planetAlt: 438,
  acMcLabel: 462,
};

/** Oversized glyphs for DTG / screen-print readability */
const SIGN_SIZE = 50;
const PLANET_SIZE = 34;
const DEG_SIZE = 13;
const MIN_SIZE = 11;
const HOUSE_SIZE = 16;
const SPREAD_GAP = 15;

type ClassicPrintNatalChartProps = {
  chart: ChartPayload;
  className?: string;
  svgId?: string;
};

function formatDms(signDegree: number): { deg: string; min: string } {
  const d = Math.floor(signDegree);
  const m = Math.floor((signDegree - d) * 60);
  return { deg: `${d}°`, min: `${String(m).padStart(2, "0")}'` };
}

function lonGap(a: number, b: number): number {
  const d = Math.abs(norm360(a) - norm360(b));
  return d > 180 ? 360 - d : d;
}

function aspectColor(type: string): string {
  return printAspectColors[type] ?? printTheme.aspectNeutral;
}

function assignPlanetRadii(
  placed: Array<{ id: string; displayLon: number }>,
): Map<string, number> {
  const sorted = [...placed].sort(
    (a, b) => norm360(a.displayLon) - norm360(b.displayLon),
  );
  const radii = new Map<string, number>();
  sorted.forEach((pl, i) => {
    radii.set(pl.id, i % 2 === 0 ? R.planet : R.planetAlt);
  });
  return radii;
}

function isMajorAspect(type: string): boolean {
  return ["conjunction", "opposition", "trine", "square", "sextile"].includes(
    type,
  );
}

export function ClassicPrintNatalChart({
  chart,
  className,
  svgId = "classic-print-natal-chart",
}: ClassicPrintNatalChartProps) {
  const asc = chart.angles.asc;
  const mc = chart.angles.mc;
  const dsc = chart.angles.dsc;
  const ic = chart.angles.ic;

  const placed = useMemo(
    () =>
      spreadLongitudes(
        chart.planets.map((p) => ({ id: p.id, lon: p.lon })),
        SPREAD_GAP,
      ),
    [chart.planets],
  );

  const byId = useMemo(
    () => new Map(chart.planets.map((p) => [p.id, p])),
    [chart.planets],
  );

  const lonById = useMemo(
    () => new Map(chart.planets.map((p) => [p.id, p.lon])),
    [chart.planets],
  );

  const planetRadii = useMemo(() => assignPlanetRadii(placed), [placed]);

  const majorAspects = useMemo(
    () => chart.aspects.filter((a) => isMajorAspect(String(a.type))),
    [chart.aspects],
  );

  const ticks = useMemo(() => {
    const out: Array<{ lon: number; major: boolean; medium: boolean }> = [];
    for (let d = 0; d < 360; d++) {
      out.push({
        lon: d,
        major: d % 10 === 0,
        medium: d % 5 === 0 && d % 10 !== 0,
      });
    }
    return out;
  }, []);

  return (
    <svg
      id={svgId}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
      width="100%"
      height="100%"
      role="img"
      aria-label="Natal chart — print ready"
      data-design="classic-print-textile"
      style={{ background: printTheme.bg }}
    >
      <title>Natal Chart — Print Ready</title>
      <desc>
        Textile-optimized natal wheel: compact rings, oversized glyphs, bold
        aspect colors, exterior planets. Swiss Ephemeris data.
      </desc>

      <rect x={0} y={0} width={CHART_SIZE} height={CHART_SIZE} fill={printTheme.bg} />

      {/* Bold concentric rings */}
      <g id="layer-rings" fill="none" stroke={printTheme.ring}>
        <circle cx={CHART_CX} cy={CHART_CY} r={R.aspect} strokeWidth={3} />
        <circle cx={CHART_CX} cy={CHART_CY} r={R.houseOuter} strokeWidth={2.75} />
        <circle cx={CHART_CX} cy={CHART_CY} r={R.zodiacOuter} strokeWidth={2.75} />
        <circle cx={CHART_CX} cy={CHART_CY} r={R.outer} strokeWidth={3.5} />
        <circle
          cx={CHART_CX}
          cy={CHART_CY}
          r={5}
          fill={printTheme.ink}
          stroke="none"
        />
      </g>

      {/* Bold, colorful aspect web */}
      <g id="layer-aspects" fill="none" strokeLinecap="round">
        {majorAspects.map((asp, i) => {
          const aLon = lonById.get(asp.a);
          const bLon = lonById.get(asp.b);
          if (aLon === undefined || bLon === undefined) return null;
          const a = lonToPoint(aLon, asc, R.aspect);
          const b = lonToPoint(bLon, asc, R.aspect);
          const hard = asp.type === "square" || asp.type === "opposition";
          const soft = asp.type === "trine" || asp.type === "sextile";
          return (
            <line
              key={`asp-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={aspectColor(String(asp.type))}
              strokeWidth={hard ? 2.6 : soft ? 2.3 : 2}
              opacity={0.95}
            />
          );
        })}
      </g>

      {/* House cusps + bold numbers */}
      <g id="layer-houses">
        {chart.houses.map((h) => {
          const isAngle = h.house === 1 || h.house === 10;
          const spoke = polarLine(h.cusp, asc, R.aspect, R.houseOuter);
          const next = chart.houses.find((x) => x.house === (h.house % 12) + 1);
          const nextCusp = next ? next.cusp : norm360(h.cusp + 30);
          const span = norm360(nextCusp - h.cusp) || 30;
          const numLon = midLongitude(h.cusp, norm360(h.cusp + span * 0.55));
          const num = lonToPoint(numLon, asc, R.houseNum);
          return (
            <g key={`house-${h.house}`}>
              <line
                x1={spoke.x1}
                y1={spoke.y1}
                x2={spoke.x2}
                y2={spoke.y2}
                stroke={printTheme.ring}
                strokeWidth={isAngle ? 3.2 : 2.4}
                strokeDasharray={isAngle ? undefined : "7 4"}
                opacity={1}
              />
              <text
                x={num.x}
                y={num.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={HOUSE_SIZE}
                fill={printTheme.ink}
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                fontWeight={800}
              >
                {h.house}
              </text>
            </g>
          );
        })}
      </g>

      {/* Large color-coded zodiac glyphs */}
      <g id="layer-zodiac">
        {SIGN_ORDER.map((sign, i) => {
          const start = i * 30;
          const mid = midLongitude(start, start + 30);
          const div = polarLine(start, asc, R.zodiacInner, R.zodiacOuter);
          const g = lonToPoint(mid, asc, (R.zodiacInner + R.zodiacOuter) / 2);
          return (
            <g key={sign}>
              <line
                x1={div.x1}
                y1={div.y1}
                x2={div.x2}
                y2={div.y2}
                stroke={printTheme.ring}
                strokeWidth={2}
              />
              <text
                x={g.x}
                y={g.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={SIGN_SIZE}
                fill={signPrintColors[sign] ?? printTheme.ink}
                fontFamily="'Segoe UI Symbol','Apple Symbols','Noto Sans Symbols',sans-serif"
                fontWeight={700}
              >
                {SIGN_GLYPHS[sign]}
              </text>
            </g>
          );
        })}
      </g>

      {/* Degree ruler */}
      <g id="layer-ticks" stroke={printTheme.tick}>
        {ticks.map((t) => {
          const inset = t.major ? 14 : t.medium ? 9 : 5;
          const line = polarLine(t.lon, asc, R.tickOuter - inset, R.tickOuter);
          return (
            <line
              key={`tick-${t.lon}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              strokeWidth={t.major ? 1.6 : t.medium ? 1.1 : 0.55}
              opacity={t.major ? 1 : t.medium ? 0.8 : 0.55}
            />
          );
        })}
      </g>

      {/* Angle spokes through zodiac to outer rim */}
      <g id="layer-angle-spokes" stroke={printTheme.ring}>
        {[1, 4, 7, 10].map((houseNum) => {
          const h = chart.houses.find((x) => x.house === houseNum);
          if (!h) return null;
          const spoke = polarLine(h.cusp, asc, R.houseOuter, R.outer);
          return (
            <line
              key={`angle-spoke-${houseNum}`}
              x1={spoke.x1}
              y1={spoke.y1}
              x2={spoke.x2}
              y2={spoke.y2}
              strokeWidth={3}
            />
          );
        })}
      </g>

      {/* Exterior planets — large, colorized, with leaders */}
      <g id="layer-planets">
        {placed.map((pl) => {
          const p = byId.get(pl.id);
          if (!p) return null;
          const color = planetPrintColors[p.id] ?? printTheme.ink;
          const displayR = planetRadii.get(pl.id) ?? R.planet;
          const anchor = lonToPoint(p.lon, asc, R.tickOuter);
          const glyph = lonToPoint(pl.displayLon, asc, displayR);
          const gap = lonGap(p.lon, pl.displayLon);
          const useElbow = gap > 1.5 && gap < 358;
          const elbow = lonToPoint(pl.displayLon, asc, R.planetElbow);
          const { deg, min } = formatDms(p.signDegree);
          const leaderPts = useElbow
            ? `${anchor.x},${anchor.y} ${elbow.x},${elbow.y} ${glyph.x},${glyph.y}`
            : `${anchor.x},${anchor.y} ${glyph.x},${glyph.y}`;

          const vx = glyph.x - CHART_CX;
          const vy = glyph.y - CHART_CY;
          const len = Math.hypot(vx, vy) || 1;
          const lx = glyph.x + (vx / len) * 26;
          const ly = glyph.y + (vy / len) * 26;

          return (
            <g key={p.id}>
              <polyline
                points={leaderPts}
                fill="none"
                stroke={color}
                strokeWidth={1.35}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.9}
              />
              <circle
                cx={anchor.x}
                cy={anchor.y}
                r={3.2}
                fill={color}
                stroke={printTheme.bg}
                strokeWidth={1}
              />
              <text
                x={glyph.x}
                y={glyph.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={PLANET_SIZE}
                fill={color}
                fontFamily="'Segoe UI Symbol','Apple Symbols','Noto Sans Symbols',sans-serif"
                fontWeight={700}
              >
                {PLANET_GLYPHS[p.id] ?? "·"}
              </text>
              {p.retrograde && (
                <text
                  x={glyph.x + 14}
                  y={glyph.y + 12}
                  fontSize={11}
                  fill={printTheme.retrograde}
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                  fontWeight={800}
                >
                  R
                </text>
              )}
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="central"
                fill={color}
                fontFamily="ui-sans-serif, system-ui, sans-serif"
              >
                <tspan fontSize={DEG_SIZE} fontWeight={700}>
                  {deg}
                </tspan>
                <tspan fontSize={MIN_SIZE} fontWeight={600} dx={2}>
                  {min}
                </tspan>
              </text>
            </g>
          );
        })}
      </g>

      <AngleMarker lon={asc} asc={asc} label="ASC" kind="asc" />
      <AngleMarker lon={mc} asc={asc} label="MC" kind="mc" />
      <AngleArrow lon={dsc} asc={asc} />
      <AngleArrow lon={ic} asc={asc} />
    </svg>
  );
}

function AngleArrow({ lon, asc }: { lon: number; asc: number }) {
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
  return (
    <polygon
      points={`${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`}
      fill={printTheme.acMc}
    />
  );
}

function AngleMarker({
  lon,
  asc,
  label,
  kind,
}: {
  lon: number;
  asc: number;
  label: string;
  kind: "asc" | "mc";
}) {
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

  return (
    <g>
      <line
        x1={base.x}
        y1={base.y}
        x2={tip.x}
        y2={tip.y}
        stroke={printTheme.acMc}
        strokeWidth={3.4}
      />
      <polygon
        points={`${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`}
        fill={printTheme.acMc}
      />
      {kind === "mc" ? (
        <g>
          <circle
            cx={labelPt.x}
            cy={labelPt.y}
            r={17}
            fill={printTheme.bg}
            stroke={printTheme.acMc}
            strokeWidth={2.2}
          />
          <text
            x={labelPt.x}
            y={labelPt.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
            fontWeight={800}
            fill={printTheme.acMc}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            MC
          </text>
        </g>
      ) : (
        <text
          x={labelPt.x}
          y={labelPt.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={16}
          fontWeight={800}
          fill={printTheme.acMc}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {label}
        </text>
      )}
    </g>
  );
}
