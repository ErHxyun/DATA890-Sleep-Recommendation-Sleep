import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SegmentOption<T extends string | number> = {
  value: T;
  label: string;
  /** Small dot that draws attention to a segment, e.g. a safety flag. */
  alert?: boolean;
};

/**
 * Pill segmented control. Used to split long screens into short views and for range
 * filters; it sits in one row above everything it scopes.
 */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.option,
              selected && { backgroundColor: theme.primary },
              pressed && styles.pressed,
            ]}>
            <ThemedText
              type="smallBold"
              style={{ color: selected ? theme.onPrimary : theme.textSecondary }}>
              {option.label}
            </ThemedText>
            {option.alert && <View style={[styles.dot, { backgroundColor: theme.warning }]} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: Spacing.one,
    borderRadius: 24,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 20,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  pressed: {
    opacity: 0.7,
  },
});
