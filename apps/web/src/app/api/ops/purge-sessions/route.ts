import { NextRequest, NextResponse } from "next/server";

import { log } from "@/lib/logging/logger";
import { purgeExpiredSessions } from "@/lib/session/lifecycle";

export const runtime = "nodejs";

/**
 * Ops maintenance: purge expired personalization sessions.
 * Requires Authorization: Bearer SESSION_API_TOKEN (or CRON_SECRET).
 */
export async function POST(req: NextRequest) {
  const token =
    process.env.SESSION_API_TOKEN?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    "";
  const auth = req.headers.get("authorization") || "";
  if (!token || auth !== `Bearer ${token}`) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const removed = purgeExpiredSessions();
  log.info("session.purge", { removed });
  return NextResponse.json({ ok: true, removed });
}
