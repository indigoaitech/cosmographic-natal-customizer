"use client";

import { useState } from "react";

import { ClassicPrintNatalChart } from "@/components/chart/ClassicPrintNatalChart";
import {
  PRINT_ZONE,
  TShirtSilhouette,
} from "@/components/mockup/TShirtSilhouette";
import type { ChartPayload } from "@/lib/chart/types";

export type PrintSide = "front" | "back";

type TShirtMockupProps = {
  chart: ChartPayload;
  printSide?: PrintSide;
  onPrintSideChange?: (side: PrintSide) => void;
};

function PrintOverlay({
  chart,
  side,
}: {
  chart: ChartPayload;
  side: PrintSide;
}) {
  const zone = PRINT_ZONE[side];
  const style = {
    left: `${(zone.x / 400) * 100}%`,
    top: `${(zone.y / 500) * 100}%`,
    width: `${(zone.size / 400) * 100}%`,
    height: `${(zone.size / 500) * 100}%`,
  };

  return (
    <div
      className="pointer-events-none absolute overflow-hidden rounded-md bg-black"
      style={style}
    >
      <div className="flex h-full w-full items-center justify-center">
        <ClassicPrintNatalChart
          chart={chart}
          svgId={`mock-print-${side}`}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}

export function TShirtMockup({
  chart,
  printSide: controlledSide,
  onPrintSideChange,
}: TShirtMockupProps) {
  const [internalSide, setInternalSide] = useState<PrintSide>("front");
  const side = controlledSide ?? internalSide;

  function setSide(next: PrintSide) {
    onPrintSideChange?.(next);
    if (controlledSide === undefined) setInternalSide(next);
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-neon-pink-soft)]">
            Live mock-up engine
          </p>
          <h3 className="mt-1 text-lg font-medium text-[var(--color-star)]">
            Apparel preview
          </h3>
          <p className="mt-1 max-w-md text-xs text-[var(--color-muted)]">
            FRONT / BACK baskı yerleşimini görüntüle.
          </p>
        </div>

        <div className="cg-toggle" role="group" aria-label="Print side">
          <button
            type="button"
            className="cg-toggle-btn"
            data-side="front"
            data-active={side === "front"}
            aria-pressed={side === "front"}
            onClick={() => setSide("front")}
          >
            FRONT
          </button>
          <button
            type="button"
            className="cg-toggle-btn"
            data-side="back"
            data-active={side === "back"}
            aria-pressed={side === "back"}
            onClick={() => setSide("back")}
          >
            BACK
          </button>
        </div>
      </div>

      <div className="mockup-stage rounded-[var(--radius-lg)] border border-[var(--color-panel-border)] bg-[rgba(3,7,18,0.45)] px-4 py-6 sm:px-8">
        <div className="mockup-flipper" data-side={side}>
          <div className="mockup-face mockup-face--front">
            <div className="relative h-full w-full">
              <TShirtSilhouette side="front" className="h-full w-full" />
              <PrintOverlay chart={chart} side="front" />
            </div>
          </div>
          <div className="mockup-face mockup-face--back">
            <div className="relative h-full w-full">
              <TShirtSilhouette side="back" className="h-full w-full" />
              <PrintOverlay chart={chart} side="back" />
            </div>
          </div>
        </div>

        <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-muted)]">
          Print side ·{" "}
          <span
            className={
              side === "front"
                ? "text-[var(--color-electric-blue)]"
                : "text-[var(--color-neon-pink)]"
            }
          >
            {side}
          </span>
        </p>
      </div>
    </section>
  );
}
