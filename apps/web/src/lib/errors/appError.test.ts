import { describe, expect, it } from "vitest";

import { AppError, toErrorResponse } from "@/lib/errors/appError";
import { PRODUCT_CATALOG, resolveVariantId } from "@/lib/catalog/products";

describe("AppError", () => {
  it("maps SESSION_EXPIRED to 410", () => {
    const err = new AppError("SESSION_EXPIRED", "expired");
    expect(err.status).toBe(410);
    const { status, body } = toErrorResponse(err);
    expect(status).toBe(410);
    expect(body.code).toBe("SESSION_EXPIRED");
  });
});

describe("product catalog", () => {
  it("includes apparel kinds for expansion", () => {
    const kinds = PRODUCT_CATALOG.map((p) => p.kind);
    expect(kinds).toContain("tee");
    expect(kinds).toContain("hoodie");
    expect(kinds).toContain("poster");
  });

  it("resolveVariantId returns null without env", () => {
    expect(resolveVariantId("poster")).toBeNull();
  });
});
