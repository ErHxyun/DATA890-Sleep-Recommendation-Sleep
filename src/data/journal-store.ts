import { useSyncExternalStore } from 'react';

import type { Answer, CheckInKind } from './journal-questions';

/**
 * In-memory store for today's check-ins. Good enough for the prototype;
 * later this is where answers get persisted and sent to the data pipeline.
 */
export type CheckInRecord = {
  kind: CheckInKind;
  completedAt: Date;
  answers: Record<string, Answer>;
};

let records: Partial<Record<CheckInKind, CheckInRecord>> = {};
const listeners = new Set<() => void>();

export function saveCheckIn(record: CheckInRecord) {
  records = { ...records, [record.kind]: record };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCheckIns() {
  return useSyncExternalStore(
    subscribe,
    () => records,
    () => records,
  );
}
