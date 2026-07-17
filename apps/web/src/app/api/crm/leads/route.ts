import { NextRequest, NextResponse } from "next/server";

import { upsertCustomer } from "@/lib/crm/db";

export const runtime = "nodejs";

type LeadBody = {
  email?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  timeOfBirth?: string;
  birthCity?: string;
  birthCountry?: string;
  marketingOptIn?: boolean;
};

/**
 * Capture customizer leads for CRM / birthday marketing (requires consent flag).
 */
export async function POST(req: NextRequest) {
  let body: LeadBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ detail: "email is required" }, { status: 422 });
  }
  if (!body.marketingOptIn) {
    return NextResponse.json(
      {
        detail:
          "marketingOptIn must be true to store customer data for marketing.",
      },
      { status: 422 },
    );
  }
  if (!body.dateOfBirth) {
    return NextResponse.json(
      { detail: "dateOfBirth is required for birthday CRM retention" },
      { status: 422 },
    );
  }

  try {
    const row = upsertCustomer({
      email,
      firstName: body.firstName,
      lastName: body.lastName,
      dateOfBirth: body.dateOfBirth,
      timeOfBirth: body.timeOfBirth,
      birthCity: body.birthCity,
      birthCountry: body.birthCountry,
      marketingOptIn: true,
      source: "customizer",
    });

    return NextResponse.json({
      ok: true,
      customerId: row.id,
      email: row.email,
    });
  } catch (err) {
    return NextResponse.json(
      {
        detail: err instanceof Error ? err.message : "CRM write failed",
      },
      { status: 500 },
    );
  }
}
