import { NextRequest, NextResponse } from "next/server";

import { track } from "@/lib/analytics/track";
import { AppError, toErrorResponse } from "@/lib/errors/appError";
import { log } from "@/lib/logging/logger";
import { corsHeaders, isOriginAllowed } from "@/lib/security/cors";
import { lookupSession } from "@/lib/session/lifecycle";
import {
  deletePersonalizationSession,
  toPublicSessionPreview,
} from "@/lib/session/privacy";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ sessionId: string }> };

/**
 * Shopify theme / Printify webhook fetches session by UUID.
 * Default response is a privacy-minimized preview (no full chart snapshot).
 * ?format=full requires SESSION_API_TOKEN bearer (ops / fulfillment).
 */
export async function GET(req: NextRequest, context: RouteContext) {
  const origin = req.headers.get("origin");
  if (origin && !isOriginAllowed(origin)) {
    const { status, body } = toErrorResponse(
      new AppError("UNAUTHORIZED", "Origin not allowed", {
        recovery: "Configure CORS_ALLOWED_ORIGINS to include your Shopify domain.",
      }),
    );
    return NextResponse.json(body, {
      status,
      headers: corsHeaders(origin),
    });
  }

  const { sessionId } = await context.params;
  const lookup = lookupSession(sessionId);
  const headers = {
    ...corsHeaders(origin),
    "Cache-Control": "private, max-age=60",
  };

  if (lookup.status === "invalid_id" || lookup.status === "missing") {
    const { status, body } = toErrorResponse(
      new AppError("SESSION_NOT_FOUND", "Unknown session_id", {
        recovery:
          "Return to the customizer and click Create My Personalized Products again.",
      }),
    );
    return NextResponse.json(body, { status, headers });
  }

  if (lookup.status === "expired") {
    const { status, body } = toErrorResponse(
      new AppError("SESSION_EXPIRED", "Personalization session expired", {
        recovery:
          "Sessions last 72 hours. Generate your chart again to create a new session.",
      }),
    );
    return NextResponse.json(body, { status, headers });
  }

  const session = lookup.session;
  const format = req.nextUrl.searchParams.get("format") || "preview";

  if (format === "full") {
    const token = process.env.SESSION_API_TOKEN?.trim();
    const auth = req.headers.get("authorization") || "";
    const ok = token && auth === `Bearer ${token}`;
    if (!ok) {
      const { status, body } = toErrorResponse(
        new AppError("UNAUTHORIZED", "Full session requires SESSION_API_TOKEN", {
          recovery:
            "Use ?format=preview for theme scripts, or set Authorization: Bearer …",
        }),
      );
      return NextResponse.json(body, { status, headers });
    }
    return NextResponse.json(session, { headers });
  }

  return NextResponse.json(toPublicSessionPreview(session), { headers });
}

/** GDPR erasure */
export async function DELETE(req: NextRequest, context: RouteContext) {
  const origin = req.headers.get("origin");
  const { sessionId } = await context.params;
  const deleted = deletePersonalizationSession(sessionId);
  track("privacy_delete_requested", { ok: deleted });
  log.info("session.deleted", { sessionId, deleted: deleted ? 1 : 0 });

  if (!deleted) {
    const { status, body } = toErrorResponse(
      new AppError("SESSION_NOT_FOUND", "Session not found or already deleted", {
        recovery: "No further action needed — data is not stored under this id.",
      }),
    );
    return NextResponse.json(body, { status, headers: corsHeaders(origin) });
  }

  return NextResponse.json(
    { ok: true, deleted: true, sessionId },
    { headers: corsHeaders(origin) },
  );
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}
