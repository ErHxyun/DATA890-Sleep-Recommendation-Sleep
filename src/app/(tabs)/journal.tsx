import { router } from 'expo-router';
import { type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { IconCircle } from '@/components/icon-circle';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing } from '@/constants/theme';
import { CHECK_INS, type CheckInKind } from '@/data/journal-questions';
import { useCheckIns } from '@/data/journal-store';
import { formatClock } from '@/data/sleep-math';
import { useTheme } from '@/hooks/use-theme';

const KIND_META: Record<
  CheckInKind,
  { when: string; icon: SymbolViewProps['name']; background: string; color: string }
> = {
  morning: {
    when: 'After you wake up',
    icon: { ios: 'sun.horizon.fill', android: 'wb_twilight', web: 'wb_twilight' },
    background: Palette.yellow,
    color: Palette.brown,
  },
  evening: {
    when: 'Before bed',
    icon: { ios: 'moon.stars.fill', android: 'nights_stay', web: 'nights_stay' },
    background: Palette.lavender,
    color: '#FFFFFF',
  },
};

/** Mock completion for the past six days: [morning, evening]. */
const PAST_WEEK: [boolean, boolean][] = [
  [true, true],
  [true, false],
  [true, true],
  [false, false],
  [true, true],
  [true, true],
];

export default function JournalScreen() {
  const checkIns = useCheckIns();
  const recommended: CheckInKind = new Date().getHours() < 15 ? 'morning' : 'evening';

  return (
    <Screen title="Sleep journal" subtitle="Based on the NSF sleep diary">
      {(['morning', 'evening'] as const).map((kind) => (
        <CheckInCard
          key={kind}
          kind={kind}
          completedAt={checkIns[kind]?.completedAt}
          recommended={kind === recommended}
        />
      ))}

      <WeekStrip today={[!!checkIns.morning, !!checkIns.evening]} />

      <Card tone="greenSoft">
        <ThemedText type="heading">Why keep a journal?</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Your Apple Watch measures how you slept, but not why. Caffeine, alcohol, naps, stress, and
          how rested you feel fill in that picture, and they&apos;re what your coaching
          recommendations are built on.
        </ThemedText>
      </Card>
    </Screen>
  );
}

function CheckInCard({
  kind,
  completedAt,
  recommended,
}: {
  kind: CheckInKind;
  completedAt?: Date;
  recommended: boolean;
}) {
  const theme = useTheme();
  const meta = KIND_META[kind];
  const { title, questions } = CHECK_INS[kind];
  const done = completedAt !== undefined;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/check-in/[kind]', params: { kind } })}
      style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.checkIn}>
        <IconCircle icon={meta.icon} background={meta.background} color={meta.color} size={56} />
        <View style={styles.flex}>
          <View style={styles.titleRow}>
            <ThemedText type="heading">{title}</ThemedText>
            {recommended && !done && (
              <View style={[styles.pill, { backgroundColor: theme.orangeSoft }]}>
                <ThemedText style={[styles.pillText, { color: theme.warning }]}>Now</ThemedText>
              </View>
            )}
          </View>
          <ThemedText type="small" themeColor={done ? 'positive' : 'textSecondary'}>
            {done
              ? `✓ Done at ${formatClock(completedAt)}`
              : `${meta.when} · ${questions.length} questions · ~1 min`}
          </ThemedText>
        </View>
        <IconCircle
          icon={
            done
              ? { ios: 'pencil', android: 'edit', web: 'edit' }
              : { ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }
          }
          background={done ? theme.backgroundSelected : theme.primary}
          color={done ? theme.text : theme.onPrimary}
          size={40}
        />
      </Card>
    </Pressable>
  );
}

function WeekStrip({ today }: { today: [boolean, boolean] }) {
  const theme = useTheme();
  const days = [...PAST_WEEK, today].map((entries, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return {
      entries,
      label: date.toLocaleDateString('en-US', { weekday: 'narrow' }),
      isToday: index === 6,
    };
  });

  return (
    <Card>
      <View style={styles.titleRow}>
        <ThemedText type="heading">This week</ThemedText>
        <View style={styles.legend}>
          <Dot color={Palette.yellow} />
          <ThemedText type="small" themeColor="textSecondary">
            AM
          </ThemedText>
          <Dot color={Palette.lavender} />
          <ThemedText type="small" themeColor="textSecondary">
            PM
          </ThemedText>
        </View>
      </View>
      <View style={styles.week}>
        {days.map(({ entries, label, isToday }, index) => (
          <View key={index} style={styles.day}>
            <View
              style={[
                styles.dayCircle,
                isToday
                  ? { backgroundColor: theme.primary }
                  : { backgroundColor: theme.backgroundSelected },
              ]}>
              <ThemedText
                type="smallBold"
                style={{ color: isToday ? theme.onPrimary : theme.textSecondary }}>
                {label}
              </ThemedText>
            </View>
            <View style={styles.dots}>
              <Dot color={entries[0] ? Palette.yellow : theme.backgroundSelected} />
              <Dot color={entries[1] ? Palette.lavender : theme.backgroundSelected} />
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

function Dot({ color }: { color: string }) {
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  checkIn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  pill: {
    paddingHorizontal: Spacing.two + Spacing.one,
    paddingVertical: Spacing.half,
    borderRadius: 12,
  },
  pillText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 700,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
