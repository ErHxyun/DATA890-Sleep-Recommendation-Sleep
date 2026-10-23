import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Interpretation } from '@/data/interpretation';
import { useTheme } from '@/hooks/use-theme';

/** Sections shown before "More context". */
const PRIMARY = new Set(['seen', 'reasons']);

/**
 * "What this means": a one-line takeaway, then what the chart shows and why it might be,
 * with background and when-to-get-help tucked behind "More context".
 */
export function InterpretationPanel({ interpretation }: { interpretation: Interpretation }) {
  const theme = useTheme();
  const [more, setMore] = useState(false);
  const primary = interpretation.sections.filter((s) => PRIMARY.has(s.id));
  const extra = interpretation.sections.filter((s) => !PRIMARY.has(s.id));

  return (
    <View style={[styles.panel, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <SymbolView
          name={{ ios: 'lightbulb.fill', android: 'lightbulb', web: 'lightbulb' }}
          size={16}
          tintColor={theme.accent}
        />
        <ThemedText type="smallBold" themeColor="accent">
          What this means
        </ThemedText>
      </View>
      <ThemedText type="smallBold">{interpretation.headline}</ThemedText>

      {[...primary, ...(more ? extra : [])].map((section) => (
        <View
          key={section.id}
          style={[
            styles.section,
            section.id === 'checkIn' && [styles.checkIn, { backgroundColor: theme.orangeSoft }],
          ]}>
          <ThemedText type="smallBold">{section.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {section.text}
          </ThemedText>
        </View>
      ))}

      <View style={styles.footer}>
        <Pressable
          onPress={() => setMore((value) => !value)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}>
          <ThemedText type="smallBold" themeColor="accent">
            {more ? 'Less' : 'More context'}
          </ThemedText>
          <SymbolView
            name={{
              ios: more ? 'chevron.up' : 'chevron.down',
              android: more ? 'expand_less' : 'expand_more',
              web: more ? 'expand_less' : 'expand_more',
            }}
            size={14}
            tintColor={theme.accent}
          />
        </Pressable>
        <ThemedText
          type="small"
          themeColor={interpretation.clinicalReview === 'reviewed' ? 'positive' : 'warning'}>
          {interpretation.clinicalReview === 'reviewed'
            ? '✓ Clinician reviewed'
            : '● Pending clinical review'}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 20,
    padding: Spacing.three,
    gap: Spacing.three - Spacing.one,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  section: {
    gap: Spacing.half,
  },
  checkIn: {
    borderRadius: 14,
    padding: Spacing.three - Spacing.one,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
});
