"use client";

type SVGChartRendererProps = {
  /** Complete SVG markup from ephemeris `/v1/natal-chart-svg` */
  svgMarkup: string;
  className?: string;
  title?: string;
};

/**
 * Displays a server-rendered Astrotheme-style natal chart SVG.
 * Uses a sandboxed inline HTML document so print styles from the
 * ephemeris renderer apply cleanly on mobile and desktop.
 */
export function SVGChartRenderer({
  svgMarkup,
  className,
  title = "Natal chart",
}: SVGChartRendererProps) {
  if (!svgMarkup.includes("<svg")) {
    return (
      <div
        className={`flex min-h-[280px] items-center justify-center bg-white text-sm text-neutral-500 ${className ?? ""}`}
      >
        Chart preview unavailable
      </div>
    );
  }

  // Prefer direct inline SVG when markup is a bare <svg>…</svg>
  const srcDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
    html,body{margin:0;padding:0;background:#fff;}
    body{display:flex;align-items:center;justify-content:center;min-height:100%;}
    svg{width:100%;height:auto;max-width:100%;display:block;}
    @media print{
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      svg{width:190mm;height:auto;}
    }
  </style></head><body>${svgMarkup}</body></html>`;

  return (
    <div
      className={`overflow-hidden bg-white ${className ?? ""}`}
      data-chart-renderer="ephemeris-svg"
    >
      <iframe
        title={title}
        srcDoc={srcDoc}
        className="aspect-square w-full border-0 bg-white"
        sandbox="allow-same-origin"
        loading="lazy"
      />
    </div>
  );
}
