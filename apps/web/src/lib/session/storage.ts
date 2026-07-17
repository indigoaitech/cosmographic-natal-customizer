import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { saveDesignAsset } from "@/lib/design/storage";
import { log } from "@/lib/logging/logger";
import { backArtboard, frontArtboard, toPrintReadySvg } from "@/lib/print/artboard";
import { lookupSession } from "@/lib/session/lifecycle";
import type {
  CreateSessionInput,
  PersonalizationSession,
} from "@/lib/session/types";

const SESSION_TTL_MS = 1000 * 60 * 60 * 72; // 72h

function sessionsDir(): string {
  const configured = process.env.SESSION_STORAGE_PATH?.trim();
  if (configured) {
    fs.mkdirSync(configured, { recursive: true });
    return configured;
  }
  const base =
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
      ? path.join("/tmp", "cosmographic", "sessions")
      : path.join(process.cwd(), "data", "sessions");
  fs.mkdirSync(base, { recursive: true });
  return base;
}

function newSessionId(): string {
  return crypto.randomUUID();
}

function assetUrl(origin: string, visualId: string, format: "svg" | "json"): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/api/design/${encodeURIComponent(visualId)}?format=${format}`;
}

/**
 * Persist front + back print SVGs (300 DPI artboard metadata) under a session UUID.
 */
export function createPersonalizationSession(
  input: CreateSessionInput,
): PersonalizationSession {
  const frontSvg = toPrintReadySvg(input.frontSvg, frontArtboard());
  const backSvg = toPrintReadySvg(input.backSvg, backArtboard());

  const front = saveDesignAsset({
    svg: frontSvg,
    designOption: "A",
    printSide: "front",
    chartSummary: input.chartSummary,
    meta: {
      utc: input.chart.meta.utc,
      timezone: input.chart.meta.timezone,
      place: input.chart.meta.placeLabel,
      role: "front_wheel",
      dpi: String(frontArtboard().dpi),
      widthIn: String(frontArtboard().widthIn),
      heightIn: String(frontArtboard().heightIn),
    },
  });

  const back = saveDesignAsset({
    svg: backSvg,
    designOption: "A",
    printSide: "back",
    chartSummary: input.chartSummary,
    meta: {
      utc: input.chart.meta.utc,
      timezone: input.chart.meta.timezone,
      place: input.chart.meta.placeLabel,
      role: "back_table",
      dpi: String(backArtboard().dpi),
      widthIn: String(backArtboard().widthIn),
      heightIn: String(backArtboard().heightIn),
    },
  });

  const sessionId = newSessionId();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const origin = input.publicOrigin;

  const storeSnapshot = process.env.SESSION_STORE_CHART_SNAPSHOT === "1";

  const session: PersonalizationSession = {
    sessionId,
    createdAt,
    expiresAt,
    birth: input.birth,
    chartSummary: input.chartSummary,
    visualIdFront: front.visualId,
    visualIdBack: back.visualId,
    printFrontUrl: assetUrl(origin, front.visualId, "svg"),
    printBackUrl: assetUrl(origin, back.visualId, "svg"),
    previewFrontUrl: assetUrl(origin, front.visualId, "svg"),
    previewBackUrl: assetUrl(origin, back.visualId, "svg"),
    chartMeta: {
      utc: input.chart.meta.utc,
      timezone: input.chart.meta.timezone,
      placeLabel: input.chart.meta.placeLabel,
      asc: input.chart.angles.asc,
      mc: input.chart.angles.mc,
    },
    chartSnapshot: storeSnapshot
      ? {
          meta: input.chart.meta,
          planets: input.chart.planets,
          houses: input.chart.houses,
          angles: input.chart.angles,
          aspects: input.chart.aspects,
        }
      : undefined,
  };

  const file = path.join(sessionsDir(), `${sessionId}.json`);
  fs.writeFileSync(file, JSON.stringify(session, null, 2), "utf8");
  log.info("session.created", {
    sessionId,
    visualIdFront: front.visualId,
    visualIdBack: back.visualId,
  });
  return session;
}

export function getPersonalizationSession(
  sessionId: string,
): PersonalizationSession | null {
  const result = lookupSession(sessionId);
  return result.status === "ok" ? result.session : null;
}

/**
 * Build Shopify personalized-collection redirect URL.
 * Default: https://www.cosmographic.store/collections/personalized?session_id=…
 */
export function buildPersonalizedCatalogUrl(sessionId: string): string {
  const configured = process.env.SHOPIFY_PERSONALIZED_COLLECTION_URL?.trim();
  if (configured) {
    const url = new URL(configured);
    url.searchParams.set("session_id", sessionId);
    return url.toString();
  }

  const domain = (
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "www.cosmographic.store"
  )
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  const collection =
    process.env.SHOPIFY_PERSONALIZED_COLLECTION_HANDLE || "personalized";

  return `https://${domain}/collections/${collection}?session_id=${encodeURIComponent(sessionId)}`;
}
