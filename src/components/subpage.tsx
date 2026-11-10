import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { type PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Full-screen page opened from a tab (a topic, the guide), with a round back button.
 * `fallback` is where back goes when the page was opened directly from a link.
 */
export function Subpage({
  label,
  fallback,
  children,
}: PropsWithChildren<{ label: string; fallback: Href }>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.five },
      ]}>
      <View style={styles.column}>
        <View style={styles.header}>
          <Pressable
            onPress={close}
            accessibilityLabel="Back"
            style={({ pressed }) => [
              styles.back,
              { borderColor: theme.backgroundSelected },
              pressed && styles.pressed,
            ]}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
              size={20}
              tintColor={theme.text}
            />
          </Pressable>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {label}
          </ThemedText>
        </View>
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
  },
  column: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three + Spacing.one,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
