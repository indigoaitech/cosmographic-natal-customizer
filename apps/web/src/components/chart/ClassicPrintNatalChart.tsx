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
  norm360,
  spreadLongitudes,
} from "@/lib/chart/geometry";
import {
  cosmoAspectColors,
  cosmographicTheme,
  planetCosmoColors,
  signCosmoColors,
} from "@/lib/chart/cosmographicTheme";
import type { ChartPayload } from "@/lib/chart/types";

/**
 * Full-bleed apparel layout — rings define the birth map;
 * planets sit outside, zodiac on the mid ring, aspects inside.
 */
const R = {
  /** Outer bounding ring — fills print area */
  outer: 486,
  /** Second outer guide */
  outerInner: 468,
  /** Planet glyph band (side-by-side fan) */
  planet: 412,
  planetAlt: 438,
  planetElbow: 352,
  /** Zodiac glyph ring */
  zodiac: 298,
  /** Ring just outside zodiac / aspect boundary */
  mid: 268,
  /** Inner aspect circle */
  aspect: 258,
  /** Tiny core */
  core: 8,
  acMc: 456,
};

/** Reference proportions: planets ~2.2× zodiac; thin strokes */
const SIGN_SIZE = 44;
const PLANET_SIZE = 96;
const DEG_SIZE = 20;
const MIN_SIZE = 15;
const AC_MC_SIZE = 28;
const LABEL_OFFSET = 54;
/** Wide gap so clustered planets stand side-by-side */
const SPREAD_GAP = 26;

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

function planetColor(id: string): string {
  return planetCosmoColors[id] ?? cosmographicTheme.ink;
}

function labelOffset(
  gx: number,
  gy: number,
  radius = R.planet,
): { dx: number; dy: number; anchor: "start" | "middle" | "end" } {
  const vx = gx - CHART_CX;
  const vy = gy - CHART_CY;
  const len = Math.hypot(vx, vy) || 1;
  const extra = radius > R.planet ? 10 : 0;
  const ox = (vx / len) * (LABEL_OFFSET + extra);
  const oy = (vy / len) * (LABEL_OFFSET + extra);
  const angle = Math.atan2(vy, vx);
  const deg = (angle * 180) / Math.PI;
  let anchor: "start" | "middle" | "end" = "middle";
  if (deg > -40 && deg < 40) anchor = "start";
  else if (deg > 140 || deg < -140) anchor = "end";
  return { dx: ox, dy: oy, anchor };
}

type ExteriorBody = {
  id: string;
  lon: number;
  displayLon: number;
  displayR: number;
  signDegree: number;
  retrograde: boolean;
  glyph: string;
  isAngle?: boolean;
  label?: string;
};

/**
 * Fan planets onto alternating radii so neighbours sit side-by-side,
 * not stacked on the same arc.
 */
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

/**
 * Cosmographic natal chart — black apparel design matching reference PNGs.
 * Rings frame the map; large exterior planets; thin zodiac; aspect web.
 */
export function ClassicPrintNatalChart({
  chart,
  className,
  svgId = "classic-print-natal-chart",
}: ClassicPrintNatalChartProps) {
  const uid = useId().replace(/:/g, "");
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

  const exteriorBodies: ExteriorBody[] = useMemo(() => {
    const planets: ExteriorBody[] = placed.map((pl) => {
      const p = byId.get(pl.id)!;
      return {
        id: p.id,
        lon: p.lon,
        displayLon: pl.displayLon,
        displayR: planetRadii.get(pl.id) ?? R.planet,
        signDegree: p.signDegree,
        retrograde: p.retrograde,
        glyph: PLANET_GLYPHS[p.id] ?? "·",
      };
    });

    const angles: ExteriorBody[] = [
      {
        id: "ac",
        lon: asc,
        displayLon: asc,
        displayR: R.acMc,
        signDegree: 0,
        retrograde: false,
        glyph: "",
        isAngle: true,
        label: "AC",
      },
      {
        id: "mc",
        lon: mc,
        displayLon: mc,
        displayR: R.acMc,
        signDegree: 0,
        retrograde: false,
        glyph: "",
        isAngle: true,
        label: "MC",
      },
    ];

    return [...planets, ...angles];
  }, [placed, byId, asc, mc, planetRadii]);

  const aspectEndpoints = useMemo(() => {
    const set = new Set<string>();
    for (const asp of chart.aspects) {
      if (lonById.has(asp.a)) set.add(asp.a);
      if (lonById.has(asp.b)) set.add(asp.b);
    }
    return set;
  }, [chart.aspects, lonById]);

  const glow = `url(#${uid}-glow)`;
  const ringStroke = cosmographicTheme.muted;

  return (
    <svg
      id={svgId}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
      width="100%"
      height="100%"
      role="img"
      aria-label="Cosmographic natal chart"
      data-design="cosmographic-print"
      style={{ background: cosmographicTheme.bg }}
    >
      <title>Cosmographic Natal Chart — Print</title>
      <desc>
        Black cosmographic wheel with defining rings, exterior planets, zodiac
        band, and aspect web from Swiss Ephemeris.
      </desc>

      <defs>
        <filter id={`${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.55" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect
        x={0}
        y={0}
        width={CHART_SIZE}
        height={CHART_SIZE}
        fill={cosmographicTheme.bg}
      />

      {/* Birth-map rings — outer frame + mid + center aspect circle */}
      <g id="layer-rings" fill="none">
        <circle
          cx={CHART_CX}
          cy={CHART_CY}
          r={R.outer}
          stroke={ringStroke}
          strokeWidth={1.6}
          opacity={0.55}
        />
        <circle
          cx={CHART_CX}
          cy={CHART_CY}
          r={R.outerInner}
          stroke={ringStroke}
          strokeWidth={0.7}
          opacity={0.35}
        />
        <circle
          cx={CHART_CX}
          cy={CHART_CY}
          r={R.zodiac + 22}
          stroke={ringStroke}
          strokeWidth={0.9}
          opacity={0.4}
        />
        <circle
          cx={CHART_CX}
          cy={CHART_CY}
          r={R.mid}
          stroke={ringStroke}
          strokeWidth={1.2}
          opacity={0.5}
        />
        <circle
          cx={CHART_CX}
          cy={CHART_CY}
          r={R.aspect}
          stroke={cosmographicTheme.ink}
          strokeWidth={1.35}
          opacity={0.45}
        />
        <circle
          cx={CHART_CX}
          cy={CHART_CY}
          r={R.core}
          fill={cosmographicTheme.ink}
          stroke="none"
          opacity={0.7}
        />
      </g>

      {/* Aspect web — interior */}
      <g id="layer-aspects" fill="none">
        {chart.aspects.map((asp, i) => {
          const aLon = lonById.get(asp.a);
          const bLon = lonById.get(asp.b);
          if (aLon === undefined || bLon === undefined) return null;
          const a = lonToPoint(aLon, asc, R.aspect);
          const b = lonToPoint(bLon, asc, R.aspect);
          const hard = asp.type === "square" || asp.type === "opposition";
          const color =
            cosmoAspectColors[asp.type] ?? cosmographicTheme.aspectNeutral;
          return (
            <line
              key={`asp-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={color}
              strokeWidth={hard ? 1.35 : 1.05}
              opacity={0.9}
              filter={glow}
            />
          );
        })}
      </g>

      {/* Green endpoint nodes on center ring */}
      <g id="layer-aspect-nodes" fill="none">
        {chart.planets.map((p) => {
          if (!aspectEndpoints.has(p.id)) return null;
          const pt = lonToPoint(p.lon, asc, R.aspect);
          return (
            <circle
              key={`node-${p.id}`}
              cx={pt.x}
              cy={pt.y}
              r={5.5}
              stroke={cosmographicTheme.aspectNode}
              strokeWidth={1.4}
              opacity={0.9}
            />
          );
        })}
      </g>

      {/* Zodiac — single mid ring, thin & medium (reference scale) */}
      <g id="layer-zodiac">
        {SIGN_ORDER.map((sign, i) => {
          const mid = midLongitude(i * 30, (i + 1) * 30);
          const g = lonToPoint(mid, asc, R.zodiac);
          return (
            <text
              key={sign}
              x={g.x}
              y={g.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={SIGN_SIZE}
              fill={signCosmoColors[sign] ?? cosmographicTheme.ink}
              fontFamily="'Segoe UI Symbol','Apple Symbols','Noto Sans Symbols',sans-serif"
              fontWeight={300}
              opacity={0.96}
            >
              {SIGN_GLYPHS[sign]}
            </text>
          );
        })}
      </g>

      {/* Exterior planets + AC/MC — large, side-by-side */}
      <g id="layer-exterior">
        {exteriorBodies.map((body) => {
          if (body.isAngle) {
            return (
              <AngleMarker
                key={body.id}
                lon={body.lon}
                asc={asc}
                label={body.label!}
              />
            );
          }
          return <ExteriorPlanet key={body.id} body={body} asc={asc} />;
        })}
      </g>
    </svg>
  );
}

function ExteriorPlanet({
  body,
  asc,
}: {
  body: ExteriorBody;
  asc: number;
}) {
  const color = planetColor(body.id);
  const anchor = lonToPoint(body.lon, asc, R.aspect);
  const glyph = lonToPoint(body.displayLon, asc, body.displayR);
  const gap = lonGap(body.lon, body.displayLon);
  const useElbow = gap > 1.8 && gap < 358;
  const elbow = lonToPoint(body.displayLon, asc, R.planetElbow);
  const { deg, min } = formatDms(body.signDegree);
  const off = labelOffset(glyph.x, glyph.y, body.displayR);

  const leaderPoints = useElbow
    ? `${glyph.x},${glyph.y} ${elbow.x},${elbow.y} ${anchor.x},${anchor.y}`
    : `${glyph.x},${glyph.y} ${anchor.x},${anchor.y}`;

  return (
    <g>
      <polyline
        points={leaderPoints}
        fill="none"
        stroke={color}
        strokeWidth={0.7}
        opacity={0.72}
      />
      <text
        x={glyph.x}
        y={glyph.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={PLANET_SIZE}
        fill={color}
        fontFamily="'Segoe UI Symbol','Apple Symbols','Noto Sans Symbols',sans-serif"
        fontWeight={400}
        opacity={0.97}
      >
        {body.glyph}
      </text>
      {body.retrograde && (
        <text
          x={glyph.x + 36}
          y={glyph.y + 28}
          fontSize={18}
          fill={cosmographicTheme.retrograde}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontWeight={500}
        >
          R
        </text>
      )}
      <text
        x={glyph.x + off.dx}
        y={glyph.y + off.dy}
        textAnchor={off.anchor}
        dominantBaseline="central"
        fill={color}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        opacity={0.92}
      >
        <tspan fontSize={DEG_SIZE} fontWeight={400}>
          {deg}
        </tspan>
        <tspan fontSize={MIN_SIZE} fontWeight={300} dx={4} dy={1}>
          {min}
        </tspan>
      </text>
    </g>
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
  const anchor = lonToPoint(lon, asc, R.aspect);
  const pos = lonToPoint(lon, asc, R.acMc);
  const off = labelOffset(pos.x, pos.y, R.acMc);

  return (
    <g>
      <line
        x1={pos.x}
        y1={pos.y}
        x2={anchor.x}
        y2={anchor.y}
        stroke={cosmographicTheme.angle}
        strokeWidth={0.8}
        opacity={0.5}
      />
      <text
        x={pos.x + off.dx * 0.55}
        y={pos.y + off.dy * 0.55}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={AC_MC_SIZE}
        fill={cosmographicTheme.angle}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight={400}
        opacity={0.78}
      >
        {label}
      </text>
    </g>
  );
}
