import { NextRequest, NextResponse } from "next/server";

import { AppError, toErrorResponse } from "@/lib/errors/appError";
import { fetchWithTimeout } from "@/lib/http/fetchWithTimeout";
import { renderClassicNatalSvg } from "@/lib/chart/renderClassicNatalSvg";
import type { ChartPayload } from "@/lib/chart/types";
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

type BirthBody = {
  dateOfBirth: string;
  timeOfBirth: string;
  location: { city: string; country: string };
  houseSystem: string;
};

async function fetchEphemerisSvg(upstreamBody: BirthBody): Promise<string | null> {
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
    { timeoutMs: 25_000, retries: 1, label: "ephemeris.natal-chart-svg" },
  );

  if (upstream.status === 404) return null;

  const payload = await upstream.text();
  if (!upstream.ok) {
    throw Object.assign(new Error(payload.slice(0, 200)), {
      status: upstream.status,
    });
  }
  if (!payload.includes("<svg")) {
    throw new Error("Upstream returned non-SVG");
  }
  return payload;
}

async function fetchChartJson(upstreamBody: BirthBody): Promise<ChartPayload> {
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
  const data = await upstream.json().catch(() => null);
  if (!upstream.ok || !data) {
    throw Object.assign(
      new Error(
        typeof (data as { detail?: string } | null)?.detail === "string"
          ? (data as { detail: string }).detail
          : "Chart calculation failed",
      ),
      { status: upstream.status },
    );
  }
  return data as ChartPayload;
}

/**
 * BFF natal SVG:
 * 1) Prefer ephemeris Astrotheme renderer `POST /v1/natal-chart-svg`
 * 2) Fall back to TS `renderClassicNatalSvg` if endpoint missing (404)
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

  const upstreamBody: BirthBody = {
    dateOfBirth: birth.dateOfBirth,
    timeOfBirth: birth.timeOfBirth,
    location: { city: birth.city, country: birth.country },
    houseSystem: String(body.houseSystem || "P"),
  };

  try {
    let svg = await fetchEphemerisSvg(upstreamBody);

    if (!svg) {
      // Production ephemeris may not have /v1/natal-chart-svg yet
      const chart = await fetchChartJson(upstreamBody);
      svg = renderClassicNatalSvg(chart);
    }

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
    const statusCode =
      err && typeof err === "object" && "status" in err
        ? Number((err as { status: number }).status)
        : 502;
    const { status, body: errBody } = toErrorResponse(
      new AppError(
        statusCode >= 500 || statusCode === 0
          ? "EPHEMERIS_UNAVAILABLE"
          : "EPHEMERIS_CALC_FAILED",
        err instanceof Error ? err.message : "SVG generation failed",
        {
          status: statusCode >= 500 ? 502 : statusCode || 502,
          retryable: true,
          recovery:
            "Confirm EPHEMERIS_API_URL and that /v1/natal-chart(-svg) is healthy.",
        },
      ),
    );
    return NextResponse.json(errBody, { status });
  }
}
