import { NextRequest, NextResponse } from "next/server";

import { AppError, toErrorResponse } from "@/lib/errors/appError";
import { fetchWithTimeout } from "@/lib/http/fetchWithTimeout";
import { frontArtboard, toPrintReadySvg } from "@/lib/print/artboard";
import {
  formatValidationError,
  normalizeBirthTime,
  validateBirthInput,
  type BirthInput,
} from "@/lib/validation/birth";

export const runtime = "nodejs";

const EPHEMERIS_API_URL =
  process.env.EPHEMERIS_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

/**
 * BFF → ephemeris Astrotheme SVG (`POST /v1/natal-chart-svg`).
 *
 * Body: birth fields (dateOfBirth, timeOfBirth, location).
 * Query: `?print=1` upgrades SVG to 300 DPI print artboard attrs.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    const { status, body: err } = toErrorResponse(
      new AppError("VALIDATION_FAILED", "Invalid JSON body", {
        recovery: "Retry with a valid JSON payload.",
      }),
    );
    return NextResponse.json(err, { status });
  }

  const wantPrint = req.nextUrl.searchParams.get("print") === "1";
  const loc = body.location as { city?: string; country?: string } | undefined;

  const birth: BirthInput = {
    dateOfBirth: String(body.dateOfBirth || ""),
    timeOfBirth: normalizeBirthTime(String(body.timeOfBirth || "")),
    city: String(loc?.city || body.city || ""),
    country: String(loc?.country || body.country || ""),
  };

  const fieldErrors = validateBirthInput(birth);
  if (fieldErrors.length) {
    const { status, body: err } = toErrorResponse(
      new AppError("VALIDATION_FAILED", formatValidationError(fieldErrors), {
        recovery: fieldErrors[0]?.recovery,
      }),
    );
    return NextResponse.json(err, { status });
  }

  const upstreamBody = {
    dateOfBirth: birth.dateOfBirth,
    timeOfBirth: birth.timeOfBirth,
    location: { city: birth.city, country: birth.country },
    houseSystem: body.houseSystem || "P",
  };

  try {
    const upstream = await fetchWithTimeout(
      `${EPHEMERIS_API_URL}/v1/natal-chart-svg`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "image/svg+xml",
        },
        body: JSON.stringify(upstreamBody),
        cache: "no-store",
      },
      { timeoutMs: 25_000, retries: 2, label: "ephemeris.natal-chart-svg" },
    );

    const contentType = upstream.headers.get("content-type") || "";
    const payload = await upstream.text();

    if (!upstream.ok) {
      let detail = "SVG generation failed";
      try {
        const j = JSON.parse(payload) as { detail?: string };
        if (typeof j.detail === "string") detail = j.detail;
      } catch {
        /* keep default */
      }
      const { status, body: err } = toErrorResponse(
        new AppError("EPHEMERIS_CALC_FAILED", detail, {
          status: upstream.status >= 500 ? 502 : upstream.status,
          retryable: upstream.status >= 500,
        }),
      );
      return NextResponse.json(err, { status });
    }

    if (!payload.includes("<svg") && !contentType.includes("svg")) {
      const { status, body: err } = toErrorResponse(
        new AppError("EPHEMERIS_CALC_FAILED", "Upstream returned non-SVG", {
          status: 502,
          retryable: true,
        }),
      );
      return NextResponse.json(err, { status });
    }

    let svg = payload;
    if (wantPrint) {
      svg = toPrintReadySvg(svg, frontArtboard());
    }

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Disposition": `inline; filename="natal-chart.svg"`,
      },
    });
  } catch (err) {
    const { status, body: errBody } = toErrorResponse(
      new AppError(
        "EPHEMERIS_UNAVAILABLE",
        err instanceof Error ? err.message : "Ephemeris unreachable",
        {
          recovery:
            "Start the ephemeris service (port 8000) and retry Generate.",
          retryable: true,
        },
      ),
    );
    return NextResponse.json(errBody, { status });
  }
}
