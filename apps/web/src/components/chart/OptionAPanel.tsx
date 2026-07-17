"use client";

import { useCallback } from "react";

import { ClassicAstrolabeChart } from "@/components/chart/ClassicAstrolabeChart";
import type { ChartPayload } from "@/lib/chart/types";

/** Legacy panel — prefers DesignPreview; kept for compatibility. */
const SVG_ID = "classic-astrolabe-chart";

type OptionAPanelProps = {
  chart: ChartPayload;
  compact?: boolean;
};

export function OptionAPanel({ chart, compact = false }: OptionAPanelProps) {
  const downloadSvg = useCallback(() => {
    const el = document.getElementById(SVG_ID);
    if (!el) return;
    const clone = el.cloneNode(true) as SVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const payload = `<?xml version="1.0" encoding="UTF-8"?>\n${clone.outerHTML}`;
    const blob = new Blob([payload], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cosmographic-classic-${chart.meta.utc.replace(/[:.]/g, "-")}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [chart.meta.utc]);

  return (
    <div className={`flex flex-col gap-4 ${compact ? "" : "animate-fade-up"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-electric-blue)]">
            Classic · Cosmographic
          </p>
          <h3 className="text-base font-medium text-[var(--color-star)]">
            Flat natal astrolabe
          </h3>
        </div>
        <button type="button" onClick={downloadSvg} className="cg-btn-ghost">
          Download SVG
        </button>
      </div>
      <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-panel-border)]">
        <ClassicAstrolabeChart chart={chart} svgId={SVG_ID} className="h-full w-full p-2" />
      </div>
    </div>
  );
}
