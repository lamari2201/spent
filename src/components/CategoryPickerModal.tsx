import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radii, spacing, typography } from '../theme/theme';
import { SPENT_CATEGORIES, type SpendAttribution } from '../types/domain';

type Props = {
  visible: boolean;
  amount: number | null;
  onSelect: (category: (typeof SPENT_CATEGORIES)[number], myPortion: number) => void;
  onClose: () => void;
};

function clampPct(raw: string): number {
  const n = parseFloat(raw.replace(/,/g, '.'));
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, n));
}

function myPortionFromAttribution(
  amount: number,
  attribution: SpendAttribution,
  myPercentStr: string,
): number {
  if (attribution === 'me') return Math.round(amount * 100) / 100;
  if (attribution === 'other') return 0;
  const pct = clampPct(myPercentStr);
  return Math.round(amount * (pct / 100) * 100) / 100;
}

export function CategoryPickerModal({ visible, amount, onSelect, onClose }: Props) {
  const [attribution, setAttribution] = useState<SpendAttribution | null>(null);
  const [myPercentStr, setMyPercentStr] = useState('50');

  useEffect(() => {
    if (visible) {
      setAttribution(null);
      setMyPercentStr('50');
    }
  }, [visible]);

  const amt = amount ?? 0;
  const splitPreview = useMemo(() => {
    if (attribution !== 'split' || !Number.isFinite(amt) || amt === 0) return null;
    const my = myPortionFromAttribution(amt, 'split', myPercentStr);
    const other = Math.round((amt - my) * 100) / 100;
    const pct = clampPct(myPercentStr);
    return { my, other, pct, otherPct: Math.round((100 - pct) * 100) / 100 };
  }, [attribution, amt, myPercentStr]);

  function trySelectCategory(c: (typeof SPENT_CATEGORIES)[number]) {
    if (attribution === null) return;
    if (!Number.isFinite(amt) || amt === 0) return;
    const my = myPortionFromAttribution(amt, attribution, myPercentStr);
    onSelect(c, my);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Pick a category</Text>
          {amount != null ? (
            <Text style={styles.amount}>
              {amount < 0 ? '-' : ''}${Math.abs(amount).toFixed(2)}
            </Text>
          ) : null}

          <Text style={styles.attrHeading}>Who is this for?</Text>
          <View style={styles.attrRow}>
            {(
              [
                { key: 'me' as const, label: 'just me' },
                { key: 'other' as const, label: 'someone else' },
                { key: 'split' as const, label: 'split' },
              ] as const
            ).map(({ key, label }) => (
              <Pressable
                key={key}
                onPress={() => setAttribution(key)}
                style={({ pressed }) => [
                  styles.attrChip,
                  attribution === key && styles.attrChipOn,
                  pressed && styles.attrChipPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: attribution === key }}
                accessibilityLabel={label}
              >
                <Text
                  style={[styles.attrChipText, attribution === key && styles.attrChipTextOn]}
                  numberOfLines={2}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {attribution === 'split' ? (
            <View style={styles.splitBox}>
              <Text style={styles.splitLabel}>Your share (%)</Text>
              <View style={styles.splitInputRow}>
                <TextInput
                  value={myPercentStr}
                  onChangeText={setMyPercentStr}
                  keyboardType="decimal-pad"
                  placeholder="50"
                  placeholderTextColor={colors.textMuted}
                  style={styles.splitInput}
                  maxLength={6}
                  accessibilityLabel="Your share percent"
                />
                <Text style={styles.splitPctSuffix}>%</Text>
                {splitPreview ? (
                  <Text style={styles.splitMeta}>Other {splitPreview.otherPct}%</Text>
                ) : null}
              </View>
              {splitPreview && amt !== 0 ? (
                <Text style={styles.splitAmounts}>
                  You: {splitPreview.my < 0 ? '-' : ''}${Math.abs(splitPreview.my).toFixed(2)} · Other:{' '}
                  {splitPreview.other < 0 ? '-' : ''}${Math.abs(splitPreview.other).toFixed(2)}
                </Text>
              ) : null}
            </View>
          ) : null}

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {SPENT_CATEGORIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => trySelectCategory(c)}
                style={({ pressed }) => [
                  styles.chip,
                  attribution === null && styles.chipMuted,
                  pressed && attribution !== null && styles.chipPressed,
                ]}
                disabled={attribution === null}
              >
                <Text style={[styles.chipText, attribution === null && styles.chipTextMuted]}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '78%',
  },
  title: {
    ...typography.title,
    marginBottom: spacing.xs,
  },
  amount: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.accent,
    marginBottom: spacing.md,
    fontVariant: ['tabular-nums'],
  },
  attrHeading: {
    ...typography.label,
    fontSize: 11,
    marginBottom: spacing.xs,
    color: colors.textMuted,
  },
  attrRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  attrChip: {
    flex: 1,
    minHeight: 44,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.pad,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attrChipOn: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  attrChipPressed: {
    opacity: 0.9,
  },
  attrChipText: {
    ...typography.body,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  attrChipTextOn: {
    color: colors.accent,
  },
  splitBox: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.pad,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
  },
  splitLabel: {
    ...typography.label,
    fontSize: 11,
    marginBottom: spacing.xs,
    color: colors.textMuted,
  },
  splitInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  splitInput: {
    ...typography.body,
    minWidth: 64,
    maxWidth: 88,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pad,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  splitPctSuffix: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textMuted,
  },
  splitMeta: {
    ...typography.subtitle,
    fontSize: 13,
    marginLeft: 'auto',
    fontVariant: ['tabular-nums'],
  },
  splitAmounts: {
    ...typography.subtitle,
    fontSize: 14,
    marginTop: spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  list: {
    maxHeight: 320,
  },
  chip: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pad,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  chipMuted: {
    opacity: 0.45,
  },
  chipPressed: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  chipText: {
    ...typography.body,
    fontSize: 17,
    fontWeight: '600',
  },
  chipTextMuted: {
    color: colors.textMuted,
  },
  cancel: {
    marginTop: spacing.md,
    alignItems: 'center',
    padding: spacing.sm,
  },
  cancelText: {
    ...typography.subtitle,
    color: colors.textMuted,
  },
});
