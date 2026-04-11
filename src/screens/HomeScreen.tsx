import { useCallback, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalculatorPad } from '../components/CalculatorPad';
import { CategoryPickerModal } from '../components/CategoryPickerModal';
import { ChartsSection } from '../components/ChartsSection';
import { TotalsModal } from '../components/TotalsModal';
import { VoiceMicButton } from '../components/VoiceMicButton';
import type { CategoryBreakdown, MonthTotal } from '../db/database';
import {
  addSpendEntry,
  getBreakdownSinceReset,
  getCategoryTotalsForMonth,
  getDatabase,
  getMonthlyTotals,
  getOtherRunningTotalSinceReset,
  getRunningTotal,
  resetSpendingPeriod,
} from '../db/database';
import { colors, spacing, typography } from '../theme/theme';
import type { SpentCategory } from '../types/domain';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [calcKey, setCalcKey] = useState(0);
  const [tick, setTick] = useState(0);
  const [runningTotal, setRunningTotal] = useState(0);
  const [otherRunningTotal, setOtherRunningTotal] = useState(0);
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);
  const [monthly, setMonthly] = useState<MonthTotal[]>([]);
  const [categoryMonth, setCategoryMonth] = useState<CategoryBreakdown[]>([]);
  const [totalsOpen, setTotalsOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoadError(null);
      await getDatabase();
      const mk = new Date().toISOString().slice(0, 7);
      const [run, other, br, mo, cm] = await Promise.all([
        getRunningTotal(),
        getOtherRunningTotalSinceReset(),
        getBreakdownSinceReset(),
        getMonthlyTotals(6),
        getCategoryTotalsForMonth(mk),
      ]);
      setRunningTotal(run);
      setOtherRunningTotal(other);
      setBreakdown(br);
      setMonthly(mo);
      setCategoryMonth(cm);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not load data';
      setLoadError(msg);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh, tick]),
  );

  function openCategoryForAmount(amount: number) {
    if (!Number.isFinite(amount) || amount === 0) return;
    setPendingAmount(amount);
    setCategoryOpen(true);
  }

  async function onPickCategory(cat: SpentCategory, myPortion: number) {
    if (pendingAmount == null) return;
    try {
      await addSpendEntry(pendingAmount, cat, myPortion);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      setLoadError(msg);
      return;
    }
    setPendingAmount(null);
    setCategoryOpen(false);
    setCalcKey((k) => k + 1);
    setTick((t) => t + 1);
    await refresh();
  }

  async function onResetPeriod() {
    try {
      await resetSpendingPeriod();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Reset failed';
      setLoadError(msg);
      return;
    }
    setCalcKey((k) => k + 1);
    setTick((t) => t + 1);
    await refresh();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.xl * 2 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="spent. logo"
          />
        </View>

        {loadError ? (
          <Text style={styles.errorBanner} accessibilityRole="alert">
            Data error: {loadError}
          </Text>
        ) : null}

        <CalculatorPad resetKey={calcKey} onAmountReady={openCategoryForAmount} />

        <Pressable
          onPress={() => {
            void refresh().then(() => setTotalsOpen(true));
          }}
          style={({ pressed }) => [styles.totalsBtn, pressed && styles.totalsBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Open totals"
        >
          <Text style={styles.totalsBtnText}>Totals</Text>
          <Text style={styles.totalsHint}>
            You: ${runningTotal.toFixed(2)}
            {otherRunningTotal > 0 ? ` · Others: $${otherRunningTotal.toFixed(2)}` : ''}
          </Text>
        </Pressable>

        <View style={styles.micCentered}>
          <VoiceMicButton wrapStyle={styles.micBelowTotals} onAmountRecognized={openCategoryForAmount} />
        </View>

        <ChartsSection monthly={monthly} categoryThisMonth={categoryMonth} />
      </ScrollView>

      <TotalsModal
        visible={totalsOpen}
        runningTotal={runningTotal}
        otherRunningTotal={otherRunningTotal}
        breakdown={breakdown}
        onClose={() => setTotalsOpen(false)}
        onReset={() => void onResetPeriod()}
      />

      <CategoryPickerModal
        visible={categoryOpen}
        amount={pendingAmount}
        onSelect={(c, my) => void onPickCategory(c, my)}
        onClose={() => {
          setCategoryOpen(false);
          setPendingAmount(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  scroll: {
    flexGrow: 1,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    minHeight: 100,
  },
  logo: {
    width: '100%',
    height: 100,
    maxWidth: 280,
  },
  errorBanner: {
    ...typography.subtitle,
    color: '#fca5a5',
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.5)',
    backgroundColor: 'rgba(127,29,29,0.35)',
  },
  totalsBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.accentHot,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: 4,
  },
  totalsBtnPressed: {
    opacity: 0.9,
    borderColor: colors.accent,
  },
  totalsBtnText: {
    ...typography.title,
    fontSize: 18,
    letterSpacing: 4,
    color: colors.accentHot,
  },
  totalsHint: {
    ...typography.subtitle,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  micCentered: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  micBelowTotals: {
    marginTop: spacing.sm,
    marginBottom: 0,
  },
});
