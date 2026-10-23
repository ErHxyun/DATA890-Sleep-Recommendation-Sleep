import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type RangeOption = { value: number; label: string };

/** Pill segmented control; one row above everything it scopes. */
export function RangeControl({
  options,
  value,
  onChange,
}: {
  options: RangeOption[];
  value: number;
  onChange: (value: number) => void;
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
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 20,
  },
  pressed: {
    opacity: 0.7,
  },
});
