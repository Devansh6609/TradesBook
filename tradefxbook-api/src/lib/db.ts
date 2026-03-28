// src/lib/db.ts
// Typed helpers for Cloudflare D1 (env.DB binding)

export type D1Database = import('@cloudflare/workers-types').D1Database;

/** Generate a cuid-like unique ID (crypto-based, edge-safe) */
export function generateId(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36)).join('').slice(0, 25);
}

/** Run a query that returns many rows */
export async function queryMany<T = Record<string, unknown>>(
  db: D1Database,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const stmt = db.prepare(sql);
  const result = await stmt.bind(...params).all<T>();
  return result.results ?? [];
}

/** Run a query that returns a single row (or null) */
export async function queryOne<T = Record<string, unknown>>(
  db: D1Database,
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const stmt = db.prepare(sql);
  return stmt.bind(...params).first<T>();
}

/** Run a DML (INSERT/UPDATE/DELETE) and return metadata */
export async function execute(
  db: D1Database,
  sql: string,
  params: unknown[] = [],
): Promise<D1Result> {
  return db.prepare(sql).bind(...params).run();
}

export type D1Result = import('@cloudflare/workers-types').D1Result;

/** Convert JS Date / string to Unix timestamp (integer for D1) */
export function toUnix(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  return Math.floor(d.getTime() / 1000);
}

/** Convert Unix timestamp from D1 back to ISO string */
export function fromUnix(ts: number | null | undefined): string | null {
  if (ts == null) return null;
  return new Date(ts * 1000).toISOString();
}
