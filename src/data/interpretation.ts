/**
 * Plain-language interpretation for the overnight vitals trends.
 *
 * Two kinds of text live here:
 * - Computed observations ("what we see", "possible reasons") built from the user's own data.
 * - Fixed educational content per vital ("keep in mind", "when to check in"). This is
 *   placeholder wording until the clinical lead reviews it, so it ships marked as pending.
 */

import type { Behavior, NightRecord, WatchNight } from './history';
import { usualRange } from './sleep-math';

export type VitalId = 'hrv' | 'restingHr' | 'respiratory' | 'wristTemp';

/** Which direction away from usual is the one people usually care about. */
type Concern = 'low' | 'high';

type VitalContent = {
  name: string;
  concern: Concern;
  /** What a change in the `concern` direction often means, completing "…than usual last night, ___". */
  concernMeaning: string;
  about: string;
  keepInMind: string;
  checkIn: string;
  /** Habits with a known link to this vital, and the direction they push it. */
  linkedHabits: Partial<Record<Behavior, { pushes: Concern; why: string }>>;
};

const CONTENT: Record<VitalId, VitalContent> = {
  hrv: {
    name: 'HRV',
    concern: 'low',
    concernMeaning: 'which often means your body was less recovered',
    about:
      'Heart rate variability is the small variation in time between heartbeats. Higher usually means your body is more recovered. It varies a lot between people, so compare it with your own range, not anyone else’s.',
    keepInMind:
      'Apple Watch reports SDNN from short readings during the night, which is noisier than lab measurements. The trend over a week or more matters more than any single night.',
    checkIn:
      'If your HRV stays well below your usual range for more than a week and you also feel unwell or exhausted, consider talking with your primary care provider.',
    linkedHabits: {
      alcohol: { pushes: 'low', why: 'Alcohol near bedtime is linked to lower HRV overnight.' },
      lateCaffeine: {
        pushes: 'low',
        why: 'Caffeine late in the day can keep your nervous system more alert at night.',
      },
      exercise: {
        pushes: 'high',
        why: 'Regular exercise is linked to higher HRV over time, though a very hard session can lower it the next night.',
      },
    },
  },
  restingHr: {
    name: 'Resting heart rate',
    concern: 'high',
    concernMeaning: 'which often means your body was working harder overnight',
    about:
      'Your lowest steady heart rate while asleep. A few beats above your usual can follow alcohol, a late meal, stress, illness, or hard training.',
    keepInMind: 'One higher night is common. A rise that lasts several days is more meaningful.',
    checkIn:
      'If your resting heart rate stays well above your usual for several days, or you notice palpitations or shortness of breath, contact a clinician. Seek urgent care for chest pain.',
    linkedHabits: {
      alcohol: {
        pushes: 'high',
        why: 'Alcohol is linked to a higher heart rate during sleep, with larger effects from more drinks.',
      },
      lateCaffeine: {
        pushes: 'high',
        why: 'Caffeine late in the day can raise your heart rate at night.',
      },
      exercise: {
        pushes: 'low',
        why: 'Regular exercise tends to lower resting heart rate over time.',
      },
    },
  },
  respiratory: {
    name: 'Respiratory rate',
    concern: 'high',
    concernMeaning: 'worth watching if it continues',
    about:
      'Breaths per minute while you sleep. It is usually very stable for each person, so a change that lasts is worth noticing even when it looks small.',
    keepInMind: 'Changes of about one breath per minute from night to night are normal.',
    checkIn:
      'If your sleeping breathing rate stays higher than usual for several nights, especially with a cough, fever, or shortness of breath, check in with a clinician.',
    linkedHabits: {
      alcohol: { pushes: 'high', why: 'Alcohol can change breathing during sleep.' },
    },
  },
  wristTemp: {
    name: 'Wrist temperature',
    concern: 'high',
    concernMeaning: 'which can follow alcohol, a warm room, or the start of an illness',
    about:
      'How the skin temperature at your wrist differs from your own baseline. It shifts with room temperature, bedding, alcohol, illness, and the menstrual cycle.',
    keepInMind:
      'Wrist temperature is not your core body temperature, and it can’t tell you whether you have a fever.',
    checkIn:
      'If a raised wrist temperature comes with feeling sick, check your temperature with a thermometer and contact a clinician if you have a fever.',
    linkedHabits: {
      alcohol: {
        pushes: 'high',
        why: 'Alcohol widens blood vessels in the skin, which can raise wrist temperature.',
      },
    },
  },
};

const HABIT_NAMES: Record<Behavior, string> = {
  alcohol: 'alcohol near bedtime',
  lateCaffeine: 'afternoon caffeine',
  exercise: 'exercise',
  screens: 'screens before bed',
  nap: 'a nap',
};

export type InterpretationSection = {
  id: 'seen' | 'reasons' | 'about' | 'keepInMind' | 'checkIn';
  title: string;
  text: string;
};

export type Interpretation = {
  /** The one-line takeaway shown first. */
  headline: string;
  sections: InterpretationSection[];
  clinicalReview: 'pending' | 'reviewed';
};

/** Least-squares slope per night. */
function slope(values: number[]) {
  const n = values.length;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  values.forEach((v, i) => {
    num += (i - meanX) * (v - meanY);
    den += (i - meanX) ** 2;
  });
  return den === 0 ? 0 : num / den;
}

export function interpretVital({
  id,
  pick,
  format,
  trendNights,
  allNights,
}: {
  id: VitalId;
  pick: (w: WatchNight) => number;
  format: (value: number) => string;
  /** The nights shown in the chart, oldest first; the last is last night. */
  trendNights: NightRecord[];
  /** Longer history, used to look for the user's own habit patterns. */
  allNights: NightRecord[];
}): Interpretation {
  const content = CONTENT[id];
  const values = trendNights.map((n) => pick(n.watch));
  const latest = values[values.length - 1];
  const range = usualRange(values.slice(0, -1));
  const span = `${format(range.low).split(' ')[0]}–${format(range.high)}`;
  const side: Concern | null = latest < range.low ? 'low' : latest > range.high ? 'high' : null;
  const sd = (range.high - range.low) / 2;

  // What we see: last night, the two-week drift, and how often nights fall outside.
  const seen: string[] = [];
  seen.push(
    side
      ? `Last night (${format(latest)}) was ${side === 'low' ? 'below' : 'above'} your usual range of ${span}.`
      : `Last night (${format(latest)}) was within your usual range of ${span}.`,
  );
  const drift = slope(values) * (values.length - 1);
  if (Math.abs(drift) < sd * 0.5) {
    seen.push(`Over the past ${values.length} nights it has been fairly steady.`);
  } else {
    seen.push(
      `Over the past ${values.length} nights it has drifted ${drift > 0 ? 'up' : 'down'} by about ${format(Math.abs(drift)).replace(/^\+/, '')}.`,
    );
  }
  const outside = values.slice(0, -1).filter((v) => v < range.low || v > range.high).length;
  seen.push(
    `${outside} of the previous ${values.length - 1} nights were outside this range too. About 1 night in 3 usually is, so single nights outside it are normal.`,
  );

  // Possible reasons: last evening's habits with a known link in the same direction,
  // backed by the user's own nights with and without that habit where possible.
  const lastEvening = trendNights[trendNights.length - 1].behaviors;
  const reasons: string[] = [];
  if (!lastEvening) {
    reasons.push(
      'Log your evening check-in to see which habits might be linked to changes like this.',
    );
  } else {
    for (const [habit, link] of Object.entries(content.linkedHabits) as [
      Behavior,
      { pushes: Concern; why: string },
    ][]) {
      if (!lastEvening[habit] || (side && link.pushes !== side)) continue;
      const withHabit = allNights.filter((n) => n.behaviors?.[habit]).map((n) => pick(n.watch));
      const without = allNights
        .filter((n) => n.behaviors && !n.behaviors[habit])
        .map((n) => pick(n.watch));
      let personal = '';
      if (withHabit.length >= 3 && without.length >= 3) {
        const diff =
          withHabit.reduce((a, b) => a + b, 0) / withHabit.length -
          without.reduce((a, b) => a + b, 0) / without.length;
        personal = ` In your own data, nights after ${HABIT_NAMES[habit]} averaged ${format(Math.abs(diff)).replace(/^\+/, '')} ${diff < 0 ? 'lower' : 'higher'} (${withHabit.length} nights).`;
      }
      reasons.push(
        side
          ? `You logged ${HABIT_NAMES[habit]} yesterday. ${link.why}${personal}`
          : `You logged ${HABIT_NAMES[habit]} yesterday, which can affect this, but last night stayed within your usual range.${personal}`,
      );
    }
    if (reasons.length === 0) {
      reasons.push(
        side
          ? 'None of the habits you logged yesterday are strongly linked to this. Stress, illness, travel, or your sleep environment can also shift it.'
          : 'Nothing stands out. Your logged habits don’t point to a change here.',
      );
    }
  }

  const headline = !side
    ? `${content.name} looks normal for you.`
    : side === content.concern
      ? `${content.name} was ${side === 'low' ? 'lower' : 'higher'} than usual last night, ${content.concernMeaning}.`
      : `${content.name} was ${side === 'low' ? 'lower' : 'higher'} than usual last night, usually not a concern.`;

  return {
    headline,
    sections: [
      { id: 'seen', title: 'What we see', text: seen.join(' ') },
      { id: 'reasons', title: 'Possible reasons', text: reasons.join(' ') },
      { id: 'about', title: 'About this measure', text: content.about },
      { id: 'keepInMind', title: 'Keep in mind', text: content.keepInMind },
      { id: 'checkIn', title: 'When to check in with a clinician', text: content.checkIn },
    ],
    clinicalReview: 'pending',
  };
}
