# WeatherMuse

> **Weather optimised for productivity.**

WeatherMuse is a context-aware productivity intelligence system that transforms live weather signals into a fully structured workday — task suggestions, a time-block schedule, smart alerts, and a personal baseline comparison, all generated automatically from your local forecast.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-102%20passing-brightgreen)](#testing)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## What It Does

Instead of:
> *"Rainy, 6°C."*

WeatherMuse outputs:
> *"🎯 Deep Focus Day — 80% confidence. Schedule 90-min deep-work blocks from 09:00. Rain clears at 14:00 — good window for errands. ↑ 12% above your 7-day average."*

**Live inputs:**  geolocation → Open-Meteo hourly forecast  
**Live outputs:** productivity signal · confidence band · task cards · time-block schedule · weather alerts · personal baseline delta

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         WeatherMuse Pipeline                        │
│                                                                     │
│  Open-Meteo API                                                     │
│       │                                                             │
│       ▼                                                             │
│  FeatureExtractor ──► WeatherFeatures                               │
│       │               (temp, rain%, humidity, wind, daylight…)      │
│       │                                                             │
│       ▼                                                             │
│  ScoringModel  ──────► WeightedScores + Confidence Band            │
│  (Day 6)               (named weight vectors, ambiguity detection)  │
│       │                                                             │
│       ▼                                                             │
│  ProductivityEngine ──► ProductivityScore                           │
│  (Days 3+6)             (focusScore, outdoorViability,              │
│                          signal, reason, breakdown,                 │
│                          confidence, ±uncertainty)                  │
│       │                                                             │
│       ├──► RecommendationEngine ──► RecommendationResult            │
│       │    (Day 4)                  (12 task categories, ranked)    │
│       │                                                             │
│       ├──► TimeBlockEngine ──────► DailySchedule                   │
│       │    (Day 5)                 (09:00–18:00 time blocks,        │
│       │                            adaptive duration per signal)    │
│       │                                                             │
│       ├──► HistoryStore ─────────► DailySnapshot[]                 │
│       │    (Day 7)                 (localStorage, 30-day cap)       │
│       │         │                                                   │
│       │         ▼                                                   │
│       │    BaselineEngine ────────► BaselineResult                  │
│       │    (Day 7)                  (7-day rolling avg, Δ%, trend)  │
│       │                                                             │
│       └──► AlertEngine ──────────► AlertResult                     │
│            (Day 8)                 (7 detectors, severity-ranked)   │
│                                                                     │
│  Dashboard UI  ◄──── All results rendered in React                 │
│  (Days 1,9)          with glassmorphism, staggered animations,      │
│                       sticky alert banner, shimmer skeleton          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 10-Day Build Log

| Day | Feature | Module | Commit |
|-----|---------|--------|--------|
| 1 | Weather dashboard, dynamic temperature gradients, hourly strip | `WeatherCard`, `HourlyForecast`, `gradient.ts` | `feat: basic weather dashboard` |
| 2 | Structured feature extraction from raw forecast data | `featureExtractor.ts` | `feat: structured weather feature extraction` |
| 3 | Rule-based productivity scoring engine, signal labels | `productivityEngine.ts` | `feat: initial rule-based productivity scoring engine` |
| 4 | Task category suggestion engine (12 categories) | `recommendationEngine.ts`, `RecommendationPanel` | `feat: productivity-based task recommendation layer` |
| 5 | Weather-adaptive time-block schedule generator | `timeBlockEngine.ts`, `SchedulePanel` | `feat: weather-adaptive time-block schedule generator` |
| 6 | Weighted scoring model + confidence bands + ±uncertainty | `scoringModel.ts` | `feat: confidence scoring and weighted productivity model` |
| 7 | localStorage history store + 7-day rolling baseline | `historyStore.ts`, `baselineEngine.ts`, `BaselinePanel` | `feat: historical baseline and relative productivity scoring` |
| 8 | Smart weather alerts with 7 detectors | `alertEngine.ts`, `AlertPanel` | `feat: smart weather alerts and notification engine` |
| 9 | UI polish: shimmer skeleton, sticky alert banner, staggered animations | `LoadingSkeleton`, `StickyAlertBanner`, `useReveal` | `feat: UI polish and micro-animations pass` |
| 10 | Portfolio-quality README, project documentation | `README.md` | `docs: final README and project wrap-up` |

---

## Module Guide

### Core Library (`src/lib/`)

| File | Purpose |
|------|---------|
| `featureExtractor.ts` | Converts raw `WeatherData` → structured `WeatherFeatures` (rain%, humidity, daylight hours, avg temp, condition category) |
| `productivityEngine.ts` | Maps `WeatherFeatures` → `ProductivityScore` (focusScore, outdoorViability, signal, confidence, uncertainty) |
| `scoringModel.ts` | Named weight vectors for focus and outdoor scoring; ambiguity-based confidence computation across 4 signal dimensions |
| `recommendationEngine.ts` | Maps `ProductivityScore` → 12 prioritised `TaskCategory` objects with time hints and scheduling headline |
| `timeBlockEngine.ts` | Generates a full 09:00–18:00 `DailySchedule` with adaptive block durations, auto-breaks, and signal-specific reordering |
| `historyStore.ts` | SSR-safe localStorage adapter — upserts daily `DailySnapshot`, caps at 30 days |
| `baselineEngine.ts` | Computes 7-day rolling averages, absolute Δ and %Δ vs baseline, trend labels, and human-readable summary |
| `alertEngine.ts` | Seven weather shift detectors (rain onset/ending, wind surge, temp drop/spike, clear window, storm); severity-ranked `AlertResult` |
| `gradient.ts` | Temperature → HSL gradient + accent colour mapping used across the whole UI |
| `weather.ts` | Open-Meteo API fetch + Nominatim reverse geocoding |

### UI Components (`src/components/`)

| Component | Renders |
|-----------|---------|
| `WeatherCard` | Hero temperature, condition emoji, feels-like, stats grid (humidity, wind, rain) |
| `HourlyForecast` | Horizontally scrollable hourly strip |
| `AlertPanel` | Severity-coded cards (red/amber/blue); hidden when no alerts; danger panels pulse |
| `BaselinePanel` | 7-day average vs today delta bars with trend arrows (↑↓→) |
| `SchedulePanel` | Proportional day progress bar + vertical timeline with dot-and-line connectors |
| `RecommendationPanel` | Task card grid with priority highlighting and type pills (indoor/outdoor/flexible) |
| `ProductivityPanel` | Signal icon, animated score gauges, confidence badge, ±uncertainty, scoring breakdown |
| `FeaturePanel` | Full weather feature table with visual indicators |
| `StickyAlertBanner` | Fixed banner (slides in after 200px scroll) when warning/danger alerts exist |
| `LoadingSkeleton` | Shimmer skeleton matching real content shapes during data fetch |
| `WeatherDashboard` | Root orchestrator — fetches all data, runs pipeline, renders all panels |

### Hooks (`src/hooks/`)

| Hook | Purpose |
|------|---------|
| `useReveal` | Intersection Observer; fires once when element enters viewport for scroll-triggered animations |

---

## Scoring Model (Day 6)

The engine uses named weight vectors instead of ad-hoc constants:

```
focusScore = 0.48                          // base
           + rainProbability  × 0.32       // rain → stay inside → focus ↑
           + daylightHours    × 0.22       // light → energy ↑
           - humidity         × 0.14       // muggy → sluggish
           - temperatureExtreme × 0.09     // extremes → distraction

outdoorViability = 0.78
                 - rainProbability  × 0.52
                 - windSpeed        × 0.18
                 - temperatureExtreme × 0.18
                 + daylightHours    × 0.09
```

**Confidence** is computed from signal ambiguity across 4 dimensions:

| Ambiguous range | Weight |
|---|---|
| Rain 25–55% | 35% |
| Wind 15–35 km/h | 20% |
| Humidity 55–75% | 20% |
| Temp ±3°C of comfort boundaries (12°C/22°C) | 25% |

`confidence = 1 − Σ(ambiguity × weight)` → `"high" ≥0.75 / "medium" ≥0.45 / "low"`

---

## Alert Detectors (Day 8)

Seven independent detectors scan the next 12 hours of forecast:

| Detector | Trigger | Severity |
|---|---|---|
| 🌧 Rain onset | precipitation ≥ 40% | info |
| 🌧 Heavy rain | precipitation ≥ 70% | **warning** |
| 🌤 Rain ending | drops after rain | info |
| 💨 Strong wind | ≥ 30 km/h | **warning** |
| 💨 Dangerous wind | ≥ 50 km/h | 🔴 danger |
| 🌡 Temp drop | ≥ 5°C in 3h | **warning** |
| ☀ Temp spike | ≥ 6°C in 3h | info |
| 🌿 Clear window | ≥ 2h dry + calm | info |
| ⛈ Storm | WMO code ≥ 80 | 🔴 danger |

Alerts are deduplicated by type and sorted: danger → warning → info → earliest.

---

## Time-Block Engine (Day 5)

Block durations adapt to the productivity signal:

| Signal | Block length | Strategy |
|---|---|---|
| 🎯 Deep Focus | 90 min | Longest blocks, cognitive tasks first |
| 📖 Moderate Focus | 60 min | Structured blocks, mixed content |
| 🌿 Outdoor Optimal | 50 min | Outdoor tasks placed first |
| ⚖️ Mixed | 50 min | Interleaved indoor/outdoor |
| 🌫️ Low Focus | 40 min | Short blocks, rest/flexibility leads |

15-min breaks are auto-inserted between work blocks; a 45-min lunch break is placed at 12:00.

---

## Testing

```
✓ alertEngine          19 tests
✓ baselineEngine       18 tests
✓ scoringModel         20 tests
✓ timeBlockEngine      16 tests
✓ recommendationEngine 15 tests
✓ productivityEngine   14 tests
✓ featureExtractor     18 tests (originally 14)
──────────────────────────────
102 passed, 0 failed  (< 0.5s)
```

Run tests:

```bash
npx jest --config jest.config.js --no-coverage
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Vanilla CSS — glassmorphism, pastel gradients, CSS custom properties |
| Weather API | [Open-Meteo](https://open-meteo.com/) (free, no key required) |
| Geocoding | [Nominatim](https://nominatim.org/) (free, no key required) |
| Persistence | Browser `localStorage` (no backend needed) |
| Testing | Jest + ts-jest |
| Fonts | Inter (Google Fonts) |

---

## Run Locally

```bash
git clone https://github.com/shubhipar33k/WeatherMuse.git
cd WeatherMuse
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).  
Grant location permission when prompted — or it defaults to London.  
No API keys required.

---

## Design System

The UI uses a consistent glassmorphism design language:

- **Glass panels** — `rgba(255,255,255,0.07)` background + `backdrop-filter: blur(20px)`
- **Accent colour** — derived dynamically from temperature (cold = blue-purple, warm = amber-red)
- **Ambient orbs** — two blurred circles floating behind the content with `orbFloat` keyframes
- **Card entrance** — `cardIn` keyframe (translateY + scale + blur) with staggered `nth-child` delays (0–0.42s)
- **Gauge fills** — animate from 0 width on mount via `gaugeGrow` keyframe
- **Sticky banner** — slides down from `translateY(-100%)` after 200px scroll; disappears when scrolled back up

---

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Design system, all component styles (~1965 lines)
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AlertPanel.tsx
│   ├── BaselinePanel.tsx
│   ├── FeaturePanel.tsx
│   ├── HourlyForecast.tsx
│   ├── LoadingSkeleton.tsx
│   ├── ProductivityPanel.tsx
│   ├── RecommendationPanel.tsx
│   ├── SchedulePanel.tsx
│   ├── StickyAlertBanner.tsx
│   ├── WeatherCard.tsx
│   └── WeatherDashboard.tsx
├── hooks/
│   └── useReveal.ts
├── lib/
│   ├── __tests__/
│   │   ├── alertEngine.test.ts
│   │   ├── baselineEngine.test.ts
│   │   ├── featureExtractor.test.ts
│   │   ├── productivityEngine.test.ts
│   │   ├── recommendationEngine.test.ts
│   │   ├── scoringModel.test.ts
│   │   └── timeBlockEngine.test.ts
│   ├── alertEngine.ts
│   ├── baselineEngine.ts
│   ├── featureExtractor.ts
│   ├── gradient.ts
│   ├── historyStore.ts
│   ├── productivityEngine.ts
│   ├── recommendationEngine.ts
│   ├── scoringModel.ts
│   ├── timeBlockEngine.ts
│   └── weather.ts
└── types/
    └── weather.ts
```

---

## Roadmap

Future ideas beyond the 10-day build:

- **User energy feedback slider** — collect subjective productivity ratings to personalise the model
- **ML regression layer** — train a `LinearRegression` on `(weather features, user rating)` pairs to replace the heuristic weights
- **Push notifications** — browser Notification API for alert delivery
- **Calendar integration** — overlay time blocks onto Google Calendar
- **Multi-day outlook** — extend pipeline to 7-day horizon

---

*Built in 10 incremental days. Each day's work was committed, tested, and documented before moving to the next.*
