import { NextRequest, NextResponse } from "next/server";

import { AppError, toErrorResponse } from "@/lib/errors/appError";
import { fetchWithTimeout } from "@/lib/http/fetchWithTimeout";
import { frontArtboard, toPrintReadySvg } from "@/lib/print/artboard";
import {
  renderClassicNatalSvg,
  toChartDocument,
} from "@/lib/chart/renderClassicNatalSvg";
import type { ChartPayload } from "@/lib/chart/types";
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
 * Server-side natal SVG (Astrotheme-style SSR).
 *
 * Body options:
 * - Birth fields → compute via ephemeris, then serialize SVG
 * - `{ chart: ChartPayload }` → serialize existing JSON only
 *
 * Query:
 * - `?print=1` → 300 DPI print-ready dimensions
 * - `?format=json` → Astrotheme-aligned chart document (no SVG)
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

  const wantDoc =
    req.nextUrl.searchParams.get("format") === "json" ||
    body.format === "json";
  const wantPrint = req.nextUrl.searchParams.get("print") === "1";

  let chart: ChartPayload;

  if (body.chart && typeof body.chart === "object") {
    chart = body.chart as ChartPayload;
  } else {
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

    try {
      const upstream = await fetchWithTimeout(
        `${EPHEMERIS_API_URL}/v1/natal-chart`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            dateOfBirth: birth.dateOfBirth,
            timeOfBirth: birth.timeOfBirth,
            location: { city: birth.city, country: birth.country },
            houseSystem: body.houseSystem || "P",
          }),
          cache: "no-store",
        },
        { timeoutMs: 20_000, retries: 2, label: "ephemeris.natal-chart.svg" },
      );

      const data = await upstream.json().catch(() => null);
      if (!upstream.ok || !data) {
        const { status, body: err } = toErrorResponse(
          new AppError(
            "EPHEMERIS_CALC_FAILED",
            typeof (data as { detail?: string } | null)?.detail === "string"
              ? (data as { detail: string }).detail
              : "Chart calculation failed",
            { status: 502, retryable: true },
          ),
        );
        return NextResponse.json(err, { status });
      }
      chart = data as ChartPayload;
    } catch (err) {
      const { status, body: errBody } = toErrorResponse(
        new AppError(
          "EPHEMERIS_UNAVAILABLE",
          err instanceof Error ? err.message : "Ephemeris unreachable",
          { retryable: true },
        ),
      );
      return NextResponse.json(errBody, { status });
    }
  }

  if (wantDoc) {
    return NextResponse.json(toChartDocument(chart), { status: 200 });
  }

  let svg = renderClassicNatalSvg(chart);
  if (wantPrint) {
    svg = toPrintReadySvg(svg, frontArtboard());
  }

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Disposition": `inline; filename="cosmographi-birth-map.svg"`,
    },
  });
}
