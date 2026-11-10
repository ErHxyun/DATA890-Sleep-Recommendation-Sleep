# Sleep by Science — Web Interface

Front-end prototype for the DATA 890 project: an evidence-based sleep coaching app that combines
Apple Watch data with a self-reported sleep journal.

Built with [Expo](https://expo.dev) (React Native + TypeScript), so it runs on the web for demos
and can be built for iPhone without a Mac using EAS Build.

> Nothing is read from HealthKit yet. The app runs on a demo user built from two public
> datasets (see [Demo data](#demo-data)).

## Run it

```bash
npm install
npm run web
```

Then open http://localhost:8081. In the browser's dev tools, switch to a phone-sized viewport
for the intended layout.

To try it on an iPhone, install **Expo Go**, run `npx expo start`, and scan the QR code
(phone and computer on the same Wi-Fi).

**Live demo:** https://erhxyun.github.io/DATA890-Sleep-Recommendation-Sleep/ — rebuilt and
redeployed automatically on every push to `Xiyun-Web-Interface`
(`.github/workflows/deploy-web.yml`, published to the `gh-pages` branch). To build the same
static site locally, run `npm run build:web` (output in `dist/`).

Before committing, run:

```bash
npx tsc --noEmit
npx expo lint
```

## Screens

| Tab | What it does |
|---|---|
| **Today** | Morning check-in first, then last night's sleep (rings, timeline), a "You vs. your watch" comparison, today's recommendation (computed from the user's nights) with its evidence, and overnight vitals with expandable 14-night trends and plain-language interpretation. |
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
    demo.ts, demo/         Demo user (generated JSON) and which dataset each field came from
    history.ts             The nights the app works with: demo nights + today's check-in
    recommend.ts           Rules that pick today's focus (first version of the rule engine)
    journal-questions.ts   Check-in questions (content — edit here to change the journal)
    alignment.ts           Self-report vs. watch comparison and tolerances
    insights.ts            Trends, agreement and habit patterns
    interpretation.ts      "What this means" text for vitals
  hooks/               Theme hooks
pipeline/
  build_demo_user.py   Builds src/data/demo/demo-user.json from the public datasets
knowledge-graph/       Clinical knowledge map as tables (nodes, edges, recommendations)
```

## Demo data

The demo user is a composite of real nights from two public datasets, re-dated to the last 28 days:

| Fields | Dataset | License |
|---|---|---|
| Sleep stages and timing, resting heart rate, morning self-report, evening habits (alcohol, exercise) | PMData, participant p06 (Thambawita et al., ACM MMSys 2020) | CC BY-NC 4.0 |
| Overnight HRV (RMSSD), breathing rate, skin temperature | LifeSnaps (Yfantidou et al., Scientific Data 2022) | CC BY 4.0 |

Because the two parts come from different people, the app never links a habit to a measure from
the other dataset (see `sameParticipant` in `src/data/demo.ts`).

To rebuild the JSON, download the datasets, extract them into a folder with `pmdata/` and
`lifesnaps/` subfolders (kept outside this repo), and run:

```bash
python pipeline/build_demo_user.py <path-to-datasets>
```

## Content that needs clinical review

Text marked **Pending clinical review** in the app is placeholder wording:

- `src/data/journal-questions.ts` — check-in questions and answer options
- `src/data/alignment.ts` — what counts as "matching" the watch
- `src/data/interpretation.ts` — vitals background, caveats and when to see a clinician
- `src/data/recommend.ts` — recommendation rules, thresholds and their evidence
- `knowledge-graph/` — suggested relations and triggers in the knowledge map tables
