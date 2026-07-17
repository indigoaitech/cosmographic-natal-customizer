import { describe, expect, it } from "vitest";

import {
  backArtboard,
  frontArtboard,
  toPrintReadySvg,
} from "@/lib/print/artboard";
import { planPngRaster } from "@/lib/print/raster";

describe("print artboard", () => {
  it("front artboard is 10×10in @ 300 DPI", () => {
    const a = frontArtboard();
    expect(a.dpi).toBe(300);
    expect(a.widthPx).toBe(3000);
    expect(a.heightPx).toBe(3000);
    expect(a.viewBox).toBe("0 0 1000 1000");
  });

  it("back artboard is 10×14in @ 300 DPI", () => {
    const a = backArtboard();
    expect(a.widthPx).toBe(3000);
    expect(a.heightPx).toBe(4200);
  });

  it("toPrintReadySvg injects physical pixel dimensions and dpi metadata", () => {
    const raw = `<svg viewBox="0 0 1000 1000" width="100%" height="100%"><circle r="10"/></svg>`;
    const out = toPrintReadySvg(raw, frontArtboard());
    expect(out).toContain('width="3000"');
    expect(out).toContain('height="3000"');
    expect(out).toContain('data-dpi="300"');
    expect(out).toContain('data-print-role="front_wheel"');
    expect(out.startsWith("<?xml")).toBe(true);
  });

  it("planPngRaster marks print-ready SVG as ready", () => {
    const svg = toPrintReadySvg(
      `<svg viewBox="0 0 1000 1000"><rect width="10" height="10"/></svg>`,
      frontArtboard(),
    );
    const plan = planPngRaster(svg, frontArtboard());
    expect(plan.readyForRaster).toBe(true);
    expect(plan.blockers).toEqual([]);
  });
});
