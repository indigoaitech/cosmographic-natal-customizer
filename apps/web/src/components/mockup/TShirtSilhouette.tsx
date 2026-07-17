type TShirtSilhouetteProps = {
  side: "front" | "back";
  className?: string;
};

/**
 * Flat apparel silhouette with a defined print zone.
 * Front/back share cut; back omits the neck placket detail.
 */
export function TShirtSilhouette({ side, className }: TShirtSilhouetteProps) {
  const printId = `print-zone-${side}`;

  return (
    <svg
      className={className}
      viewBox="0 0 400 500"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`T-shirt ${side} mock-up`}
    >
      <defs>
        <linearGradient id={`fabric-${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a2740" />
          <stop offset="45%" stopColor="#121c2e" />
          <stop offset="100%" stopColor="#0b1528" />
        </linearGradient>
        <linearGradient id={`sheen-${side}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(30,224,255,0.14)" />
          <stop offset="40%" stopColor="rgba(30,224,255,0)" />
          <stop offset="100%" stopColor="rgba(255,45,149,0.08)" />
        </linearGradient>
        <filter id={`soft-${side}`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow
            dx="0"
            dy="10"
            stdDeviation="12"
            floodColor="#030712"
            floodOpacity="0.55"
          />
        </filter>
        <clipPath id={printId}>
          <rect x="118" y={side === "front" ? 148 : 138} width="164" height="164" rx="8" />
        </clipPath>
      </defs>

      {/* Shirt body */}
      <path
        filter={`url(#soft-${side})`}
        fill={`url(#fabric-${side})`}
        stroke="rgba(30,224,255,0.35)"
        strokeWidth="1.5"
        d="M132 78
           C150 58 170 48 200 48
           C230 48 250 58 268 78
           L318 118
           C328 126 334 140 328 152
           L300 168
           L300 430
           C300 448 286 460 268 460
           L132 460
           C114 460 100 448 100 430
           L100 168
           L72 152
           C66 140 72 126 82 118
           Z"
      />

      {/* Collar */}
      <path
        fill="none"
        stroke="rgba(232,244,255,0.22)"
        strokeWidth="1.25"
        d="M158 86 C170 70 185 62 200 62 C215 62 230 70 242 86"
      />
      {side === "front" && (
        <path
          fill="none"
          stroke="rgba(30,224,255,0.25)"
          strokeWidth="1"
          d="M186 86 L200 112 L214 86"
        />
      )}

      {/* Sleeve folds */}
      <path
        d="M100 168 L132 188"
        stroke="rgba(30,224,255,0.18)"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M300 168 L268 188"
        stroke="rgba(30,224,255,0.18)"
        strokeWidth="1"
        fill="none"
      />

      {/* Sheen */}
      <path
        fill={`url(#sheen-${side})`}
        opacity="0.85"
        d="M132 78
           C150 58 170 48 200 48
           C230 48 250 58 268 78
           L318 118
           C328 126 334 140 328 152
           L300 168
           L300 250
           L100 250
           L100 168
           L72 152
           C66 140 72 126 82 118
           Z"
      />

      {/* Print frame guide */}
      <rect
        x="118"
        y={side === "front" ? 148 : 138}
        width="164"
        height="164"
        rx="8"
        fill="rgba(3,7,18,0.35)"
        stroke={side === "front" ? "rgba(30,224,255,0.45)" : "rgba(255,45,149,0.45)"}
        strokeWidth="1"
        strokeDasharray="4 3"
      />

      {/* Side label badge */}
      <text
        x="200"
        y="488"
        textAnchor="middle"
        fill={side === "front" ? "#1ee0ff" : "#ff6bb5"}
        fontFamily="ui-monospace, monospace"
        fontSize="11"
        letterSpacing="0.28em"
      >
        {side === "front" ? "FRONT" : "BACK"}
      </text>
    </svg>
  );
}

export const PRINT_ZONE = {
  front: { x: 118, y: 148, size: 164 },
  back: { x: 118, y: 138, size: 164 },
} as const;
