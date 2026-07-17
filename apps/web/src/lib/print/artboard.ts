/**
 * Print asset engine — physical dimensions @ 300 DPI for POD vendors.
 */

import { POD } from "@/lib/chart/pod";

export type PrintSideRole = "front_wheel" | "back_table";

export type PrintArtboard = {
  role: PrintSideRole;
  widthPx: number;
  heightPx: number;
  widthIn: number;
  heightIn: number;
  dpi: number;
  viewBox: string;
};

/** Front wheel — square chest print zone @ 300 DPI (10" × 10"). */
export function frontArtboard(): PrintArtboard {
  const widthIn = 10;
  const heightIn = 10;
  const dpi = POD.dpi;
  const widthPx = widthIn * dpi;
  const heightPx = heightIn * dpi;
  return {
    role: "front_wheel",
    widthPx,
    heightPx,
    widthIn,
    heightIn,
    dpi,
    viewBox: "0 0 1000 1000",
  };
}

/** Back table — portrait upper-back zone @ 300 DPI (10" × 14"). */
export function backArtboard(): PrintArtboard {
  const widthIn = 10;
  const heightIn = 14;
  const dpi = POD.dpi;
  const widthPx = widthIn * dpi;
  const heightPx = heightIn * dpi;
  return {
    role: "back_table",
    widthPx,
    heightPx,
    widthIn,
    heightIn,
    dpi,
    viewBox: "0 0 1000 1400",
  };
}

/**
 * Upgrade an in-browser SVG string to print-ready markup:
 * physical width/height at 300 DPI + stable namespaces.
 */
export function toPrintReadySvg(
  svgMarkup: string,
  artboard: PrintArtboard,
): string {
  let svg = svgMarkup.trim();
  if (!svg.startsWith("<?xml")) {
    svg = `<?xml version="1.0" encoding="UTF-8"?>\n${svg}`;
  }

  // Inject / replace width, height, viewBox on root <svg>
  svg = svg.replace(/<svg\b([^>]*)>/i, (_full, attrs: string) => {
    let next = attrs
      .replace(/\swidth="[^"]*"/gi, "")
      .replace(/\sheight="[^"]*"/gi, "")
      .replace(/\sviewBox="[^"]*"/gi, "");
    next += ` viewBox="${artboard.viewBox}"`;
    next += ` width="${artboard.widthPx}" height="${artboard.heightPx}"`;
    next += ` data-dpi="${artboard.dpi}"`;
    next += ` data-width-in="${artboard.widthIn}" data-height-in="${artboard.heightIn}"`;
    next += ` data-print-role="${artboard.role}"`;
    if (!/\sxmlns=/.test(next)) {
      next += ` xmlns="http://www.w3.org/2000/svg"`;
    }
    return `<svg${next}>`;
  });

  return svg;
}

/**
 * Minimal PDF wrapper embedding the SVG as a form XObject is vendor-specific.
 * We emit an SVG-in-PDF placeholder comment + recommend SVG/PNG to Printify.
 * For true PDF, wire a headless renderer (e.g. resvg / puppeteer) in production.
 */
export function svgToSimplePdfStub(svgMarkup: string, artboard: PrintArtboard): string {
  const title = `Cosmographic ${artboard.role} ${artboard.widthIn}x${artboard.heightIn}in @${artboard.dpi}dpi`;
  return `%PDF-1.4
% Cosmographic print stub — embed SVG via Printify image upload or convert with resvg.
% ${title}
% SVG_BYTES=${Buffer.byteLength(svgMarkup, "utf8")}
%%EOF
`;
}
