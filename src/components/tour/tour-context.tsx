/**
 * Guided tour (coach marks): parts of the UI register themselves as targets, and the
 * overlay walks through them one by one with the rest of the screen dimmed.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Platform, View, type HostInstance, type StyleProp, type ViewStyle } from 'react-native';

export type Rect = { x: number; y: number; width: number; height: number };

export type TourStep = { target: string; title: string; body: string };

/** Steps in order. Steps whose target isn't on screen (e.g. native tab bars) are skipped. */
export const TOUR_STEPS: TourStep[] = [
  {
    target: 'sleep',
    title: 'Start your day here',
    body: 'Each morning, tell us how you slept first. Then you’ll see what your watch measured, side by side.',
  },
  {
    target: 'focus',
    title: 'One thing to focus on',
    body: 'Your coach picks one suggestion from your own data. Tap “Why am I seeing this?” to see the evidence behind it.',
  },
  {
    target: 'vitals',
    title: 'Overnight vitals',
    body: 'Tap any tile to see its two-week trend and a plain-language explanation of what it means.',
  },
  {
    target: 'tab-journal',
    title: 'Journal',
    body: 'Your morning and evening check-ins. About a minute each.',
  },
  {
    target: 'tab-insights',
    title: 'Insights',
    body: 'Weekly trends, and which habits line up with your better and worse nights.',
  },
  {
    target: 'tab-coach',
    title: 'Coach',
    body: 'Your goal, every suggestion the coach considered and why, and safety checks.',
  },
  {
    target: 'tab-learn',
    title: 'Learn',
    body: 'Short lessons on how sleep works, with videos coming soon.',
  },
  {
    target: 'help',
    title: 'Help anytime',
    body: 'Open the guide for tracking tips, or replay this tour from there.',
  },
];

type Target = {
  measure: () => Promise<Rect | null>;
  /** Scrolls the target's screen; absent for targets that don't scroll (the tab bar). */
  scrollBy?: (dy: number) => void;
};

type TourState = {
  register: (id: string, target: Target) => () => void;
  start: () => void;
  stop: () => void;
  next: () => void;
  back: () => void;
  /** The active step, or null when the tour isn't running. */
  step: { index: number; count: number; data: TourStep; target: Target | undefined } | null;
};

const TourContext = createContext<TourState | null>(null);

/** Lets a target scroll the screen it lives on, so it can be brought into view. */
export const ScrollContainerContext = createContext<{ scrollBy: (dy: number) => void } | null>(
  null,
);

const SEEN_KEY = 'sleep-app:tour-seen';
let seenInMemory = false;

export function hasSeenTour() {
  if (Platform.OS !== 'web') return seenInMemory;
  try {
    return window.localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return seenInMemory;
  }
}

function markTourSeen() {
  seenInMemory = true;
  if (Platform.OS !== 'web') return;
  try {
    window.localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Storage unavailable; the in-memory flag covers this visit.
  }
}

export function TourProvider({ children }: PropsWithChildren) {
  const targets = useRef(new Map<string, Target>());
  // Each step with the target it points at, captured when the tour starts.
  const [steps, setSteps] = useState<{ data: TourStep; target: Target }[]>([]);
  const [index, setIndex] = useState<number | null>(null);

  const register = useCallback((id: string, target: Target) => {
    targets.current.set(id, target);
    return () => {
      if (targets.current.get(id) === target) targets.current.delete(id);
    };
  }, []);

  const stop = useCallback(() => setIndex(null), []);

  const start = useCallback(() => {
    markTourSeen();
    const available = TOUR_STEPS.flatMap((data) => {
      const target = targets.current.get(data.target);
      return target ? [{ data, target }] : [];
    });
    if (available.length === 0) return;
    setSteps(available);
    setIndex(0);
  }, []);

  const next = useCallback(
    () => setIndex((i) => (i === null || i + 1 >= steps.length ? null : i + 1)),
    [steps.length],
  );
  const back = useCallback(() => setIndex((i) => (i === null ? null : Math.max(0, i - 1))), []);

  const value = useMemo<TourState>(
    () => ({
      register,
      start,
      stop,
      next,
      back,
      step:
        index === null
          ? null
          : {
              index,
              count: steps.length,
              data: steps[index].data,
              target: steps[index].target,
            },
    }),
    [register, start, stop, next, back, index, steps],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const tour = useContext(TourContext);
  if (!tour) throw new Error('useTour must be used inside TourProvider');
  return tour;
}

/** Wrap a part of the UI to make it a stop on the tour. */
export function TourTarget({
  id,
  style,
  children,
}: PropsWithChildren<{ id: string; style?: StyleProp<ViewStyle> }>) {
  const ref = useRef<HostInstance>(null);
  const tour = useContext(TourContext);
  const scroll = useContext(ScrollContainerContext);
  const register = tour?.register;

  useEffect(() => {
    if (!register) return;
    return register(id, {
      measure: () =>
        new Promise((resolve) => {
          const node = ref.current;
          if (!node) return resolve(null);
          node.measureInWindow((x, y, width, height) =>
            resolve(width > 0 && height > 0 ? { x, y, width, height } : null),
          );
        }),
      scrollBy: scroll?.scrollBy,
    });
  }, [id, register, scroll]);

  return (
    <View ref={ref} collapsable={false} style={style}>
      {children}
    </View>
  );
}
