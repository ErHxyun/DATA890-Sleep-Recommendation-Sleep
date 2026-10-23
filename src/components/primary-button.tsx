import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

/** Full-width pill button with a trailing arrow, the app's main call to action. */
export function PrimaryButton({ label, onPress, disabled }: PrimaryButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.primary },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      <ThemedText style={[styles.label, { color: theme.onPrimary }]}>{label}</ThemedText>
      <SymbolView
        name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
        size={18}
        tintColor={theme.onPrimary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 56,
    borderRadius: 28,
  },
  label: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.35,
  },
});
