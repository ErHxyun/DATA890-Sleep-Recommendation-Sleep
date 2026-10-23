import type { SymbolViewProps } from 'expo-symbols';

import { TOLERANCE } from './alignment';
import type { Behavior, NightRecord, SelfReport, WatchNight } from './history';
import { minutesBetween } from './sleep-math';

// ── Self-report vs. watch ──────────────────────────────────────────────────────

export type AlignmentMetric = {
  id: string;
  label: string;
  unit: 'minutes' | 'count';
  /** Nights that have both a self-report and a watch value. */
  nights: number;
  /** Mean of (self − watch). Positive = the user reports later / more. */
  meanGap: number;
  agreeing: number;
};

const ALIGNMENT_METRICS: {
  id: string;
  label: string;
  unit: AlignmentMetric['unit'];
  tolerance: number;
  gap: (self: SelfReport, watch: WatchNight) => number;
}[] = [
  {
    id: 'totalSleep',
    label: 'Total sleep',
    unit: 'minutes',
    tolerance: TOLERANCE.totalSleepMinutes,
    gap: (s, w) => s.totalSleepMinutes - w.asleepMinutes,
  },
  {
    id: 'bedtime',
    label: 'Bedtime',
    unit: 'minutes',
    tolerance: TOLERANCE.clockMinutes,
    gap: (s, w) => minutesBetween(w.bedtime, s.bedtime),
  },
  {
    id: 'outOfBed',
    label: 'Out of bed',
    unit: 'minutes',
    tolerance: TOLERANCE.clockMinutes,
    gap: (s, w) => minutesBetween(w.outOfBed, s.outOfBed),
  },
  {
    id: 'wakings',
    label: 'Times awake',
    unit: 'count',
    tolerance: TOLERANCE.wakings,
    gap: (s, w) => s.wakings - w.wakings,
  },
  {
    id: 'awakeMinutes',
    label: 'Time awake',
    unit: 'minutes',
    tolerance: TOLERANCE.awakeMinutes,
    gap: (s, w) => s.awakeMinutes - w.awakeMinutes,
  },
];

export function alignmentSummary(nights: NightRecord[]): AlignmentMetric[] {
  const paired = nights.filter((night) => night.self !== null);
  return ALIGNMENT_METRICS.map((metric) => {
    const gaps = paired.map((night) => metric.gap(night.self as SelfReport, night.watch));
    return {
      id: metric.id,
      label: metric.label,
      unit: metric.unit,
      nights: gaps.length,
      meanGap: gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0,
      agreeing: gaps.filter((gap) => Math.abs(gap) <= metric.tolerance).length,
    };
  });
}

// ── Behavior × sleep ───────────────────────────────────────────────────────────

export const BEHAVIORS: Record<
  Behavior,
  { label: string; detail: string; icon: SymbolViewProps['name'] }
> = {
  alcohol: {
    label: 'Alcohol near bedtime',
    detail: 'within 2–3 h of bed',
    icon: { ios: 'wineglass.fill', android: 'wine_bar', web: 'wine_bar' },
  },
  lateCaffeine: {
    label: 'Afternoon caffeine',
    detail: 'afternoon or evening',
    icon: { ios: 'cup.and.saucer.fill', android: 'coffee', web: 'coffee' },
  },
  exercise: {
    label: 'Exercise',
    detail: '20+ minutes that day',
    icon: { ios: 'figure.run', android: 'directions_run', web: 'directions_run' },
  },
  screens: {
    label: 'Screens before bed',
    detail: 'phone or TV in the last hour',
    icon: { ios: 'iphone', android: 'smartphone', web: 'smartphone' },
  },
  nap: {
    label: 'Daytime nap',
    detail: 'any nap that day',
    icon: { ios: 'powersleep', android: 'airline_seat_flat', web: 'airline_seat_flat' },
  },
};

export type OutcomeId = 'asleep' | 'deep' | 'hrv';

/** Watch outcomes compared across behaviors; for all three, higher is generally better. */
export const OUTCOMES: Record<
  OutcomeId,
  { label: string; unit: string; pick: (w: WatchNight) => number }
> = {
  asleep: { label: 'Total sleep', unit: 'min', pick: (w) => w.asleepMinutes },
  deep: { label: 'Deep sleep', unit: 'min', pick: (w) => w.deepMinutes },
  hrv: { label: 'HRV', unit: 'ms', pick: (w) => w.hrvSdnnMs },
};

export type OutcomeComparison = {
  outcome: OutcomeId;
  withMean: number;
  withoutMean: number;
  /** withMean − withoutMean. */
  difference: number;
  /** difference relative to the "without" mean, for ranking. */
  relative: number;
};

export type BehaviorPattern = {
  behavior: Behavior;
  nightsWith: number;
  nightsWithout: number;
  /** Too few nights on one side to say much yet. */
  early: boolean;
  outcomes: OutcomeComparison[];
};

/** Fewer nights than this on either side and the pattern is flagged as early. */
const MIN_NIGHTS = 4;

/** Below this relative difference on every outcome, a habit shows no clear pattern. */
export const MIN_EFFECT = 0.03;

/** Largest relative difference across outcomes, used to rank patterns. */
export function patternStrength(pattern: BehaviorPattern) {
  return Math.max(...pattern.outcomes.map((o) => Math.abs(o.relative)));
}

const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

export function behaviorPatterns(nights: NightRecord[]): BehaviorPattern[] {
  const logged = nights.filter((night) => night.behaviors !== null);

  const patterns = (Object.keys(BEHAVIORS) as Behavior[]).flatMap((behavior) => {
    const withB = logged.filter((night) => night.behaviors?.[behavior]);
    const withoutB = logged.filter((night) => !night.behaviors?.[behavior]);
    // A comparison needs at least one night on each side.
    if (withB.length === 0 || withoutB.length === 0) return [];

    const outcomes = (Object.keys(OUTCOMES) as OutcomeId[]).map((outcome) => {
      const pick = OUTCOMES[outcome].pick;
      const withMean = mean(withB.map((night) => pick(night.watch)));
      const withoutMean = mean(withoutB.map((night) => pick(night.watch)));
      return {
        outcome,
        withMean,
        withoutMean,
        difference: withMean - withoutMean,
        relative: (withMean - withoutMean) / withoutMean,
      };
    });

    return [
      {
        behavior,
        nightsWith: withB.length,
        nightsWithout: withoutB.length,
        early: Math.min(withB.length, withoutB.length) < MIN_NIGHTS,
        outcomes,
      },
    ];
  });

  return patterns.sort((a, b) => patternStrength(b) - patternStrength(a));
}

// ── Plain-language takeaways ───────────────────────────────────────────────────

/** One sentence summarizing which way the user's total-sleep estimates lean. */
export function alignmentTakeaway(nights: NightRecord[]): string {
  const gaps = nights
    .filter((n) => n.self !== null)
    .map((n) => (n.self as SelfReport).totalSleepMinutes - n.watch.asleepMinutes);
  if (gaps.length === 0)
    return 'Complete a few morning check-ins to compare your own sense of sleep with the watch.';

  const tol = TOLERANCE.totalSleepMinutes;
  const over = gaps.filter((g) => g > tol);
  const under = gaps.filter((g) => g < -tol);
  const avg = (values: number[]) =>
    Math.round(values.reduce((a, b) => a + Math.abs(b), 0) / values.length);

  if (over.length > gaps.length / 2) {
    return `On ${over.length} of ${gaps.length} nights you felt you slept more than your watch measured, by about ${avg(over)} minutes. That’s common: brief wakings are easy to forget, and watches count quiet wakefulness as awake.`;
  }
  if (under.length > gaps.length / 2) {
    return `On ${under.length} of ${gaps.length} nights you felt you slept less than your watch measured, by about ${avg(under)} minutes. Sleep can feel shorter when it isn’t refreshing, and this gap is something your coach can help with.`;
  }
  return `Your own sense of how long you slept usually matches your watch: ${gaps.length - over.length - under.length} of ${gaps.length} nights were within ${tol} minutes.`;
}

const OUTCOME_WORDS: Record<OutcomeId, { up: string; down: string }> = {
  asleep: { up: 'longer', down: 'shorter' },
  deep: { up: 'longer', down: 'shorter' },
  hrv: { up: 'higher', down: 'lower' },
};

/** e.g. "After alcohol near bedtime, your deep sleep was 19 min shorter and HRV 10 ms lower than on other nights." */
export function patternTakeaway(pattern: BehaviorPattern): string {
  const notable = pattern.outcomes.filter((o) => Math.abs(o.relative) >= MIN_EFFECT);
  const label =
    pattern.behavior === 'nap' ? 'a daytime nap' : BEHAVIORS[pattern.behavior].label.toLowerCase();
  if (notable.length === 0) return `Nights after ${label} looked about the same as other nights.`;

  const parts = notable.map((o) => {
    const { label: name, unit } = OUTCOMES[o.outcome];
    const amount = Math.abs(Math.round(o.difference));
    const word = o.difference > 0 ? OUTCOME_WORDS[o.outcome].up : OUTCOME_WORDS[o.outcome].down;
    return `${name === 'HRV' ? 'HRV' : name.toLowerCase()} was ${amount} ${unit} ${word}`;
  });
  const joined =
    parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0];
  return `After ${label}, your ${joined} than on other nights.`;
}
