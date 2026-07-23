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
 * Classic white natal wheel — print-ready layout matching the technical
 * reference: dominant outer zodiac band, planets on the inner perimeter,
 * bold house numbers, thin aspect web, ASC left / MC top.
 *
 * Radius hierarchy (outer → inner):
 *   outer ticks → wide zodiac → house numbers → planet glyphs → aspect circle
 */
const R = {
  outer: 482,
  tickOuter: 474,
  tickInner: 458,
  zodiacOuter: 458,
  zodiacInner: 338,
  houseNum: 308,
  planet: 272,
  planetAlt: 248,
  aspect: 222,
  acMcLabel: 498,
};

const SIGN_SIZE = 38;
const PLANET_SIZE = 24;
const DEG_SIZE = 10;
const MIN_SIZE = 8;
const HOUSE_SIZE = 17;
const SPREAD_GAP = 11;

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
        Classic white natal wheel with dominant zodiac band, house cusps,
        inner-perimeter planets, and thin aspect lines. Swiss Ephemeris data.
      </desc>

      <rect x={0} y={0} width={CHART_SIZE} height={CHART_SIZE} fill={printTheme.bg} />

      {/* Concentric rings — wide outer band, compact aspect core */}
      <g id="layer-rings" fill="none" stroke={printTheme.ring}>
        <circle cx={CHART_CX} cy={CHART_CY} r={R.outer} strokeWidth={2} />
        <circle cx={CHART_CX} cy={CHART_CY} r={R.zodiacOuter} strokeWidth={1.35} />
        <circle cx={CHART_CX} cy={CHART_CY} r={R.zodiacInner} strokeWidth={1.5} />
        <circle cx={CHART_CX} cy={CHART_CY} r={R.aspect} strokeWidth={1.6} />
        <circle
          cx={CHART_CX}
          cy={CHART_CY}
          r={3.5}
          fill={printTheme.ink}
          stroke="none"
        />
      </g>

      {/* Degree ticks on outer edge of zodiac */}
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
              strokeWidth={t.major ? 1.15 : t.medium ? 0.75 : 0.4}
              opacity={t.major ? 0.9 : t.medium ? 0.65 : 0.4}
            />
          );
        })}
      </g>

      {/* Zodiac dividers + large color-coded glyphs */}
      <g id="layer-zodiac">
        {SIGN_ORDER.map((sign, i) => {
          const start = i * 30;
          const mid = midLongitude(start, start + 30);
          const div = polarLine(start, asc, R.zodiacInner, R.outer);
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

      {/* House cusps through full wheel + bold numbers inside houses */}
      <g id="layer-houses">
        {chart.houses.map((h) => {
          const isAngle = h.house === 1 || h.house === 10;
          const spoke = polarLine(h.cusp, asc, R.aspect, R.outer);
          const next = chart.houses.find((x) => x.house === (h.house % 12) + 1);
          const nextCusp = next ? next.cusp : norm360(h.cusp + 30);
          // Bias number slightly past the cusp into the house (CCW)
          const span = norm360(nextCusp - h.cusp) || 30;
          const numLon = norm360(h.cusp + Math.min(span * 0.28, 12));
          const num = lonToPoint(numLon, asc, R.houseNum);
          return (
            <g key={`house-${h.house}`}>
              <line
                x1={spoke.x1}
                y1={spoke.y1}
                x2={spoke.x2}
                y2={spoke.y2}
                stroke={printTheme.ring}
                strokeWidth={isAngle ? 2.1 : 1.15}
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

      {/* Thin aspect web — does not overpower outer symbols */}
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
              strokeWidth={hard ? 0.85 : soft ? 0.7 : 0.55}
              strokeDasharray={soft ? "3 2.5" : undefined}
              opacity={0.78}
            />
          );
        })}
      </g>

      {/* Planets on inner perimeter with degree labels */}
      <g id="layer-planets">
        {placed.map((pl) => {
          const p = byId.get(pl.id);
          if (!p) return null;
          const color = planetPrintColors[p.id] ?? printTheme.ink;
          const displayR = planetRadii.get(pl.id) ?? R.planet;
          const truePt = lonToPoint(p.lon, asc, R.aspect);
          const glyph = lonToPoint(pl.displayLon, asc, displayR);
          const { deg, min } = formatDms(p.signDegree);

          // Degree text slightly inward from glyph
          const vx = CHART_CX - glyph.x;
          const vy = CHART_CY - glyph.y;
          const len = Math.hypot(vx, vy) || 1;
          const lx = glyph.x + (vx / len) * 18;
          const ly = glyph.y + (vy / len) * 18;

          // Tick from aspect rim toward glyph
          const rim = lonToPoint(p.lon, asc, R.aspect + 6);

          return (
            <g key={p.id}>
              <line
                x1={truePt.x}
                y1={truePt.y}
                x2={rim.x}
                y2={rim.y}
                stroke={color}
                strokeWidth={1.1}
                opacity={0.85}
              />
              <circle
                cx={truePt.x}
                cy={truePt.y}
                r={2}
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
                  x={glyph.x + 11}
                  y={glyph.y + 9}
                  fontSize={8}
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
                fill={printTheme.inkSoft}
                fontFamily="ui-sans-serif, system-ui, sans-serif"
              >
                <tspan fontSize={DEG_SIZE} fontWeight={600}>
                  {deg}
                </tspan>
                <tspan fontSize={MIN_SIZE} fontWeight={400} dx={1.5}>
                  {min}
                </tspan>
              </text>
            </g>
          );
        })}
      </g>

      {/* ASC / MC on the perimeter */}
      <AngleMarker lon={asc} asc={asc} label="ASC" />
      <AngleMarker lon={mc} asc={asc} label="MC" />
    </svg>
  );
}

function AngleMarker({
  lon,
  asc,
  label,
}: {
  lon: number;
  asc: number;
  label: string;
}) {
  const tip = lonToPoint(lon, asc, R.outer + 6);
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
        strokeWidth={2.4}
      />
      <polygon
        points={`${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`}
        fill={printTheme.acMc}
      />
      {label === "MC" ? (
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
          fontSize={13}
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
