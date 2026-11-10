import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { IconCircle } from '@/components/icon-circle';
import { SegmentedControl } from '@/components/segmented-control';
import { Subpage } from '@/components/subpage';
import { ThemedText } from '@/components/themed-text';
import { useTour } from '@/components/tour/tour-context';
import { FontFamily, Palette, Spacing } from '@/constants/theme';
import {
  PRIVACY,
  QUICK_START,
  ROUTINE,
  SCREENS,
  TRACKING_FAQ,
  type GuideQuestion,
  type GuideSection,
} from '@/data/guide';
import { useTheme } from '@/hooks/use-theme';

const SECTIONS: { value: GuideSection; label: string }[] = [
  { value: 'start', label: 'Start' },
  { value: 'tracking', label: 'Tracking' },
  { value: 'screens', label: 'Screens' },
  { value: 'privacy', label: 'Privacy' },
];

/** How to use the app and how to track, split into short sections. */
export default function GuideScreen() {
  const { section } = useLocalSearchParams<{ section?: GuideSection }>();
  const [view, setView] = useState<GuideSection>(
    SECTIONS.some((s) => s.value === section) ? (section as GuideSection) : 'start',
  );

  return (
    <Subpage label="Guide" fallback="/">
      <ThemedText type="subtitle">How to use Sleep by Science</ThemedText>
      <SegmentedControl options={SECTIONS} value={view} onChange={setView} />

      {view === 'start' && <QuickStart />}
      {view === 'tracking' && (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            Good tracking is quick and honest. Two short check-ins a day are enough.
          </ThemedText>
          <Questions items={TRACKING_FAQ} />
        </>
      )}
      {view === 'screens' && <Screens />}
      {view === 'privacy' && <Questions items={PRIVACY} />}
    </Subpage>
  );
}

function QuickStart() {
  const theme = useTheme();
  const { start } = useTour();

  function takeTour() {
    // The tour runs on Today, so go there first and give it a moment to lay out.
    router.navigate('/');
    setTimeout(start, 700);
  }

  return (
    <>
      <Pressable
        onPress={takeTour}
        accessibilityRole="button"
        style={({ pressed }) => pressed && styles.pressed}>
        <Card tone="greenSoft" style={styles.tourCard}>
          <IconCircle
            icon={{ ios: 'hand.tap', android: 'touch_app', web: 'touch_app' }}
            background={Palette.green}
            color="#FFFFFF"
            size={40}
          />
          <View style={styles.flex}>
            <ThemedText type="smallBold">Take the interactive tour</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              A quick walk through each part of the app, about 30 seconds.
            </ThemedText>
          </View>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={16}
            tintColor={theme.textSecondary}
          />
        </Card>
      </Pressable>

      {QUICK_START.map((step, i) => (
        <Card key={step.title} style={styles.step}>
          <View style={[styles.number, { backgroundColor: theme.primary }]}>
            <ThemedText style={[styles.numberText, { color: theme.onPrimary }]}>{i + 1}</ThemedText>
          </View>
          <View style={styles.flex}>
            <View style={styles.stepTitle}>
              <SymbolView name={step.icon} size={16} tintColor={theme.textSecondary} />
              <ThemedText type="smallBold" style={styles.flex}>
                {step.title}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="accent" style={styles.when}>
              {step.when}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {step.body}
            </ThemedText>
          </View>
        </Card>
      ))}

      <Card tone="greenSoft">
        <ThemedText type="heading">Then, keep it simple</ThemedText>
        {ROUTINE.map((item) => (
          <View key={item.label} style={styles.routineRow}>
            <ThemedText type="smallBold" style={styles.routineLabel}>
              {item.label}
            </ThemedText>
            <ThemedText type="small" style={styles.flex}>
              {item.detail}
            </ThemedText>
          </View>
        ))}
      </Card>
    </>
  );
}

/** Accordion: one answer open at a time keeps the page short. */
function Questions({ items }: { items: GuideQuestion[] }) {
  const theme = useTheme();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Card>
      {items.map((item, i) => {
        const expanded = open === i;
        return (
          <View
            key={item.question}
            style={[styles.question, i > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}>
            <Pressable
              onPress={() => setOpen(expanded ? null : i)}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              style={({ pressed }) => [styles.questionHeader, pressed && styles.pressed]}>
              <ThemedText type="smallBold" style={styles.flex}>
                {item.question}
              </ThemedText>
              <SymbolView
                name={{
                  ios: expanded ? 'minus' : 'plus',
                  android: expanded ? 'remove' : 'add',
                  web: expanded ? 'remove' : 'add',
                }}
                size={16}
                tintColor={theme.textSecondary}
              />
            </Pressable>
            {expanded && (
              <ThemedText type="small" themeColor="textSecondary">
                {item.answer}
              </ThemedText>
            )}
          </View>
        );
      })}
    </Card>
  );
}

function Screens() {
  const theme = useTheme();
  return (
    <Card>
      {SCREENS.map((screen, i) => (
        <View
          key={screen.name}
          style={[styles.screenRow, i > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}>
          <IconCircle
            icon={screen.icon}
            background={theme.greenSoft}
            color={Palette.green}
            size={36}
          />
          <View style={styles.flex}>
            <ThemedText type="smallBold">{screen.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {screen.body}
            </ThemedText>
          </View>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  tourCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  number: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontFamily: FontFamily.extrabold,
    fontSize: 15,
    lineHeight: 20,
  },
  stepTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  when: {
    marginBottom: Spacing.one,
  },
  routineRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  routineLabel: {
    width: 96,
  },
  question: {
    gap: Spacing.two,
    paddingVertical: Spacing.three - Spacing.one,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  screenRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
  },
});
