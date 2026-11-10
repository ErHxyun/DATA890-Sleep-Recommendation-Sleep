/**
 * Psychoeducation topics for the Learn tab, one per item in the clinical knowledge map
 * (knowledge-graph/nodes.csv). Wording is placeholder content pending clinical review.
 */

import type { SymbolViewProps } from 'expo-symbols';

export type LearnTopic = {
  id: string;
  title: string;
  summary: string;
  icon: SymbolViewProps['name'];
  paragraphs: string[];
  tips: string[];
  /** Rules in recommend.ts this topic explains; used to put it first when they fire. */
  rules: string[];
};

export const LEARN_TOPICS: LearnTopic[] = [
  {
    id: 'sleep_drive',
    title: 'Sleep drive',
    summary: 'Why you get sleepier the longer you’re awake.',
    icon: { ios: 'battery.25', android: 'battery_2_bar', web: 'battery_2_bar' },
    paragraphs: [
      'While you’re awake, your brain uses energy and a chemical called adenosine slowly builds up. The more of it there is, the sleepier you feel. Sleep clears it away again.',
      'This “sleep pressure” is one of two systems that decide when you sleep. Caffeine, long naps and lying in bed for many hours all weaken it.',
    ],
    tips: ['Protect your sleep pressure: keep naps short and caffeine early.'],
    rules: ['r05', 'r09'],
  },
  {
    id: 'circadian_rhythm',
    title: 'Your body clock',
    summary: 'The 24-hour rhythm that tells your body when it’s night.',
    icon: { ios: 'clock', android: 'schedule', web: 'schedule' },
    paragraphs: [
      'Your body runs on a roughly 24-hour clock that times sleepiness, alertness, body temperature and hormones like melatonin. It is the second system, alongside sleep drive, that decides when you sleep.',
      'The clock is set mostly by light and by regular timing. When bedtimes jump around, it’s like giving yourself mild jet lag: you may lie awake at night and feel groggy in the morning.',
    ],
    tips: [
      'Go to bed and get up at about the same time every day, weekends included.',
      'If you need to change your schedule, move it by an hour or less at a time.',
    ],
    rules: ['r01', 'r04'],
  },
  {
    id: 'routine_consistency',
    title: 'Routine and wind-down',
    summary: 'Small, repeated steps that cue your body for sleep.',
    icon: { ios: 'list.bullet.clipboard', android: 'checklist', web: 'checklist' },
    paragraphs: [
      'A short routine done in the same order each night becomes a signal that sleep is coming. It also gives your mind a buffer between the day’s work and lying down.',
    ],
    tips: [
      'Stop work about an hour before bed.',
      'Pick two or three calm steps, such as a shower, reading and dim lights, and keep them the same.',
    ],
    rules: ['r01', 'r02'],
  },
  {
    id: 'bed_association',
    title: 'Bed is for sleep',
    summary: 'Why lying awake in bed can make sleep harder.',
    icon: { ios: 'bed.double', android: 'bed', web: 'bed' },
    paragraphs: [
      'If you often lie awake, scroll or work in bed, your brain starts to link the bed with being awake. Using the bed only for sleep and sex helps rebuild the link with sleep.',
      'This idea, called stimulus control, is part of cognitive behavioral therapy for insomnia (CBT-I), the recommended first treatment for chronic insomnia.',
    ],
    tips: [
      'If you can’t fall asleep after about 20 minutes, get up and do something calm in dim light. Go back when you feel sleepy.',
    ],
    rules: ['r03'],
  },
  {
    id: 'alcohol',
    title: 'Alcohol and sleep',
    summary: 'It can help you fall asleep, then disturb the rest of the night.',
    icon: { ios: 'wineglass', android: 'wine_bar', web: 'wine_bar' },
    paragraphs: [
      'Alcohol is a depressant, so it can make you drowsy at first. As your body breaks it down, sleep tends to become lighter and more broken, especially in the second half of the night, and heart rate during sleep often rises.',
      'Effects differ between people and with how much and how late you drink. Your coach only suggests changes when your own nights show a pattern.',
    ],
    tips: ['If you drink, finish at least 3 hours before bed and keep it moderate.'],
    rules: ['r06'],
  },
  {
    id: 'caffeine',
    title: 'Caffeine',
    summary: 'How a morning coffee can still affect tonight.',
    icon: { ios: 'cup.and.saucer', android: 'coffee', web: 'coffee' },
    paragraphs: [
      'Caffeine looks enough like adenosine to block it, which is why it makes you feel less sleepy. It stays in the body for hours, so an afternoon drink can still be working at bedtime.',
      'Coffee, tea, energy drinks, some sodas and chocolate all count.',
    ],
    tips: ['Try having your last caffeine before about 2 PM.'],
    rules: ['r09'],
  },
  {
    id: 'naps',
    title: 'Naps',
    summary: 'When a nap helps and when it costs you sleep at night.',
    icon: { ios: 'powersleep', android: 'airline_seat_flat', web: 'airline_seat_flat' },
    paragraphs: [
      'A short nap can refresh you. Long or late naps use up sleep pressure you need at night and can leave you groggy.',
    ],
    tips: ['Keep naps to 20 minutes or less, and before mid-afternoon.'],
    rules: ['r05'],
  },
  {
    id: 'environment',
    title: 'Your bedroom',
    summary: 'Cool, dark and quiet.',
    icon: { ios: 'moon.zzz', android: 'bedtime', web: 'bedtime' },
    paragraphs: [
      'Your body temperature drops as you fall asleep, so a slightly cool room helps. Darkness supports melatonin, and steady quiet means fewer brief awakenings.',
    ],
    tips: [
      'Blackout curtains or an eye mask for light.',
      'Earplugs or a fan for steady background sound.',
      'A cooler room and breathable bedding.',
    ],
    rules: ['r07'],
  },
  {
    id: 'sunlight_blue_light',
    title: 'Light and screens',
    summary: 'Morning light sets your clock; evening light delays it.',
    icon: { ios: 'sun.max', android: 'light_mode', web: 'light_mode' },
    paragraphs: [
      'Daylight in the morning is the strongest signal for your body clock. Bright light in the evening, including from screens, can push back the time your body starts making melatonin.',
    ],
    tips: [
      'Get outside for a few minutes soon after waking.',
      'Dim lights and screens in the last hour before bed, or use night mode.',
    ],
    rules: ['r10'],
  },
  {
    id: 'exercise',
    title: 'Exercise',
    summary: 'Regular activity tends to mean deeper sleep.',
    icon: { ios: 'figure.run', android: 'directions_run', web: 'directions_run' },
    paragraphs: [
      'Regular physical activity is linked to falling asleep faster and more deep sleep. For most people, exercise at any time of day is better than none; some find very hard workouts close to bedtime keep them up.',
    ],
    tips: ['Aim for activity most days, and notice how late workouts affect you.'],
    rules: [],
  },
  {
    id: 'sleep_stages',
    title: 'Sleep stages',
    summary: 'What deep, core and REM sleep are.',
    icon: { ios: 'waveform.path', android: 'stacked_line_chart', web: 'stacked_line_chart' },
    paragraphs: [
      'Through the night you cycle through light (core), deep and REM sleep about every 90 minutes. Deep sleep comes mostly early in the night; REM, linked to dreaming, grows toward morning.',
      'Waking briefly a few times a night is normal. Most of these wakings are too short to remember.',
    ],
    tips: [],
    rules: [],
  },
  {
    id: 'wearables',
    title: 'What your watch can tell you',
    summary: 'Useful trends, not a clinical sleep test.',
    icon: { ios: 'applewatch', android: 'watch', web: 'watch' },
    paragraphs: [
      'Watches estimate sleep stages from movement and heart rate. They’re good at total sleep and trends over weeks, and less exact about individual stages than a clinical sleep study (polysomnography).',
      'That’s why your coach compares the watch with how you felt: both views are useful, and neither is “right” on its own.',
    ],
    tips: [],
    rules: [],
  },
];
