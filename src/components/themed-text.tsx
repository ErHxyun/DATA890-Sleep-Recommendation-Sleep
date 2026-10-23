import { StyleSheet, Text, type TextProps } from 'react-native';

import { FontFamily, Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'small'
    | 'smallBold'
    | 'subtitle'
    | 'heading'
    | 'link'
    | 'linkPrimary'
    | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  small: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  smallBold: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    lineHeight: 20,
  },
  default: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontFamily: FontFamily.extrabold,
    fontSize: 48,
    lineHeight: 52,
  },
  subtitle: {
    fontFamily: FontFamily.extrabold,
    fontSize: 32,
    lineHeight: 40,
  },
  heading: {
    fontFamily: FontFamily.extrabold,
    fontSize: 20,
    lineHeight: 26,
  },
  link: {
    fontFamily: FontFamily.semibold,
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    fontFamily: FontFamily.semibold,
    lineHeight: 30,
    fontSize: 14,
    color: '#7D944D',
  },
  code: {
    fontFamily: Fonts.mono,
    fontSize: 12,
  },
});
