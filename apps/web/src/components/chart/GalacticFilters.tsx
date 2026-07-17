import { chartTheme } from "@/lib/chart/theme";

/**
 * SVG filter pipeline for organic glowing neon tubes (DTG-safe cores + glow).
 */
export function GalacticFilters({ uid }: { uid: string }) {
  const id = (name: string) => `${uid}-${name}`;

  return (
    <defs>
      {/* Neon Dark Blue base atmosphere */}
      <filter
        id={id("glow-dark-blue")}
        x="-40%"
        y="-40%"
        width="180%"
        height="180%"
        colorInterpolationFilters="sRGB"
      >
        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
        <feFlood floodColor={chartTheme.neonDarkBlue} floodOpacity="0.95" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Electric Blue structure glow */}
      <filter
        id={id("glow-electric")}
        x="-50%"
        y="-50%"
        width="200%"
        height="200%"
        colorInterpolationFilters="sRGB"
      >
        <feGaussianBlur in="SourceGraphic" stdDeviation="5.5" result="b1" />
        <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="b2" />
        <feFlood floodColor={chartTheme.electricBlue} floodOpacity="0.85" result="c1" />
        <feFlood floodColor={chartTheme.electricBlue} floodOpacity="0.35" result="c2" />
        <feComposite in="c1" in2="b1" operator="in" result="g1" />
        <feComposite in="c2" in2="b2" operator="in" result="g2" />
        <feMerge>
          <feMergeNode in="g2" />
          <feMergeNode in="g1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Neon Pink highlight glow */}
      <filter
        id={id("glow-pink")}
        x="-50%"
        y="-50%"
        width="200%"
        height="200%"
        colorInterpolationFilters="sRGB"
      >
        <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b1" />
        <feGaussianBlur in="SourceGraphic" stdDeviation="11" result="b2" />
        <feFlood floodColor={chartTheme.neonPink} floodOpacity="0.9" result="c1" />
        <feFlood floodColor={chartTheme.neonPinkSoft} floodOpacity="0.35" result="c2" />
        <feComposite in="c1" in2="b1" operator="in" result="g1" />
        <feComposite in="c2" in2="b2" operator="in" result="g2" />
        <feMerge>
          <feMergeNode in="g2" />
          <feMergeNode in="g1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Soft outer nebula for matrix shell */}
      <filter
        id={id("glow-matrix")}
        x="-30%"
        y="-30%"
        width="160%"
        height="160%"
        colorInterpolationFilters="sRGB"
      >
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <radialGradient id={id("void-wash")} cx="50%" cy="42%" r="55%">
        <stop offset="0%" stopColor={chartTheme.neonDarkBlue} stopOpacity="0.55" />
        <stop offset="55%" stopColor={chartTheme.deepBlue} stopOpacity="0.25" />
        <stop offset="100%" stopColor="#030712" stopOpacity="0" />
      </radialGradient>

      <linearGradient id={id("tube-electric")} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={chartTheme.electricBlue} />
        <stop offset="100%" stopColor={chartTheme.electricBlueDim} />
      </linearGradient>

      <linearGradient id={id("tube-pink")} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={chartTheme.neonPink} />
        <stop offset="100%" stopColor={chartTheme.neonPinkSoft} />
      </linearGradient>
    </defs>
  );
}

export function filterUrl(uid: string, name: string): string {
  return `url(#${uid}-${name})`;
}
