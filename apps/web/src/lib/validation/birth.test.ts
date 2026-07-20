import { describe, expect, it } from "vitest";

import {
  normalizeBirthTime,
  validateBirthInput,
} from "@/lib/validation/birth";

describe("normalizeBirthTime", () => {
  it("pads HH:MM to HH:MM:00", () => {
    expect(normalizeBirthTime("14:32")).toBe("14:32:00");
    expect(normalizeBirthTime("9:05")).toBe("09:05:00");
  });

  it("strips seconds when present", () => {
    expect(normalizeBirthTime("14:32:59")).toBe("14:32:00");
  });
});

describe("validateBirthInput", () => {
  it("accepts a valid birth payload", () => {
    const errors = validateBirthInput({
      dateOfBirth: "1990-07-12",
      timeOfBirth: "14:32",
      city: "Athens",
      country: "Greece",
    });
    expect(errors).toEqual([]);
  });

  it("rejects invalid date format with recovery", () => {
    const errors = validateBirthInput({
      dateOfBirth: "12-07-1990",
      timeOfBirth: "14:32",
      city: "Athens",
      country: "Greece",
    });
    expect(errors.some((e) => e.code === "INVALID_DATE")).toBe(true);
    expect(errors[0]?.recovery).toBeTruthy();
  });

  it("rejects out-of-range years for Swiss Ephemeris", () => {
    const errors = validateBirthInput({
      dateOfBirth: "1500-01-01",
      timeOfBirth: "12:00",
      city: "Rome",
      country: "Italy",
    });
    expect(errors.some((e) => e.code === "DATE_OUT_OF_RANGE")).toBe(true);
  });

  it("requires city and country", () => {
    const errors = validateBirthInput({
      dateOfBirth: "1990-07-12",
      timeOfBirth: "14:32:00",
      city: "",
      country: "",
    });
    expect(errors.some((e) => e.field === "city")).toBe(true);
    expect(errors.some((e) => e.field === "country")).toBe(true);
  });
});
