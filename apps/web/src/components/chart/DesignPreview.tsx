"use client";

import { useCallback } from "react";

import { ClassicAstrolabeChart } from "@/components/chart/ClassicAstrolabeChart";
import { ClassicPrintNatalChart } from "@/components/chart/ClassicPrintNatalChart";
import type { ChartPayload } from "@/lib/chart/types";

/** SVG exported to Shopify / Printify — primary print design */
export const PRINT_SVG_ID = "classic-print-natal-chart";
/** @deprecated alias — checkout still uses print SVG */
export const CLASSIC_SVG_ID = PRINT_SVG_ID;

export type ChartStyle = "print" | "cosmographic";

type DesignPreviewProps = {
  chart: ChartPayload;
  compact?: boolean;
  style?: ChartStyle;
  onStyleChange?: (style: ChartStyle) => void;
};

/**
 * Design preview: Print Classic (primary) + Cosmographic neon (option B).
 * Checkout always serializes the print SVG when style=print.
 */
export function DesignPreview({
  chart,
  compact = false,
  style = "print",
  onStyleChange,
}: DesignPreviewProps) {
  const downloadSvg = useCallback(() => {
    const id = style === "print" ? PRINT_SVG_ID : "cosmographic-style-chart";
    const el = document.getElementById(id);
    if (!el) return;
    const clone = el.cloneNode(true) as SVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    if (style === "print") {
      clone.style.background = "#000000";
    }
    const payload = `<?xml version="1.0" encoding="UTF-8"?>\n${clone.outerHTML}`;
    const blob = new Blob([payload], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = chart.meta.utc.replace(/[:.]/g, "-");
    a.href = url;
    a.download =
      style === "print"
        ? `cosmographic-print-natal-${stamp}.svg`
        : `cosmographic-style-natal-${stamp}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [chart.meta.utc, style]);

  return (
    <div className={`flex flex-col gap-4 ${compact ? "" : "animate-fade-up"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-electric-blue)]">
            Natal chart
          </p>
          <h3 className="text-base font-medium text-[var(--color-star)]">
            {style === "print"
              ? "Cosmographic Print Chart"
              : "Cosmographic Style Chart"}
          </h3>
          {!compact && (
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {style === "print"
                ? "Black cosmographic wheel · exterior planets · color-coded Swiss Ephemeris data"
                : "Neon galaxy wheel · ringed astrolabe · secondary look"}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onStyleChange && (
            <div className="cg-toggle" role="group" aria-label="Chart style">
              <button
                type="button"
                className="cg-toggle-btn"
                data-active={style === "print"}
                onClick={() => onStyleChange("print")}
              >
                PRINT
              </button>
              <button
                type="button"
                className="cg-toggle-btn"
                data-active={style === "cosmographic"}
                onClick={() => onStyleChange("cosmographic")}
              >
                COSMO
              </button>
            </div>
          )}
          <button type="button" onClick={downloadSvg} className="cg-btn-ghost">
            Download SVG
          </button>
        </div>
      </div>

      <div
        className="relative mx-auto aspect-square w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-panel-border)]"
        style={{
          maxWidth: compact ? "280px" : "36rem",
          background:
            style === "print"
              ? "#000000"
              : "radial-gradient(circle at 50% 42%, rgba(11,31,74,0.75) 0%, rgba(3,7,18,0.45) 70%)",
        }}
      >
        {/* Print SVG always mounted — checkout / Printify export target */}
        <div
          className={style === "print" ? "h-full w-full" : "sr-only"}
          aria-hidden={style !== "print"}
        >
          <ClassicPrintNatalChart
            chart={chart}
            svgId={PRINT_SVG_ID}
            className="h-full w-full"
          />
        </div>
        {style === "cosmographic" && (
          <ClassicAstrolabeChart
            chart={chart}
            svgId="cosmographic-style-chart"
            className="h-full w-full p-2"
          />
        )}
      </div>
    </div>
  );
}
