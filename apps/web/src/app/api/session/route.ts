import { NextRequest, NextResponse } from "next/server";

import { AppError, toErrorResponse } from "@/lib/errors/appError";
import { log } from "@/lib/logging/logger";
import { corsHeaders, isOriginAllowed } from "@/lib/security/cors";
import {
  buildPersonalizedCatalogUrl,
  createPersonalizationSession,
} from "@/lib/session/storage";
import type { ChartPayload } from "@/lib/chart/types";
import {
  formatValidationError,
  validateBirthInput,
} from "@/lib/validation/birth";
import { track } from "@/lib/analytics/track";

export const runtime = "nodejs";

type SessionBody = {
  frontSvg?: string;
  backSvg?: string;
  chartSummary?: string;
  birth?: {
    dateOfBirth?: string;
    timeOfBirth?: string;
    city?: string;
    country?: string;
  };
  chart?: ChartPayload;
};

function resolvePublicOrigin(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "localhost:3000";
  return `${proto}://${host}`;
}

/**
 * Create a personalization session: front wheel + back table SVGs → UUID.
 */
export async function POST(req: NextRequest) {
  let body: SessionBody;
  try {
    body = await req.json();
  } catch {
    const { status, body: err } = toErrorResponse(
      new AppError("VALIDATION_FAILED", "Invalid JSON", {
        recovery: "Retry the request with a valid JSON body.",
      }),
    );
    return NextResponse.json(err, { status });
  }

  try {
    if (!body.frontSvg || body.frontSvg.length < 100) {
      throw new AppError(
        "RENDER_FAILED",
        "frontSvg (natal wheel) is required",
        {
          recovery: "Generate the chart and wait for the front preview to render.",
        },
      );
    }
    if (!body.backSvg || body.backSvg.length < 100) {
      throw new AppError(
        "RENDER_FAILED",
        "backSvg (planet table) is required",
        {
          recovery: "Generate the chart and wait for the back table to render.",
        },
      );
    }
    if (!body.chart?.meta || !body.chart.planets?.length) {
      throw new AppError("VALIDATION_FAILED", "chart payload is required", {
        recovery: "Re-run chart generation before creating products.",
      });
    }

    const birth = {
      dateOfBirth: body.birth?.dateOfBirth?.trim() || "",
      timeOfBirth: body.birth?.timeOfBirth?.trim() || "",
      city: body.birth?.city?.trim() || "",
      country: body.birth?.country?.trim() || "",
    };

    const fieldErrors = validateBirthInput(birth);
    if (fieldErrors.length) {
      throw new AppError("VALIDATION_FAILED", formatValidationError(fieldErrors), {
        fields: fieldErrors.map((e) => ({
          field: e.field,
          message: e.message,
        })),
        recovery: fieldErrors[0]?.recovery,
      });
    }

    const session = createPersonalizationSession({
      birth,
      chartSummary: body.chartSummary?.trim() || body.chart.meta.placeLabel,
      frontSvg: body.frontSvg,
      backSvg: body.backSvg,
      chart: body.chart,
      publicOrigin: resolvePublicOrigin(req),
    });

    const catalogUrl = buildPersonalizedCatalogUrl(session.sessionId);
    track("session_created", { sessionId: session.sessionId });
    track("catalog_redirect");

    return NextResponse.json({
      ok: true,
      sessionId: session.sessionId,
      catalogUrl,
      expiresAt: session.expiresAt,
      printFrontUrl: session.printFrontUrl,
      printBackUrl: session.printBackUrl,
      visualIdFront: session.visualIdFront,
      visualIdBack: session.visualIdBack,
      dpi: 300,
    });
  } catch (err) {
    log.error("session.create_failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
    const { status, body: errBody } = toErrorResponse(err);
    return NextResponse.json(errBody, { status });
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}
