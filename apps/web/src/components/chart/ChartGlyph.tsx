"use client";

import {
  PLANET_PATHS,
  SIGN_PATHS,
  type GlyphDef,
} from "@/lib/chart/glyphPaths";

type ChartGlyphProps = {
  /** Zodiac sign name or planet id */
  id: string;
  kind: "sign" | "planet";
  x: number;
  y: number;
  /** Rendered width/height in SVG user units */
  size: number;
  color: string;
  /** Stroke weight relative to 100×100 viewBox (default 7 = bold textile) */
  strokeWidth?: number;
  className?: string;
};

function resolveDef(kind: "sign" | "planet", id: string): GlyphDef | null {
  if (kind === "sign") return SIGN_PATHS[id] ?? null;
  return PLANET_PATHS[id] ?? PLANET_PATHS[id.replace("mean_", "true_")] ?? null;
}

/**
 * Scalable vector astrology glyph — sharp at any print resolution.
 * Centered on (x, y) via transform; uses path data (not Unicode text).
 */
export function ChartGlyph({
  id,
  kind,
  x,
  y,
  size,
  color,
  strokeWidth = 7,
  className,
}: ChartGlyphProps) {
  const def = resolveDef(kind, id);
  if (!def) return null;

  const half = size / 2;
  const sw = strokeWidth;

  return (
    <g
      className={className}
      transform={`translate(${x}, ${y})`}
      data-glyph={id}
      data-glyph-kind={kind}
    >
      <svg
        x={-half}
        y={-half}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        overflow="visible"
        aria-hidden
      >
        {def.paths.map((d, i) => {
          const closed = /\bZ\s*$/i.test(d.trim());
          return (
            <path
              key={`p-${i}`}
              d={d}
              fill={closed ? color : "none"}
              stroke={color}
              strokeWidth={closed ? sw * 0.35 : sw}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
        {def.lines?.map(([x1, y1, x2, y2], i) => (
          <line
            key={`l-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        ))}
        {def.circles?.map((c, i) => (
          <circle
            key={`c-${i}`}
            cx={c.cx}
            cy={c.cy}
            r={c.r}
            fill={c.fill ? color : "none"}
            stroke={color}
            strokeWidth={sw}
          />
        ))}
      </svg>
    </g>
  );
}
