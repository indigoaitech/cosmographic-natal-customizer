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
 * Classic white natal wheel — print-ready, matches technical reference charts:
 * white ground, thin black rings, element-colored signs, exterior planets,
 * colored aspects, AC left / MC top.
 */
const R = {
  outer: 478,
  tickOuter: 468,
  tickInner: 455,
  zodiacOuter: 448,
  zodiacInner: 388,
  houseNum: 355,
  aspect: 320,
  planet: 492,
  planetAlt: 508,
  planetElbow: 430,
  acMc: 500,
};

const SIGN_SIZE = 28;
const PLANET_SIZE = 26;
const DEG_SIZE = 11;
const MIN_SIZE = 9;
const HOUSE_SIZE = 12;
const SPREAD_GAP = 14;

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

export function ClassicPrintNatalChart({
  chart,
  className,
  svgId = "classic-print-natal-chart",
}: ClassicPrintNatalChartProps) {
  const asc = chart.angles.asc;
  const mc = chart.angles.mc;

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

  const ticks = useMemo(() => {
    const out: Array<{ lon: number; major: boolean }> = [];
    for (let d = 0; d < 360; d++) {
      out.push({ lon: d, major: d % 5 === 0 });
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
        Classic white natal wheel with zodiac ring, house cusps, exterior
        planets, and aspect lines. Swiss Ephemeris data.
      </desc>

      <rect x={0} y={0} width={CHART_SIZE} height={CHART_SIZE} fill={printTheme.bg} />

      {/* Concentric rings */}
      <g id="layer-rings" fill="none" stroke={printTheme.ring}>
        <circle cx={CHART_CX} cy={CHART_CY} r={R.outer} strokeWidth={1.75} />
        <circle cx={CHART_CX} cy={CHART_CY} r={R.tickOuter} strokeWidth={1} />
        <circle cx={CHART_CX} cy={CHART_CY} r={R.zodiacOuter} strokeWidth={1.25} />
        <circle cx={CHART_CX} cy={CHART_CY} r={R.zodiacInner} strokeWidth={1.25} />
        <circle cx={CHART_CX} cy={CHART_CY} r={R.aspect} strokeWidth={1.5} />
        <circle
          cx={CHART_CX}
          cy={CHART_CY}
          r={4}
          fill={printTheme.ink}
          stroke="none"
        />
      </g>

      {/* Degree ticks */}
      <g id="layer-ticks" stroke={printTheme.tick}>
        {ticks.map((t) => {
          const line = polarLine(
            t.lon,
            asc,
            t.major ? R.tickInner - 4 : R.tickInner,
            R.tickOuter,
          );
          return (
            <line
              key={`tick-${t.lon}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              strokeWidth={t.major ? 1 : 0.45}
              opacity={t.major ? 0.85 : 0.45}
            />
          );
        })}
      </g>

      {/* Zodiac sign dividers + glyphs */}
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
                strokeWidth={1}
              />
              <text
                x={g.x}
                y={g.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={SIGN_SIZE}
                fill={signPrintColors[sign] ?? printTheme.ink}
                fontFamily="'Segoe UI Symbol','Apple Symbols','Noto Sans Symbols',sans-serif"
                fontWeight={500}
              >
                {SIGN_GLYPHS[sign]}
              </text>
            </g>
          );
        })}
      </g>

      {/* House cusp spokes + numbers */}
      <g id="layer-houses">
        {chart.houses.map((h) => {
          const spoke = polarLine(h.cusp, asc, R.aspect, R.zodiacInner);
          const next = chart.houses.find((x) => x.house === (h.house % 12) + 1);
          const nextCusp = next ? next.cusp : norm360(h.cusp + 30);
          const mid = midLongitude(h.cusp, nextCusp);
          const num = lonToPoint(mid, asc, R.houseNum);
          return (
            <g key={`house-${h.house}`}>
              <line
                x1={spoke.x1}
                y1={spoke.y1}
                x2={spoke.x2}
                y2={spoke.y2}
                stroke={printTheme.ring}
                strokeWidth={h.house === 1 || h.house === 10 ? 1.6 : 0.9}
                opacity={0.9}
              />
              <text
                x={num.x}
                y={num.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={HOUSE_SIZE}
                fill={printTheme.ink}
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                fontWeight={500}
              >
                {h.house}
              </text>
            </g>
          );
        })}
      </g>

      {/* Aspect web */}
      <g id="layer-aspects" fill="none">
        {chart.aspects.map((asp, i) => {
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
              strokeWidth={hard ? 1.35 : soft ? 1.15 : 0.9}
              opacity={0.92}
            />
          );
        })}
      </g>

      {/* Exterior planets */}
      <g id="layer-planets">
        {placed.map((pl) => {
          const p = byId.get(pl.id);
          if (!p) return null;
          const color = planetPrintColors[p.id] ?? printTheme.ink;
          const displayR = planetRadii.get(pl.id) ?? R.planet;
          const anchor = lonToPoint(p.lon, asc, R.aspect);
          const glyph = lonToPoint(pl.displayLon, asc, displayR);
          const gap = lonGap(p.lon, pl.displayLon);
          const useElbow = gap > 1.5 && gap < 358;
          const elbow = lonToPoint(pl.displayLon, asc, R.planetElbow);
          const { deg, min } = formatDms(p.signDegree);
          const leader = useElbow
            ? `${glyph.x},${glyph.y} ${elbow.x},${elbow.y} ${anchor.x},${anchor.y}`
            : `${glyph.x},${glyph.y} ${anchor.x},${anchor.y}`;

          // Radial outward for degree label
          const vx = glyph.x - CHART_CX;
          const vy = glyph.y - CHART_CY;
          const len = Math.hypot(vx, vy) || 1;
          const lx = glyph.x + (vx / len) * 22;
          const ly = glyph.y + (vy / len) * 22;

          return (
            <g key={p.id}>
              <polyline
                points={leader}
                fill="none"
                stroke={printTheme.inkMuted}
                strokeWidth={0.6}
                opacity={0.55}
              />
              <circle
                cx={anchor.x}
                cy={anchor.y}
                r={2.2}
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
                fontWeight={500}
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
                  fontWeight={600}
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
                <tspan fontSize={DEG_SIZE} fontWeight={500}>
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

      {/* AC / MC markers */}
      <AngleMarker lon={asc} asc={asc} label="AC" kind="ac" />
      <AngleMarker lon={mc} asc={asc} label="MC" kind="mc" />
    </svg>
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
  kind: "ac" | "mc";
}) {
  const tip = lonToPoint(lon, asc, R.outer + 8);
  const base = lonToPoint(lon, asc, R.zodiacOuter);
  const mid = lonToPoint(lon, asc, R.acMc);

  // Arrowhead
  const angle = Math.atan2(tip.y - CHART_CY, tip.x - CHART_CX);
  const ah = 10;
  const left = {
    x: tip.x - ah * Math.cos(angle - 0.45),
    y: tip.y - ah * Math.sin(angle - 0.45),
  };
  const right = {
    x: tip.x - ah * Math.cos(angle + 0.45),
    y: tip.y - ah * Math.sin(angle + 0.45),
  };

  return (
    <g>
      <line
        x1={base.x}
        y1={base.y}
        x2={tip.x}
        y2={tip.y}
        stroke={printTheme.acMc}
        strokeWidth={2}
      />
      <polygon
        points={`${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`}
        fill={printTheme.acMc}
      />
      {kind === "mc" ? (
        <g>
          <circle
            cx={mid.x}
            cy={mid.y}
            r={14}
            fill={printTheme.bg}
            stroke={printTheme.acMc}
            strokeWidth={1.5}
          />
          <text
            x={mid.x}
            y={mid.y}
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
          x={mid.x}
          y={mid.y}
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
