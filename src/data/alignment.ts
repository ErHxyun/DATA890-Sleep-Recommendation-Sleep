import type { Answer } from './journal-questions';
import {
  asleepMinutes,
  formatClock,
  formatDuration,
  formatSignedMinutes,
  minutesBetween,
} from './sleep-math';
import type { NightSummary } from './types';

/**
 * Aligns the morning self-report with what the watch measured for the same night.
 * Each row keeps both values; the difference is data, not an error to correct.
 */
export type AlignmentRow = {
  id: string;
  label: string;
  self: string;
  watch: string;
  /** e.g. "+20 min"; empty when the two agree. */
  difference: string;
  agrees: boolean;
};

/** How far apart two values can be and still count as agreeing. */
export const TOLERANCE = {
  clockMinutes: 15,
  totalSleepMinutes: 30,
  wakings: 1,
  awakeMinutes: 15,
};

function signedCount(count: number) {
  return `${count > 0 ? '+' : '−'}${Math.abs(count)}`;
}

export function alignMorningCheckIn(
  answers: Record<string, Answer>,
  night: NightSummary,
): AlignmentRow[] {
  // The first awake segment is falling asleep; later ones are night wakings.
  const wakings = night.segments.slice(1).filter((segment) => segment.stage === 'awake');
  const watchAwakeMinutes = wakings.reduce(
    (sum, segment) => sum + minutesBetween(segment.start, segment.end),
    0,
  );
  const nightWaking = answers.nightWaking as Record<string, number> | undefined;
  const totalSleep = answers.totalSleep as Record<string, number> | undefined;

  const rows: AlignmentRow[] = [];

  function addClock(id: string, label: string, self: Answer | undefined, watch: Date) {
    if (!(self instanceof Date)) return;
    const diff = minutesBetween(watch, self);
    const agrees = Math.abs(diff) <= TOLERANCE.clockMinutes;
    rows.push({
      id,
      label,
      self: formatClock(self),
      watch: formatClock(watch),
      difference: agrees ? '' : formatSignedMinutes(diff),
      agrees,
    });
  }

  addClock('bedtime', 'Went to bed', answers.bedtime, night.inBedStart);
  addClock('outOfBed', 'Got out of bed', answers.outOfBed, night.inBedEnd);

  if (totalSleep?.hours !== undefined) {
    const selfMinutes = totalSleep.hours * 60;
    const diff = selfMinutes - asleepMinutes(night);
    const agrees = Math.abs(diff) <= TOLERANCE.totalSleepMinutes;
    rows.push({
      id: 'totalSleep',
      label: 'Total sleep',
      self: formatDuration(Math.round(selfMinutes)),
      watch: formatDuration(asleepMinutes(night)),
      difference: agrees ? '' : formatSignedMinutes(diff),
      agrees,
    });
  }

  if (nightWaking?.times !== undefined) {
    const diff = nightWaking.times - wakings.length;
    const agrees = Math.abs(diff) <= TOLERANCE.wakings;
    rows.push({
      id: 'wakings',
      label: 'Times awake',
      self: `${nightWaking.times}×`,
      watch: `${wakings.length}×`,
      difference: agrees ? '' : signedCount(diff),
      agrees,
    });
  }

  if (nightWaking?.minutes !== undefined) {
    const diff = nightWaking.minutes - watchAwakeMinutes;
    const agrees = Math.abs(diff) <= TOLERANCE.awakeMinutes;
    rows.push({
      id: 'awakeMinutes',
      label: 'Time awake',
      self: formatDuration(nightWaking.minutes),
      watch: formatDuration(watchAwakeMinutes),
      difference: agrees ? '' : formatSignedMinutes(diff),
      agrees,
    });
  }

  return rows;
}
