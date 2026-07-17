/**
 * Shared natal-chart contracts used by the web app and documented
 * against services/ephemeris OpenAPI schemas.
 */

export type HouseSystem = "P" | "K" | "R" | "W" | "C" | "E" | "B";

export type DesignOption = "A" | "B";
export type PrintSide = "front" | "back";

export interface LocationInput {
  city: string;
  country: string;
  /** Optional free-text override, e.g. "Athens, Greece" */
  query?: string;
}

export interface NatalChartRequest {
  dateOfBirth: string; // YYYY-MM-DD
  timeOfBirth: string; // HH:mm or HH:mm:ss
  location: LocationInput;
  houseSystem?: HouseSystem;
}

export interface ChartMeta {
  utc: string;
  lat: number;
  lon: number;
  timezone: string;
  utcOffsetHours: number;
  julianDay: number;
  houseSystem: HouseSystem;
  placeLabel: string;
}

export interface PlanetPosition {
  id: string;
  name: string;
  lon: number;
  lat: number;
  speed: number;
  sign: string;
  signDegree: number;
  house: number | null;
  retrograde: boolean;
}

export interface HouseCusp {
  house: number;
  cusp: number;
  sign: string;
}

export interface ChartAngles {
  asc: number;
  mc: number;
  dsc: number;
  ic: number;
}

export type AspectType =
  | "conjunction"
  | "opposition"
  | "trine"
  | "square"
  | "sextile";

export interface Aspect {
  a: string;
  b: string;
  type: AspectType;
  angle: number;
  orb: number;
  applying: boolean;
}

export type InterpretationKind = "planet_sign" | "planet_house" | "house_sign";

export interface InterpretationRow {
  kind: InterpretationKind;
  key: string;
  label: string;
  summary: string;
}

export interface ChartPayload {
  meta: ChartMeta;
  planets: PlanetPosition[];
  houses: HouseCusp[];
  angles: ChartAngles;
  aspects: Aspect[];
  interpretations?: InterpretationRow[];
}

export interface CartCustomization {
  designOption: DesignOption;
  printSide: PrintSide;
  visualId: string;
  chartSummary?: string;
}
