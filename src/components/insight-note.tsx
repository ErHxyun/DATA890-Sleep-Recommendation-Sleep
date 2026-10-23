import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** A short takeaway for a chart, with optional "How to read this chart" help. */
export function InsightNote({ takeaway, howToRead }: { takeaway: string; howToRead?: string }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.note, { backgroundColor: theme.background }]}>
      <View style={styles.row}>
        <SymbolView
          name={{ ios: 'lightbulb.fill', android: 'lightbulb', web: 'lightbulb' }}
          size={16}
          tintColor={theme.accent}
        />
        <ThemedText type="small" style={styles.flex}>
          {takeaway}
        </ThemedText>
      </View>
      {howToRead && (
        <>
          <Pressable
            onPress={() => setOpen((value) => !value)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}>
            <ThemedText type="smallBold" themeColor="accent">
              {open ? 'Hide' : 'How to read this chart'}
            </ThemedText>
          </Pressable>
          {open && (
            <ThemedText type="small" themeColor="textSecondary">
              {howToRead}
            </ThemedText>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    borderRadius: 16,
    padding: Spacing.three - Spacing.one,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  flex: {
    flex: 1,
  },
  toggle: {
    alignSelf: 'flex-start',
    paddingLeft: Spacing.four,
  },
  pressed: {
    opacity: 0.7,
  },
});
