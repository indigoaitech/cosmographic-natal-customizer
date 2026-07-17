"use client";

import { useId, useMemo } from "react";

/**
 * @deprecated Experimental 15×19@300 DPI galactic renderer — not on commerce path.
 * Primary print assets: ClassicPrintNatalChart + BackPlacementPrint (+ print/artboard.ts).
 */

import {
  GalacticFilters,
  filterUrl,
} from "@/components/chart/GalacticFilters";
import { GalacticStructuralShell } from "@/components/chart/GalacticStructuralShell";
import {
  ANGLE_LABELS,
  PLANET_GLYPHS,
  SIGN_GLYPHS,
  SIGN_ORDER,
} from "@/lib/chart/glyphs";
import { midLongitude, spreadLongitudes } from "@/lib/chart/geometry";
import {
  organicSpokePath,
  organicTubePath,
  projectLon,
  projectedRingPath,
} from "@/lib/chart/perspective3d";
import { DTG_STROKE, LOCAL_R, POD } from "@/lib/chart/pod";
import { aspectColors, chartTheme } from "@/lib/chart/theme";
import type { ChartPayload } from "@/lib/chart/types";

/** Local radii inside the locked 3D disc (before perspective). */
const R = {
  zodiacOuter: LOCAL_R * 0.98,
  zodiacInner: LOCAL_R * 0.82,
  houseOuter: LOCAL_R * 0.82,
  houseInner: LOCAL_R * 0.62,
  planet: LOCAL_R * 0.5,
  aspect: LOCAL_R * 0.4,
  angleLabel: LOCAL_R * 1.05,
} as const;

type GalacticNatalChartProps = {
  chart: ChartPayload;
  className?: string;
  svgId?: string;
  /** Show POD crop guides (design mode) */
  showGuides?: boolean;
};

/**
 * Cosmographic natal chart — Printify DTG 15×19 @ 300 DPI.
 * Structural shell is fixed; Swiss Ephemeris data maps into the tilted disc.
 */
/**
 * @deprecated Experimental 15×19@300 DPI galactic renderer — not on commerce path.
 * Primary print assets: ClassicPrintNatalChart + BackPlacementPrint via print/artboard.ts.
 */
export function GalacticNatalChart({
  chart,
  className,
  svgId = "galactic-natal-chart",
  showGuides = false,
}: GalacticNatalChartProps) {
  const uid = useId().replace(/:/g, "");
  const f = (name: string) => filterUrl(uid, name);
  const asc = chart.angles.asc;

  const placedPlanets = useMemo(
    () =>
      spreadLongitudes(
        chart.planets.map((p) => ({ id: p.id, lon: p.lon })),
        8,
      ),
    [chart.planets],
  );

  const planetById = useMemo(
    () => new Map(chart.planets.map((p) => [p.id, p])),
    [chart.planets],
  );

  const lonById = useMemo(
    () => new Map(chart.planets.map((p) => [p.id, p.lon])),
    [chart.planets],
  );

  return (
    <svg
      id={svgId}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${POD.widthPx} ${POD.heightPx}`}
      width="100%"
      height="100%"
      role="img"
      aria-label="Cosmographic natal chart — Printify DTG"
      data-design="cosmographic-3d"
      data-dpi={POD.dpi}
      data-print-in={`${POD.widthIn}x${POD.heightIn}`}
      style={{ background: "transparent" }}
    >
      <title>Cosmographic Natal Chart</title>
      <desc>
        Printify DTG layout {POD.widthIn}&quot;×{POD.heightIn}&quot; at {POD.dpi} DPI.
        Core wheel diameter is 85% of vertical canvas. Neon tube strokes sized for
        black-fabric DTG. Structural matrix is fixed; planetary data is dynamic.
      </desc>

      <GalacticFilters uid={uid} />

      {/* Transparent POD artboard — black garment shows through */}
      <g id="layer-pod-artboard" data-layer="pod-artboard">
        {showGuides && (
          <rect
            x={0}
            y={0}
            width={POD.widthPx}
            height={POD.heightPx}
            fill="none"
            stroke={chartTheme.muted}
            strokeWidth={2}
            strokeDasharray="24 16"
            opacity={0.35}
          />
        )}
      </g>

      {/* ---- FIXED structural matrix (never shifts with ephemeris) ---- */}
      <GalacticStructuralShell uid={uid} />

      {/* ---- DYNAMIC ephemeris content inside tilted framework ---- */}
      <g id="layer-ephemeris-dynamic" data-layer="ephemeris-dynamic">
        {/* Concentric neon rings */}
        <g id="layer-rings" data-layer="rings">
          <path
            d={projectedRingPath(R.zodiacOuter, 120, 0)}
            fill="none"
            stroke={chartTheme.electricBlue}
            strokeWidth={DTG_STROKE.tubeGlow}
            opacity={0.22}
            filter={f("glow-electric")}
          />
          <path
            d={projectedRingPath(R.zodiacOuter, 120, 0)}
            fill="none"
            stroke={chartTheme.electricBlue}
            strokeWidth={DTG_STROKE.tubeCore}
            filter={f("glow-electric")}
          />
          <path
            d={projectedRingPath(R.zodiacInner, 100, 6)}
            fill="none"
            stroke={chartTheme.neonDarkBlue}
            strokeWidth={DTG_STROKE.tubeCore + 2}
            filter={f("glow-dark-blue")}
          />
          <path
            d={projectedRingPath(R.houseInner, 96, 10)}
            fill="none"
            stroke={chartTheme.electricBlueDim}
            strokeWidth={DTG_STROKE.division}
            filter={f("glow-electric")}
            opacity={0.85}
          />
          <path
            d={projectedRingPath(R.aspect, 80, 14)}
            fill="none"
            stroke={chartTheme.neonPink}
            strokeWidth={DTG_STROKE.division}
            filter={f("glow-pink")}
            opacity={0.7}
          />
        </g>

        {/* Zodiac divisions — organic spokes */}
        <g id="layer-zodiac-divisions" data-layer="zodiac-divisions">
          {SIGN_ORDER.map((sign, i) => {
            const lon = i * 30;
            return (
              <path
                key={sign}
                id={`zodiac-tube-${sign.toLowerCase()}`}
                d={organicSpokePath(lon, asc, R.zodiacInner, R.zodiacOuter, 2)}
                fill="none"
                stroke={chartTheme.electricBlue}
                strokeWidth={DTG_STROKE.division}
                strokeLinecap="round"
                opacity={0.65}
                filter={f("glow-electric")}
              />
            );
          })}
        </g>

        {/* Sign glyphs */}
        <g
          id="layer-sign-glyphs"
          data-layer="sign-glyphs"
          fill={chartTheme.electricBlue}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {SIGN_ORDER.map((sign, i) => {
            const mid = midLongitude(i * 30, (i + 1) * 30);
            const r = (R.zodiacOuter + R.zodiacInner) / 2;
            const p = projectLon(mid, asc, r, 4);
            return (
              <text
                key={sign}
                x={p.x}
                y={p.y}
                fontSize={POD.heightPx * 0.018}
                fontFamily="'Segoe UI Symbol', 'Apple Symbols', sans-serif"
                filter={f("glow-electric")}
                data-sign={sign}
              >
                {SIGN_GLYPHS[sign]}
              </text>
            );
          })}
        </g>

        {/* House cusps */}
        <g id="layer-house-cusps" data-layer="house-cusps">
          {chart.houses.map((h) => {
            const angular = [1, 4, 7, 10].includes(h.house);
            return (
              <path
                key={`house-${h.house}`}
                id={`house-tube-${h.house}`}
                d={organicSpokePath(
                  h.cusp,
                  asc,
                  R.houseInner,
                  R.houseOuter,
                  angular ? 8 : 4,
                )}
                fill="none"
                stroke={angular ? chartTheme.neonPink : chartTheme.electricBlueDim}
                strokeWidth={angular ? DTG_STROKE.angleRay : DTG_STROKE.division}
                strokeLinecap="round"
                filter={f(angular ? "glow-pink" : "glow-electric")}
                opacity={angular ? 0.95 : 0.7}
              />
            );
          })}
        </g>

        {/* House numbers */}
        <g
          id="layer-house-numbers"
          data-layer="house-numbers"
          fill={chartTheme.star}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Space Grotesk, Segoe UI, sans-serif"
          fontWeight={600}
        >
          {chart.houses.map((h, idx) => {
            const next = chart.houses[(idx + 1) % chart.houses.length]!;
            const mid = midLongitude(h.cusp, next.cusp);
            const p = projectLon(
              mid,
              asc,
              (R.houseOuter + R.houseInner) / 2,
              6,
            );
            return (
              <text
                key={`hn-${h.house}`}
                x={p.x}
                y={p.y}
                fontSize={POD.heightPx * 0.012}
                opacity={0.85}
              >
                {h.house}
              </text>
            );
          })}
        </g>

        {/* Aspect neon tubes */}
        <g id="layer-aspects" data-layer="aspects">
          {chart.aspects.map((asp, i) => {
            const lonA = lonById.get(asp.a);
            const lonB = lonById.get(asp.b);
            if (lonA === undefined || lonB === undefined) return null;
            const hard = asp.type === "opposition" || asp.type === "square";
            const color = aspectColors[asp.type] ?? chartTheme.electricBlue;
            return (
              <g key={`asp-${asp.a}-${asp.b}-${i}`}>
                <path
                  d={organicTubePath(lonA, lonB, asc, R.aspect, 0.22, 12)}
                  fill="none"
                  stroke={color}
                  strokeWidth={DTG_STROKE.aspectGlow}
                  opacity={0.2}
                  strokeLinecap="round"
                  filter={f(hard ? "glow-pink" : "glow-electric")}
                />
                <path
                  d={organicTubePath(lonA, lonB, asc, R.aspect, 0.22, 12)}
                  fill="none"
                  stroke={color}
                  strokeWidth={DTG_STROKE.aspectCore}
                  opacity={0.92}
                  strokeLinecap="round"
                  filter={f(hard ? "glow-pink" : "glow-electric")}
                  data-aspect={asp.type}
                  data-orb={asp.orb}
                />
              </g>
            );
          })}
        </g>

        {/* Planet ticks + glyphs */}
        <g id="layer-planets" data-layer="planets">
          {chart.planets.map((p) => (
            <path
              key={`tick-${p.id}`}
              d={organicSpokePath(
                p.lon,
                asc,
                R.houseInner * 0.92,
                R.planet * 1.08,
                5,
              )}
              fill="none"
              stroke={chartTheme.electricBlueDim}
              strokeWidth={DTG_STROKE.tick}
              opacity={0.45}
              strokeLinecap="round"
            />
          ))}

          {placedPlanets.map((placed) => {
            const planet = planetById.get(placed.id);
            if (!planet) return null;
            const p = projectLon(placed.displayLon, asc, R.planet, 16);
            const glyph = PLANET_GLYPHS[planet.id] ?? "?";
            const glyphSize = POD.heightPx * 0.016;
            return (
              <g
                key={`planet-${planet.id}`}
                id={`planet-${planet.id}`}
                data-planet={planet.id}
                data-lon={planet.lon}
                transform={`translate(${p.x}, ${p.y})`}
              >
                <circle
                  r={glyphSize * 0.95}
                  fill={chartTheme.neonDarkBlue}
                  stroke={chartTheme.electricBlue}
                  strokeWidth={DTG_STROKE.glyphHalo}
                  filter={f("glow-electric")}
                  opacity={0.95}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={glyphSize}
                  fill={chartTheme.star}
                  fontFamily="'Segoe UI Symbol', 'Apple Symbols', sans-serif"
                >
                  {glyph}
                </text>
                {planet.retrograde && (
                  <text
                    y={glyphSize * 1.35}
                    textAnchor="middle"
                    fontSize={glyphSize * 0.45}
                    fill={chartTheme.neonPink}
                    fontFamily="Space Grotesk, sans-serif"
                    filter={f("glow-pink")}
                  >
                    ℞
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Angles */}
        <g id="layer-angles" data-layer="angles">
          {(
            [
              ["asc", chart.angles.asc],
              ["mc", chart.angles.mc],
              ["dsc", chart.angles.dsc],
              ["ic", chart.angles.ic],
            ] as const
          ).map(([key, lon]) => {
            const accent =
              key === "asc" || key === "mc"
                ? chartTheme.neonPink
                : chartTheme.electricBlue;
            const label = projectLon(lon, asc, R.angleLabel, 20);
            return (
              <g key={key} id={`angle-${key}`} data-angle={key}>
                <path
                  d={organicSpokePath(
                    lon,
                    asc,
                    R.houseInner,
                    R.zodiacOuter * 1.02,
                    10,
                  )}
                  fill="none"
                  stroke={accent}
                  strokeWidth={DTG_STROKE.angleRay}
                  strokeLinecap="round"
                  filter={f(key === "asc" || key === "mc" ? "glow-pink" : "glow-electric")}
                />
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={POD.heightPx * 0.011}
                  fontWeight={700}
                  fill={accent}
                  fontFamily="Space Grotesk, Segoe UI, sans-serif"
                  filter={f(key === "asc" || key === "mc" ? "glow-pink" : "glow-electric")}
                >
                  {ANGLE_LABELS[key]}
                </text>
              </g>
            );
          })}
        </g>

        {/* Center nucleus */}
        <g id="layer-center" data-layer="center">
          {(() => {
            const c = projectLon(asc, asc, 0, 22);
            return (
              <>
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={POD.heightPx * 0.008}
                  fill={chartTheme.neonPink}
                  filter={f("glow-pink")}
                />
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={POD.heightPx * 0.016}
                  fill="none"
                  stroke={chartTheme.electricBlue}
                  strokeWidth={DTG_STROKE.tick}
                  filter={f("glow-electric")}
                  opacity={0.8}
                />
              </>
            );
          })()}
        </g>
      </g>

      {/* POD metadata strip (non-print critical, tiny) */}
      <g id="layer-pod-meta" data-layer="pod-meta" opacity={0.4}>
        <text
          x={POD.cx}
          y={POD.heightPx - 48}
          textAnchor="middle"
          fill={chartTheme.muted}
          fontSize={28}
          fontFamily="ui-monospace, monospace"
        >
          COSMOGRAPHIC · 3D PRINT · {POD.widthIn}&quot;×{POD.heightIn}&quot; · {POD.dpi}DPI · CHART{" "}
          {Math.round(POD.chartDiameterPx / POD.heightPx * 100)}%H
        </text>
      </g>
    </svg>
  );
}

/** Backward-compatible alias used by mock-up / Option A panels. */
export { GalacticNatalChart as NatalChartSVG };
