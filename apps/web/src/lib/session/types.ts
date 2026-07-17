import type { ChartPayload } from "@/lib/chart/types";

export type PersonalizationSession = {
  sessionId: string;
  createdAt: string;
  expiresAt: string;
  birth: {
    dateOfBirth: string;
    timeOfBirth: string;
    city: string;
    country: string;
  };
  chartSummary: string;
  /** Opaque front visual id (legacy cart compat) */
  visualIdFront: string;
  visualIdBack: string;
  /** Absolute or app-relative URLs for Printify / Shopify line items */
  printFrontUrl: string;
  printBackUrl: string;
  previewFrontUrl: string;
  previewBackUrl: string;
  chartMeta: {
    utc: string;
    timezone: string;
    placeLabel: string;
    asc: number;
    mc: number;
  };
  /** Optional slim chart snapshot for theme scripts */
  chartSnapshot?: Pick<
    ChartPayload,
    "meta" | "planets" | "houses" | "angles" | "aspects"
  >;
};

export type CreateSessionInput = {
  birth: PersonalizationSession["birth"];
  chartSummary: string;
  frontSvg: string;
  backSvg: string;
  chart: ChartPayload;
  /** Public origin for absolute asset URLs, e.g. https://www.cosmographic.store */
  publicOrigin: string;
};
