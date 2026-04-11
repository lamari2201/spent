import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { CategoryBreakdown } from '../db/database';
import { colors, radii, spacing, typography } from '../theme/theme';

type Props = {
  visible: boolean;
  runningTotal: number;
  otherRunningTotal: number;
  breakdown: CategoryBreakdown[];
  onClose: () => void;
  onReset: () => void;
};

export function TotalsModal({
  visible,
  runningTotal,
  otherRunningTotal,
  breakdown,
  onClose,
  onReset,
}: Props) {
  function confirmReset() {
    Alert.alert(
      'Reset period?',
      'This saves your current total under this month and starts fresh. Past months stay in your charts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            onReset();
            onClose();
          },
        },
      ],
    );
  }

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Totals</Text>
          <Text style={styles.runningLabel}>Your spending (this period)</Text>
          <Text style={styles.runningValue}>${runningTotal.toFixed(2)}</Text>
          <Text style={styles.otherLabel}>Others / shared out (this period)</Text>
          <Text style={styles.otherValue}>${otherRunningTotal.toFixed(2)}</Text>
          <Text style={styles.subLabel}>By category (your share, this period)</Text>
          <ScrollView style={styles.scroll} nestedScrollEnabled>
            {breakdown.length === 0 ? (
              <Text style={styles.empty}>No spends yet — tap enter or the mic.</Text>
            ) : (
              breakdown.map((row) => (
                <View key={row.category} style={styles.row}>
                  <Text style={styles.cat}>{row.category}</Text>
                  <Text style={styles.amt}>${row.total.toFixed(2)}</Text>
                </View>
              ))
            )}
          </ScrollView>
          <Pressable onPress={confirmReset} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset &amp; save to month</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  title: {
    ...typography.title,
    fontSize: 24,
    marginBottom: spacing.md,
  },
  runningLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  runningValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.accent,
    marginBottom: spacing.md,
    fontVariant: ['tabular-nums'],
  },
  otherLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
    color: colors.textMuted,
  },
  otherValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.lg,
    fontVariant: ['tabular-nums'],
  },
  subLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  scroll: {
    maxHeight: 220,
    marginBottom: spacing.md,
  },
  empty: {
    ...typography.subtitle,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  cat: {
    ...typography.body,
    fontWeight: '600',
  },
  amt: {
    ...typography.body,
    fontVariant: ['tabular-nums'],
    color: colors.textMuted,
  },
  resetBtn: {
    backgroundColor: colors.accentMuted,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: radii.pad,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  resetText: {
    ...typography.label,
    fontSize: 13,
    color: colors.accent,
  },
  closeBtn: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  closeText: {
    ...typography.subtitle,
  },
});
