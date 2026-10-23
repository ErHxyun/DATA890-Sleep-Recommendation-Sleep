import { StyleSheet, type ViewProps } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { type ThemeColor, Spacing } from '@/constants/theme';

type CardProps = ViewProps & {
  /** Background token; soft accent tints work well for highlighted cards. */
  tone?: ThemeColor;
};

export function Card({ style, tone = 'backgroundElement', ...props }: CardProps) {
  return <ThemedView type={tone} style={[styles.card, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: Spacing.four - Spacing.one,
    gap: Spacing.three,
    boxShadow: '0 8px 24px rgba(79, 52, 34, 0.06)',
  },
});
