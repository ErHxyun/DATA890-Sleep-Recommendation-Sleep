/**
 * Four weeks of mock nights for the Insights screen. Each night pairs the watch's
 * measurement with the user's own morning report and the previous evening's habits,
 * which is the shape the knowledge graph will eventually provide.
 *
 * Values are generated from a fixed seed with built-in effects (e.g. late alcohol
 * lowers deep sleep and HRV) so the patterns on screen are plausible and stable.
 */

import type { Answer } from './journal-questions';
import { lastNight } from './mock';
import { asleepMinutes, minutesBetween, stageMinutes } from './sleep-math';

export type Behavior = 'alcohol' | 'lateCaffeine' | 'exercise' | 'screens' | 'nap';

export type WatchNight = {
  bedtime: Date;
  outOfBed: Date;
  asleepMinutes: number;
  deepMinutes: number;
  wakings: number;
  awakeMinutes: number;
  hrvSdnnMs: number;
  restingHr: number;
  respiratoryRate: number;
  /** Deviation from the user's baseline, °C. */
  wristTempDeltaC: number;
};

export type SelfReport = {
  bedtime: Date;
  outOfBed: Date;
  totalSleepMinutes: number;
  wakings: number;
  awakeMinutes: number;
};

export type NightRecord = {
  /** Morning the user woke up. */
  date: Date;
  watch: WatchNight;
  /** Missing when the morning check-in was skipped. */
  self: SelfReport | null;
  /** From the previous evening's check-in; missing when it was skipped. */
  behaviors: Record<Behavior, boolean> | null;
};

const NIGHTS = 28;

/** mulberry32: small seeded PRNG so the mock data never changes between reloads. */
function seededRandom(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = seededRandom(890);
const chance = (p: number) => random() < p;
/** Roughly normal noise (Box–Muller). */
const noise = (sd: number) =>
  Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random()) * sd;
const roundTo = (value: number, step: number) => Math.round(value / step) * step;
const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60_000);

function midnightOf(daysAgo: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function generateNight(daysAgo: number): NightRecord {
  const date = midnightOf(daysAgo);
  const b: Record<Behavior, boolean> = {
    alcohol: chance(0.3),
    lateCaffeine: chance(0.3),
    exercise: chance(0.5),
    screens: chance(0.5),
    nap: chance(0.15),
  };
  const n = (flag: boolean) => (flag ? 1 : 0);

  const bedtime = addMinutes(date, -45 + noise(25) + 20 * n(b.screens) + 15 * n(b.alcohol));
  const latency = 10 + 15 * n(b.lateCaffeine) + random() * 10;
  const asleep = Math.round(
    425 -
      25 * n(b.lateCaffeine) -
      15 * n(b.alcohol) +
      10 * n(b.exercise) -
      20 * n(b.nap) +
      noise(12),
  );
  const wakings = 2 + 2 * n(b.alcohol) + Math.floor(random() * 3);
  const awake = wakings * 4 + Math.round(random() * 6);

  const watch: WatchNight = {
    bedtime,
    outOfBed: addMinutes(bedtime, latency + asleep + awake),
    asleepMinutes: asleep,
    deepMinutes: Math.round(95 - 22 * n(b.alcohol) + 12 * n(b.exercise) + noise(6)),
    wakings,
    awakeMinutes: awake,
    hrvSdnnMs: Math.round(48 - 9 * n(b.alcohol) + 3 * n(b.exercise) + noise(2.5)),
    restingHr: Math.round(57 + 4 * n(b.alcohol) - n(b.exercise) + noise(1.5)),
    respiratoryRate: Math.round((14.8 + 0.3 * n(b.alcohol) + noise(0.3)) * 10) / 10,
    wristTempDeltaC: Math.round((0.1 * n(b.alcohol) + noise(0.15)) * 10) / 10,
  };

  // People tend to round to the quarter hour, sleep through brief wakings, and
  // over- or under-estimate total sleep; the gaps below are what alignment surfaces.
  const self: SelfReport | null = chance(0.86)
    ? {
        bedtime: new Date(roundTo(bedtime.getTime() + noise(10) * 60_000, 15 * 60_000)),
        outOfBed: new Date(
          roundTo(watch.outOfBed.getTime() + (5 + noise(12)) * 60_000, 15 * 60_000),
        ),
        totalSleepMinutes: roundTo(asleep + 25 + noise(20), 15),
        wakings: Math.max(0, wakings - 1 - Math.floor(random() * 2)),
        awakeMinutes: roundTo(Math.max(0, awake + noise(10)), 5),
      }
    : null;

  return { date, watch, self, behaviors: chance(0.82) ? b : null };
}

function watchFromSummary(): WatchNight {
  const wakings = lastNight.segments.slice(1).filter((segment) => segment.stage === 'awake');
  return {
    bedtime: lastNight.inBedStart,
    outOfBed: lastNight.inBedEnd,
    asleepMinutes: asleepMinutes(lastNight),
    deepMinutes: stageMinutes(lastNight).deep,
    wakings: wakings.length,
    awakeMinutes: wakings.reduce((sum, s) => sum + minutesBetween(s.start, s.end), 0),
    hrvSdnnMs: lastNight.hrvSdnnMs,
    restingHr: lastNight.restingHr,
    respiratoryRate: lastNight.respiratoryRate,
    wristTempDeltaC: lastNight.wristTempDeltaC,
  };
}

/** Earlier nights, oldest first. Last night is appended by `buildHistory`. */
const PAST_NIGHTS: NightRecord[] = Array.from({ length: NIGHTS - 1 }, (_, i) =>
  generateNight(NIGHTS - 1 - i),
);

/** Turns a saved morning check-in into a self-report, if it has every field. */
function selfFromAnswers(answers: Record<string, Answer> | undefined): SelfReport | null {
  if (!answers) return null;
  const { bedtime, outOfBed } = answers;
  const nightWaking = answers.nightWaking as Record<string, number> | undefined;
  const totalSleep = answers.totalSleep as Record<string, number> | undefined;
  if (!(bedtime instanceof Date) || !(outOfBed instanceof Date) || !nightWaking || !totalSleep) {
    return null;
  }
  return {
    bedtime,
    outOfBed,
    totalSleepMinutes: totalSleep.hours * 60,
    wakings: nightWaking.times,
    awakeMinutes: nightWaking.minutes,
  };
}

/**
 * All nights, oldest first. Last night uses the same watch data as the Today screen
 * and today's real morning check-in, so what the user just entered shows up here.
 */
export function buildHistory(morningAnswers?: Record<string, Answer>): NightRecord[] {
  return [
    ...PAST_NIGHTS,
    {
      date: lastNight.wakeDate,
      watch: watchFromSummary(),
      self: selfFromAnswers(morningAnswers),
      behaviors: { alcohol: true, lateCaffeine: false, exercise: true, screens: true, nap: false },
    },
  ];
}
