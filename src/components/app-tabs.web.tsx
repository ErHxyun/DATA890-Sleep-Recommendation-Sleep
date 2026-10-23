import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, View, StyleSheet } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Web has no system tab bar, so the prototype draws a floating pill bar. */
export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="bedtime">Today</TabButton>
          </TabTrigger>
          <TabTrigger name="journal" href="/journal" asChild>
            <TabButton icon="edit_note">Journal</TabButton>
          </TabTrigger>
          <TabTrigger name="insights" href="/insights" asChild>
            <TabButton icon="insights">Insights</TabButton>
          </TabTrigger>
          <TabTrigger name="coach" href="/coach" asChild>
            <TabButton icon="self_improvement">Coach</TabButton>
          </TabTrigger>
          <TabTrigger name="learn" href="/learn" asChild>
            <TabButton icon="menu_book">Learn</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  icon: Extract<SymbolViewProps['name'], object>['web'];
};

export function TabButton({ children, isFocused, icon, ref: _ref, ...props }: TabButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      {...props}
      accessibilityLabel={typeof children === 'string' ? children : undefined}
      style={({ pressed }) => [
        styles.tabButton,
        isFocused
          ? { backgroundColor: theme.onPrimary }
          : { borderColor: `${theme.onPrimary}40`, borderWidth: 1.5 },
        pressed && styles.pressed,
      ]}>
      <SymbolView
        name={{ web: icon }}
        size={24}
        tintColor={isFocused ? theme.primary : theme.onPrimary}
      />
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const theme = useTheme();
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={[styles.innerContainer, { backgroundColor: theme.primary }]}>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    bottom: Spacing.three,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: Spacing.three + Spacing.one,
  },
  innerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: MaxContentWidth - Spacing.five,
    padding: Spacing.two,
    borderRadius: 40,
    boxShadow: '0 12px 32px rgba(79, 52, 34, 0.25)',
  },
  tabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
