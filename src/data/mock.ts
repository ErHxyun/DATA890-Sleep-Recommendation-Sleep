import type { NightSummary, Recommendation, SleepSegment, SleepStage } from './types';

function minutesAfter(start: Date, minutes: number) {
  return new Date(start.getTime() + minutes * 60_000);
}

/**
 * Builds a plausible hypnogram: ~90-minute cycles where deep sleep shrinks
 * and REM grows across the night, with a few short awakenings.
 */
function buildSegments(sleepStart: Date): SleepSegment[] {
  const cycles: [SleepStage, number][][] = [
    [
      ['awake', 14],
      ['core', 18],
      ['deep', 38],
      ['core', 16],
      ['rem', 9],
    ],
    [
      ['core', 22],
      ['deep', 30],
      ['core', 18],
      ['rem', 18],
      ['awake', 3],
    ],
    [
      ['core', 28],
      ['deep', 14],
      ['core', 20],
      ['rem', 26],
    ],
    [
      ['core', 34],
      ['deep', 6],
      ['core', 16],
      ['rem', 30],
      ['awake', 4],
    ],
    [
      ['core', 32],
      ['rem', 34],
      ['awake', 6],
    ],
  ];

  const segments: SleepSegment[] = [];
  let cursor = sleepStart;
  for (const [stage, minutes] of cycles.flat()) {
    const end = minutesAfter(cursor, minutes);
    segments.push({ stage, start: cursor, end });
    cursor = end;
  }
  return segments;
}

const today = new Date();
today.setHours(0, 0, 0, 0);
const inBedStart = minutesAfter(today, -40); // 11:20 PM the night before
const segments = buildSegments(inBedStart);

export const lastNight: NightSummary = {
  wakeDate: today,
  inBedStart,
  inBedEnd: segments[segments.length - 1].end,
  segments,
  hrvSdnnMs: 39,
  restingHr: 61,
  respiratoryRate: 15.2,
  wristTempDeltaC: 0.3,
};

export const todaysRecommendation: Recommendation = {
  id: 'alcohol-timing',
  title: 'Give alcohol a 3-hour buffer before bed',
  action: 'If you drink tonight, try to finish your last drink by 8:00 PM.',
  why: 'On the 4 nights you logged alcohol within 3 hours of bed, your HRV averaged 18% lower and you got 21 fewer minutes of deep sleep than on other nights.',
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
