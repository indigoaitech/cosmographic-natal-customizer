"use client";

import type { InterpretationRow } from "@/lib/chart/types";

type PlacementSummaryTableProps = {
  rows: InterpretationRow[];
};

const KIND_LABEL: Record<InterpretationRow["kind"], string> = {
  planet_sign: "Planet · Sign",
  planet_house: "Planet · House",
  house_sign: "House · Sign",
};

export function PlacementSummaryTable({ rows }: PlacementSummaryTableProps) {
  if (!rows.length) return null;

  const planetSign = rows.filter((r) => r.kind === "planet_sign").slice(0, 8);
  const houseSign = rows
    .filter((r) => r.kind === "house_sign")
    .filter((r) => ["1st", "4th", "7th", "10th"].some((o) => r.label.startsWith(o)))
    .slice(0, 4);
  const planetHouse = rows.filter((r) => r.kind === "planet_house").slice(0, 6);
  const display = [...planetSign, ...houseSign, ...planetHouse];

  return (
    <section className="panel-glass animate-fade-up overflow-hidden">
      <div className="border-b border-[var(--color-panel-border)] px-5 py-5 sm:px-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-electric-blue)]">
          Your chart story
        </p>
        <h2 className="mt-1 text-xl font-medium text-[var(--color-star)]">
          Placement highlights
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted)]">
          Short, clear reads from your Swiss Ephemeris positions — what each
          placement generally means before you print it on apparel.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-panel-border)] bg-[rgba(11,31,74,0.55)] font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
              <th className="px-5 py-3 font-medium sm:px-6">Type</th>
              <th className="px-5 py-3 font-medium sm:px-6">Placement</th>
              <th className="px-5 py-3 font-medium sm:px-6">Meaning</th>
            </tr>
          </thead>
          <tbody>
            {display.map((row, i) => (
              <tr
                key={row.key}
                className="border-b border-[var(--color-panel-border)]/70 align-top transition last:border-b-0 hover:bg-[rgba(30,224,255,0.04)]"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[10px] text-[var(--color-neon-pink-soft)] sm:px-6">
                  {KIND_LABEL[row.kind]}
                </td>
                <td className="px-5 py-3.5 font-medium text-[var(--color-electric-blue)] sm:px-6">
                  {row.label}
                </td>
                <td className="px-5 py-3.5 leading-relaxed text-[var(--color-star)]/90 sm:px-6">
                  {row.summary}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
