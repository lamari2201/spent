import { StyleSheet, Text, View } from 'react-native';
import type { CategoryBreakdown, MonthTotal } from '../db/database';
import { colors, radii, spacing, typography } from '../theme/theme';
import { ExportCsvButton } from './ExportCsvButton';

const BAR_COLORS = [
  '#7cf5d6',
  '#c4b5fd',
  '#f472b6',
  '#fcd34d',
  '#60a5fa',
  '#fb923c',
  '#4ade80',
  '#a78bfa',
];

function abbrevMonth(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString(undefined, { month: 'short', year: '2-digit' });
}

type Props = {
  monthly: MonthTotal[];
  categoryThisMonth: CategoryBreakdown[];
};

export function ChartsSection({ monthly, categoryThisMonth }: Props) {
  const maxMonth = Math.max(1, ...monthly.map((x) => Math.abs(x.total)));
  const maxCat = Math.max(1, ...categoryThisMonth.map((x) => Math.abs(x.total)));

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Your trends</Text>
      <Text style={styles.sub}>Totals compound by month and category in the background.</Text>

      <View style={styles.chartBlock}>
        <Text style={styles.chartTitle}>Spend by month</Text>
        {monthly.length === 0 ? (
          <Text style={styles.empty}>No monthly data yet — log a few spends.</Text>
        ) : (
          monthly.map((row) => {
            const pct = Math.min(100, (Math.abs(row.total) / maxMonth) * 100);
            return (
              <View key={row.monthKey} style={styles.barRow}>
                <Text style={styles.barLabel}>{abbrevMonth(row.monthKey)}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.barValue}>${row.total.toFixed(0)}</Text>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.chartBlock}>
        <Text style={styles.chartTitle}>This month by category</Text>
        {categoryThisMonth.length === 0 ? (
          <Text style={styles.empty}>Nothing this calendar month yet.</Text>
        ) : (
          categoryThisMonth.map((row, i) => {
            const pct = Math.min(100, (Math.abs(row.total) / maxCat) * 100);
            const c = BAR_COLORS[i % BAR_COLORS.length];
            return (
              <View key={row.category} style={styles.barRow}>
                <Text style={styles.barLabel} numberOfLines={1}>
                  {row.category}
                </Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: c }]} />
                </View>
                <Text style={styles.barValue}>${row.total.toFixed(0)}</Text>
              </View>
            );
          })
        )}
      </View>

      <Text style={styles.exportHint}>
        Includes entries, month/category rollups, period snapshots, and settings.
      </Text>
      <ExportCsvButton />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  heading: {
    ...typography.title,
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  sub: {
    ...typography.subtitle,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  chartBlock: {
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    padding: spacing.md,
  },
  chartTitle: {
    ...typography.label,
    marginBottom: spacing.md,
  },
  empty: {
    ...typography.subtitle,
    fontStyle: 'italic',
    paddingVertical: spacing.md,
  },
  barRow: {
    marginBottom: spacing.sm,
  },
  barLabel: {
    ...typography.subtitle,
    fontSize: 12,
    marginBottom: 4,
    maxWidth: '100%',
  },
  barTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.background,
    overflow: 'hidden',
    marginBottom: 4,
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: colors.accent,
    minWidth: 4,
  },
  barValue: {
    ...typography.body,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    color: colors.textMuted,
  },
  exportHint: {
    ...typography.subtitle,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
});
