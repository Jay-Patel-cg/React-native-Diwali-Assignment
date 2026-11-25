/**
 * Ocean-inspired design system tokens for "Samundar Ke Sath".
 * Mirrors tailwind.config.js so inline StyleSheet & NativeWind classes stay 100% in sync.
 */
export const COLORS = {
  // Primary Ocean Palette
  primary: '#0B4F6C',       // Deep Ocean
  primaryLight: '#0E7490',  // Mid Ocean
  primaryDark: '#083344',   // Abyss Blue
  secondary: '#14B8A6',     // Turquoise Horizon / Seafoam
  secondarySoft: '#CCFBF1',
  oceanTint: '#ECFEFF',

  // Warm Coastal Surfaces
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceWarm: '#FDFBF7',
  surfaceMuted: '#F1F5F9',

  // Accents & Status
  coral: '#F97316',         // Sunset Coral CTA / highlight
  coralSoft: '#FFEDD5',
  success: '#10B981',       // Reef Emerald
  successSoft: '#D1FAE5',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  danger: '#EF4444',
  dangerSoft: '#FEE2E2',

  // Typography & Borders
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
};

export const TYPOGRAPHY = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.6 },
  h1: { fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.4 },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: '700', letterSpacing: -0.2 },
  h3: { fontSize: 17, lineHeight: 23, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyMedium: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  bodySmall: { fontSize: 13, lineHeight: 19, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.4 },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const SHADOWS = {
  card: {
    shadowColor: '#0B4F6C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#083344',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 6,
  },
};

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
};

