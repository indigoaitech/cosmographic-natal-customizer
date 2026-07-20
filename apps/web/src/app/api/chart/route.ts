import { NextRequest, NextResponse } from "next/server";

import { track } from "@/lib/analytics/track";
import { AppError, toErrorResponse } from "@/lib/errors/appError";
import { fetchWithTimeout } from "@/lib/http/fetchWithTimeout";
import { log } from "@/lib/logging/logger";
import {
  formatValidationError,
  normalizeBirthTime,
  validateBirthInput,
  type BirthInput,
} from "@/lib/validation/birth";

const EPHEMERIS_API_URL =
  process.env.EPHEMERIS_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

export const runtime = "nodejs";

/**
 * BFF → Swiss Ephemeris natal chart.
 * Validates birth inputs before calling the calculation engine.
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

  const loc = body.location as { city?: string; country?: string } | undefined;
  const city = String(loc?.city || body.city || "");
  const country = String(loc?.country || body.country || "");

  const birth: BirthInput = {
    dateOfBirth: String(body.dateOfBirth || ""),
    timeOfBirth: normalizeBirthTime(String(body.timeOfBirth || "")),
    city,
    country,
  };

  const fieldErrors = validateBirthInput(birth);
  if (fieldErrors.length) {
    track("chart_generate_failed", { code: "VALIDATION_FAILED" });
    const { status, body: err } = toErrorResponse(
      new AppError("VALIDATION_FAILED", formatValidationError(fieldErrors), {
        fields: fieldErrors.map((e) => ({ field: e.field, message: e.message })),
        recovery: fieldErrors[0]?.recovery,
      }),
    );
    return NextResponse.json(err, { status });
  }

  // Ephemeris expects location:{city,country} — normalize flat city/country bodies.
  const upstreamBody = {
    dateOfBirth: birth.dateOfBirth,
    timeOfBirth: birth.timeOfBirth,
    location: { city: birth.city, country: birth.country },
    houseSystem: body.houseSystem || "P",
  };

  track("chart_generate_started");

  try {
    const upstream = await fetchWithTimeout(
      `${EPHEMERIS_API_URL}/v1/natal-chart`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(upstreamBody),
        cache: "no-store",
      },
      { timeoutMs: 20_000, retries: 2, label: "ephemeris.natal-chart" },
    );

    const data = await upstream.json().catch(() => ({
      detail: "Upstream returned non-JSON response",
    }));

    if (!upstream.ok) {
      track("chart_generate_failed", { status: upstream.status });
      const detail =
        typeof (data as { detail?: unknown }).detail === "string"
          ? (data as { detail: string }).detail
          : "Chart calculation failed";

      const code =
        upstream.status === 404
          ? "GEOCODE_FAILED"
          : upstream.status >= 500
            ? "EPHEMERIS_CALC_FAILED"
            : "VALIDATION_FAILED";

      const { status, body: err } = toErrorResponse(
        new AppError(code, detail, {
          status: upstream.status === 404 ? 404 : upstream.status >= 500 ? 502 : 422,
          recovery:
            upstream.status === 404
              ? "Try a more specific city and country, or pick another nearby town."
              : "Retry in a moment. If it persists, check the ephemeris service health.",
          retryable: upstream.status >= 500,
        }),
      );
      return NextResponse.json(err, { status });
    }

    track("chart_generate_succeeded");
    log.info("chart.ok", {
      planets: Array.isArray((data as { planets?: unknown[] }).planets)
        ? (data as { planets: unknown[] }).planets.length
        : 0,
    });
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    track("chart_generate_failed", { code: "EPHEMERIS_UNAVAILABLE" });
    log.error("chart.ephemeris_unreachable", {
      message: err instanceof Error ? err.message : "unknown",
    });
    const { status, body: errBody } = toErrorResponse(
      new AppError(
        "EPHEMERIS_UNAVAILABLE",
        err instanceof Error ? err.message : "Ephemeris unreachable",
        {
          recovery:
            "Start the ephemeris service (port 8000) and retry Generate natal chart.",
          retryable: true,
        },
      ),
    );
    return NextResponse.json(errBody, { status });
  }
}
