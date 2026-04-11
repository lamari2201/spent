import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/theme';

type Op = '+' | '-';

function fmt(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 100) / 100);
}

function applyOp(a: number, b: number, op: Op): number {
  return op === '+' ? a + b : a - b;
}

type Props = {
  onAmountReady: (amount: number) => void;
  resetKey: number;
};

export function CalculatorPad({ onAmountReady, resetKey }: Props) {
  const [display, setDisplay] = useState('0');
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<Op | null>(null);
  const [overwrite, setOverwrite] = useState(true);

  const hardReset = useCallback(() => {
    setDisplay('0');
    setAccumulator(null);
    setPendingOp(null);
    setOverwrite(true);
  }, []);

  useEffect(() => {
    hardReset();
  }, [resetKey, hardReset]);

  function pressDigit(d: string) {
    if (overwrite) {
      const neg = display.startsWith('-');
      const core = neg ? display.slice(1) : display;
      if (core === '0' || core === '0.') {
        if (d === '.') {
          setDisplay((neg ? '-' : '') + '0.');
        } else {
          setDisplay((neg ? '-' : '') + d);
        }
        setOverwrite(false);
        return;
      }
      setDisplay(d === '.' ? '0.' : d);
      setOverwrite(false);
      return;
    }
    if (d === '.') {
      if (display.includes('.')) return;
      setDisplay((prev) => (prev === '0' && !prev.includes('.') ? '0.' : `${prev}.`));
      return;
    }
    setDisplay((prev) => {
      if (prev === '-0' && d !== '.') return `-${d}`;
      if (prev === '-0.' && d !== '.') return `-0.${d}`;
      if (prev === '0' && !prev.includes('.')) return d;
      return prev + d;
    });
  }

  function pressToggleSign() {
    if (display.startsWith('-')) {
      const rest = display.slice(1);
      setDisplay(rest === '' ? '0' : rest);
    } else if (display === '0' || display === '0.') {
      setDisplay(display === '0.' ? '-0.' : '-0');
    } else {
      setDisplay(`-${display}`);
    }
    setOverwrite(false);
  }

  function pressOp(op: Op) {
    const cur = parseFloat(display);
    if (!Number.isFinite(cur)) return;

    if (accumulator !== null && pendingOp !== null) {
      const next = applyOp(accumulator, cur, pendingOp);
      setAccumulator(next);
      setDisplay(fmt(next));
    } else {
      setAccumulator(cur);
    }
    setPendingOp(op);
    setOverwrite(true);
  }

  function pressEquals() {
    const cur = parseFloat(display);
    if (!Number.isFinite(cur)) return;
    let result: number;
    if (accumulator !== null && pendingOp !== null) {
      result = applyOp(accumulator, cur, pendingOp);
    } else {
      result = cur;
    }
    if (!Number.isFinite(result)) return;
    setDisplay(fmt(result));
    setAccumulator(null);
    setPendingOp(null);
    setOverwrite(true);
    onAmountReady(result);
  }

  function pressClear() {
    hardReset();
  }

  function pressBack() {
    if (overwrite) return;
    setDisplay((prev) => {
      if (prev.length <= 1) return '0';
      const next = prev.slice(0, -1);
      if (next === '-' || next === '-0') return '0';
      return next;
    });
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.display}>
        <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>
          {display}
        </Text>
      </View>
      <View style={styles.grid}>
        {[
          ['1', '2', '3', '+'],
          ['4', '5', '6', '-'],
          ['7', '8', '9', '⌫'],
        ].map((row, ri) => (
          <View style={styles.row} key={ri}>
            {row.map((k) => (
              <Pressable
                key={k}
                onPress={() => {
                  if (k === '+') pressOp('+');
                  else if (k === '-') pressOp('-');
                  else if (k === '⌫') pressBack();
                  else pressDigit(k);
                }}
                style={({ pressed }) => [
                  styles.key,
                  (k === '+' || k === '-') && styles.keyOp,
                  k === '⌫' && styles.keyUtil,
                  pressed && styles.keyPressed,
                ]}
              >
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[
                    styles.keyText,
                    (k === '+' || k === '-') && styles.keyTextOp,
                    k === '⌫' && styles.keyTextUtil,
                  ]}
                >
                  {k}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}
        <View style={styles.row}>
          <Pressable
            onPress={() => pressDigit('.')}
            style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
          >
            <Text style={styles.keyText}>.</Text>
          </Pressable>
          <Pressable
            onPress={() => pressDigit('0')}
            style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
          >
            <Text style={styles.keyText}>0</Text>
          </Pressable>
          <Pressable
            onPress={pressToggleSign}
            style={({ pressed }) => [styles.key, styles.keyUtil, pressed && styles.keyPressed]}
            accessibilityRole="button"
            accessibilityLabel="Toggle plus or minus"
          >
            <Text style={[styles.keyText, styles.keyTextUtil]}>±</Text>
          </Pressable>
          <Pressable
            onPress={pressClear}
            style={({ pressed }) => [styles.key, styles.keyUtil, pressed && styles.keyPressed]}
          >
            <Text style={[styles.keyText, styles.keyTextUtil]}>C</Text>
          </Pressable>
        </View>
        <View style={styles.row}>
          <Pressable
            onPress={pressEquals}
            style={({ pressed }) => [styles.keyEnter, styles.keyOp, pressed && styles.keyPressed]}
            accessibilityRole="button"
            accessibilityLabel="Enter amount"
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.keyText, styles.keyTextOp, styles.keyTextEnter]}
            >
              enter
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  display: {
    backgroundColor: colors.surface,
    borderRadius: radii.pad,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    minHeight: 72,
    justifyContent: 'center',
  },
  displayText: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  grid: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  key: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 72,
    borderRadius: radii.pad,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyOp: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  keyEnter: {
    flex: 1,
    minHeight: 52,
    maxHeight: 72,
    borderRadius: radii.pad,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyUtil: {
    borderColor: colors.borderStrong,
  },
  keyPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  keyText: {
    fontSize: 26,
    fontWeight: '600',
    color: colors.text,
  },
  keyTextOp: {
    fontSize: 28,
    color: colors.accent,
  },
  keyTextEnter: {
    fontSize: 18,
    letterSpacing: 1,
    textTransform: 'lowercase',
  },
  keyTextUtil: {
    ...typography.label,
    fontSize: 18,
    color: colors.textMuted,
  },
});
