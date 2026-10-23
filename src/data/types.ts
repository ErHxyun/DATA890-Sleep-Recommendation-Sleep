/**
 * Data shapes for the prototype. Field names mirror the HealthKit types we plan to read,
 * so the mock data can later be swapped for real HealthKit queries without touching the UI.
 */

/** Where an observation came from. Shown on every card so users can see provenance. */
export type DataSource = 'watch' | 'journal' | 'bpCuff';

/** HKCategoryValueSleepAnalysis: awake, asleepREM, asleepCore, asleepDeep. */
export type SleepStage = 'awake' | 'rem' | 'core' | 'deep';

export type SleepSegment = {
  stage: SleepStage;
  start: Date;
  end: Date;
};

export type NightSummary = {
  /** The morning the user woke up, e.g. 2026-10-23. */
  wakeDate: Date;
  inBedStart: Date;
  inBedEnd: Date;
  segments: SleepSegment[];
  /** HKQuantityTypeIdentifierHeartRateVariabilitySDNN, in ms. Apple reports SDNN, not RMSSD. */
  hrvSdnnMs: number;
  /** HKQuantityTypeIdentifierRestingHeartRate, in bpm. */
  restingHr: number;
  /** HKQuantityTypeIdentifierRespiratoryRate during sleep, breaths/min. */
  respiratoryRate: number;
  /** HKQuantityTypeIdentifierAppleSleepingWristTemperature, deviation from baseline in °C. */
  wristTempDeltaC: number;
};

export type Evidence = {
  citation: string;
  finding: string;
};

export type Recommendation = {
  id: string;
  title: string;
  action: string;
  /** Personal "why": the pattern in this user's own data that triggered the recommendation. */
  why: string;
  sources: DataSource[];
  evidence: Evidence[];
  /** Until Lyn signs off, every recommendation shows as pending review. */
  clinicalReview: 'pending' | 'reviewed';
};
