"use client";

import { useId, useMemo } from "react";

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
  polarLine,
  spreadLongitudes,
} from "@/lib/chart/geometry";
import { aspectColors, chartTheme } from "@/lib/chart/theme";
import type { ChartPayload } from "@/lib/chart/types";

/** Classic flat astrolabe radii (front-facing — no tilt). */
const R = {
  outer: 478,
  degree: 455,
  zodiacOuter: 448,
  zodiacInner: 368,
  houseOuter: 368,
  houseInner: 288,
  planet: 238,
  aspect: 198,
  core: 28,
} as const;

/** Larger glyphs sit slightly outside the zodiac band (can overhang rings). */
const SIGN_GLYPH_R = (R.zodiacOuter + R.zodiacInner) / 2 + 14;
const SIGN_GLYPH_SIZE = 40;
const PLANET_BEAD_R = 21;
const PLANET_GLYPH_SIZE = 22;

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export type AstrolabeBackdrop = "none" | "mayan-stone";

type ClassicAstrolabeChartProps = {
  chart: ChartPayload;
  className?: string;
  svgId?: string;
  /** Option B: same flat chart sitting on carved Aztec/Maya sun-stone. */
  backdrop?: AstrolabeBackdrop;
};

/**
 * Flat Western natal astrolabe.
 * Option A — transparent / space wash
 * Option B — Mayan/Aztec carved-stone calendar underlay (no perspective tilt)
 */
export function ClassicAstrolabeChart({
  chart,
  className,
  svgId = "classic-astrolabe-chart",
  backdrop = "none",
}: ClassicAstrolabeChartProps) {
  const uid = useId().replace(/:/g, "");
  const asc = chart.angles.asc;
  const withStone = backdrop === "mayan-stone";
  /** Leave a stone rim visible around the wheel */
  const chartScale = withStone ? 0.78 : 1;

  const placed = useMemo(
    () =>
      spreadLongitudes(
        chart.planets.map((p) => ({ id: p.id, lon: p.lon })),
        8,
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

  const glowElectric = `url(#${uid}-glow-e)`;
  const glowPink = `url(#${uid}-glow-p)`;
  const glowCore = `url(#${uid}-glow-c)`;

  return (
    <svg
      id={svgId}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
      width="100%"
      height="100%"
      role="img"
      aria-label={
        withStone
          ? "Cosmographic natal chart on Mayan stone calendar"
          : "Classic vector natal chart"
      }
      data-design={withStone ? "option-b-stone" : "option-a-classic"}
      style={{ background: "transparent" }}
    >
      <title>
        {withStone
          ? "Cosmographic — Astrolabe on Stone Calendar"
          : "Cosmographic Classic Astrolabe"}
      </title>
      <desc>
        Flat concentric natal wheel. Zodiac and planet glyphs enlarged.
        {withStone
          ? " Carved Aztec/Maya sun-stone provides a three-dimensional stone base."
          : ""}
      </desc>

      <defs>
        <filter id={`${uid}-glow-e`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${uid}-glow-p`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${uid}-glow-c`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${uid}-stone-depth`} x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow
            dx="0"
            dy="10"
            stdDeviation="14"
            floodColor="#1a1208"
            floodOpacity="0.65"
          />
        </filter>
        <filter id={`${uid}-chart-lift`} x="-8%" y="-8%" width="116%" height="116%">
          <feDropShadow
            dx="0"
            dy="6"
            stdDeviation="10"
            floodColor="#000000"
            floodOpacity="0.55"
          />
        </filter>
        <radialGradient id={`${uid}-core`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={chartTheme.star} stopOpacity="1" />
          <stop offset="35%" stopColor={chartTheme.electricBlue} stopOpacity="0.95" />
          <stop offset="70%" stopColor={chartTheme.neonPink} stopOpacity="0.55" />
          <stop offset="100%" stopColor={chartTheme.neonDarkBlue} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-disc`} cx="42%" cy="40%" r="62%">
          <stop offset="0%" stopColor={chartTheme.neonDarkBlue} stopOpacity="0.55" />
          <stop offset="55%" stopColor={chartTheme.deepBlue} stopOpacity="0.35" />
          <stop offset="100%" stopColor="#030712" stopOpacity="0.15" />
        </radialGradient>
        <radialGradient id={`${uid}-stone-veil`} cx="50%" cy="50%" r="48%">
          <stop offset="0%" stopColor="#030712" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#030712" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#030712" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${uid}-stone-clip`}>
          <circle cx={CHART_CX} cy={CHART_CY} r={495} />
        </clipPath>
      </defs>

      {/* ---- Option B: carved sun-stone base (flat, no tilt) ---- */}
      {withStone && (
        <g id="layer-mayan-stone-backdrop" data-layer="mayan-stone">
          <g clipPath={`url(#${uid}-stone-clip)`} filter={`url(#${uid}-stone-depth)`}>
            <image
              href="/mayan-sun-stone.png"
              x={CHART_CX - 500}
              y={CHART_CY - 500}
              width={1000}
              height={1000}
              preserveAspectRatio="xMidYMid slice"
              opacity={0.98}
            />
          </g>
          {/* Soft center veil so the natal wheel stays readable */}
          <circle
            cx={CHART_CX}
            cy={CHART_CY}
            r={R.outer * chartScale + 24}
            fill={`url(#${uid}-stone-veil)`}
          />
        </g>
      )}

      {/* Chart group — slightly inset on stone so the carved rim stays visible */}
      <g
        id="layer-natal-wheel"
        transform={
          withStone
            ? `translate(${CHART_CX}, ${CHART_CY}) scale(${chartScale}) translate(${-CHART_CX}, ${-CHART_CY})`
            : undefined
        }
        filter={withStone ? `url(#${uid}-chart-lift)` : undefined}
      >
        {!withStone && (
          <circle
            cx={CHART_CX}
            cy={CHART_CY}
            r={R.outer}
            fill={`url(#${uid}-disc)`}
          />
        )}
        {withStone && (
          <circle
            cx={CHART_CX}
            cy={CHART_CY}
            r={R.outer}
            fill="rgba(3,7,18,0.72)"
          />
        )}

        {/* Concentric rings */}
        <g id="layer-rings" fill="none" filter={glowElectric}>
          <circle
            cx={CHART_CX}
            cy={CHART_CY}
            r={R.outer}
            stroke={chartTheme.electricBlue}
            strokeWidth={1.6}
            opacity={0.95}
          />
          <circle
            cx={CHART_CX}
            cy={CHART_CY}
            r={R.degree}
            stroke={chartTheme.electricBlueDim}
            strokeWidth={0.8}
            opacity={0.55}
          />
          <circle
            cx={CHART_CX}
            cy={CHART_CY}
            r={R.zodiacOuter}
            stroke={chartTheme.electricBlue}
            strokeWidth={1.25}
          />
          <circle
            cx={CHART_CX}
            cy={CHART_CY}
            r={R.zodiacInner}
            stroke={chartTheme.neonDarkBlue}
            strokeWidth={2}
          />
          <circle
            cx={CHART_CX}
            cy={CHART_CY}
            r={R.houseInner}
            stroke={chartTheme.electricBlueDim}
            strokeWidth={1.1}
            opacity={0.85}
          />
          <circle
            cx={CHART_CX}
            cy={CHART_CY}
            r={R.aspect}
            stroke={chartTheme.neonPink}
            strokeWidth={0.9}
            opacity={0.55}
            filter={glowPink}
          />
        </g>

        {/* Degree ticks */}
        <g id="layer-degree-ticks" stroke={chartTheme.electricBlue} opacity={0.35}>
          {Array.from({ length: 72 }, (_, i) => {
            const lon = i * 5;
            const major = lon % 30 === 0;
            const line = polarLine(
              lon,
              asc,
              major ? R.degree - 14 : R.degree - 7,
              R.degree,
            );
            return (
              <line
                key={`tick-${i}`}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                strokeWidth={major ? 1.2 : 0.6}
                opacity={major ? 0.7 : 0.4}
              />
            );
          })}
        </g>

        {/* Zodiac — larger glyphs that can overhang the band */}
        <g id="layer-zodiac">
          {SIGN_ORDER.map((sign, i) => {
            const lon = i * 30;
            const spoke = polarLine(lon, asc, R.zodiacInner, R.zodiacOuter);
            const mid = midLongitude(lon, lon + 30);
            const g = lonToPoint(mid, asc, SIGN_GLYPH_R);
            return (
              <g key={sign}>
                <line
                  x1={spoke.x1}
                  y1={spoke.y1}
                  x2={spoke.x2}
                  y2={spoke.y2}
                  stroke={chartTheme.electricBlue}
                  strokeWidth={1}
                  opacity={0.55}
                />
                <text
                  x={g.x}
                  y={g.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={SIGN_GLYPH_SIZE}
                  fill={chartTheme.electricBlue}
                  filter={glowElectric}
                  fontFamily="'Segoe UI Symbol','Apple Symbols',sans-serif"
                  fontWeight={600}
                >
                  {SIGN_GLYPHS[sign]}
                </text>
              </g>
            );
          })}
        </g>

        {/* Houses */}
        <g id="layer-houses">
          {chart.houses.map((h, idx) => {
            const angular = [1, 4, 7, 10].includes(h.house);
            const spoke = polarLine(h.cusp, asc, R.houseInner, R.houseOuter);
            const next = chart.houses[(idx + 1) % chart.houses.length]!;
            const mid = midLongitude(h.cusp, next.cusp);
            const label = lonToPoint(
              mid,
              asc,
              (R.houseOuter + R.houseInner) / 2,
            );
            return (
              <g key={`house-${h.house}`}>
                <line
                  x1={spoke.x1}
                  y1={spoke.y1}
                  x2={spoke.x2}
                  y2={spoke.y2}
                  stroke={
                    angular ? chartTheme.neonPink : chartTheme.electricBlueDim
                  }
                  strokeWidth={angular ? 1.8 : 1}
                  opacity={angular ? 0.95 : 0.65}
                  filter={angular ? glowPink : undefined}
                />
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={14}
                  fill={chartTheme.star}
                  opacity={0.85}
                  fontFamily="Space Grotesk, Segoe UI, sans-serif"
                  fontWeight={600}
                >
                  {ROMAN[h.house - 1]}
                </text>
              </g>
            );
          })}
        </g>

        {/* Aspects */}
        <g id="layer-aspects" fill="none">
          {chart.aspects.map((asp, i) => {
            const aLon = lonById.get(asp.a);
            const bLon = lonById.get(asp.b);
            if (aLon === undefined || bLon === undefined) return null;
            const a = lonToPoint(aLon, asc, R.aspect);
            const b = lonToPoint(bLon, asc, R.aspect);
            const hard = asp.type === "square" || asp.type === "opposition";
            const color = aspectColors[asp.type] ?? chartTheme.electricBlue;
            return (
              <line
                key={`asp-${i}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={color}
                strokeWidth={hard ? 1.35 : 1}
                opacity={0.82}
                filter={hard ? glowPink : glowElectric}
              />
            );
          })}
        </g>

        {/* Planets — larger beads */}
        <g id="layer-planets">
          {chart.planets.map((p) => {
            const tick = polarLine(p.lon, asc, R.houseInner - 8, R.planet + 20);
            return (
              <line
                key={`pt-${p.id}`}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke={chartTheme.electricBlueDim}
                strokeWidth={0.7}
                opacity={0.4}
              />
            );
          })}

          {placed.map((pl) => {
            const p = byId.get(pl.id);
            if (!p) return null;
            const pos = lonToPoint(pl.displayLon, asc, R.planet);
            const degPos = lonToPoint(pl.displayLon, asc, R.planet - 34);
            return (
              <g key={p.id} transform={`translate(${pos.x},${pos.y})`}>
                <circle
                  r={PLANET_BEAD_R}
                  fill={chartTheme.deepBlue}
                  stroke={
                    p.id === "sun" || p.id === "moon"
                      ? chartTheme.neonPink
                      : chartTheme.electricBlue
                  }
                  strokeWidth={1.4}
                  filter={
                    p.id === "sun" || p.id === "moon" ? glowPink : glowElectric
                  }
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={PLANET_GLYPH_SIZE}
                  fill={chartTheme.star}
                  fontFamily="'Segoe UI Symbol','Apple Symbols',sans-serif"
                >
                  {PLANET_GLYPHS[p.id] ?? "·"}
                </text>
                <text
                  x={degPos.x - pos.x}
                  y={degPos.y - pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={9}
                  fill={chartTheme.muted}
                  fontFamily="ui-monospace, monospace"
                >
                  {Math.floor(p.signDegree)}°
                </text>
              </g>
            );
          })}
        </g>

        {/* Center */}
        <g id="layer-center">
          <circle
            cx={CHART_CX}
            cy={CHART_CY}
            r={R.core * 2.2}
            fill={`url(#${uid}-core)`}
            filter={glowCore}
            opacity={0.9}
          />
          <circle
            cx={CHART_CX}
            cy={CHART_CY}
            r={R.core}
            fill={chartTheme.electricBlue}
            opacity={0.85}
            filter={glowElectric}
          />
          <circle
            cx={CHART_CX}
            cy={CHART_CY}
            r={R.core * 0.35}
            fill={chartTheme.star}
          />
        </g>
      </g>
    </svg>
  );
}
