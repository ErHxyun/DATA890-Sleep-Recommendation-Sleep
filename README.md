# Sleep by Science — Web Interface

Front-end prototype for the DATA 890 project: an evidence-based sleep coaching app that combines
Apple Watch data with a self-reported sleep journal.

Built with [Expo](https://expo.dev) (React Native + TypeScript), so it runs on the web for demos
and can be built for iPhone without a Mac using EAS Build.

> All data in this prototype is mock data. Nothing is read from HealthKit yet.

## Run it

```bash
npm install
npm run web
```

Then open http://localhost:8081. In the browser's dev tools, switch to a phone-sized viewport
for the intended layout.

To try it on an iPhone, install **Expo Go**, run `npx expo start`, and scan the QR code
(phone and computer on the same Wi-Fi).

Before committing, run:

```bash
npx tsc --noEmit
npx expo lint
```

## Screens

| Tab | What it does |
|---|---|
| **Today** | Morning check-in first, then last night's sleep (rings, timeline), a "You vs. your watch" comparison, today's recommendation with its evidence, and overnight vitals with expandable 14-night trends and plain-language interpretation. |
| **Journal** | Morning and evening check-ins adapted from the NSF sleep diary, one question per page. Answers are never pre-filled from the watch, so self-reports stay independent for alignment. |
| **Insights** | 1/2/4-week view: nightly self-report vs. watch, agreement per measure, and habit × sleep comparisons. |
| **Coach**, **Learn** | Placeholders listing planned content. |

Light (cream) is the default theme; the button at the top right of each tab switches to dark.

## Project layout

```
src/
  app/                 Routes (Expo Router)
    (tabs)/            Today, Journal, Insights, Coach, Learn
    check-in/[kind]    Morning / evening check-in flow
  components/          UI building blocks and charts
  constants/theme.ts   Colors, fonts, spacing
  data/
    types.ts               Data shapes, named after the HealthKit types they mirror
    mock.ts, history.ts    Mock last night and 4 weeks of mock nights
    journal-questions.ts   Check-in questions (content — edit here to change the journal)
    alignment.ts           Self-report vs. watch comparison and tolerances
    insights.ts            Trends, agreement and habit patterns
    interpretation.ts      "What this means" text for vitals
  hooks/               Theme hooks
```

## Content that needs clinical review

Text marked **Pending clinical review** in the app is placeholder wording:

- `src/data/journal-questions.ts` — check-in questions and answer options
- `src/data/alignment.ts` — what counts as "matching" the watch
- `src/data/interpretation.ts` — vitals background, caveats and when to see a clinician
- `src/data/mock.ts` — the sample recommendation and its evidence
