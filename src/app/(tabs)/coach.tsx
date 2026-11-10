import { router } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Card } from '@/components/card';
import { IconCircle } from '@/components/icon-circle';
import { RecommendationCard } from '@/components/recommendation-card';
import { Screen } from '@/components/screen';
import { SegmentedControl } from '@/components/segmented-control';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Palette, Spacing, type ThemeColor } from '@/constants/theme';
import { DEMO_PERSONA } from '@/data/demo';
import { useFeedback } from '@/data/feedback-store';
import { bedtimeGoal, GOAL_WINDOW_MINUTES, type GoalProgress } from '@/data/goal';
import { buildHistory } from '@/data/history';
import { useCheckIns } from '@/data/journal-store';
import {
  evaluateRules,
  rankRecommendations,
  type RuleEvaluation,
  type RuleStatus,
} from '@/data/recommend';
import { evaluateSafety, type SafetyCheck, type SafetyResult } from '@/data/safety';
import { formatClock } from '@/data/sleep-math';
import type { Recommendation } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';

export default function CoachScreen() {
  const checkIns = useCheckIns();
  const history = buildHistory(checkIns.morning?.answers);
  const answers = { morning: checkIns.morning?.answers, evening: checkIns.evening?.answers };
  const evaluations = evaluateRules(history, answers);
  const { focus, others } = rankRecommendations(evaluations);
  const safety = evaluateSafety(history, answers.morning);
  const goal = bedtimeGoal(history);
  const [view, setView] = useState<'plan' | 'safety' | 'why'>('plan');

  // Crisis support replaces coaching entirely; no goals or suggestions alongside it.
  if (safety.level === 'urgent') {
    return (
      <Screen title="Coach" subtitle={`${DEMO_PERSONA.name}’s plan`}>
        <CrisisCard />
        <SafetyCard safety={safety} />
      </Screen>
    );
  }

  return (
    <Screen title="Coach" subtitle={`${DEMO_PERSONA.name}’s plan`}>
      <SegmentedControl
        options={[
          { value: 'plan', label: 'Plan' },
          { value: 'safety', label: 'Safety', alert: safety.level !== 'clear' },
          { value: 'why', label: 'Why' },
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'plan' && (
        <>
          <GoalCard goal={goal} />
          <RecommendationCard recommendation={focus} />
          {others.length > 0 && <AlsoSuggested recommendations={others} />}
          <AskCoachCard />
        </>
      )}

      {view === 'safety' && <SafetyCard safety={safety} />}

      {view === 'why' && (
        <>
          <RuleList evaluations={evaluations} />
          <FeedbackCard evaluations={evaluations} />
        </>
      )}
    </Screen>
  );
}

/** Other suggestions that fired today, as one compact list instead of full cards. */
function AlsoSuggested({ recommendations }: { recommendations: Recommendation[] }) {
  const theme = useTheme();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Card>
      <ThemedText type="smallBold" themeColor="textSecondary">
        Also suggested today
      </ThemedText>
      {recommendations.map((recommendation, i) => {
        const expanded = open === recommendation.id;
        return (
          <View
            key={recommendation.id}
            style={[styles.alsoRow, i > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}>
            <Pressable
              onPress={() => setOpen(expanded ? null : recommendation.id)}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <View style={styles.flex}>
                <ThemedText type="smallBold">{recommendation.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {recommendation.action}
                </ThemedText>
              </View>
              <SymbolView
                name={{
                  ios: expanded ? 'chevron.up' : 'chevron.down',
                  android: expanded ? 'expand_less' : 'expand_more',
                  web: expanded ? 'expand_less' : 'expand_more',
                }}
                size={16}
                tintColor={theme.textSecondary}
              />
            </Pressable>
            {expanded && (
              <View style={styles.alsoDetail}>
                <ThemedText type="small">{recommendation.why}</ThemedText>
                {recommendation.learnTopic && (
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/topic/[id]',
                        params: { id: recommendation.learnTopic as string },
                      })
                    }
                    accessibilityRole="link">
                    <ThemedText type="smallBold" themeColor="accent">
                      Learn why this works →
                    </ThemedText>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        );
      })}
    </Card>
  );
}

/** Suggested and not-needed rules up front; the ones still waiting for data fold away. */
function RuleList({ evaluations }: { evaluations: RuleEvaluation[] }) {
  const [showAll, setShowAll] = useState(false);
  const order: RuleStatus[] = ['fired', 'notNeeded', 'needsData'];
  const sorted = [...evaluations].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  const decided = sorted.filter((e) => e.status !== 'needsData');
  const waiting = sorted.filter((e) => e.status === 'needsData');
  const count = (status: RuleStatus) => evaluations.filter((e) => e.status === status).length;
  const shown = showAll ? sorted : decided;

  return (
    <Card>
      <View>
        <ThemedText type="heading">How your coach decided</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {count('fired')} suggested · {count('notNeeded')} not needed · {count('needsData')} need
          more data. Only suggestions your own data supports are made.
        </ThemedText>
      </View>
      <View>
        {shown.map((evaluation, i) => (
          <RuleRow key={evaluation.id} evaluation={evaluation} first={i === 0} />
        ))}
      </View>
      {waiting.length > 0 && (
        <Pressable onPress={() => setShowAll((value) => !value)} accessibilityRole="button">
          <ThemedText type="smallBold" themeColor="accent">
            {showAll ? 'Show less' : `Show ${waiting.length} waiting for more data`}
          </ThemedText>
        </Pressable>
      )}
    </Card>
  );
}

function GoalCard({ goal }: { goal: GoalProgress }) {
  const theme = useTheme();
  return (
    <Card>
      <View style={styles.row}>
        <IconCircle
          icon={{ ios: 'scope', android: 'track_changes', web: 'track_changes' }}
          background={theme.greenSoft}
          color={Palette.green}
          size={44}
        />
        <View style={styles.flex}>
          <ThemedText type="smallBold" themeColor="accent">
            Your goal
          </ThemedText>
          <ThemedText type="heading">{goal.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            In bed within {GOAL_WINDOW_MINUTES} minutes of {formatClock(goal.target)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.week}>
        {goal.days.map((day) => (
          <View key={day.date.toISOString()} style={styles.day}>
            <ThemedText type="small" themeColor="textSecondary">
              {day.date.toLocaleDateString('en-US', { weekday: 'narrow' })}
            </ThemedText>
            <View
              style={[
                styles.dayDot,
                { backgroundColor: day.onTarget ? Palette.green : theme.backgroundSelected },
              ]}>
              {day.onTarget && (
                <ThemedText style={[styles.check, { color: '#FFFFFF' }]}>✓</ThemedText>
              )}
            </View>
            <ThemedText style={styles.dayTime} themeColor="textSecondary">
              {formatClock(day.bedtime).replace(' ', '')}
            </ThemedText>
          </View>
        ))}
      </View>

      <ThemedText type="smallBold">
        {goal.onTarget} of the last {goal.days.length} nights on target
        {goal.streak > 1 ? ` · ${goal.streak}-night streak` : ''}
      </ThemedText>
    </Card>
  );
}

const SAFETY_HEADER: Record<
  SafetyResult['level'],
  { title: string; body: string; tone: ThemeColor; icon: SymbolViewProps['name'] }
> = {
  clear: {
    title: 'No safety concerns',
    body: 'Nothing in your recent nights or notes needs a clinician’s attention right now.',
    tone: 'greenSoft',
    icon: { ios: 'checkmark.shield', android: 'verified_user', web: 'verified_user' },
  },
  clinician: {
    title: 'Worth checking in with a clinician',
    body: 'Something below is outside what sleep coaching can address. Consider talking with your primary care provider.',
    tone: 'orangeSoft',
    icon: { ios: 'stethoscope', android: 'stethoscope', web: 'stethoscope' },
  },
  urgent: {
    title: 'Please reach out for support now',
    body: 'See the crisis contacts at the top of this page.',
    tone: 'orangeSoft',
    icon: { ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' },
  },
};

function SafetyCard({ safety }: { safety: SafetyResult }) {
  const theme = useTheme();
  const header = SAFETY_HEADER[safety.level];
  return (
    <Card>
      <View style={[styles.safetyHeader, { backgroundColor: theme[header.tone] }]}>
        <IconCircle
          icon={header.icon}
          background={theme.backgroundElement}
          color={safety.level === 'clear' ? theme.positive : theme.warning}
          size={40}
        />
        <View style={styles.flex}>
          <ThemedText type="smallBold">Safety check</ThemedText>
          <ThemedText type="heading">{header.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {header.body}
          </ThemedText>
        </View>
      </View>
      {safety.checks.map((check) => (
        <SafetyRow key={check.id} check={check} />
      ))}
      <ThemedText type="small" themeColor="textSecondary">
        These checks run before any coaching. Thresholds are placeholders pending clinical review.
        If you are in crisis, call or text 988 (US) or your local emergency number.
      </ThemedText>
    </Card>
  );
}

function SafetyRow({ check }: { check: SafetyCheck }) {
  const theme = useTheme();
  const mark = { ok: '✓', flag: '!', pending: '…' }[check.status];
  const color = { ok: theme.positive, flag: theme.warning, pending: theme.textSecondary }[
    check.status
  ];
  return (
    <View style={styles.checkRow}>
      <View style={[styles.mark, { borderColor: color }]}>
        <ThemedText style={[styles.markText, { color }]}>{mark}</ThemedText>
      </View>
      <View style={styles.flex}>
        <ThemedText type="smallBold">{check.label}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {check.detail}
        </ThemedText>
      </View>
    </View>
  );
}

function CrisisCard() {
  const theme = useTheme();
  return (
    <Card tone="orangeSoft">
      <ThemedText type="heading">You don’t have to go through this alone</ThemedText>
      <ThemedText type="small">
        If you are thinking about harming yourself, call or text{' '}
        <ThemedText type="smallBold">988</ThemedText> (Suicide & Crisis Lifeline, US) now, or call
        your local emergency number. If you are outside the US, contact your local crisis line.
      </ThemedText>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        Sleep coaching is paused while this is showing.
      </ThemedText>
    </Card>
  );
}

const STATUS_META: Record<RuleStatus, { label: string; tone: ThemeColor; text: ThemeColor }> = {
  fired: { label: 'Suggested', tone: 'greenSoft', text: 'positive' },
  notNeeded: { label: 'Not needed', tone: 'backgroundSelected', text: 'textSecondary' },
  needsData: { label: 'Needs data', tone: 'yellowSoft', text: 'text' },
};

function RuleRow({ evaluation, first }: { evaluation: RuleEvaluation; first: boolean }) {
  const theme = useTheme();
  const clinician = evaluation.level === 'clinician' && evaluation.status === 'fired';
  const meta = clinician
    ? { label: 'Ask your clinician', tone: 'orangeSoft' as const, text: 'warning' as const }
    : STATUS_META[evaluation.status];
  return (
    <View style={[styles.ruleRow, !first && { borderTopWidth: 1, borderTopColor: theme.border }]}>
      <View style={styles.ruleHeader}>
        <ThemedText type="smallBold" style={styles.flex}>
          {evaluation.name}
        </ThemedText>
        <View style={[styles.pill, { backgroundColor: theme[meta.tone] }]}>
          <ThemedText style={[styles.pillText, { color: theme[meta.text] }]}>
            {meta.label}
          </ThemedText>
        </View>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {evaluation.reason}
      </ThemedText>
    </View>
  );
}

function FeedbackCard({ evaluations }: { evaluations: RuleEvaluation[] }) {
  const feedback = useFeedback();
  const titles = Object.fromEntries(
    evaluations.flatMap((e) =>
      e.recommendation ? [[e.recommendation.id, e.recommendation.title]] : [],
    ),
  );
  const entries = Object.entries(feedback);
  return (
    <Card>
      <ThemedText type="heading">Your feedback</ThemedText>
      {entries.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Tap 👍 or 👎 on a suggestion. Your coach will show more of what helps and less of what
          doesn’t.
        </ThemedText>
      ) : (
        entries.map(([id, value]) => (
          <View key={id} style={styles.row}>
            <ThemedText style={styles.thumb}>{value === 'up' ? '👍' : '👎'}</ThemedText>
            <ThemedText type="small" style={styles.flex}>
              {titles[id] ?? id}
            </ThemedText>
          </View>
        ))
      )}
    </Card>
  );
}

function AskCoachCard() {
  const theme = useTheme();
  return (
    <Card>
      <View style={styles.row}>
        <IconCircle
          icon={{ ios: 'bubble.left.and.text.bubble.right', android: 'forum', web: 'forum' }}
          background={theme.lavenderSoft}
          color={Palette.lavender}
          size={40}
        />
        <View style={styles.flex}>
          <ThemedText type="heading">Ask your coach</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Coming soon
          </ThemedText>
        </View>
      </View>
      <TextInput
        editable={false}
        placeholder="Why is a steady bedtime so important?"
        placeholderTextColor={theme.textSecondary}
        style={[styles.askInput, { backgroundColor: theme.background, color: theme.text }]}
      />
      <ThemedText type="small" themeColor="textSecondary">
        Answers will explain your current suggestions using only your data and clinician-reviewed
        content. The assistant won’t give new medical advice.
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  alsoRow: {
    paddingVertical: Spacing.two + Spacing.one,
    gap: Spacing.two,
  },
  alsoDetail: {
    gap: Spacing.two,
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    lineHeight: 18,
  },
  dayTime: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: FontFamily.medium,
  },
  safetyHeader: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 20,
  },
  checkRow: {
    flexDirection: 'row',
    gap: Spacing.three - Spacing.one,
  },
  mark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  markText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    lineHeight: 16,
  },
  ruleRow: {
    gap: Spacing.one,
    paddingVertical: Spacing.two + Spacing.one,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  pill: {
    paddingHorizontal: Spacing.two + Spacing.one,
    paddingVertical: Spacing.half,
    borderRadius: 12,
  },
  pillText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    lineHeight: 16,
  },
  thumb: {
    fontSize: 18,
    lineHeight: 24,
  },
  askInput: {
    height: 48,
    borderRadius: 24,
    paddingHorizontal: Spacing.three,
    fontFamily: FontFamily.medium,
    fontSize: 15,
  },
});
