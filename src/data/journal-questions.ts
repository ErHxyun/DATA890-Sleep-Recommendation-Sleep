/**
 * Check-in questions, adapted from the National Sleep Foundation sleep diary
 * ("Complete in Morning" / "Complete at the End of Day").
 *
 * This file is content, not UI: questions can be reworded, reordered, or added here
 * (e.g. by the clinical lead) and the check-in flow renders them automatically.
 * `nsf` records which diary item each question maps to.
 *
 * Nothing is pre-filled from the watch: self-reports are collected independently so they
 * can later be aligned against sensor data without the user anchoring on the watch's numbers.
 */

import type { SymbolViewProps } from 'expo-symbols';

export type CheckInKind = 'morning' | 'evening';

/** Feeling scale shared by single-choice questions; drives icon and color. */
export type Tone = 'great' | 'good' | 'okay' | 'poor';

export type ChoiceOption = {
  value: string;
  label: string;
  hint?: string;
  tone?: Tone;
};

export type CounterField = {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  /** Value shown before the user answers. Omit to start empty ("—"). */
  initial?: number;
  /** Where an empty counter jumps to on the first tap. */
  start: number;
};

type BaseQuestion = {
  id: string;
  nsf: string;
  title: string;
  subtitle?: string;
  optional?: boolean;
};

export type Question = BaseQuestion &
  (
    | { kind: 'single'; options: ChoiceOption[] }
    /** `exclusive` is an option that clears the others, like "None". */
    | { kind: 'multi'; options: ChoiceOption[]; exclusive?: string }
    /** Starts empty; the first tap jumps to `startMinutes` (minutes from midnight of the wake day). */
    | { kind: 'time'; startMinutes: number; stepMinutes: number }
    | { kind: 'counter'; fields: CounterField[] }
    | { kind: 'text'; placeholder: string }
  );

export type Answer = string | string[] | Date | Record<string, number>;

const TIMES_OF_DAY: ChoiceOption[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'none', label: 'Not today' },
];

export const CHECK_INS: Record<CheckInKind, { title: string; questions: Question[] }> = {
  morning: {
    title: 'Morning check-in',
    questions: [
      {
        id: 'bedtime',
        nsf: 'I went to bed last night at',
        kind: 'time',
        title: 'When did you go to bed last night?',
        startMinutes: -60,
        stepMinutes: 15,
      },
      {
        id: 'outOfBed',
        nsf: 'I got out of bed this morning at',
        kind: 'time',
        title: 'When did you get out of bed?',
        startMinutes: 7 * 60,
        stepMinutes: 15,
      },
      {
        id: 'fellAsleep',
        nsf: 'Last night I fell asleep',
        kind: 'single',
        title: 'How did falling asleep go?',
        options: [
          { value: 'easily', label: 'Easily', tone: 'great' },
          { value: 'afterSomeTime', label: 'After some time', tone: 'okay' },
          { value: 'withDifficulty', label: 'With difficulty', tone: 'poor' },
        ],
      },
      {
        id: 'nightWaking',
        nsf: 'I woke up during the night (# of times, # of minutes)',
        kind: 'counter',
        title: 'Did you wake up during the night?',
        subtitle: 'Your best guess is fine. Count 0 if you slept through.',
        fields: [
          {
            id: 'times',
            label: 'Times',
            unit: '×',
            min: 0,
            max: 20,
            step: 1,
            start: 0,
          },
          {
            id: 'minutes',
            label: 'Minutes awake in total',
            unit: 'min',
            min: 0,
            max: 240,
            step: 5,
            start: 0,
          },
        ],
      },
      {
        id: 'totalSleep',
        nsf: 'Last night I slept a total of',
        kind: 'counter',
        title: 'How long do you think you slept?',
        subtitle: 'Your own sense of it, without checking your watch.',
        fields: [
          {
            id: 'hours',
            label: 'Total sleep',
            unit: 'h',
            min: 0,
            max: 14,
            step: 0.25,
            start: 7,
          },
        ],
      },
      {
        id: 'disturbances',
        nsf: 'My sleep was disturbed by',
        kind: 'multi',
        title: 'Did anything disturb your sleep?',
        subtitle: 'Pick all that apply.',
        exclusive: 'nothing',
        options: [
          { value: 'noise', label: 'Noise' },
          { value: 'light', label: 'Light' },
          { value: 'temperature', label: 'Temperature' },
          { value: 'partnerOrPets', label: 'Partner / pets' },
          { value: 'discomfort', label: 'Pain or discomfort' },
          { value: 'bathroom', label: 'Bathroom trips' },
          { value: 'stress', label: 'Stress or worry' },
          { value: 'allergies', label: 'Allergies' },
          { value: 'nothing', label: 'Nothing' },
        ],
      },
      {
        id: 'wokeFeeling',
        nsf: 'When I woke up for the day, I felt',
        kind: 'single',
        title: 'How did you feel when you woke up?',
        options: [
          { value: 'refreshed', label: 'Refreshed', tone: 'great' },
          {
            value: 'somewhatRefreshed',
            label: 'Somewhat refreshed',
            tone: 'okay',
          },
          { value: 'fatigued', label: 'Fatigued', tone: 'poor' },
        ],
      },
      {
        id: 'morningNotes',
        nsf: 'Notes',
        kind: 'text',
        optional: true,
        title: 'Anything else that may have affected your sleep?',
        subtitle: 'For example a late work shift, travel, or your menstrual cycle.',
        placeholder: 'Write a note…',
      },
    ],
  },
  evening: {
    title: 'Evening check-in',
    questions: [
      {
        id: 'caffeineTiming',
        nsf: 'I consumed caffeinated drinks in the (M/A/E/NA)',
        kind: 'multi',
        title: 'When did you have caffeine today?',
        subtitle: 'Coffee, tea, energy drinks, soda.',
        exclusive: 'none',
        options: TIMES_OF_DAY,
      },
      {
        id: 'caffeineAmount',
        nsf: 'How many?',
        kind: 'counter',
        title: 'How many caffeinated drinks?',
        fields: [
          {
            id: 'drinks',
            label: 'Drinks',
            unit: '',
            min: 0,
            max: 12,
            step: 1,
            initial: 0,
            start: 0,
          },
        ],
      },
      {
        id: 'exercise',
        nsf: 'I exercised at least 20 minutes in the (M/A/E/NA)',
        kind: 'multi',
        title: 'When did you exercise for 20+ minutes?',
        exclusive: 'none',
        options: TIMES_OF_DAY,
      },
      {
        id: 'nap',
        nsf: 'Took a nap? If yes, for how long?',
        kind: 'counter',
        title: 'Did you nap today?',
        subtitle: 'Leave at 0 if you didn’t nap.',
        fields: [
          {
            id: 'minutes',
            label: 'Nap length',
            unit: 'min',
            min: 0,
            max: 240,
            step: 5,
            initial: 0,
            start: 0,
          },
        ],
      },
      {
        id: 'dozeOff',
        nsf: 'During the day, how likely was I to doze off while performing daily activities',
        kind: 'single',
        title: 'How likely were you to doze off during the day?',
        options: [
          { value: 'noChance', label: 'No chance', tone: 'great' },
          { value: 'slight', label: 'Slight chance', tone: 'good' },
          { value: 'moderate', label: 'Moderate chance', tone: 'okay' },
          { value: 'high', label: 'High chance', tone: 'poor' },
        ],
      },
      {
        id: 'mood',
        nsf: 'Throughout the day, my mood was',
        kind: 'single',
        title: 'How was your mood today?',
        options: [
          { value: 'veryPleasant', label: 'Very pleasant', tone: 'great' },
          { value: 'pleasant', label: 'Pleasant', tone: 'good' },
          { value: 'unpleasant', label: 'Unpleasant', tone: 'okay' },
          { value: 'veryUnpleasant', label: 'Very unpleasant', tone: 'poor' },
        ],
      },
      {
        id: 'beforeBed',
        nsf: 'Approximately 2–3 hours before going to bed, I consumed',
        kind: 'multi',
        title: 'In the 2–3 hours before bed, did you have…',
        exclusive: 'none',
        options: [
          { value: 'alcohol', label: 'Alcohol' },
          { value: 'heavyMeal', label: 'A heavy meal' },
          { value: 'caffeine', label: 'Caffeine' },
          { value: 'none', label: 'None of these' },
        ],
      },
      {
        id: 'medications',
        nsf: 'Medications I took today',
        kind: 'text',
        optional: true,
        title: 'Any medications or supplements today?',
        subtitle: 'Including sleep aids like melatonin.',
        placeholder: 'e.g. melatonin 3 mg at 10 PM',
      },
      {
        id: 'routine',
        nsf: 'In the hour before going to sleep, my bedtime routine included',
        kind: 'multi',
        title: 'What’s your plan for the hour before bed?',
        subtitle: 'Pick all that apply.',
        options: [
          { value: 'reading', label: 'Reading' },
          { value: 'screens', label: 'Phone / TV' },
          { value: 'bath', label: 'Bath or shower' },
          { value: 'relaxation', label: 'Relaxation exercise' },
          { value: 'work', label: 'Work or study' },
          { value: 'other', label: 'Something else' },
        ],
      },
    ],
  },
};

export const TONE_META: Record<Tone, { icon: SymbolViewProps['name'] }> = {
  great: { icon: { ios: 'sun.max.fill', android: 'sunny', web: 'sunny' } },
  good: {
    icon: {
      ios: 'cloud.sun.fill',
      android: 'partly_cloudy_day',
      web: 'partly_cloudy_day',
    },
  },
  okay: { icon: { ios: 'cloud.fill', android: 'cloud', web: 'cloud' } },
  poor: { icon: { ios: 'cloud.rain.fill', android: 'rainy', web: 'rainy' } },
};

/** Whether the user has given enough of an answer to move on. */
export function isAnswered(question: Question, answer: Answer | undefined) {
  if (question.optional) return true;
  if (question.kind === 'multi') return Array.isArray(answer) && answer.length > 0;
  if (question.kind === 'single') return typeof answer === 'string';
  if (question.kind === 'time') return answer instanceof Date;
  if (question.kind === 'counter') {
    const values = answer as Record<string, number> | undefined;
    return question.fields.every((field) => typeof values?.[field.id] === 'number');
  }
  return true;
}

export function initialAnswer(question: Question): Answer | undefined {
  if (question.kind !== 'counter') return undefined;
  const preset = question.fields.filter((field) => field.initial !== undefined);
  if (preset.length === 0) return undefined;
  return Object.fromEntries(preset.map((field) => [field.id, field.initial as number]));
}

/** Clock time `minutes` after midnight of today (negative = the evening before). */
export function timeFromMinutes(minutes: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return new Date(date.getTime() + minutes * 60_000);
}
