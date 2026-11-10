import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** 16:9 slot for a lesson video that hasn't been produced yet. Swap for a player later. */
export function VideoPlaceholder({ label = 'Video coming soon' }: { label?: string }) {
  const theme = useTheme();
  return (
    <View
      accessibilityLabel={label}
      style={[
        styles.box,
        { backgroundColor: theme.backgroundSelected, borderColor: theme.textSecondary },
      ]}>
      <View style={[styles.play, { backgroundColor: theme.primary }]}>
        <SymbolView
          name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }}
          size={26}
          tintColor={theme.onPrimary}
        />
      </View>
      <ThemedText type="smallBold">{label}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Placeholder · 16:9
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  play: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
