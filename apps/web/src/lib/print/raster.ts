/**
 * Future PNG rasterization readiness — documents the contract for resvg/sharp.
 * Does not rasterize yet; validates SVG is print-ready for downstream conversion.
 */

import type { PrintArtboard } from "@/lib/print/artboard";

export type RasterPlan = {
  format: "png";
  dpi: number;
  widthPx: number;
  heightPx: number;
  colorSpace: "sRGB";
  transparentBackground: boolean;
  readyForRaster: boolean;
  blockers: string[];
};

export function planPngRaster(
  svgMarkup: string,
  artboard: PrintArtboard,
): RasterPlan {
  const blockers: string[] = [];
  if (!svgMarkup.includes("<svg")) blockers.push("missing_svg_root");
  if (!/data-dpi="/i.test(svgMarkup) && artboard.dpi !== 300) {
    blockers.push("missing_dpi_metadata");
  }
  if (artboard.widthPx < 1000 || artboard.heightPx < 1000) {
    blockers.push("artboard_too_small_for_apparel");
  }

  return {
    format: "png",
    dpi: artboard.dpi,
    widthPx: artboard.widthPx,
    heightPx: artboard.heightPx,
    colorSpace: "sRGB",
    transparentBackground: artboard.role === "front_wheel",
    readyForRaster: blockers.length === 0,
    blockers,
  };
}

/**
 * Hook point for production: spawn resvg-js / sharp once dependency is added.
 */
export async function rasterizeSvgToPng(_svg: string, _artboard: PrintArtboard): Promise<Buffer> {
  void _svg;
  void _artboard;
  throw new Error(
    "PNG rasterization not installed. Add @resvg/resvg-js (or sharp) and implement rasterizeSvgToPng.",
  );
}
