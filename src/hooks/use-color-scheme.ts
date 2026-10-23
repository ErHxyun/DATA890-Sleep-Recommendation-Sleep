import { useSyncExternalStore } from 'react';
import { Appearance, Platform } from 'react-native';

export type AppColorScheme = 'light' | 'dark';

/**
 * The app's own light/dark setting, chosen in-app and independent of the system.
 * Light (cream) is the default. On web the choice is remembered in localStorage.
 */
const STORAGE_KEY = 'sleep-app:color-scheme';

let scheme: AppColorScheme = 'light';
const listeners = new Set<() => void>();

function apply(next: AppColorScheme) {
  scheme = next;
  // Native system UI (keyboard, alerts) follows the app's choice rather than the device's.
  if (Platform.OS !== 'web') Appearance.setColorScheme(next);
  listeners.forEach((listener) => listener());
}

export function setColorScheme(next: AppColorScheme) {
  apply(next);
  if (Platform.OS === 'web') {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the choice then lasts for this visit.
    }
  }
}

/** Restores the saved choice. Called once after mount so server and client first render match. */
export function restoreColorScheme() {
  if (Platform.OS !== 'web') return;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') apply(saved);
  } catch {
    // Keep the default.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useColorScheme(): AppColorScheme {
  return useSyncExternalStore(
    subscribe,
    () => scheme,
    () => 'light',
  );
}
