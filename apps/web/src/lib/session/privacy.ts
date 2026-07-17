import fs from "node:fs";
import path from "node:path";

import { getDesignAsset } from "@/lib/design/storage";
import type { PersonalizationSession } from "@/lib/session/types";

function designsDir(): string {
  const configured = process.env.DESIGN_STORAGE_PATH?.trim();
  if (configured) return configured;
  return process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? path.join("/tmp", "cosmographic", "designs")
    : path.join(process.cwd(), "data", "designs");
}

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

/** GDPR erasure — delete session + linked design assets. */
export function deletePersonalizationSession(sessionId: string): boolean {
  const safe = sessionId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safe || safe !== sessionId) return false;
  const file = path.join(sessionsDir(), `${safe}.json`);
  if (!fs.existsSync(file)) return false;

  let session: PersonalizationSession | null = null;
  try {
    session = JSON.parse(fs.readFileSync(file, "utf8")) as PersonalizationSession;
  } catch {
    session = null;
  }

  fs.unlinkSync(file);

  for (const id of [session?.visualIdFront, session?.visualIdBack]) {
    if (!id) continue;
    const design = getDesignAsset(id);
    if (!design) continue;
    const base = path.join(designsDir(), id);
    for (const ext of [".json", ".svg"]) {
      const p = `${base}${ext}`;
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  }

  return true;
}

/** Public-safe session payload — omits full chart snapshot & minimizes birth detail. */
export function toPublicSessionPreview(session: PersonalizationSession) {
  return {
    sessionId: session.sessionId,
    expiresAt: session.expiresAt,
    chartSummary: session.chartSummary,
    visualIdFront: session.visualIdFront,
    visualIdBack: session.visualIdBack,
    printFrontUrl: session.printFrontUrl,
    printBackUrl: session.printBackUrl,
    previewFrontUrl: session.previewFrontUrl,
    previewBackUrl: session.previewBackUrl,
    chartMeta: {
      timezone: session.chartMeta.timezone,
      placeLabel: session.chartMeta.placeLabel,
      // angles only — no DOB in public preview
      asc: session.chartMeta.asc,
      mc: session.chartMeta.mc,
    },
    birth: {
      // Theme needs these for line items; still CORS-restricted
      dateOfBirth: session.birth.dateOfBirth,
      timeOfBirth: session.birth.timeOfBirth,
      city: session.birth.city,
      country: session.birth.country,
    },
  };
}
