import { cacheDirectory, EncodingType, writeAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getDatabase } from '../db/database';

function esc(cell: string | number): string {
  const s = String(cell);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function line(cells: (string | number)[]): string {
  return cells.map(esc).join(',');
}

export async function buildSpentExportCsv(): Promise<string> {
  const db = await getDatabase();
  const entries = await db.getAllAsync<{
    id: string;
    amount: number;
    category: string;
    created_at: string;
    my_portion: number | null;
  }>(`SELECT id, amount, category, created_at, my_portion FROM entries ORDER BY created_at ASC`);

  const monthCategory = await db.getAllAsync<{
    month_key: string;
    category: string;
    total: number;
  }>(
    `SELECT month_key, category, total FROM month_category_totals ORDER BY month_key ASC, category ASC`,
  );

  const snapshots = await db.getAllAsync<{
    id: string;
    month_key: string;
    grand_total: number;
    category_json: string;
    reset_at: string;
  }>(
    `SELECT id, month_key, grand_total, category_json, reset_at FROM period_snapshots ORDER BY reset_at ASC`,
  );

  const settings = await db.getAllAsync<{ key: string; value: string }>(
    `SELECT key, value FROM settings ORDER BY key ASC`,
  );

  const out: string[] = [];
  out.push('# spent. export');
  out.push(`# generated_utc,${new Date().toISOString()}`);
  out.push('');
  out.push('##ENTRIES');
  out.push(line(['id', 'amount', 'my_portion', 'category', 'created_at']));
  for (const e of entries) {
    const mp = e.my_portion ?? e.amount;
    out.push(line([e.id, e.amount, mp, e.category, e.created_at]));
  }
  out.push('');
  out.push('##MONTH_CATEGORY_TOTALS');
  out.push(line(['month_key', 'category', 'total']));
  for (const r of monthCategory) {
    out.push(line([r.month_key, r.category, r.total]));
  }
  out.push('');
  out.push('##PERIOD_SNAPSHOTS');
  out.push(line(['id', 'month_key', 'grand_total', 'category_json', 'reset_at']));
  for (const s of snapshots) {
    out.push(line([s.id, s.month_key, s.grand_total, s.category_json, s.reset_at]));
  }
  out.push('');
  out.push('##SETTINGS');
  out.push(line(['key', 'value']));
  for (const s of settings) {
    out.push(line([s.key, s.value]));
  }
  return out.join('\n');
}

export async function shareSpentCsvExport(): Promise<void> {
  const csv = await buildSpentExportCsv();
  const base = cacheDirectory;
  if (!base) {
    throw new Error('Cache directory is not available.');
  }
  const safeName = `spent-export-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
  const uri = `${base}${safeName}`;
  await writeAsStringAsync(uri, `\uFEFF${csv}`, { encoding: EncodingType.UTF8 });
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export spent. CSV',
    UTI: 'public.comma-separated-values-text',
  });
}
