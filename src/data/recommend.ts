/**
 * In-app rule engine (first version). Every recommendation in
 * knowledge-graph/recommendations.csv is evaluated against the user's nights and today's
 * check-ins, and each one reports whether it fired and why. The "why" is always computed
 * from the data, never written in. Thresholds are placeholders pending clinical review.
 */

import type { NightRecord } from './history';
import { behaviorPatterns, MIN_EFFECT, OUTCOMES } from './insights';
import type { Answer } from './journal-questions';
import { clockMinutes, formatClock, formatDuration } from './sleep-math';
import type { Evidence, Recommendation } from './types';

/** fired: the data supports it; notNeeded: data says no; needsData: nothing to judge by yet. */
export type RuleStatus = 'fired' | 'notNeeded' | 'needsData';

export type RuleEvaluation = {
  id: string;
  /** Short name of the rule, as in the knowledge-graph table. */
  name: string;
  status: RuleStatus;
  /** Why it fired or not, in the user's own numbers where possible. */
  reason: string;
  level: 'coach' | 'clinician';
  recommendation?: Recommendation;
};

export type CheckInAnswers = {
  morning?: Record<string, Answer>;
  evening?: Record<string, Answer>;
};

/** Bedtime spread (SD, minutes) above which a schedule counts as irregular. */
const IRREGULAR_SD_MINUTES = 45;
/** Largest night-to-night bedtime move that still counts as gradual. */
const MAX_SHIFT_MINUTES = 60;
const MAX_NAP_MINUTES = 20;
const RECENT_NIGHTS = 7;

const minutesFromMidnight = (night: NightRecord) => clockMinutes(night.watch.bedtime, night.date);

function sd(values: number[]) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
}

const picked = (answers: Record<string, Answer> | undefined, id: string) =>
  Array.isArray(answers?.[id]) ? (answers[id] as string[]) : [];

function recommendation(
  fields: Omit<Recommendation, 'clinicalReview' | 'evidence'> & { evidence?: Evidence[] },
): Recommendation {
  return { evidence: [], clinicalReview: 'pending', ...fields };
}

const REGULARITY_EVIDENCE: Evidence[] = [
  {
    citation: 'Phillips et al., 2017, Scientific Reports',
    finding:
      'Students with irregular sleep and wake times had a later body clock than regular sleepers, even when they slept a similar amount.',
  },
];

// ── Rules ──────────────────────────────────────────────────────────────────────

/** r01: irregular bedtimes this week, or a steady week after an irregular stretch. */
function regularity(nights: NightRecord[]): RuleEvaluation {
  const recent = nights.slice(-RECENT_NIGHTS);
  const earlier = nights.slice(0, -RECENT_NIGHTS);
  const recentSd = sd(recent.map(minutesFromMidnight));
  const range = (list: NightRecord[]) => {
    const sorted = [...list].sort((a, b) => minutesFromMidnight(a) - minutesFromMidnight(b));
    return `${formatClock(sorted[0].watch.bedtime)} to ${formatClock(sorted[sorted.length - 1].watch.bedtime)}`;
  };
  const base = { id: 'r01', name: 'Keep the same sleep and wake times', level: 'coach' as const };

  if (recentSd > IRREGULAR_SD_MINUTES) {
    const reason = `Over the last ${recent.length} nights you went to bed anywhere from ${range(recent)}.`;
    return {
      ...base,
      status: 'fired',
      reason,
      recommendation: recommendation({
        id: 'r01',
        title: 'Keep the same bedtime every night',
        action: 'This week, aim to get into bed within 30 minutes of the same time each night.',
        why: `${reason} Shifting bedtimes make it harder for your body clock to know when to get sleepy.`,
        sources: ['watch'],
        evidence: REGULARITY_EVIDENCE,
        learnTopic: 'circadian_rhythm',
      }),
    };
  }
  if (
    earlier.length >= RECENT_NIGHTS &&
    sd(earlier.map(minutesFromMidnight)) > IRREGULAR_SD_MINUTES
  ) {
    const reason = `Your bedtime has stayed within about ${Math.round(recentSd)} minutes over the last ${recent.length} nights. Earlier this month it ranged from ${range(earlier)}.`;
    return {
      ...base,
      status: 'fired',
      reason,
      recommendation: recommendation({
        id: 'r01',
        title: 'Keep your steady bedtime going',
        action: 'You’ve kept a regular bedtime this week. Try to hold it, including on weekends.',
        why: reason,
        sources: ['watch'],
        evidence: REGULARITY_EVIDENCE,
        learnTopic: 'circadian_rhythm',
      }),
    };
  }
  return {
    ...base,
    status: 'notNeeded',
    reason: `Your bedtime has been steady: within about ${Math.round(recentSd)} minutes over the last ${recent.length} nights.`,
  };
}

/** r04: a night-to-night bedtime jump of more than an hour this week. */
function gradualShifts(nights: NightRecord[]): RuleEvaluation {
  const recent = nights.slice(-RECENT_NIGHTS);
  let biggest = { minutes: 0, from: recent[0], to: recent[0] };
  for (let i = 1; i < recent.length; i++) {
    const move = Math.abs(minutesFromMidnight(recent[i]) - minutesFromMidnight(recent[i - 1]));
    if (move > biggest.minutes) biggest = { minutes: move, from: recent[i - 1], to: recent[i] };
  }
  const base = {
    id: 'r04',
    name: 'Shift your schedule by no more than 1 hour at a time',
    level: 'coach' as const,
  };
  if (biggest.minutes <= MAX_SHIFT_MINUTES) {
    return {
      ...base,
      status: 'notNeeded',
      reason: `Your bedtime moved at most ${formatDuration(Math.round(biggest.minutes))} from one night to the next this week.`,
    };
  }
  const reason = `Your bedtime jumped by ${formatDuration(Math.round(biggest.minutes))}, from ${formatClock(biggest.from.watch.bedtime)} to ${formatClock(biggest.to.watch.bedtime)}.`;
  return {
    ...base,
    status: 'fired',
    reason,
    recommendation: recommendation({
      id: 'r04',
      title: 'Move your bedtime gradually',
      action: 'If you need a new schedule, shift your bedtime by an hour or less per night.',
      why: `${reason} Big jumps work like jet lag for your body clock.`,
      sources: ['watch'],
      learnTopic: 'circadian_rhythm',
    }),
  };
}

/** r06: alcohol last evening, and alcohol nights are worse in this user's own data. */
function alcohol(nights: NightRecord[]): RuleEvaluation {
  const base = { id: 'r06', name: 'Avoid alcohol near bedtime', level: 'coach' as const };
  const pattern = behaviorPatterns(nights).find((p) => p.behavior === 'alcohol');
  if (!pattern) {
    return {
      ...base,
      status: 'needsData',
      reason: 'No evenings with and without alcohol logged yet.',
    };
  }
  if (!nights[nights.length - 1].behaviors?.alcohol) {
    return { ...base, status: 'notNeeded', reason: 'No alcohol logged last evening.' };
  }
  const sleepOutcomes = pattern.outcomes.filter(
    (o) => o.outcome === 'deep' || o.outcome === 'asleep',
  );
  const worse = sleepOutcomes.filter((o) => o.relative <= -MIN_EFFECT);
  const describe = (list: typeof sleepOutcomes) =>
    list
      .map(
        (o) =>
          `${OUTCOMES[o.outcome].label.toLowerCase()} ${o.difference >= 0 ? '+' : '−'}${formatDuration(Math.abs(Math.round(o.difference)))}`,
      )
      .join(', ');
  if (pattern.early || worse.length === 0) {
    return {
      ...base,
      status: 'notNeeded',
      reason: pattern.early
        ? `Too few nights to compare yet (${pattern.nightsWith} with alcohol, ${pattern.nightsWithout} without).`
        : `You logged alcohol last evening, but in your data nights after alcohol weren’t worse (${describe(sleepOutcomes)} over ${pattern.nightsWith} nights). We don’t recommend changes your own data doesn’t support.`,
    };
  }
  const reason = `On the ${pattern.nightsWith} nights after you logged alcohol: ${describe(worse)} versus the ${pattern.nightsWithout} nights without.`;
  return {
    ...base,
    status: 'fired',
    reason,
    recommendation: recommendation({
      id: 'r06',
      title: 'Give alcohol a 3-hour buffer before bed',
      action: 'If you drink tonight, try to finish your last drink at least 3 hours before bed.',
      why: reason,
      sources: ['journal', 'watch'],
      evidence: [
        {
          citation: 'Strüven et al., 2025, Nutrients',
          finding:
            'Evening alcohol was associated with a dose-dependent rise in nocturnal resting heart rate measured by smartwatch.',
        },
        {
          citation: 'De Rosa et al., 2025, Int. J. Psychophysiology',
          finding:
            'Alcohol use days were linked to changes in wearable-measured sleep and heart rate in young adults.',
        },
      ],
      learnTopic: 'alcohol',
    }),
  };
}

/** r07: noise, light or temperature disturbed last night's sleep. */
function environment(answers: CheckInAnswers): RuleEvaluation {
  const base = {
    id: 'r07',
    name: 'Keep the bedroom cool, dark, and quiet',
    level: 'coach' as const,
  };
  if (!answers.morning) {
    return {
      ...base,
      status: 'needsData',
      reason: 'Do the morning check-in to tell us what disturbed your sleep.',
    };
  }
  const labels: Record<string, string> = {
    noise: 'noise',
    light: 'light',
    temperature: 'temperature',
  };
  const hits = picked(answers.morning, 'disturbances').filter((d) => d in labels);
  if (hits.length === 0) {
    return {
      ...base,
      status: 'notNeeded',
      reason: 'You didn’t report noise, light or temperature disturbing you.',
    };
  }
  const reason = `You said ${hits.map((h) => labels[h]).join(' and ')} disturbed your sleep last night.`;
  return {
    ...base,
    status: 'fired',
    reason,
    recommendation: recommendation({
      id: 'r07',
      title: 'Make your bedroom cooler, darker and quieter',
      action: hits.includes('noise')
        ? 'Try earplugs or a fan for steady background sound tonight.'
        : 'Try blackout curtains or an eye mask, and a slightly cooler room.',
      why: reason,
      sources: ['journal'],
      learnTopic: 'environment',
    }),
  };
}

/** r09: caffeine in the afternoon or evening. */
function caffeine(answers: CheckInAnswers): RuleEvaluation {
  const base = { id: 'r09', name: 'Limit caffeine later in the day', level: 'coach' as const };
  if (!answers.evening) {
    return {
      ...base,
      status: 'needsData',
      reason: 'Caffeine isn’t in your past data; the evening check-in asks about it.',
    };
  }
  const late =
    picked(answers.evening, 'caffeineTiming').some((t) => t === 'afternoon' || t === 'evening') ||
    picked(answers.evening, 'beforeBed').includes('caffeine');
  if (!late) {
    return {
      ...base,
      status: 'notNeeded',
      reason: 'No afternoon or evening caffeine logged today.',
    };
  }
  const reason = 'You had caffeine in the afternoon or evening today.';
  return {
    ...base,
    status: 'fired',
    reason,
    recommendation: recommendation({
      id: 'r09',
      title: 'Stop caffeine by early afternoon',
      action: 'Tomorrow, try having your last coffee or tea before 2 PM.',
      why: `${reason} Caffeine blocks the “sleep pressure” signal for hours after you drink it.`,
      sources: ['journal'],
      learnTopic: 'caffeine',
    }),
  };
}

/** r10: screens in the hour before bed. */
function screens(answers: CheckInAnswers): RuleEvaluation {
  const base = {
    id: 'r10',
    name: 'Morning daylight; dim screens in the evening',
    level: 'coach' as const,
  };
  if (!answers.evening) {
    return {
      ...base,
      status: 'needsData',
      reason: 'Screen use isn’t in your past data; the evening check-in asks about it.',
    };
  }
  if (!picked(answers.evening, 'routine').includes('screens')) {
    return {
      ...base,
      status: 'notNeeded',
      reason: 'No phone or TV planned for the hour before bed.',
    };
  }
  const reason = 'You plan to use your phone or TV in the hour before bed.';
  return {
    ...base,
    status: 'fired',
    reason,
    recommendation: recommendation({
      id: 'r10',
      title: 'Dim screens in the last hour',
      action: 'Tonight, put the phone away 30–60 minutes before bed, or turn on night mode.',
      why: `${reason} Evening light can push back the time your body starts releasing melatonin.`,
      sources: ['journal'],
      learnTopic: 'sunlight_blue_light',
    }),
  };
}

/** r05: a nap longer than 20 minutes. */
function naps(answers: CheckInAnswers): RuleEvaluation {
  const base = { id: 'r05', name: 'Keep naps to 20 minutes or less', level: 'coach' as const };
  const nap = (answers.evening?.nap as Record<string, number> | undefined)?.minutes;
  if (nap === undefined) {
    return {
      ...base,
      status: 'needsData',
      reason: 'Naps aren’t in your past data; the evening check-in asks about them.',
    };
  }
  if (nap <= MAX_NAP_MINUTES) {
    return {
      ...base,
      status: 'notNeeded',
      reason: nap === 0 ? 'No nap today.' : `Today’s nap was ${nap} minutes.`,
    };
  }
  const reason = `You napped for ${formatDuration(nap)} today.`;
  return {
    ...base,
    status: 'fired',
    reason,
    recommendation: recommendation({
      id: 'r05',
      title: 'Keep naps short',
      action: 'If you nap, set an alarm for 20 minutes and nap before mid-afternoon.',
      why: `${reason} Long naps use up the sleep pressure you need at night.`,
      sources: ['journal'],
      learnTopic: 'naps',
    }),
  };
}

/** r02: work or study in the hour before bed. */
function bedtimeRoutine(answers: CheckInAnswers): RuleEvaluation {
  const base = { id: 'r02', name: 'Build a relaxing bedtime routine', level: 'coach' as const };
  if (!answers.evening) {
    return {
      ...base,
      status: 'needsData',
      reason: 'The evening check-in asks what you do before bed.',
    };
  }
  if (!picked(answers.evening, 'routine').includes('work')) {
    return {
      ...base,
      status: 'notNeeded',
      reason: 'Your plan for the hour before bed doesn’t include work or study.',
    };
  }
  const reason = 'You plan to work or study in the hour before bed.';
  return {
    ...base,
    status: 'fired',
    reason,
    recommendation: recommendation({
      id: 'r02',
      title: 'Give yourself a wind-down hour',
      action:
        'Stop work an hour before bed and switch to something calm, like reading or a shower.',
      why: reason,
      sources: ['journal'],
      learnTopic: 'routine_consistency',
    }),
  };
}

/** r03: trouble falling asleep, where stimulus control helps. */
function bedAssociation(answers: CheckInAnswers): RuleEvaluation {
  const base = { id: 'r03', name: 'Use the bed only for sleep and sex', level: 'coach' as const };
  if (!answers.morning) {
    return {
      ...base,
      status: 'needsData',
      reason: 'The morning check-in asks how falling asleep went.',
    };
  }
  if (answers.morning.fellAsleep !== 'withDifficulty') {
    return { ...base, status: 'notNeeded', reason: 'Falling asleep wasn’t difficult last night.' };
  }
  const reason = 'You said falling asleep was difficult last night.';
  return {
    ...base,
    status: 'fired',
    reason,
    recommendation: recommendation({
      id: 'r03',
      title: 'If you can’t sleep, get up',
      action:
        'If you’re still awake after about 20 minutes, get up and do something calm in dim light, then return when sleepy.',
      why: `${reason} This keeps your bed linked with sleep rather than lying awake.`,
      sources: ['journal'],
      learnTopic: 'bed_association',
    }),
  };
}

/** r08: medications are a prescriber question, never coached in the app. */
function medications(answers: CheckInAnswers): RuleEvaluation {
  const base = {
    id: 'r08',
    name: 'Check medication timing with your clinician',
    level: 'clinician' as const,
  };
  const text =
    typeof answers.evening?.medications === 'string' ? answers.evening.medications.trim() : '';
  if (!answers.evening) {
    return { ...base, status: 'needsData', reason: 'The evening check-in asks about medications.' };
  }
  if (!text) return { ...base, status: 'notNeeded', reason: 'No medications logged today.' };
  return {
    ...base,
    status: 'fired',
    reason:
      'You logged a medication or supplement. Timing questions go to your prescriber, not the app.',
  };
}

// ── Engine ─────────────────────────────────────────────────────────────────────

/** All rules, evaluated. Order here is the display order on the Coach screen. */
export function evaluateRules(nights: NightRecord[], answers: CheckInAnswers): RuleEvaluation[] {
  return [
    alcohol(nights),
    regularity(nights),
    gradualShifts(nights),
    environment(answers),
    caffeine(answers),
    screens(answers),
    naps(answers),
    bedtimeRoutine(answers),
    bedAssociation(answers),
    medications(answers),
  ];
}

/**
 * Priority for today's focus: patterns across many nights first (they are more reliable
 * than one evening's answers), a positive "keep it up" next, then single-day triggers.
 */
const PRIORITY = [
  'r06',
  'r01-improve',
  'r04',
  'r01-keep',
  'r07',
  'r09',
  'r10',
  'r05',
  'r02',
  'r03',
];

const priorityKey = (e: RuleEvaluation) =>
  e.id === 'r01'
    ? e.recommendation?.title.startsWith('Keep your steady')
      ? 'r01-keep'
      : 'r01-improve'
    : e.id;

const FALLBACK: Recommendation = recommendation({
  id: 'none',
  title: 'Keep logging your nights',
  action: 'Do your morning and evening check-ins so your coach can spot what helps you sleep.',
  why: 'Nothing in your recent nights stands out yet. A few more check-ins will make patterns clearer.',
  sources: ['journal'],
});

/** Today's focus and the other coach-level suggestions that also fired. */
export function rankRecommendations(evaluations: RuleEvaluation[]) {
  const fired = evaluations
    .filter((e) => e.status === 'fired' && e.level === 'coach' && e.recommendation)
    .sort((a, b) => PRIORITY.indexOf(priorityKey(a)) - PRIORITY.indexOf(priorityKey(b)));
  return {
    focus: fired[0]?.recommendation ?? FALLBACK,
    others: fired.slice(1).map((e) => e.recommendation as Recommendation),
  };
}

export function todaysRecommendation(nights: NightRecord[], answers: CheckInAnswers = {}) {
  return rankRecommendations(evaluateRules(nights, answers)).focus;
}
