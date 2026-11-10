/**
 * "How to use this app" content. Kept as data so wording can change without touching the
 * screen. Placeholder text pending review with the clinical lead.
 */

import type { SymbolViewProps } from 'expo-symbols';

export type GuideSection = 'start' | 'tracking' | 'screens' | 'privacy';

export type GuideStep = {
  title: string;
  body: string;
  when: string;
  icon: SymbolViewProps['name'];
};

export type GuideQuestion = { question: string; answer: string };

export type GuideScreenInfo = {
  name: string;
  body: string;
  icon: SymbolViewProps['name'];
};

export const QUICK_START: GuideStep[] = [
  {
    title: 'Wear your watch to bed',
    body: 'Charge it during the day and wear it snugly at night. Sleep stages, heart rate, HRV, breathing and temperature are recorded on their own.',
    when: 'Every night',
    icon: { ios: 'applewatch', android: 'watch', web: 'watch' },
  },
  {
    title: 'Do the morning check-in',
    body: 'Answer from memory before looking at any sleep numbers. Your own sense of the night is part of the data, so the app shows the watch’s numbers only after you answer.',
    when: 'Right after you get up · about 1 min',
    icon: { ios: 'sun.horizon', android: 'wb_twilight', web: 'wb_twilight' },
  },
  {
    title: 'Do the evening check-in',
    body: 'Log caffeine, alcohol, naps, exercise and your plan for the hour before bed. These are what link your days to your nights.',
    when: 'Before bed · about 1 min',
    icon: { ios: 'moon.stars', android: 'nights_stay', web: 'nights_stay' },
  },
];

export const ROUTINE: { label: string; detail: string }[] = [
  {
    label: 'Each morning',
    detail: 'Read your one focus on Today. That’s the only thing to act on.',
  },
  {
    label: 'Once a week',
    detail: 'Open Insights to see trends and which habits line up with better nights.',
  },
  {
    label: 'Any time',
    detail: 'Coach shows your goal and why each suggestion was made; Learn explains the ideas.',
  },
];

export const TRACKING_FAQ: GuideQuestion[] = [
  {
    question: 'I don’t remember exact times. What should I enter?',
    answer:
      'Your best guess is exactly what we want. Round to the nearest 15 minutes and don’t check your watch first. Differences between your memory and the watch are useful, not mistakes.',
  },
  {
    question: 'What counts as caffeine?',
    answer:
      'Coffee, tea (including green and black), energy drinks, many sodas, pre-workout drinks and chocolate. Decaf has only a little.',
  },
  {
    question: 'What counts as “alcohol near bedtime”?',
    answer: 'Any alcoholic drink in the 2–3 hours before you went to bed, even a single one.',
  },
  {
    question: 'What counts as a nap?',
    answer:
      'Any sleep during the day, including dozing off on the couch or on transit. Estimate how many minutes; leave it at 0 if you didn’t nap.',
  },
  {
    question: 'What if I miss a check-in?',
    answer:
      'Just skip it; don’t fill it in later from memory. Patterns need a handful of nights, so aim for most days rather than every day.',
  },
  {
    question: 'Why does the app sometimes say “needs data”?',
    answer:
      'Some suggestions depend on things only you can report, like naps or screen use. They stay on hold until your check-ins give the coach something to go on.',
  },
  {
    question: 'Why do my answers differ from my watch?',
    answer:
      'Watches estimate sleep from movement and heart rate, and people often forget brief wakings or feel they slept less when sleep was poor. Neither is simply “right”; both shape your coaching.',
  },
];

export const SCREENS: GuideScreenInfo[] = [
  {
    name: 'Today',
    body: 'Morning check-in first, then last night’s sleep, today’s one focus, and your overnight vitals. Tap a vital to see its two-week trend and what it means.',
    icon: { ios: 'moon.zzz.fill', android: 'bedtime', web: 'bedtime' },
  },
  {
    name: 'Journal',
    body: 'Your morning and evening check-ins, and which ones you’ve done this week.',
    icon: { ios: 'square.and.pencil', android: 'edit_note', web: 'edit_note' },
  },
  {
    name: 'Insights',
    body: 'Trends over 1, 2 or 4 weeks: how your own sense of sleep compares with the watch, and which habits line up with better or worse nights.',
    icon: { ios: 'chart.xyaxis.line', android: 'insights', web: 'insights' },
  },
  {
    name: 'Coach',
    body: 'Your current goal and progress, every suggestion the coach considered and why, and safety checks.',
    icon: { ios: 'figure.mind.and.body', android: 'self_improvement', web: 'self_improvement' },
  },
  {
    name: 'Learn',
    body: 'Short lessons on how sleep works, with the ones behind your current suggestions first.',
    icon: { ios: 'book.fill', android: 'menu_book', web: 'menu_book' },
  },
];

export const PRIVACY: GuideQuestion[] = [
  {
    question: 'Is this a medical device?',
    answer:
      'No. Sleep by Science offers behavioral sleep coaching. It doesn’t diagnose or treat conditions, and when something looks outside what coaching can address, it suggests seeing a clinician.',
  },
  {
    question: 'Where does my data go?',
    answer:
      'In this prototype, nothing you enter leaves your device, and it is cleared when you reload the page. The sleep history shown is demo data from two public research datasets.',
  },
  {
    question: 'Who decides what the coach suggests?',
    answer:
      'Rules based on a clinical knowledge map and published research, checked against your own data. Suggestions are marked as pending until a clinician has reviewed them.',
  },
  {
    question: 'What if I’m struggling?',
    answer:
      'If you are thinking about harming yourself, call or text 988 (Suicide & Crisis Lifeline, US) or your local emergency number now. For ongoing sleep problems, talk with your primary care provider.',
  },
];
