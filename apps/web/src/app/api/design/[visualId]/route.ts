import { NextRequest, NextResponse } from "next/server";

import { getDesignAsset } from "@/lib/design/storage";

export const runtime = "nodejs";

/** Fulfillment helper: fetch stored SVG by visualId */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ visualId: string }> },
) {
  const { visualId } = await ctx.params;
  const design = getDesignAsset(visualId);
  if (!design) {
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }

  const format = _req.nextUrl.searchParams.get("format");
  if (format === "svg") {
    return new NextResponse(design.svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  return NextResponse.json({
    visualId: design.visualId,
    designOption: design.designOption,
    printSide: design.printSide,
    chartSummary: design.chartSummary,
    createdAt: design.createdAt,
    meta: design.meta,
  });
}
