import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type StoredDesign = {
  visualId: string;
  designOption: string;
  printSide: string;
  svg: string;
  chartSummary?: string;
  meta?: Record<string, string>;
  createdAt: string;
};

function designsDir(): string {
  const configured = process.env.DESIGN_STORAGE_PATH?.trim();
  if (configured) {
    fs.mkdirSync(configured, { recursive: true });
    return configured;
  }
  // Vercel / serverless: cwd is read-only; use /tmp for ephemeral design assets.
  const base =
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
      ? path.join("/tmp", "cosmographic", "designs")
      : path.join(process.cwd(), "data", "designs");
  fs.mkdirSync(base, { recursive: true });
  return base;
}

export function saveDesignAsset(input: {
  svg: string;
  designOption: string;
  printSide: string;
  chartSummary?: string;
  meta?: Record<string, string>;
}): StoredDesign {
  const visualId = `cg_${crypto.randomBytes(8).toString("hex")}`;
  const createdAt = new Date().toISOString();
  const record: StoredDesign = {
    visualId,
    designOption: input.designOption,
    printSide: input.printSide,
    svg: input.svg,
    chartSummary: input.chartSummary,
    meta: input.meta,
    createdAt,
  };

  const base = path.join(designsDir(), visualId);
  fs.writeFileSync(`${base}.json`, JSON.stringify(record, null, 2), "utf8");
  fs.writeFileSync(`${base}.svg`, input.svg, "utf8");
  return record;
}

export function getDesignAsset(visualId: string): StoredDesign | null {
  const safe = visualId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safe || safe !== visualId) return null;
  const file = path.join(designsDir(), `${safe}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as StoredDesign;
}
