import fs from "node:fs";
import path from "node:path";

import type { PersonalizationSession } from "@/lib/session/types";

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

export type SessionLookup =
  | { status: "ok"; session: PersonalizationSession }
  | { status: "missing" }
  | { status: "expired"; sessionId: string }
  | { status: "invalid_id" };

export function lookupSession(sessionId: string): SessionLookup {
  const safe = sessionId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safe || safe !== sessionId) return { status: "invalid_id" };
  const file = path.join(sessionsDir(), `${safe}.json`);
  if (!fs.existsSync(file)) return { status: "missing" };

  let session: PersonalizationSession;
  try {
    session = JSON.parse(fs.readFileSync(file, "utf8")) as PersonalizationSession;
  } catch {
    return { status: "missing" };
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    return { status: "expired", sessionId: safe };
  }
  return { status: "ok", session };
}

/** Delete expired session JSON files. Returns count removed. */
export function purgeExpiredSessions(now = Date.now()): number {
  const dir = sessionsDir();
  let removed = 0;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".json")) continue;
    const file = path.join(dir, name);
    try {
      const session = JSON.parse(
        fs.readFileSync(file, "utf8"),
      ) as PersonalizationSession;
      if (new Date(session.expiresAt).getTime() < now) {
        fs.unlinkSync(file);
        removed += 1;
      }
    } catch {
      // leave corrupt files for ops inspection
    }
  }
  return removed;
}
