import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { IconCircle } from '@/components/icon-circle';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Palette, Spacing } from '@/constants/theme';
import { formatClock } from '@/data/sleep-math';
import {
  TONE_META,
  type ChoiceOption,
  type CounterField,
  type Tone,
} from '@/data/journal-questions';
import { useTheme } from '@/hooks/use-theme';

const TONE_COLORS: Record<Tone, { background: string; color: string }> = {
  great: { background: Palette.green, color: '#FFFFFF' },
  good: { background: Palette.yellow, color: Palette.brown },
  okay: { background: Palette.orange, color: '#FFFFFF' },
  poor: { background: Palette.lavender, color: '#FFFFFF' },
};

/** One tall row per option, with a weather icon showing how good the answer is. */
export function OptionList({
  options,
  value,
  onChange,
}: {
  options: ChoiceOption[];
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.optionList}>
      {options.map((option) => {
        const selected = option.value === value;
        const tone = TONE_COLORS[option.tone ?? 'good'];
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: selected ? tone.background : 'transparent',
              },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="heading" style={styles.flex}>
              {option.label}
            </ThemedText>
            <View style={!selected && value !== undefined ? styles.dimmed : undefined}>
              <IconCircle
                icon={TONE_META[option.tone ?? 'good'].icon}
                background={tone.background}
                color={tone.color}
                size={48}
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Wrapping chips for "pick all that apply"; an `exclusive` option clears the rest. */
export function ChipSelect({
  options,
  value,
  exclusive,
  onChange,
}: {
  options: ChoiceOption[];
  value: string[];
  exclusive?: string;
  onChange: (value: string[]) => void;
}) {
  const theme = useTheme();

  function toggle(option: string) {
    if (value.includes(option)) return onChange(value.filter((item) => item !== option));
    if (option === exclusive) return onChange([option]);
    onChange([...value.filter((item) => item !== exclusive), option]);
  }

  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <Pressable
            key={option.value}
            onPress={() => toggle(option.value)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: selected ? theme.primary : theme.backgroundElement,
              },
              pressed && styles.pressed,
            ]}>
            {selected && (
              <SymbolView
                name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                size={16}
                tintColor={theme.onPrimary}
              />
            )}
            <ThemedText type="smallBold" style={{ color: selected ? theme.onPrimary : theme.text }}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Big clock with round −/+ buttons; avoids a platform date picker for the prototype.
 * Starts empty so the answer is the user's own; the first tap jumps to `start`.
 */
export function TimeAdjuster({
  value,
  start,
  stepMinutes,
  onChange,
}: {
  value: Date | undefined;
  start: Date;
  stepMinutes: number;
  onChange: (value: Date) => void;
}) {
  const shift = (direction: 1 | -1) =>
    onChange(value ? new Date(value.getTime() + direction * stepMinutes * 60_000) : start);

  return (
    <View style={styles.answerStack}>
      <View style={styles.adjuster}>
        <RoundButton
          label="Decrease"
          icon={{ ios: 'minus', android: 'remove', web: 'remove' }}
          onPress={() => shift(-1)}
        />
        <ThemedText style={styles.clock} themeColor={value ? 'text' : 'textSecondary'}>
          {value ? formatClock(value) : '--:--'}
        </ThemedText>
        <RoundButton
          label="Increase"
          icon={{ ios: 'plus', android: 'add', web: 'add' }}
          onPress={() => shift(1)}
        />
      </View>
      {!value && <EmptyHint />}
    </View>
  );
}

export function CounterList({
  fields,
  value,
  onChange,
}: {
  fields: CounterField[];
  value: Record<string, number>;
  onChange: (value: Record<string, number>) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.optionList}>
      {fields.map((field) => {
        const current: number | undefined = value[field.id];
        const set = (next: number) =>
          onChange({
            ...value,
            [field.id]: Math.min(field.max, Math.max(field.min, next)),
          });
        const step = (direction: 1 | -1) =>
          set(current === undefined ? field.start : current + direction * field.step);
        return (
          <View
            key={field.id}
            style={[styles.counter, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {field.label}
            </ThemedText>
            <View style={styles.adjuster}>
              <RoundButton
                label="Decrease"
                icon={{ ios: 'minus', android: 'remove', web: 'remove' }}
                disabled={current !== undefined && current <= field.min}
                onPress={() => step(-1)}
              />
              <View style={styles.counterValue}>
                <ThemedText
                  style={styles.clock}
                  themeColor={current === undefined ? 'textSecondary' : 'text'}>
                  {current ?? '—'}
                </ThemedText>
                <ThemedText type="heading" themeColor="textSecondary">
                  {field.unit}
                </ThemedText>
              </View>
              <RoundButton
                label="Increase"
                icon={{ ios: 'plus', android: 'add', web: 'add' }}
                disabled={current !== undefined && current >= field.max}
                onPress={() => step(1)}
              />
            </View>
            {current === undefined && <EmptyHint />}
          </View>
        );
      })}
    </View>
  );
}

export function TextAnswer({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const theme = useTheme();
  const MAX = 500;
  return (
    <View style={[styles.textBox, { backgroundColor: theme.backgroundElement }]}>
      <TextInput
        multiline
        value={value}
        onChangeText={onChange}
        maxLength={MAX}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        style={[styles.textInput, { color: theme.text }]}
      />
      <ThemedText type="small" themeColor="textSecondary" style={styles.count}>
        {value.length}/{MAX}
      </ThemedText>
    </View>
  );
}

function EmptyHint() {
  return (
    <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
      Tap − or + to set your answer
    </ThemedText>
  );
}

function RoundButton({
  label,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  icon: SymbolViewProps['name'];
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.roundButton,
        { borderColor: theme.backgroundSelected },
        disabled && styles.dimmed,
        pressed && styles.pressed,
      ]}>
      <SymbolView name={icon} size={22} tintColor={theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  dimmed: {
    opacity: 0.35,
  },
  optionList: {
    gap: Spacing.three - Spacing.one,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three - Spacing.one,
    paddingLeft: Spacing.four,
    paddingRight: Spacing.three - Spacing.one,
    borderRadius: 40,
    borderWidth: 2.5,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two + Spacing.one,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three + Spacing.one,
    height: 48,
    borderRadius: 24,
  },
  answerStack: {
    gap: Spacing.two,
  },
  hint: {
    textAlign: 'center',
  },
  adjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clock: {
    fontFamily: FontFamily.extrabold,
    fontSize: 44,
    lineHeight: 52,
  },
  roundButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    borderRadius: 28,
    padding: Spacing.four - Spacing.one,
    gap: Spacing.two,
  },
  counterValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
  },
  textBox: {
    borderRadius: 28,
    padding: Spacing.four - Spacing.one,
    minHeight: 200,
  },
  textInput: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 20,
    lineHeight: 28,
    textAlignVertical: 'top',
    ...Platform.select({ web: { outlineWidth: 0 } }),
  },
  count: {
    textAlign: 'right',
  },
});
