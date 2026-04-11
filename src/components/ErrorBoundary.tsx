import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme/theme';

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string };

/**
 * Catches render errors so a failed screen does not leave users on a blank view.
 * App Store: demonstrates basic stability handling; errors are not shown with stack traces in production UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, message: error.message };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    if (__DEV__) {
      console.error(error, info.componentStack);
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, message: '' });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container} accessibilityRole="alert">
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            {this.state.message || 'An unexpected error occurred.'}
          </Text>
          <Pressable
            onPress={this.handleReset}
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text style={styles.btnLabel}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    fontSize: 22,
    color: colors.text,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
  },
  btn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  btnPressed: {
    opacity: 0.9,
  },
  btnLabel: {
    ...typography.label,
    fontSize: 13,
    color: colors.accent,
  },
});
