import { describe, expect, it } from "vitest";

/** Pure JS port of ephemeris angular distance — guards aspect accuracy assumptions. */
function angularDistance(a: number, b: number): number {
  const na = ((a % 360) + 360) % 360;
  const nb = ((b % 360) + 360) % 360;
  const d = Math.abs(na - nb) % 360;
  return d <= 180 ? d : 360 - d;
}

describe("aspect angular distance (accuracy guard)", () => {
  it("measures exact opposition as 180", () => {
    expect(angularDistance(0, 180)).toBe(180);
  });

  it("measures wrap-around conjunction near 0", () => {
    expect(angularDistance(359, 1)).toBe(2);
  });

  it("measures square as 90", () => {
    expect(angularDistance(10, 100)).toBe(90);
  });
});
