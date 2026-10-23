/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * Warm, low-glare palette: cream background, deep brown for primary actions, and
 * olive / orange / yellow / lavender accents that double as data colors.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Palette = {
  brown: '#4F3422',
  green: '#9BB068',
  orange: '#ED7E1C',
  yellow: '#FFCE5C',
  lavender: '#A694F5',
  cream: '#F7F4F2',
} as const;

export const Colors = {
  light: {
    text: '#3B2A1F',
    background: Palette.cream,
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EDE7E2',
    textSecondary: '#8C7A6E',
    border: '#EFE9E4',
    primary: Palette.brown,
    onPrimary: '#FFFFFF',
    accent: '#7D944D',
    positive: '#7D944D',
    warning: '#D46A0F',
    danger: '#D9454B',
    greenSoft: '#E8EDDB',
    orangeSoft: '#FDE8D5',
    yellowSoft: '#FFF2D3',
    lavenderSoft: '#ECE8FD',
    // Chart series, validated with the dataviz palette checker against the card surface.
    seriesSelf: '#D9650B',
    seriesWatch: '#7B66E0',
    seriesWith: '#6F8A3A',
    seriesWithout: '#D6CEC7',
    gridline: '#EFE9E4',
  },
  dark: {
    text: '#F7F4F2',
    background: '#1E1915',
    backgroundElement: '#2A231E',
    backgroundSelected: '#3A3029',
    textSecondary: '#B5A89E',
    border: '#352C26',
    primary: '#EDE3DA',
    onPrimary: '#3B2A1F',
    accent: '#B1C47F',
    positive: '#B1C47F',
    warning: '#F29A4A',
    danger: '#F07178',
    greenSoft: '#353A2A',
    orangeSoft: '#45301E',
    yellowSoft: '#423820',
    lavenderSoft: '#322E47',
    seriesSelf: '#D06A18',
    seriesWatch: '#8A73E8',
    seriesWith: '#9BB068',
    seriesWithout: '#4E433B',
    gridline: '#3A3029',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** One color per sleep stage, reused by every sleep chart. Deep brown is lifted in dark mode. */
export const StageColors = {
  light: {
    awake: Palette.orange,
    rem: Palette.yellow,
    core: Palette.green,
    deep: Palette.brown,
  },
  dark: {
    awake: Palette.orange,
    rem: Palette.yellow,
    core: Palette.green,
    deep: '#A97E62',
  },
} as const;

/** Urbanist is loaded in the root layout; each weight is its own family on native. */
export const FontFamily = {
  medium: 'Urbanist_500Medium',
  semibold: 'Urbanist_600SemiBold',
  bold: 'Urbanist_700Bold',
  extrabold: 'Urbanist_800ExtraBold',
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 96 }) ?? 0;
/** The web build is a phone-sized prototype, so content stays at iPhone width. */
export const MaxContentWidth = 440;
