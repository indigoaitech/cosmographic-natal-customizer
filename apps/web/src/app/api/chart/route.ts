import { NextRequest, NextResponse } from "next/server";

const EPHEMERIS_API_URL =
  process.env.EPHEMERIS_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${EPHEMERIS_API_URL}/v1/natal-chart`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => ({
      detail: "Upstream returned non-JSON response",
    }));

    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ephemeris unreachable";
    return NextResponse.json(
      {
        detail: message,
        code: "EPHEMERIS_UNAVAILABLE",
      },
      { status: 502 },
    );
  }
}
