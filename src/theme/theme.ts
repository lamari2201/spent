export const colors = {
  background: '#0c0f14',
  surface: '#151a22',
  accent: '#7cf5d6',
  accentHot: '#f472b6',
  accentMuted: 'rgba(124, 245, 214, 0.14)',
  border: '#2a3140',
  borderStrong: '#3d4656',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  mic: '#7cf5d6',
  micActive: '#fcd34d',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radii = {
  card: 16,
  pad: 12,
  pill: 999,
};

export const typography = {
  title: { fontSize: 20, fontWeight: '700' as const },
  subtitle: { fontSize: 14, color: colors.textMuted },
  body: { fontSize: 16, color: colors.text },
  label: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 1.2, color: colors.textMuted },
};
