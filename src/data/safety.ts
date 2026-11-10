/**
 * Safety gate: checks that sit above coaching. When one trips, the app points the user to a
 * clinician (or to crisis support) instead of, or ahead of, behavioral suggestions.
 * Every threshold here is a placeholder pending clinical review.
 */

import type { NightRecord } from './history';
import type { Answer } from './journal-questions';
import { usualRange } from './sleep-math';

export type SafetyLevel = 'clear' | 'clinician' | 'urgent';

export type SafetyCheck = {
  id: string;
  label: string;
  status: 'ok' | 'flag' | 'pending';
  detail: string;
  /** Level this check raises the user to when it flags. */
  level: Exclude<SafetyLevel, 'clear'>;
};

export type SafetyResult = { level: SafetyLevel; checks: SafetyCheck[] };

const SHORT_SLEEP_MINUTES = 5 * 60;
const SHORT_SLEEP_NIGHTS = 4;
const RHR_RISE_BPM = 10;

/** Phrases in free-text notes that should surface crisis support right away. */
const CRISIS_PHRASES = [
  'kill myself',
  'suicide',
  'suicidal',
  'end my life',
  'want to die',
  'hurt myself',
  'harm myself',
  'not want to be alive',
  "don't want to be alive",
  'don’t want to be alive',
];

function shortSleep(nights: NightRecord[]): SafetyCheck {
  const recent = nights.slice(-14);
  const short = recent.filter((n) => n.watch.asleepMinutes < SHORT_SLEEP_MINUTES).length;
  return {
    id: 'shortSleep',
    label: 'Very short sleep',
    level: 'clinician',
    status: short >= SHORT_SLEEP_NIGHTS ? 'flag' : 'ok',
    detail:
      short >= SHORT_SLEEP_NIGHTS
        ? `${short} of the last ${recent.length} nights were under 5 hours. Ongoing short sleep is worth discussing with your primary care provider.`
        : `${short} of the last ${recent.length} nights were under 5 hours.`,
  };
}

function breathing(nights: NightRecord[]): SafetyCheck {
  const values = nights.map((n) => n.watch.respiratoryRate);
  const range = usualRange(values.slice(0, -5));
  const high = values.slice(-5).filter((v) => v > range.high).length;
  return {
    id: 'breathing',
    label: 'Breathing rate during sleep',
    level: 'clinician',
    status: high >= 3 ? 'flag' : 'ok',
    detail:
      high >= 3
        ? `Above your usual range on ${high} of the last 5 nights. If this continues, especially with a cough, fever or shortness of breath, check in with a clinician.`
        : `Above your usual range on ${high} of the last 5 nights.`,
  };
}

function restingHeartRate(nights: NightRecord[]): SafetyCheck {
  const values = nights.map((n) => n.watch.restingHr);
  const { mean } = usualRange(values.slice(0, -3));
  const raised = values.slice(-3).every((v) => v >= mean + RHR_RISE_BPM);
  return {
    id: 'restingHr',
    label: 'Resting heart rate',
    level: 'clinician',
    status: raised ? 'flag' : 'ok',
    detail: raised
      ? `At least ${RHR_RISE_BPM} bpm above your usual for the last 3 nights. Contact a clinician; seek urgent care for chest pain.`
      : `No sustained rise above your usual ${Math.round(mean)} bpm.`,
  };
}

function journalNotes(morning: Record<string, Answer> | undefined): SafetyCheck {
  const note = typeof morning?.morningNotes === 'string' ? morning.morningNotes.toLowerCase() : '';
  const crisis = CRISIS_PHRASES.some((phrase) => note.includes(phrase));
  return {
    id: 'notes',
    label: 'Journal notes',
    level: 'urgent',
    status: crisis ? 'flag' : 'ok',
    detail: crisis
      ? 'Something you wrote suggests you may be going through a very hard time.'
      : 'Nothing in today’s notes needs attention.',
  };
}

const QUESTIONNAIRES: SafetyCheck = {
  id: 'questionnaires',
  label: 'Insomnia, mood and anxiety screening',
  level: 'clinician',
  status: 'pending',
  detail:
    'Coming next: short ISI, PHQ-9 and GAD-7 questionnaires every two weeks, with clinician-set cut-offs for referral.',
};

export function evaluateSafety(
  nights: NightRecord[],
  morning: Record<string, Answer> | undefined,
): SafetyResult {
  const checks = [
    journalNotes(morning),
    shortSleep(nights),
    breathing(nights),
    restingHeartRate(nights),
    QUESTIONNAIRES,
  ];
  const flagged = checks.filter((c) => c.status === 'flag');
  const level: SafetyLevel = flagged.some((c) => c.level === 'urgent')
    ? 'urgent'
    : flagged.length > 0
      ? 'clinician'
      : 'clear';
  return { level, checks };
}
