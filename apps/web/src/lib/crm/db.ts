import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export type CrmCustomer = {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  time_of_birth: string | null;
  birth_city: string | null;
  birth_country: string | null;
  marketing_opt_in: number;
  shopify_customer_id: string | null;
  shopify_order_id: string | null;
  source: string;
  created_at: string;
  updated_at: string;
};

export type UpsertCustomerInput = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  timeOfBirth?: string | null;
  birthCity?: string | null;
  birthCountry?: string | null;
  marketingOptIn?: boolean;
  shopifyCustomerId?: string | null;
  shopifyOrderId?: string | null;
  source: "customizer" | "shopify_order" | "manual";
};

let dbSingleton: DatabaseSync | null = null;

function resolveDbPath(): string {
  const configured = process.env.CRM_DATABASE_PATH?.trim();
  if (configured) return configured;
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "crm.sqlite");
}

export function getCrmDb(): DatabaseSync {
  if (dbSingleton) return dbSingleton;
  const file = resolveDbPath();
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL COLLATE NOCASE,
      first_name TEXT,
      last_name TEXT,
      date_of_birth TEXT,
      time_of_birth TEXT,
      birth_city TEXT,
      birth_country TEXT,
      marketing_opt_in INTEGER NOT NULL DEFAULT 0,
      shopify_customer_id TEXT,
      shopify_order_id TEXT,
      source TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
    CREATE INDEX IF NOT EXISTS idx_customers_dob ON customers(date_of_birth);
    CREATE INDEX IF NOT EXISTS idx_customers_marketing
      ON customers(marketing_opt_in, date_of_birth);
  `);
  dbSingleton = db;
  return db;
}

export function upsertCustomer(input: UpsertCustomerInput): CrmCustomer {
  const db = getCrmDb();
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("Valid email is required for CRM retention");
  }

  const now = new Date().toISOString();
  const existing = db
    .prepare("SELECT * FROM customers WHERE email = ?")
    .get(email) as CrmCustomer | undefined;

  if (!existing) {
    db.prepare(
      `INSERT INTO customers (
        email, first_name, last_name, date_of_birth, time_of_birth,
        birth_city, birth_country, marketing_opt_in,
        shopify_customer_id, shopify_order_id, source, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      email,
      input.firstName ?? null,
      input.lastName ?? null,
      input.dateOfBirth ?? null,
      input.timeOfBirth ?? null,
      input.birthCity ?? null,
      input.birthCountry ?? null,
      input.marketingOptIn ? 1 : 0,
      input.shopifyCustomerId ?? null,
      input.shopifyOrderId ?? null,
      input.source,
      now,
      now,
    );
  } else {
    db.prepare(
      `UPDATE customers SET
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        date_of_birth = COALESCE(?, date_of_birth),
        time_of_birth = COALESCE(?, time_of_birth),
        birth_city = COALESCE(?, birth_city),
        birth_country = COALESCE(?, birth_country),
        marketing_opt_in = CASE WHEN ? IS NULL THEN marketing_opt_in ELSE ? END,
        shopify_customer_id = COALESCE(?, shopify_customer_id),
        shopify_order_id = COALESCE(?, shopify_order_id),
        source = ?,
        updated_at = ?
      WHERE email = ?`,
    ).run(
      input.firstName ?? null,
      input.lastName ?? null,
      input.dateOfBirth ?? null,
      input.timeOfBirth ?? null,
      input.birthCity ?? null,
      input.birthCountry ?? null,
      input.marketingOptIn === undefined ? null : input.marketingOptIn ? 1 : 0,
      input.marketingOptIn === undefined ? null : input.marketingOptIn ? 1 : 0,
      input.shopifyCustomerId ?? null,
      input.shopifyOrderId ?? null,
      input.source,
      now,
      email,
    );
  }

  const row = db
    .prepare("SELECT * FROM customers WHERE email = ?")
    .get(email) as CrmCustomer;
  return row;
}

/** Birthday-window query for future campaigns (MM-DD match). */
export function findCustomersByBirthday(month: number, day: number): CrmCustomer[] {
  const db = getCrmDb();
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const suffix = `-${mm}-${dd}`;
  return db
    .prepare(
      `SELECT * FROM customers
       WHERE marketing_opt_in = 1
         AND date_of_birth IS NOT NULL
         AND date_of_birth LIKE ?`,
    )
    .all(`%${suffix}`) as CrmCustomer[];
}
