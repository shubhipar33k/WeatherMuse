# WeatherMuse

> **Weather optimised for productivity.**

WeatherMuse is a context-aware productivity engine that converts environmental signals into structured task recommendations. The system evolves from rule-based heuristics to personalized regression modeling trained on user feedback.

---

## What It Does

Instead of:
> *"Rainy, 6°C."*

WeatherMuse outputs:
> *"High indoor-focus probability. Schedule deep work. Postpone errands until 14:00–16:00 dry window."*

---

## Architecture

```
Weather API → Feature Extraction → Scoring Engine → Recommendation Layer → UI
                                         ↑
                               Phase 1: Rule-based
                               Phase 2: Weighted model
                               Phase 3: ML regression
                               Phase 4: Personalization
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Vanilla CSS — glassmorphism, pastel gradients |
| Weather API | Open-Meteo (free, no key required) |
| Intelligence | Rule-based → scikit-learn → personalized model |

---

## Incremental Build Roadmap

| Day | Feature | Status |
|---|---|---|
| 1 | Basic weather dashboard + dynamic gradients | ✅ |
| 2 | Feature extraction layer | ⬜ |
| 3 | Rule-based productivity engine | ⬜ |
| 4 | Task category suggestions | ⬜ |
| 5 | Dry window detection | ⬜ |
| 6 | Weighted scoring model | ⬜ |
| 7 | Historical logging | ⬜ |
| 8 | User energy feedback | ⬜ |
| 9 | ML regression model (scikit-learn) | ⬜ |
| 10 | ML-powered productivity engine | ⬜ |
| 11 | Fatigue detection | ⬜ |
| 12 | Context-aware scheduling suggestions | ⬜ |
| 13 | Architecture modularisation | ⬜ |
| 14 | Evaluation metrics + documentation | ⬜ |

---

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Grant location permission for local weather, or it defaults to London.

---

## Intelligence Design

```
Phase 1 → Deterministic rules        (Days 1–5)
Phase 2 → Weighted heuristic model   (Days 6–8)
Phase 3 → LinearRegression (sklearn) (Days 9–10)
Phase 4 → Personalised model         (Days 11–14)
```
