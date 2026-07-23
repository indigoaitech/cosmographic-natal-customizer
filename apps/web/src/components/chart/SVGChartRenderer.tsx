"use client";

import { useMemo } from "react";

type SVGChartRendererProps = {
  /** Complete SVG markup from ephemeris `/v1/natal-chart-svg` */
  svgMarkup: string;
  className?: string;
  title?: string;
};

/**
 * Displays a server-rendered Astrotheme-style natal chart SVG inline.
 * Print-ready: white ground, exact colors, responsive square frame.
 */
export function SVGChartRenderer({
  svgMarkup,
  className,
  title = "Natal chart",
}: SVGChartRendererProps) {
  const cleanSvg = useMemo(() => {
    if (!svgMarkup.includes("<svg")) return null;
    return svgMarkup
      .replace(/<\?xml[^?]*\?>/i, "")
      .replace(/<!DOCTYPE[^>]*>/i, "")
      .trim();
  }, [svgMarkup]);

  if (!cleanSvg) {
    return (
      <div
        className={`flex min-h-[280px] items-center justify-center bg-white text-sm text-neutral-500 ${className ?? ""}`}
      >
        Chart preview unavailable
      </div>
    );
  }

  return (
    <div
      className={`chart-svg-frame overflow-hidden bg-white print:break-inside-avoid ${className ?? ""}`}
      data-chart-renderer="ephemeris-svg"
      style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
    >
      <div
        role="img"
        aria-label={title}
        className="aspect-square w-full [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-full print:[&_svg]:w-[190mm]"
        dangerouslySetInnerHTML={{ __html: cleanSvg }}
      />
    </div>
  );
}
