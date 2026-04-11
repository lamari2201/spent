import * as SQLite from 'expo-sqlite';
import type { SpentCategory } from '../types/domain';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('spent.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT NOT NULL PRIMARY KEY,
          value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS entries (
          id TEXT NOT NULL PRIMARY KEY,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS month_category_totals (
          month_key TEXT NOT NULL,
          category TEXT NOT NULL,
          total REAL NOT NULL DEFAULT 0,
          PRIMARY KEY (month_key, category)
        );
        CREATE TABLE IF NOT EXISTS period_snapshots (
          id TEXT NOT NULL PRIMARY KEY,
          month_key TEXT NOT NULL,
          grand_total REAL NOT NULL,
          category_json TEXT NOT NULL,
          reset_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_entries_created ON entries (created_at);
      `);
      await migrateEntriesMyPortion(db);
      await db.runAsync(
        `INSERT OR IGNORE INTO settings (key, value) VALUES ('last_reset_at', '1970-01-01T00:00:00.000Z')`,
      );
      return db;
    })();
  }
  return dbPromise;
}

async function migrateEntriesMyPortion(db: SQLite.SQLiteDatabase): Promise<void> {
  const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(entries)`);
  if (cols.some((c) => c.name === 'my_portion')) return;
  await db.execAsync(`ALTER TABLE entries ADD COLUMN my_portion REAL`);
  await db.runAsync(`UPDATE entries SET my_portion = amount WHERE my_portion IS NULL`);
}

async function getLastResetAt(): Promise<string> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM settings WHERE key = 'last_reset_at'`,
  );
  return row?.value ?? '1970-01-01T00:00:00.000Z';
}

async function setLastResetAt(iso: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`INSERT OR REPLACE INTO settings (key, value) VALUES ('last_reset_at', ?)`, [iso]);
}

function monthKeyFromIso(iso: string): string {
  return iso.slice(0, 7);
}

export async function getRunningTotal(): Promise<number> {
  const db = await getDatabase();
  const since = await getLastResetAt();
  const row = await db.getFirstAsync<{ s: number | null }>(
    `SELECT COALESCE(SUM(my_portion), 0) AS s FROM entries WHERE created_at > ?`,
    [since],
  );
  return row?.s ?? 0;
}

export async function getOtherRunningTotalSinceReset(): Promise<number> {
  const db = await getDatabase();
  const since = await getLastResetAt();
  const row = await db.getFirstAsync<{ s: number | null }>(
    `SELECT COALESCE(SUM(amount - my_portion), 0) AS s FROM entries WHERE created_at > ?`,
    [since],
  );
  return row?.s ?? 0;
}

export type CategoryBreakdown = { category: string; total: number };

export async function getBreakdownSinceReset(): Promise<CategoryBreakdown[]> {
  const db = await getDatabase();
  const since = await getLastResetAt();
  const rows = await db.getAllAsync<{ category: string; t: number }>(
    `SELECT category, SUM(my_portion) AS t FROM entries WHERE created_at > ? GROUP BY category HAVING t != 0 ORDER BY t DESC`,
    [since],
  );
  return rows.map((r) => ({ category: r.category, total: r.t }));
}

export async function addSpendEntry(
  amount: number,
  category: SpentCategory,
  myPortion: number,
): Promise<void> {
  if (!Number.isFinite(amount) || amount === 0) {
    throw new Error('Invalid amount');
  }
  const lo = Math.min(0, amount);
  const hi = Math.max(0, amount);
  if (!Number.isFinite(myPortion) || myPortion < lo - 1e-6 || myPortion > hi + 1e-6) {
    throw new Error('Invalid share');
  }
  const my = Math.round(myPortion * 100) / 100;
  const db = await getDatabase();
  const id = generateId();
  const createdAt = new Date().toISOString();
  const mk = monthKeyFromIso(createdAt);
  await db.runAsync(
    `INSERT INTO entries (id, amount, category, created_at, my_portion) VALUES (?, ?, ?, ?, ?)`,
    [id, amount, category, createdAt, my],
  );
  if (my !== 0) {
    await db.runAsync(
      `INSERT INTO month_category_totals (month_key, category, total) VALUES (?, ?, ?)
       ON CONFLICT(month_key, category) DO UPDATE SET total = total + excluded.total`,
      [mk, category, my],
    );
  }
}

export async function resetSpendingPeriod(): Promise<void> {
  const db = await getDatabase();
  const since = await getLastResetAt();
  const grandRow = await db.getFirstAsync<{ s: number | null }>(
    `SELECT COALESCE(SUM(my_portion), 0) AS s FROM entries WHERE created_at > ?`,
    [since],
  );
  const grand = grandRow?.s ?? 0;
  const breakdown = await getBreakdownSinceReset();
  const monthKey = monthKeyFromIso(new Date().toISOString());
  const snapId = generateId();
  const resetAt = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO period_snapshots (id, month_key, grand_total, category_json, reset_at) VALUES (?, ?, ?, ?, ?)`,
    [snapId, monthKey, grand, JSON.stringify(breakdown), resetAt],
  );
  await setLastResetAt(resetAt);
}

export type MonthTotal = { monthKey: string; total: number };

export async function getMonthlyTotals(monthsBack: number): Promise<MonthTotal[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ month_key: string; t: number }>(
    `SELECT strftime('%Y-%m', created_at) AS month_key, SUM(my_portion) AS t
     FROM entries
     GROUP BY month_key
     ORDER BY month_key DESC
     LIMIT ?`,
    [monthsBack],
  );
  return rows.map((r) => ({ monthKey: r.month_key, total: r.t })).reverse();
}

export async function getCategoryTotalsForMonth(monthKey: string): Promise<CategoryBreakdown[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ category: string; total: number }>(
    `SELECT category, total FROM month_category_totals WHERE month_key = ? AND total != 0 ORDER BY ABS(total) DESC`,
    [monthKey],
  );
  return rows;
}

export async function getRecentSnapshots(limit: number): Promise<
  { monthKey: string; grandTotal: number; resetAt: string }[]
> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    month_key: string;
    grand_total: number;
    reset_at: string;
  }>(
    `SELECT month_key, grand_total, reset_at FROM period_snapshots ORDER BY reset_at DESC LIMIT ?`,
    [limit],
  );
  return rows.map((r) => ({
    monthKey: r.month_key,
    grandTotal: r.grand_total,
    resetAt: r.reset_at,
  }));
}
