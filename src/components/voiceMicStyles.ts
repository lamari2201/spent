import { StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/theme';

export const voiceMicStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  mic: {
    width: 88,
    height: 88,
    borderRadius: radii.pill,
    backgroundColor: colors.mic,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.accentHot,
  },
  micActive: {
    backgroundColor: colors.micActive,
    transform: [{ scale: 1.05 }],
  },
  micDisabled: {
    opacity: 0.35,
  },
  micPressed: {
    opacity: 0.9,
  },
  hint: {
    ...typography.subtitle,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    maxWidth: 320,
  },
});
