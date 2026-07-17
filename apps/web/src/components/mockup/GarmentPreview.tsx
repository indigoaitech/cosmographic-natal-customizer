"use client";

import { useMemo, useState } from "react";

import { BackPlacementPrint } from "@/components/chart/BackPlacementPrint";
import { ClassicPrintNatalChart } from "@/components/chart/ClassicPrintNatalChart";
import type { ChartPayload } from "@/lib/chart/types";

export type GarmentKind = "tee" | "hoodie" | "crew";
export type PrintSide = "front" | "back";

type GarmentPreviewProps = {
  chart: ChartPayload;
  printSide?: PrintSide;
  onPrintSideChange?: (side: PrintSide) => void;
  garment?: GarmentKind;
  onGarmentChange?: (garment: GarmentKind) => void;
};

const GARMENTS: Array<{ id: GarmentKind; label: string }> = [
  { id: "tee", label: "Tee" },
  { id: "hoodie", label: "Hoodie" },
  { id: "crew", label: "Crew" },
];

/**
 * Photorealistic-leaning garment stage:
 * - print sits in chest / upper-back safe zone
 * - multiply blend + fabric shadow mask for fold/shadow integration
 * - perspective tilt for 3D-style depth
 */
export function GarmentPreview({
  chart,
  printSide: controlledSide,
  onPrintSideChange,
  garment: controlledGarment,
  onGarmentChange,
}: GarmentPreviewProps) {
  const [internalSide, setInternalSide] = useState<PrintSide>("front");
  const [internalGarment, setInternalGarment] = useState<GarmentKind>("tee");
  const [zoom, setZoom] = useState(1);
  const side = controlledSide ?? internalSide;
  const garment = controlledGarment ?? internalGarment;

  function setSide(next: PrintSide) {
    onPrintSideChange?.(next);
    if (controlledSide === undefined) setInternalSide(next);
  }

  function setGarment(next: GarmentKind) {
    onGarmentChange?.(next);
    if (controlledGarment === undefined) setInternalGarment(next);
  }

  const zone = useMemo(() => {
    if (side === "back") {
      return { top: "18%", left: "22%", width: "56%", height: "48%" };
    }
    return { top: "22%", left: "24%", width: "52%", height: "42%" };
  }, [side]);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-neon-pink-soft)]">
            Product preview
          </p>
          <h3 className="mt-1 text-lg font-medium text-[var(--color-star)]">
            Printify-style garment mockup
          </h3>
          <p className="mt-1 max-w-md text-xs text-[var(--color-muted)]">
            Front natal wheel · back planet table. Blend modes wrap the design
            into fabric shadows and folds.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="cg-toggle" role="group" aria-label="Garment">
            {GARMENTS.map((g) => (
              <button
                key={g.id}
                type="button"
                className="cg-toggle-btn"
                data-active={garment === g.id}
                onClick={() => setGarment(g.id)}
              >
                {g.label}
              </button>
            ))}
          </div>
          <div className="cg-toggle" role="group" aria-label="Print side">
            <button
              type="button"
              className="cg-toggle-btn"
              data-active={side === "front"}
              onClick={() => setSide("front")}
            >
              FRONT
            </button>
            <button
              type="button"
              className="cg-toggle-btn"
              data-active={side === "back"}
              onClick={() => setSide("back")}
            >
              BACK
            </button>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-panel-border)] bg-[rgba(3,7,18,0.55)] p-4 sm:p-8">
        <div
          className="garment-stage mx-auto"
          data-garment={garment}
          data-side={side}
          style={{
            transform: `scale(${zoom}) perspective(1200px) rotateY(${side === "back" ? 6 : -6}deg) rotateX(4deg)`,
          }}
        >
          <div className="garment-body">
            {garment === "hoodie" && <div className="garment-hood" aria-hidden />}
            <div className="garment-sleeve garment-sleeve--left" aria-hidden />
            <div className="garment-sleeve garment-sleeve--right" aria-hidden />
            <div className="garment-torso">
              <div className="garment-fold garment-fold--1" aria-hidden />
              <div className="garment-fold garment-fold--2" aria-hidden />
              <div className="garment-shadow-mask" aria-hidden />

              <div className="garment-print-zone" style={zone}>
                <div className="garment-print-art">
                  {side === "front" ? (
                    <ClassicPrintNatalChart
                      chart={chart}
                      svgId={`garment-front-${garment}`}
                      className="h-full w-full"
                    />
                  ) : (
                    <BackPlacementPrint
                      chart={chart}
                      svgId={`garment-back-${garment}`}
                      className="h-full w-full"
                    />
                  )}
                </div>
              </div>
            </div>
            {garment !== "tee" && <div className="garment-hem" aria-hidden />}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Zoom
            <input
              type="range"
              min={0.85}
              max={1.35}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-28 accent-[var(--color-electric-blue)]"
            />
          </label>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-muted)]">
            {garment} ·{" "}
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
      </div>
    </section>
  );
}
