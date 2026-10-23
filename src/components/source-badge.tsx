import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import type { DataSource } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';

const SOURCE_META: Record<DataSource, { label: string; icon: SymbolViewProps['name'] }> = {
  watch: { label: 'Apple Watch', icon: { ios: 'applewatch', android: 'watch', web: 'watch' } },
  journal: {
    label: 'Sleep journal',
    icon: { ios: 'book.closed', android: 'edit_note', web: 'edit_note' },
  },
  bpCuff: {
    label: 'BP cuff',
    icon: { ios: 'heart.text.square', android: 'monitor_heart', web: 'monitor_heart' },
  },
};

/** Small pill that tells the user where a number came from (provenance). */
export function SourceBadge({ source }: { source: DataSource }) {
  const theme = useTheme();
  const meta = SOURCE_META[source];
  return (
    <View style={[styles.badge, { borderColor: theme.backgroundSelected }]}>
      <SymbolView name={meta.icon} size={12} tintColor={theme.textSecondary} />
      <ThemedText style={styles.label} themeColor="textSecondary">
        {meta.label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  label: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    lineHeight: 16,
  },
});
