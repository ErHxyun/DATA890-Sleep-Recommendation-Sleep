/**
 * Picks today's focus from the user's own nights. A first, in-app version of the rule
 * engine: each rule mirrors a row in knowledge-graph/recommendations.csv and only fires
 * when the user's data supports it, so the "why" is always computed, never written in.
 */

import type { NightRecord } from './history';
import { behaviorPatterns, MIN_EFFECT, OUTCOMES } from './insights';
import { formatClock } from './sleep-math';
import type { Recommendation } from './types';

/** Bedtime spread (SD, minutes) above which a schedule counts as irregular. Placeholder. */
const IRREGULAR_SD_MINUTES = 45;
const RECENT_NIGHTS = 7;

const minutesFromMidnight = (night: NightRecord) =>
  (night.watch.bedtime.getTime() - night.date.getTime()) / 60_000;

function sd(values: number[]) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
}

/** r06: alcohol last evening, and alcohol nights are worse in this user's own data. */
function alcoholRule(nights: NightRecord[]): Recommendation | null {
  if (!nights[nights.length - 1].behaviors?.alcohol) return null;
  const pattern = behaviorPatterns(nights).find((p) => p.behavior === 'alcohol');
  if (!pattern || pattern.early) return null;
  const worse = pattern.outcomes.filter(
    (o) => (o.outcome === 'deep' || o.outcome === 'asleep') && o.relative <= -MIN_EFFECT,
  );
  if (worse.length === 0) return null;

  const details = worse
    .map(
      (o) =>
        `${Math.abs(Math.round(o.difference))} fewer minutes of ${OUTCOMES[o.outcome].label.toLowerCase()}`,
    )
    .join(' and ');
  return {
    id: 'r06',
    title: 'Give alcohol a 3-hour buffer before bed',
    action: 'If you drink tonight, try to finish your last drink at least 3 hours before bed.',
    why: `On the ${pattern.nightsWith} nights after you logged alcohol, you got ${details} than on the ${pattern.nightsWithout} nights without.`,
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
    clinicalReview: 'pending',
  };
}

const REGULARITY_EVIDENCE = [
  {
    citation: 'Phillips et al., 2017, Scientific Reports',
    finding:
      'Students with irregular sleep and wake times had a later body clock than regular sleepers, even when they slept a similar amount.',
  },
];

/** r01: irregular bedtimes this week, or a steady week after an irregular stretch. */
function regularityRule(nights: NightRecord[]): Recommendation | null {
  const recent = nights.slice(-RECENT_NIGHTS);
  const earlier = nights.slice(0, -RECENT_NIGHTS);
  const recentSd = sd(recent.map(minutesFromMidnight));
  const byBedtime = (list: NightRecord[]) =>
    [...list].sort((a, b) => minutesFromMidnight(a) - minutesFromMidnight(b));

  if (recentSd > IRREGULAR_SD_MINUTES) {
    const sorted = byBedtime(recent);
    return {
      id: 'r01',
      title: 'Keep the same bedtime every night',
      action: 'This week, aim to get into bed within 30 minutes of the same time each night.',
      why: `Over the last ${recent.length} nights you went to bed anywhere from ${formatClock(sorted[0].watch.bedtime)} to ${formatClock(sorted[sorted.length - 1].watch.bedtime)}. Shifting bedtimes make it harder for your body clock to know when to get sleepy.`,
      sources: ['watch'],
      evidence: REGULARITY_EVIDENCE,
      clinicalReview: 'pending',
    };
  }

  if (
    earlier.length >= RECENT_NIGHTS &&
    sd(earlier.map(minutesFromMidnight)) > IRREGULAR_SD_MINUTES
  ) {
    const sorted = byBedtime(earlier);
    return {
      id: 'r01',
      title: 'Keep your steady bedtime going',
      action: 'You’ve kept a regular bedtime this week. Try to hold it, including on weekends.',
      why: `Your bedtime has stayed within about ${Math.round(recentSd)} minutes over the last ${recent.length} nights. Earlier this month it ranged from ${formatClock(sorted[0].watch.bedtime)} to ${formatClock(sorted[sorted.length - 1].watch.bedtime)}.`,
      sources: ['watch'],
      evidence: REGULARITY_EVIDENCE,
      clinicalReview: 'pending',
    };
  }
  return null;
}

const FALLBACK: Recommendation = {
  id: 'none',
  title: 'Keep logging your nights',
  action: 'Do your morning and evening check-ins so your coach can spot what helps you sleep.',
  why: 'Nothing in your recent nights stands out yet. A few more check-ins will make patterns clearer.',
  sources: ['journal'],
  evidence: [],
  clinicalReview: 'pending',
};

/** Rules in priority order; the first one that fires is today's focus. */
export function todaysRecommendation(nights: NightRecord[]): Recommendation {
  for (const rule of [alcoholRule, regularityRule]) {
    const recommendation = rule(nights);
    if (recommendation) return recommendation;
  }
  return FALLBACK;
}
