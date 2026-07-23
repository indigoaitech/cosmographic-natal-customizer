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
 * Classic white natal wheel — ring-in-ring hierarchy (center → out):
 *   1. Small aspect core
 *   2. Houses band (dashed cusps + numbers)
 *   3. Zodiac band (large color glyphs)
 *   4. Degree ruler
 *   5. Planets OUTSIDE all rings with leader lines
 * ASC @ 9 o'clock · MC @ 12 o'clock
 */
const R = {
  /** 1 — tiny aspect core */
  aspect: 155,
  /** 2 — houses band */
  houseOuter: 255,
  houseNum: 205,
  /** 3 — zodiac band */
  zodiacInner: 255,
  zodiacOuter: 375,
  /** 4 — degree ruler */
  tickInner: 375,
  tickOuter: 398,
  outer: 405,
  /** 5 — exterior planets */
  planetElbow: 412,
  planet: 445,
  planetAlt: 475,
  acMcLabel: 492,
};

const SIGN_SIZE = 36;
const PLANET_SIZE = 26;
const DEG_SIZE = 11;
const MIN_SIZE = 9;
const HOUSE_SIZE = 15;
const SPREAD_GAP = 13;

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

/** Keep major aspects only so the core stays sparse. */
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
      data-design="classic-print-white"
      style={{ background: printTheme.bg }}
    >
      <title>Natal Chart — Print Ready</title>
      <desc>
        Ring-in-ring natal wheel: small aspect core, houses, zodiac, degree
        ruler, exterior planets with leaders. Swiss Ephemeris data.
      </desc>

      <rect x={0} y={0} width={CHART_SIZE} height={CHART_SIZE} fill={printTheme.bg} />

      {/* Rings: aspect → house → zodiac → outer */}
      <g id="layer-rings" fill="none" stroke={printTheme.ring}>
        <circle cx={CHART_CX} cy={CHART_CY} r={R.aspect} strokeWidth={1.75} />
        <circle cx={CHART_CX} cy={CHART_CY} r={R.houseOuter} strokeWidth={1.5} />
        <circle cx={CHART_CX} cy={CHART_CY} r={R.zodiacOuter} strokeWidth={1.5} />
        <circle cx={CHART_CX} cy={CHART_CY} r={R.outer} strokeWidth={2} />
        <circle
          cx={CHART_CX}
          cy={CHART_CY}
          r={3.5}
          fill={printTheme.ink}
          stroke="none"
        />
      </g>

      {/* 1 — sparse aspect web in the small core */}
      <g id="layer-aspects" fill="none">
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
              strokeWidth={hard ? 0.9 : soft ? 0.75 : 0.6}
              strokeDasharray={soft ? "4 3" : undefined}
              opacity={0.8}
            />
          );
        })}
      </g>

      {/* 2 — house band: thick dashed cusps + numbers */}
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
                strokeWidth={isAngle ? 2.4 : 1.8}
                strokeDasharray={isAngle ? undefined : "6 4"}
                opacity={0.95}
              />
              <text
                x={num.x}
                y={num.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={HOUSE_SIZE}
                fill={printTheme.ink}
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                fontWeight={700}
              >
                {h.house}
              </text>
            </g>
          );
        })}
      </g>

      {/* 3 — zodiac band: large color-coded glyphs */}
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
                strokeWidth={1.1}
              />
              <text
                x={g.x}
                y={g.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={SIGN_SIZE}
                fill={signPrintColors[sign] ?? printTheme.ink}
                fontFamily="'Segoe UI Symbol','Apple Symbols','Noto Sans Symbols',sans-serif"
                fontWeight={600}
              >
                {SIGN_GLYPHS[sign]}
              </text>
            </g>
          );
        })}
      </g>

      {/* 4 — degree ruler on the outer rim */}
      <g id="layer-ticks" stroke={printTheme.tick}>
        {ticks.map((t) => {
          const inset = t.major ? 16 : t.medium ? 10 : 5;
          const line = polarLine(t.lon, asc, R.tickOuter - inset, R.tickOuter);
          return (
            <line
              key={`tick-${t.lon}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              strokeWidth={t.major ? 1.2 : t.medium ? 0.8 : 0.4}
              opacity={t.major ? 0.9 : t.medium ? 0.65 : 0.4}
            />
          );
        })}
      </g>

      {/* Extend angle house spokes through zodiac to outer rim */}
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
              strokeWidth={2.2}
            />
          );
        })}
      </g>

      {/* 5 — planets OUTSIDE rings with leader lines */}
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
          const lx = glyph.x + (vx / len) * 22;
          const ly = glyph.y + (vy / len) * 22;

          return (
            <g key={p.id}>
              <polyline
                points={leaderPts}
                fill="none"
                stroke={color}
                strokeWidth={0.85}
                opacity={0.75}
              />
              <circle
                cx={anchor.x}
                cy={anchor.y}
                r={2.4}
                fill={color}
                stroke="none"
              />
              <text
                x={glyph.x}
                y={glyph.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={PLANET_SIZE}
                fill={color}
                fontFamily="'Segoe UI Symbol','Apple Symbols','Noto Sans Symbols',sans-serif"
                fontWeight={600}
              >
                {PLANET_GLYPHS[p.id] ?? "·"}
              </text>
              {p.retrograde && (
                <text
                  x={glyph.x + 12}
                  y={glyph.y + 10}
                  fontSize={9}
                  fill={printTheme.retrograde}
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                  fontWeight={700}
                >
                  R
                </text>
              )}
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="central"
                fill={printTheme.ink}
                fontFamily="ui-sans-serif, system-ui, sans-serif"
              >
                <tspan fontSize={DEG_SIZE} fontWeight={600}>
                  {deg}
                </tspan>
                <tspan fontSize={MIN_SIZE} fontWeight={400} dx={2}>
                  {min}
                </tspan>
              </text>
            </g>
          );
        })}
      </g>

      {/* 6 — ASC (9 o'clock) · MC (12 o'clock) + DSC/IC arrow tips */}
      <AngleMarker lon={asc} asc={asc} label="ASC" kind="asc" />
      <AngleMarker lon={mc} asc={asc} label="MC" kind="mc" />
      <AngleArrow lon={dsc} asc={asc} />
      <AngleArrow lon={ic} asc={asc} />
    </svg>
  );
}

function AngleArrow({ lon, asc }: { lon: number; asc: number }) {
  const tip = lonToPoint(lon, asc, R.outer + 4);
  const angle = Math.atan2(tip.y - CHART_CY, tip.x - CHART_CX);
  const ah = 9;
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
  const tip = lonToPoint(lon, asc, R.outer + 8);
  const base = lonToPoint(lon, asc, R.aspect);
  const labelPt = lonToPoint(lon, asc, R.acMcLabel);

  const angle = Math.atan2(tip.y - CHART_CY, tip.x - CHART_CX);
  const ah = 11;
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
        strokeWidth={2.5}
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
            r={15}
            fill={printTheme.bg}
            stroke={printTheme.acMc}
            strokeWidth={1.6}
          />
          <text
            x={labelPt.x}
            y={labelPt.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
            fontWeight={700}
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
          fontSize={14}
          fontWeight={700}
          fill={printTheme.acMc}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {label}
        </text>
      )}
    </g>
  );
}
