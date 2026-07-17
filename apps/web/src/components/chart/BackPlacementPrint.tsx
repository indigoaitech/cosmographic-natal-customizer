"use client";

import { useId } from "react";

import { PLANET_GLYPHS, SIGN_GLYPHS } from "@/lib/chart/glyphs";
import { printAspectColors, printTheme } from "@/lib/chart/printTheme";
import type { Aspect, ChartPayload, PlanetPosition } from "@/lib/chart/types";

/** Print-ready back artwork — Cosmographic logo + Astro-Seek style tables */
export const BACK_PRINT_SVG_ID = "classic-back-print-chart";

const W = 1000;
const H = 1400;

const ASPECT_GLYPH: Record<string, string> = {
  conjunction: "☌",
  opposition: "☍",
  trine: "△",
  square: "□",
  sextile: "⚹",
};

const GRID_ORDER = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "true_node",
  "chiron",
] as const;

type BackPlacementPrintProps = {
  chart: ChartPayload;
  className?: string;
  svgId?: string;
};

function formatDms(signDegree: number): string {
  const d = Math.floor(signDegree);
  const m = Math.floor((signDegree - d) * 60);
  return `${d}°${String(m).padStart(2, "0")}'`;
}

function CosmographicLogo({ cx, y }: { cx: number; y: number }) {
  return (
    <g id="layer-brand-logo" transform={`translate(${cx}, ${y})`}>
      <circle r={28} fill="none" stroke={printTheme.ink} strokeWidth={2.2} />
      <circle r={18} fill="none" stroke={printTheme.ink} strokeWidth={1.2} />
      <circle r={4} fill={printTheme.ink} />
      <text
        y={58}
        textAnchor="middle"
        fill={printTheme.ink}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize={36}
        fontWeight={600}
        letterSpacing="0.18em"
      >
        COSMOGRAPHIC
      </text>
      <text
        y={86}
        textAnchor="middle"
        fill={printTheme.inkMuted}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize={14}
        letterSpacing="0.42em"
      >
        BIRTH MAP
      </text>
    </g>
  );
}

function PositionsTable({
  planets,
  startY,
}: {
  planets: PlanetPosition[];
  startY: number;
}) {
  const rowH = 36;
  const col = { body: 70, name: 200, sign: 360, deg: 520, house: 680, ret: 820 };
  const rows = planets.filter((p) => GRID_ORDER.includes(p.id as (typeof GRID_ORDER)[number]));

  return (
    <g id="layer-planet-positions" transform={`translate(80, ${startY})`}>
      <text
        x={0}
        y={0}
        fill={printTheme.ink}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize={18}
        fontWeight={600}
        letterSpacing="0.12em"
      >
        PLANET POSITIONS
      </text>
      <line
        x1={0}
        y1={14}
        x2={840}
        y2={14}
        stroke={printTheme.ring}
        strokeWidth={1.5}
      />
      {(["", "Body", "Sign", "Degree", "House", ""] as const).map((h, i) => {
        const xs = [col.body, col.name, col.sign, col.deg, col.house, col.ret];
        return (
          <text
            key={h || `h${i}`}
            x={xs[i]}
            y={40}
            fill={printTheme.inkMuted}
            fontFamily="ui-monospace, monospace"
            fontSize={12}
            letterSpacing="0.08em"
          >
            {h}
          </text>
        );
      })}
      {rows.map((p, i) => {
        const y = 78 + i * rowH;
        const glyph = PLANET_GLYPHS[p.id] ?? "·";
        const signGlyph = SIGN_GLYPHS[p.sign] ?? "";
        return (
          <g key={p.id}>
            {i % 2 === 0 && (
              <rect
                x={0}
                y={y - 22}
                width={840}
                height={rowH}
                fill="#f4f4f4"
              />
            )}
            <text
              x={col.body}
              y={y}
              fill={printTheme.ink}
              fontSize={22}
              fontFamily="serif"
            >
              {glyph}
            </text>
            <text
              x={col.name}
              y={y}
              fill={printTheme.ink}
              fontSize={16}
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {p.name}
            </text>
            <text
              x={col.sign}
              y={y}
              fill={printTheme.ink}
              fontSize={18}
              fontFamily="serif"
            >
              {signGlyph} {p.sign}
            </text>
            <text
              x={col.deg}
              y={y}
              fill={printTheme.inkSoft}
              fontSize={15}
              fontFamily="ui-monospace, monospace"
            >
              {formatDms(p.signDegree)}
            </text>
            <text
              x={col.house}
              y={y}
              fill={printTheme.inkSoft}
              fontSize={15}
              fontFamily="ui-monospace, monospace"
            >
              {p.house != null ? `H${p.house}` : "—"}
            </text>
            {p.retrograde && (
              <text
                x={col.ret}
                y={y}
                fill={printTheme.retrograde}
                fontSize={14}
                fontWeight={700}
                fontFamily="ui-sans-serif, system-ui, sans-serif"
              >
                R
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

function buildBodies(planets: PlanetPosition[]): PlanetPosition[] {
  const byId = new Map(planets.map((p) => [p.id, p]));
  return GRID_ORDER.map((id) => byId.get(id)).filter(
    (p): p is PlanetPosition => Boolean(p),
  );
}

function buildAspectMap(aspects: Aspect[]): Map<string, Aspect> {
  const m = new Map<string, Aspect>();
  for (const a of aspects) {
    m.set(`${a.a}|${a.b}`, a);
    m.set(`${a.b}|${a.a}`, a);
  }
  return m;
}

function AspectGrid({
  planets,
  aspects,
  startY,
}: {
  planets: PlanetPosition[];
  aspects: Aspect[];
  startY: number;
}) {
  const bodies = buildBodies(planets);
  const aspectMap = buildAspectMap(aspects);

  const cell = 42;
  const label = 36;
  const n = bodies.length;

  return (
    <g id="layer-aspect-grid" transform={`translate(80, ${startY})`}>
      <text
        x={0}
        y={0}
        fill={printTheme.ink}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize={18}
        fontWeight={600}
        letterSpacing="0.12em"
      >
        ASPECT GRID
      </text>
      <g transform={`translate(0, 28)`}>
        {bodies.map((p, i) => (
          <text
            key={`row-${p.id}`}
            x={label / 2}
            y={label + i * cell + cell / 2 + 6}
            textAnchor="middle"
            fill={printTheme.ink}
            fontSize={20}
            fontFamily="serif"
          >
            {PLANET_GLYPHS[p.id] ?? "·"}
          </text>
        ))}
        {bodies.map((p, j) => (
          <text
            key={`col-${p.id}`}
            x={label + j * cell + cell / 2}
            y={22}
            textAnchor="middle"
            fill={printTheme.ink}
            fontSize={18}
            fontFamily="serif"
          >
            {PLANET_GLYPHS[p.id] ?? "·"}
          </text>
        ))}
        {bodies.map((row, i) =>
          bodies.map((col, j) => {
            if (j > i) return null;
            const x = label + j * cell;
            const y = label + i * cell;
            const isDiag = i === j;
            const asp = isDiag ? null : aspectMap.get(`${row.id}|${col.id}`);
            const stroke = "#cccccc";
            return (
              <g key={`${row.id}-${col.id}`}>
                <rect
                  x={x}
                  y={y}
                  width={cell}
                  height={cell}
                  fill={isDiag ? "#eeeeee" : "#ffffff"}
                  stroke={stroke}
                  strokeWidth={1}
                />
                {asp && (
                  <text
                    x={x + cell / 2}
                    y={y + cell / 2 + 6}
                    textAnchor="middle"
                    fill={
                      printAspectColors[asp.type] ?? printTheme.aspectNeutral
                    }
                    fontSize={16}
                    fontFamily="serif"
                  >
                    {ASPECT_GLYPH[asp.type] ?? "·"}
                  </text>
                )}
                {isDiag && (
                  <text
                    x={x + cell / 2}
                    y={y + cell / 2 + 6}
                    textAnchor="middle"
                    fill={printTheme.inkMuted}
                    fontSize={14}
                    fontFamily="serif"
                  >
                    {PLANET_GLYPHS[row.id] ?? ""}
                  </text>
                )}
              </g>
            );
          }),
        )}
        {/* size hint for layout math */}
        <rect
          x={0}
          y={0}
          width={label + n * cell}
          height={label + n * cell}
          fill="none"
          stroke="none"
        />
      </g>
    </g>
  );
}

/**
 * Back-of-garment print asset: brand logo + planet positions + aspect grid.
 * White background, high-contrast ink — suitable for 300 DPI rasterization.
 */
export function BackPlacementPrint({
  chart,
  className,
  svgId = BACK_PRINT_SVG_ID,
}: BackPlacementPrintProps) {
  const uid = useId().replace(/:/g, "");
  const metaLine = [
    chart.meta.placeLabel,
    chart.meta.utc.slice(0, 10),
    chart.meta.timezone,
  ].join(" · ");

  return (
    <svg
      id={svgId}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="100%"
      role="img"
      aria-label="Cosmographic back print — planet table"
      data-design="back-placement-print"
      style={{ background: printTheme.bg }}
    >
      <title>Cosmographic · Back Print</title>
      <desc>
        Cosmographic logo above planet positions table and aspect grid for
        apparel back print.
      </desc>
      <defs>
        <clipPath id={`${uid}-frame`}>
          <rect x={0} y={0} width={W} height={H} />
        </clipPath>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={printTheme.bg} />
      <CosmographicLogo cx={W / 2} y={90} />
      <text
        x={W / 2}
        y={210}
        textAnchor="middle"
        fill={printTheme.inkMuted}
        fontFamily="ui-monospace, monospace"
        fontSize={13}
      >
        {metaLine}
      </text>
      <PositionsTable planets={chart.planets} startY={250} />
      <AspectGrid
        planets={chart.planets}
        aspects={chart.aspects}
        startY={780}
      />
      <text
        x={W / 2}
        y={H - 36}
        textAnchor="middle"
        fill={printTheme.inkMuted}
        fontFamily="ui-monospace, monospace"
        fontSize={12}
        letterSpacing="0.2em"
      >
        COSMOGRAPHIC.STORE · SWISS EPHEMERIS
      </text>
    </svg>
  );
}
