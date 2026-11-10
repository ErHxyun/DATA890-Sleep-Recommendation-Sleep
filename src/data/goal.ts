/**
 * The user's current behavioral goal and how the last week went against it.
 * For now there is one goal type, a steady bedtime (knowledge-graph rule r01), with the
 * target taken from the user's own recent bedtimes rather than a generic number.
 */

import type { NightRecord } from './history';
import { clockMinutes } from './sleep-math';

/** Minutes either side of the target bedtime that still count as on target. Placeholder. */
export const GOAL_WINDOW_MINUTES = 30;
const WEEK = 7;

export type GoalDay = { date: Date; bedtime: Date; onTarget: boolean };

export type GoalProgress = {
  title: string;
  /** e.g. "In bed within 30 minutes of 11:45 PM". */
  target: Date;
  days: GoalDay[];
  onTarget: number;
  /** Consecutive on-target nights ending last night. */
  streak: number;
  ruleId: 'r01';
};

const minutesFromMidnight = (night: NightRecord) => clockMinutes(night.watch.bedtime, night.date);

export function bedtimeGoal(nights: NightRecord[]): GoalProgress {
  const week = nights.slice(-WEEK);
  const sorted = week.map(minutesFromMidnight).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const targetMinutes = Math.round(median / 15) * 15;

  const days = week.map((night) => ({
    date: night.date,
    bedtime: night.watch.bedtime,
    onTarget: Math.abs(minutesFromMidnight(night) - targetMinutes) <= GOAL_WINDOW_MINUTES,
  }));
  let streak = 0;
  for (let i = days.length - 1; i >= 0 && days[i].onTarget; i--) streak++;

  const target = new Date();
  target.setHours(0, targetMinutes, 0, 0);
  return {
    title: 'Keep a steady bedtime',
    target,
    days,
    onTarget: days.filter((d) => d.onTarget).length,
    streak,
    ruleId: 'r01',
  };
}
