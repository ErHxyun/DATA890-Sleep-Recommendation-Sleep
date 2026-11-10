import { useSyncExternalStore } from 'react';

/**
 * Thumbs up / down on recommendations, kept in memory for the prototype. Later this feeds
 * the ranking step, so suggestions someone found unhelpful come up less often.
 */
export type Feedback = 'up' | 'down';

let feedback: Record<string, Feedback> = {};
const listeners = new Set<() => void>();

export function setFeedback(recommendationId: string, value: Feedback) {
  feedback = { ...feedback, [recommendationId]: value };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useFeedback() {
  return useSyncExternalStore(
    subscribe,
    () => feedback,
    () => feedback,
  );
}
