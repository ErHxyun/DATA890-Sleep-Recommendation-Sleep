import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ChipSelect,
  CounterList,
  OptionList,
  TextAnswer,
  TimeAdjuster,
} from '@/components/check-in/answers';
import { AlignmentCard } from '@/components/alignment-card';
import { IconCircle } from '@/components/icon-circle';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { alignMorningCheckIn } from '@/data/alignment';
import {
  CHECK_INS,
  initialAnswer,
  isAnswered,
  timeFromMinutes,
  type Answer,
  type CheckInKind,
  type Question,
} from '@/data/journal-questions';
import { saveCheckIn, useCheckIns } from '@/data/journal-store';
import { lastNight } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

/** Opened from a deep link there's nothing to go back to, so fall back to Today. */
function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** One question per page, NSF sleep diary items in order. */
export default function CheckInScreen() {
  const { kind: rawKind } = useLocalSearchParams<{ kind: string }>();
  const kind: CheckInKind = rawKind === 'evening' ? 'evening' : 'morning';
  const { title, questions } = CHECK_INS[kind];

  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const previous = useCheckIns()[kind];
  const [answers, setAnswers] = useState<Record<string, Answer>>(() => {
    // Editing a saved check-in starts from its answers instead of the pre-fills.
    if (previous) return previous.answers;
    const initial: Record<string, Answer> = {};
    for (const question of questions) {
      const answer = initialAnswer(question);
      if (answer !== undefined) initial[question.id] = answer;
    }
    return initial;
  });
  const [done, setDone] = useState(false);

  const question = questions[step];
  const isLast = step === questions.length - 1;

  function goBack() {
    if (step > 0 && !done) setStep(step - 1);
    else close();
  }

  function goNext() {
    if (!isLast) return setStep(step + 1);
    saveCheckIn({ kind, completedAt: new Date(), answers });
    setDone(true);
  }

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top + Spacing.three,
        },
      ]}>
      <View style={styles.column}>
        <View style={styles.header}>
          <Pressable
            onPress={goBack}
            accessibilityLabel="Back"
            style={({ pressed }) => [
              styles.backButton,
              { borderColor: theme.backgroundSelected },
              pressed && styles.pressed,
            ]}>
            <SymbolView
              name={{
                ios: 'chevron.left',
                android: 'chevron_left',
                web: 'chevron_left',
              }}
              size={20}
              tintColor={theme.text}
            />
          </Pressable>
          <ThemedText type="heading" style={styles.flex}>
            {title}
          </ThemedText>
          {!done && (
            <View style={[styles.stepPill, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {step + 1} OF {questions.length}
              </ThemedText>
            </View>
          )}
        </View>

        {!done && (
          <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSelected }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: Palette.green,
                  width: `${((step + 1) / questions.length) * 100}%`,
                },
              ]}
            />
          </View>
        )}
      </View>

      {done ? (
        <DoneView kind={kind} answers={answers} bottomInset={insets.bottom} />
      ) : (
        <>
          <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
            <View style={[styles.column, styles.body]}>
              <View style={styles.questionHeader}>
                <ThemedText type="subtitle" style={styles.center}>
                  {question.title}
                </ThemedText>
                {question.subtitle && (
                  <ThemedText themeColor="textSecondary" style={styles.center}>
                    {question.subtitle}
                  </ThemedText>
                )}
              </View>

              <AnswerInput
                key={question.id}
                question={question}
                value={answers[question.id]}
                onChange={(value) =>
                  setAnswers((current) => ({
                    ...current,
                    [question.id]: value,
                  }))
                }
              />

              {question.kind === 'text' && (
                <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                  Journal notes aren&apos;t monitored in real time. If you&apos;re in crisis or
                  thinking about harming yourself, call or text 988 (US) or your local emergency
                  number.
                </ThemedText>
              )}
            </View>
          </ScrollView>

          <View
            style={[styles.column, styles.footer, { paddingBottom: insets.bottom + Spacing.four }]}>
            <PrimaryButton
              label={isLast ? 'Save check-in' : question.optional ? 'Continue or skip' : 'Continue'}
              disabled={!isAnswered(question, answers[question.id])}
              onPress={goNext}
            />
          </View>
        </>
      )}
    </View>
  );
}

function AnswerInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: Answer | undefined;
  onChange: (value: Answer) => void;
}) {
  switch (question.kind) {
    case 'single':
      return (
        <OptionList
          options={question.options}
          value={typeof value === 'string' ? value : undefined}
          onChange={onChange}
        />
      );
    case 'multi':
      return (
        <ChipSelect
          options={question.options}
          exclusive={question.exclusive}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
        />
      );
    case 'time':
      return (
        <TimeAdjuster
          value={value instanceof Date ? value : undefined}
          start={timeFromMinutes(question.startMinutes)}
          stepMinutes={question.stepMinutes}
          onChange={onChange}
        />
      );
    case 'counter':
      return (
        <CounterList
          fields={question.fields}
          value={
            value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)
              ? value
              : {}
          }
          onChange={onChange}
        />
      );
    case 'text':
      return (
        <TextAnswer
          value={typeof value === 'string' ? value : ''}
          placeholder={question.placeholder}
          onChange={onChange}
        />
      );
  }
}

function DoneView({
  kind,
  answers,
  bottomInset,
}: {
  kind: CheckInKind;
  answers: Record<string, Answer>;
  bottomInset: number;
}) {
  return (
    <>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.column, styles.doneBody]}>
          <IconCircle
            icon={{ ios: 'checkmark', android: 'check', web: 'check' }}
            background={Palette.green}
            color="#FFFFFF"
            size={96}
          />
          <ThemedText type="subtitle" style={styles.center}>
            Check-in saved
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.center}>
            {kind === 'morning'
              ? 'Here’s how your answers line up with what your Apple Watch measured last night.'
              : 'Today’s habits will be linked to tonight’s sleep data, so you can see what helps.'}
          </ThemedText>
        </View>
        {kind === 'morning' && (
          <View style={[styles.column, styles.alignment]}>
            <AlignmentCard rows={alignMorningCheckIn(answers, lastNight)} />
          </View>
        )}
      </ScrollView>
      <View style={[styles.column, styles.footer, { paddingBottom: bottomInset + Spacing.four }]}>
        <PrimaryButton label="Done" onPress={close} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  column: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three + Spacing.one,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPill: {
    paddingHorizontal: Spacing.three - Spacing.one,
    paddingVertical: Spacing.one,
    borderRadius: 16,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: Spacing.three,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  scrollContent: {
    alignItems: 'center',
  },
  body: {
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
    gap: Spacing.four,
  },
  questionHeader: {
    gap: Spacing.two,
    alignItems: 'center',
  },
  footer: {
    paddingTop: Spacing.three,
  },
  doneBody: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingTop: Spacing.five,
  },
  alignment: {
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
});
