import type { NightSummary, SleepStage } from './types';

export function minutesBetween(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 60_000);
}

export function stageMinutes(night: NightSummary): Record<SleepStage, number> {
  const totals: Record<SleepStage, number> = { awake: 0, rem: 0, core: 0, deep: 0 };
  for (const segment of night.segments) {
    totals[segment.stage] += minutesBetween(segment.start, segment.end);
  }
  return totals;
}

export function asleepMinutes(night: NightSummary) {
  const totals = stageMinutes(night);
  return totals.rem + totals.core + totals.deep;
}

/** Sleep efficiency = time asleep / time in bed. */
export function sleepEfficiency(night: NightSummary) {
  return asleepMinutes(night) / minutesBetween(night.inBedStart, night.inBedEnd);
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatClock(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** Signed percent change, e.g. "-17%". */
export function percentChange(value: number, base: number) {
  const pct = Math.round(((value - base) / base) * 100);
  return `${pct > 0 ? '+' : ''}${pct}%`;
}

/** Signed duration, e.g. "+41m" or "−1h 5m". */
export function formatSignedMinutes(minutes: number) {
  const rounded = Math.round(minutes);
  if (rounded === 0) return '0m';
  return `${rounded > 0 ? '+' : '−'}${formatDuration(Math.abs(rounded))}`;
}

/**
 * A user's usual range for a nightly value: mean ± 1 SD of earlier nights.
 * Shared by the vitals tiles and their trend charts so both agree.
 */
export function usualRange(earlier: number[]) {
  const mean = earlier.reduce((a, b) => a + b, 0) / earlier.length;
  const sd = Math.sqrt(earlier.reduce((a, b) => a + (b - mean) ** 2, 0) / earlier.length);
  return { mean, low: mean - sd, high: mean + sd };
}
