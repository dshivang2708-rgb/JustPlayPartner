// JustPlay Partner — design tokens
// Brand chrome = dark navy + gold (inherited from consumer JustPlay app)
// Working surfaces = light slate, dense & scannable (this is a desk/counter tool)

export const color = {
  // Brand chrome — header, sidebar/nav, primary buttons, onboarding
  chromeBlack: '#0A0E14',
  chromeNavy: '#121926',
  chromeNavyLight: '#1B2333', // elevated surfaces on dark chrome (cards on onboarding)
  gold: '#C5A059',
  goldMuted: 'rgba(197, 160, 89, 0.16)', // gold wash for active states / highlights
  goldBorder: 'rgba(197, 160, 89, 0.35)',

  // Working surfaces — dashboard, tables, forms
  surface: '#FFFFFF',
  background: '#F8FAFC',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',

  // Text
  textOnLight: '#1E293B', // deep slate
  textOnLightMuted: '#64748B',
  textOnLightFaint: '#94A3B8',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: 'rgba(255, 255, 255, 0.64)',
  textOnDarkFaint: 'rgba(255, 255, 255, 0.4)',

  // Status — data contexts only, never brand chrome
  success: '#16A34A',
  successBg: '#DCFCE7',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  danger: '#DC2626',
  dangerBg: '#FEE2E2',
  info: '#2563EB',
  infoBg: '#DBEAFE',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16, // standard card radius
  xl: 24, // sheet overlap radius
  pill: 999,
} as const;

export const shadow = {
  card: {
    shadowColor: '#0A0E14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardRaised: {
    shadowColor: '#0A0E14',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
} as const;

export const font = {
  serif: 'PlayfairDisplay_700Bold',
  serifSemiBold: 'PlayfairDisplay_600SemiBold',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

export const type = {
  // Serif — section headers & hero numbers
  heroNumber: { fontFamily: font.serif, fontSize: 40, lineHeight: 46 },
  heroNumberSm: { fontFamily: font.serif, fontSize: 28, lineHeight: 34 },
  sectionHeader: { fontFamily: font.serifSemiBold, fontSize: 20, lineHeight: 26 },
  screenTitle: { fontFamily: font.serifSemiBold, fontSize: 24, lineHeight: 30 },

  // Sans — functional UI
  body: { fontFamily: font.sans, fontSize: 15, lineHeight: 21 },
  bodyMedium: { fontFamily: font.sansMedium, fontSize: 15, lineHeight: 21 },
  label: { fontFamily: font.sansMedium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: font.sans, fontSize: 12, lineHeight: 16 },
  metricLabel: { fontFamily: font.sansMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
  button: { fontFamily: font.sansSemiBold, fontSize: 15, lineHeight: 20 },
  tableHeader: { fontFamily: font.sansSemiBold, fontSize: 11, lineHeight: 14, letterSpacing: 0.6 },
} as const;
