import { NextRequest, NextResponse } from "next/server";

import { saveDesignAsset } from "@/lib/design/storage";

export const runtime = "nodejs";

type DesignBody = {
  svg?: string;
  designOption?: string;
  printSide?: string;
  chartSummary?: string;
  meta?: Record<string, string>;
};

/**
 * Persist print-ready SVG and return opaque visualId for Shopify line items.
 */
export async function POST(req: NextRequest) {
  let body: DesignBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
  }

  if (!body.svg || body.svg.length < 100) {
    return NextResponse.json(
      { detail: "svg (print-ready markup) is required" },
      { status: 422 },
    );
  }

  const designOption = body.designOption === "B" ? "B" : "A";
  const printSide = body.printSide === "back" ? "back" : "front";

  try {
    const saved = saveDesignAsset({
      svg: body.svg,
      designOption,
      printSide,
      chartSummary: body.chartSummary,
      meta: body.meta,
    });

    return NextResponse.json({
      visualId: saved.visualId,
      designOption: saved.designOption,
      printSide: saved.printSide,
      createdAt: saved.createdAt,
    });
  } catch (err) {
    return NextResponse.json(
      {
        detail: err instanceof Error ? err.message : "Design save failed",
      },
      { status: 500 },
    );
  }
}
