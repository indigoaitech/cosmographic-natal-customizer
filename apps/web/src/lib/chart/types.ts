export type AspectType =
  | "conjunction"
  | "opposition"
  | "trine"
  | "square"
  | "sextile";

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

export interface Aspect {
  a: string;
  b: string;
  type: AspectType | string;
  angle: number;
  orb: number;
  applying: boolean;
}

export interface ChartMeta {
  utc: string;
  lat: number;
  lon: number;
  timezone: string;
  utcOffsetHours: number;
  julianDay: number;
  houseSystem: string;
  placeLabel: string;
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
