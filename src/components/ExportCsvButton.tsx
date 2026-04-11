import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { colors, radii, spacing, typography } from '../theme/theme';
import { shareSpentCsvExport } from '../utils/spentCsvExport';

export function ExportCsvButton() {
  const [busy, setBusy] = useState(false);

  async function onPress() {
    setBusy(true);
    try {
      await shareSpentCsvExport();
    } catch (e) {
      Alert.alert(
        'Export failed',
        e instanceof Error ? e.message : 'Could not create or share the CSV.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Pressable
      onPress={() => void onPress()}
      disabled={busy}
      style={({ pressed }) => [
        styles.btn,
        busy && styles.btnDisabled,
        pressed && !busy && styles.btnPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Export all data as CSV"
    >
      {busy ? (
        <ActivityIndicator color={colors.background} />
      ) : (
        <Text style={styles.label}>EXPORT DATA (CSV)</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.card,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnPressed: {
    opacity: 0.92,
  },
  label: {
    ...typography.label,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.background,
  },
});
