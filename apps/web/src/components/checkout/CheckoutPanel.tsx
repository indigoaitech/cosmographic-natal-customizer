"use client";

import { useCallback, useEffect, useState } from "react";

import { PRINT_SVG_ID } from "@/components/chart/DesignPreview";
import type { PrintSide } from "@/components/mockup/TShirtMockup";
import type { ChartPayload } from "@/lib/chart/types";

type ShopifyStatus = {
  configured: boolean;
  missing: string[];
  publicDomain: string;
  shopApi: string;
};

type CheckoutPanelProps = {
  chart: ChartPayload;
  printSide: PrintSide;
  onPrintSideChange: (side: PrintSide) => void;
  birth: {
    dateOfBirth: string;
    timeOfBirth: string;
    city: string;
    country: string;
  };
  /** From product-page CTA ?variant= */
  productVariantId?: string;
};

export function CheckoutPanel({
  chart,
  printSide,
  onPrintSideChange,
  birth,
  productVariantId,
}: CheckoutPanelProps) {
  const [busy, setBusy] = useState<"cart" | "buy" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastVisualId, setLastVisualId] = useState<string | null>(null);
  const [shopifyStatus, setShopifyStatus] = useState<ShopifyStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/shopify/status")
      .then((r) => r.json())
      .then((data: ShopifyStatus) => {
        if (!cancelled) setShopifyStatus(data);
      })
      .catch(() => {
        if (!cancelled) setShopifyStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const chartSummary = [
    chart.meta.placeLabel.split(",")[0],
    `ASC ${chart.angles.asc.toFixed(1)}°`,
    `MC ${chart.angles.mc.toFixed(1)}°`,
    birth.dateOfBirth,
  ]
    .filter(Boolean)
    .join(" · ");

  const serializeSvg = useCallback((): string | null => {
    const el = document.getElementById(PRINT_SVG_ID);
    if (!el) return null;
    const clone = el.cloneNode(true) as SVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return `<?xml version="1.0" encoding="UTF-8"?>\n${clone.outerHTML}`;
  }, []);

  const createCartAndMaybeRedirect = useCallback(
    async (mode: "cart" | "buy") => {
      setBusy(mode);
      setError(null);

      try {
        const svg = serializeSvg();
        if (!svg) {
          throw new Error("Print SVG bulunamadı — önce haritayı oluşturun.");
        }

        const designRes = await fetch("/api/design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            svg,
            designOption: "A",
            printSide,
            chartSummary,
            meta: {
              utc: chart.meta.utc,
              timezone: chart.meta.timezone,
              place: chart.meta.placeLabel,
            },
          }),
        });
        const designData = await designRes.json();
        if (!designRes.ok) {
          throw new Error(designData.detail || "Tasarım kaydı başarısız");
        }

        setLastVisualId(designData.visualId);

        const cartRes = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visualId: designData.visualId,
            designOption: "A",
            printSide,
            chartSummary,
            dateOfBirth: birth.dateOfBirth,
            timeOfBirth: birth.timeOfBirth,
            birthCity: birth.city,
            birthCountry: birth.country,
            quantity: 1,
            productVariantId: productVariantId || undefined,
          }),
        });
        const cartData = await cartRes.json();
        if (!cartRes.ok) {
          throw new Error(cartData.detail || "Shopify sepet oluşturulamadı");
        }

        if (mode === "buy" && cartData.checkoutUrl) {
          window.location.href = cartData.checkoutUrl as string;
          return;
        }

        if (cartData.checkoutUrl) {
          window.open(
            cartData.checkoutUrl as string,
            "_blank",
            "noopener,noreferrer",
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Checkout failed");
      } finally {
        setBusy(null);
      }
    },
    [birth, chart.meta, chartSummary, printSide, productVariantId, serializeSvg],
  );

  return (
    <section className="panel-glass animate-fade-up space-y-5 p-5 sm:p-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-electric-blue)]">
          Shopify checkout
        </p>
        <h3 className="mt-1 text-lg font-medium text-[var(--color-star)]">
          Sepete ekle / Hemen al
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
          Orijinal astrolabe kaydedilir → checkout{" "}
          <span className="text-[var(--color-star)]">www.cosmographic.store</span>
        </p>
      </div>

      {shopifyStatus && !shopifyStatus.configured && (
        <div
          className="rounded-lg border border-[var(--color-neon-pink)]/40 bg-[var(--color-neon-pink)]/10 px-3 py-2 text-xs text-[var(--color-star)]"
          role="status"
        >
          Shopify henüz bağlanmadı. Admin’de natal tişört oluştur → varyant ID’yi{" "}
          <span className="font-mono text-[var(--color-neon-pink)]">
            SHOPIFY_PRODUCT_VARIANT_ID
          </span>{" "}
          olarak `.env.local`’a ekle. (Partner app / Headless gerekmez.)
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-[var(--color-muted)]">Baskı yüzü</span>
        <div className="cg-toggle" role="group" aria-label="Checkout print side">
          <button
            type="button"
            className="cg-toggle-btn"
            data-side="front"
            data-active={printSide === "front"}
            onClick={() => onPrintSideChange("front")}
          >
            FRONT
          </button>
          <button
            type="button"
            className="cg-toggle-btn"
            data-side="back"
            data-active={printSide === "back"}
            onClick={() => onPrintSideChange("back")}
          >
            BACK
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={!!busy}
          onClick={() => createCartAndMaybeRedirect("cart")}
          className="cg-btn-ghost py-3 text-sm"
        >
          {busy === "cart" ? "Sepet hazırlanıyor…" : "Add to Cart"}
        </button>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => createCartAndMaybeRedirect("buy")}
          className="cg-btn-primary py-3"
        >
          {busy === "buy" ? "Checkout’a gidiliyor…" : "Buy Now"}
        </button>
      </div>

      {lastVisualId && (
        <p className="font-mono text-[10px] text-[var(--color-muted)]">
          visualId ·{" "}
          <span className="text-[var(--color-electric-blue)]">{lastVisualId}</span>
        </p>
      )}

      {error && (
        <p className="text-sm text-[var(--color-neon-pink)]" role="alert">
          {error}
        </p>
      )}

      <ul className="space-y-1 font-mono text-[10px] text-[var(--color-muted)]">
        <li>_design_option · A</li>
        <li>_print_side · {printSide}</li>
        <li>_date_of_birth · {birth.dateOfBirth || "—"}</li>
      </ul>
    </section>
  );
}
