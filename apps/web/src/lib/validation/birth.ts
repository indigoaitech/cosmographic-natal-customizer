/**
 * Birth-data validation — shared client/server rules (GDPR-safe, no PII logged).
 */

export type BirthInput = {
  dateOfBirth: string;
  timeOfBirth: string;
  city: string;
  country: string;
  /** Optional IANA timezone override; otherwise derived from geocode */
  timezone?: string;
};

export type FieldError = {
  field: keyof BirthInput | "form";
  code: string;
  message: string;
  recovery: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

export function validateBirthInput(input: BirthInput): FieldError[] {
  const errors: FieldError[] = [];

  if (!DATE_RE.test(input.dateOfBirth?.trim() || "")) {
    errors.push({
      field: "dateOfBirth",
      code: "INVALID_DATE",
      message: "Enter date of birth as YYYY-MM-DD.",
      recovery: "Use the date picker or fix the year-month-day format.",
    });
  } else {
    const d = new Date(`${input.dateOfBirth}T12:00:00Z`);
    const y = Number(input.dateOfBirth.slice(0, 4));
    if (Number.isNaN(d.getTime()) || y < 1800 || y > 2200) {
      errors.push({
        field: "dateOfBirth",
        code: "DATE_OUT_OF_RANGE",
        message: "Birth date must be between 1800 and 2200 for Swiss Ephemeris.",
        recovery: "Check the year — ephemeris files cover 1800–2399 CE.",
      });
    }
  }

  if (!TIME_RE.test(input.timeOfBirth?.trim() || "")) {
    errors.push({
      field: "timeOfBirth",
      code: "INVALID_TIME",
      message: "Enter exact birth time as HH:MM (24-hour).",
      recovery:
        "If time is unknown, use 12:00 noon as an approximation — houses/ASC will be less accurate.",
    });
  }

  if (!(input.city?.trim().length >= 1)) {
    errors.push({
      field: "city",
      code: "MISSING_CITY",
      message: "Birth city is required for geocoding.",
      recovery: "Enter the city or nearest town of birth.",
    });
  }

  if (!(input.country?.trim().length >= 1)) {
    errors.push({
      field: "country",
      code: "MISSING_COUNTRY",
      message: "Birth country is required for geocoding.",
      recovery: "Enter the country to disambiguate cities with the same name.",
    });
  }

  if (input.timezone && !/^[A-Za-z_]+\/[A-Za-z0-9_+\-]+$/.test(input.timezone)) {
    errors.push({
      field: "timezone",
      code: "INVALID_TIMEZONE",
      message: "Timezone must be an IANA name like Europe/Athens.",
      recovery: "Leave blank to auto-detect from birthplace, or pick a valid IANA zone.",
    });
  }

  return errors;
}

export function formatValidationError(errors: FieldError[]): string {
  return errors.map((e) => `${e.message} (${e.recovery})`).join(" ");
}
