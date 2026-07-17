"use client";

import { useMemo, useState } from "react";

import {
  PRODUCT_CATALOG,
  type ProductKind,
} from "@/lib/catalog/products";

type ProductCatalogProps = {
  selected: ProductKind;
  onSelect: (kind: ProductKind) => void;
};

/**
 * Personalized product picker — maps to Shopify variants via env.
 * Extensible for posters, canvas, cases, jewelry (disabled until wired).
 */
export function ProductCatalog({ selected, onSelect }: ProductCatalogProps) {
  const products = useMemo(
    () => PRODUCT_CATALOG.filter((p) => p.enabled || p.kind === selected),
    [selected],
  );

  return (
    <section className="space-y-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-electric-blue)]">
          Your products
        </p>
        <h3 className="mt-1 text-lg font-medium text-[var(--color-star)]">
          Personalized catalog
        </h3>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Same birth chart · consistent front/back layout across garments. Select
          a product to preview, then open your Shopify catalog.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {products.map((p) => {
          const active = selected === p.kind;
          const soon = !p.enabled;
          return (
            <button
              key={p.kind}
              type="button"
              disabled={soon}
              onClick={() => onSelect(p.kind)}
              className="rounded-[var(--radius-md)] border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45"
              style={{
                borderColor: active
                  ? "var(--color-electric-blue)"
                  : "var(--color-panel-border)",
                background: active
                  ? "rgba(11, 31, 74, 0.75)"
                  : "rgba(3, 7, 18, 0.35)",
                boxShadow: active ? "var(--glow-blue)" : "none",
              }}
              aria-pressed={active}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-muted)]">
                {soon ? "Coming soon" : p.printSides.join(" + ")}
              </p>
              <h4 className="mt-1 text-sm font-medium text-[var(--color-star)]">
                {p.title}
              </h4>
              <p className="mt-1 text-xs text-[var(--color-muted)]">{p.subtitle}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function useProductSelection(initial: ProductKind = "tee") {
  const [kind, setKind] = useState<ProductKind>(initial);
  return { kind, setKind };
}
