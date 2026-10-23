import { SymbolView } from 'expo-symbols';
import { type PropsWithChildren } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { setColorScheme, useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
}>;

/** Scrollable tab screen with a large title, padded for the safe area and the tab bar. */
export function Screen({ title, subtitle, children }: ScreenProps) {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const scheme = useColorScheme();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top + Spacing.three,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.four,
      paddingBottom: insets.bottom,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={[styles.logo, { borderColor: theme.backgroundSelected }]}>
              <SymbolView
                name={{ ios: 'moon.fill', android: 'bedtime', web: 'bedtime' }}
                size={18}
                tintColor={theme.text}
              />
            </View>
            {subtitle && (
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.flex}>
                {subtitle}
              </ThemedText>
            )}
            <Pressable
              onPress={() => setColorScheme(scheme === 'dark' ? 'light' : 'dark')}
              accessibilityRole="button"
              accessibilityLabel={
                scheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
              }
              style={({ pressed }) => [
                styles.logo,
                styles.toggle,
                { borderColor: theme.backgroundSelected },
                pressed && styles.pressed,
              ]}>
              <SymbolView
                name={
                  scheme === 'dark'
                    ? { ios: 'sun.max.fill', android: 'light_mode', web: 'light_mode' }
                    : { ios: 'moon.stars', android: 'dark_mode', web: 'dark_mode' }
                }
                size={18}
                tintColor={theme.text}
              />
            </Pressable>
          </View>
          <ThemedText type="subtitle">{title}</ThemedText>
        </View>
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three + Spacing.one,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  flex: {
    flex: 1,
  },
  toggle: {
    marginLeft: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
