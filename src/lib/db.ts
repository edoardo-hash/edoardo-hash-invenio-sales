import "server-only";
import { neon } from "@neondatabase/serverless";

/**
 * The portal's Neon database (the dev/ihtest one, shared `public` schema). This app only reads the villa snapshot
 * and the sales tables (migration 068) and writes CRM rows (contacts, requests, activities). It never changes the schema.
 */
export const hasDb = () => !!process.env.DATABASE_URL;

export async function q<T>(text: string, params: unknown[] = []): Promise<T[]> {
  const sql = neon(process.env.DATABASE_URL as string);
  return (await sql.query(text, params)) as T[];
}

/** Who this app writes as in the CRM (there is no login here yet). */
export const ACTOR = { email: "sales-site", name: "Sales site (prototype)" };
