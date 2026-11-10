/**
 * Four weeks of nights for Insights, trends and coaching. Each night pairs the watch's
 * measurement with the user's own morning report and the previous evening's habits.
 *
 * Earlier nights come from the demo user (see `demo.ts`). Last night uses today's real
 * morning check-in when there is one, so what the user just entered shows up here.
 */

import { demoNights, summarize, type DemoNight } from './demo';
import type { Answer } from './journal-questions';
import { asleepMinutes, stageMinutes } from './sleep-math';

export type Behavior = 'alcohol' | 'lateCaffeine' | 'exercise' | 'screens' | 'nap';

export type WatchNight = {
  bedtime: Date;
  outOfBed: Date;
  asleepMinutes: number;
  deepMinutes: number;
  wakings: number;
  awakeMinutes: number;
  hrvMs: number;
  restingHr: number;
  respiratoryRate: number;
  /** Deviation from the user's baseline, °C. */
  wristTempDeltaC: number;
};

/** Datasets record different parts of the diary, so every field is optional. */
export type SelfReport = {
  bedtime?: Date;
  outOfBed?: Date;
  totalSleepMinutes?: number;
  wakings?: number;
  awakeMinutes?: number;
  /** 1 (very poor) – 5 (very good). */
  sleepQuality?: number;
};

export type NightRecord = {
  /** Morning the user woke up. */
  date: Date;
  watch: WatchNight;
  /** Missing when the morning check-in was skipped. */
  self: SelfReport | null;
  /**
   * From the previous evening's check-in; missing when it was skipped. A habit that was
   * not asked about is left out rather than recorded as "no".
   */
  behaviors: Partial<Record<Behavior, boolean>> | null;
};

function watchOf(night: DemoNight): WatchNight {
  const summary = summarize(night);
  return {
    bedtime: summary.inBedStart,
    outOfBed: summary.inBedEnd,
    asleepMinutes: asleepMinutes(summary),
    deepMinutes: stageMinutes(summary).deep,
    wakings: summary.wakings,
    awakeMinutes: summary.awakeMinutes,
    hrvMs: summary.hrvMs,
    restingHr: summary.restingHr,
    respiratoryRate: summary.respiratoryRate,
    wristTempDeltaC: summary.wristTempDeltaC,
  };
}

function recordOf(night: DemoNight): NightRecord {
  return {
    date: summarize(night).wakeDate,
    watch: watchOf(night),
    self: night.self
      ? { totalSleepMinutes: night.self.totalSleepMin, sleepQuality: night.self.sleepQuality }
      : null,
    behaviors: night.behaviors,
  };
}

/** Earlier nights, oldest first. Last night is appended by `buildHistory`. */
const PAST_NIGHTS: NightRecord[] = demoNights.slice(0, -1).map(recordOf);
const LAST_NIGHT: NightRecord = recordOf(demoNights[demoNights.length - 1]);

/** Turns a saved morning check-in into a self-report. */
function selfFromAnswers(answers: Record<string, Answer> | undefined): SelfReport | null {
  if (!answers) return null;
  const { bedtime, outOfBed } = answers;
  const nightWaking = answers.nightWaking as Record<string, number> | undefined;
  const totalSleep = answers.totalSleep as Record<string, number> | undefined;
  return {
    bedtime: bedtime instanceof Date ? bedtime : undefined,
    outOfBed: outOfBed instanceof Date ? outOfBed : undefined,
    totalSleepMinutes: totalSleep?.hours !== undefined ? totalSleep.hours * 60 : undefined,
    wakings: nightWaking?.times,
    awakeMinutes: nightWaking?.minutes,
  };
}

/**
 * All nights, oldest first. Last night's self-report only exists once the user has done
 * this morning's check-in, matching the Today screen, which waits for it too.
 */
export function buildHistory(morningAnswers?: Record<string, Answer>): NightRecord[] {
  return [...PAST_NIGHTS, { ...LAST_NIGHT, self: selfFromAnswers(morningAnswers) }];
}
