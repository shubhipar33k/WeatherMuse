/**
 * Unit tests for BaselineEngine (Day 7)
 * Run: npx jest --config jest.config.js --no-coverage
 */

import { computeBaseline } from "@/lib/baselineEngine";
import { DailySnapshot } from "@/lib/historyStore";
import { ProductivityScore } from "@/lib/productivityEngine";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeScore(focus: number, outdoor: number): ProductivityScore {
    return {
        focusScore: focus,
        outdoorViability: outdoor,
        signal: "moderate-focus",
        reason: "test",
        confidence: 0.8,
        confidenceBand: "high",
        focusUncertainty: 0.02,
        outdoorUncertainty: 0.02,
        breakdown: {
            rainPenalty: 0.1, humidityPenalty: 0.1, windPenalty: 0,
            daylightBonus: 0.8, temperaturePenalty: 0,
        },
    };
}

function makeSnapshot(date: string, focus: number, outdoor: number): DailySnapshot {
    return {
        date,
        features: { temperature: 15, rainProbability: 10, humidity: 55, windSpeed: 8, daylightHours: 10 },
        scores: { focusScore: focus, outdoorViability: outdoor, confidence: 0.8 },
    };
}

/** Build N snapshots going back N days from 2024-03-01 */
function makeHistory(n: number, focus = 0.65, outdoor = 0.70): DailySnapshot[] {
    return Array.from({ length: n }, (_, i) => {
        const d = new Date("2024-02-29");
        d.setDate(d.getDate() - i);
        return makeSnapshot(d.toISOString().slice(0, 10), focus, outdoor);
    });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("computeBaseline — insufficient data", () => {
    test("insufficientData is true when fewer than 3 past days", () => {
        const result = computeBaseline(makeScore(0.7, 0.8), makeHistory(2));
        expect(result.insufficientData).toBe(true);
    });

    test("insufficientData is false with 3 or more days", () => {
        const result = computeBaseline(makeScore(0.7, 0.8), makeHistory(3));
        expect(result.insufficientData).toBe(false);
    });

    test("summary mentions days recorded when insufficient", () => {
        const result = computeBaseline(makeScore(0.7, 0.8), makeHistory(1));
        expect(result.summary.toLowerCase()).toContain("1 day");
    });

    test("empty history produces insufficientData=true", () => {
        const result = computeBaseline(makeScore(0.7, 0.8), []);
        expect(result.insufficientData).toBe(true);
        expect(result.daysUsed).toBe(0);
    });
});

describe("computeBaseline — delta computation", () => {
    test("positive focusDelta when today is above baseline", () => {
        // baseline = 0.60, today = 0.75
        const result = computeBaseline(makeScore(0.75, 0.70), makeHistory(5, 0.60, 0.70));
        expect(result.focusDelta).toBeGreaterThan(0);
    });

    test("negative focusDelta when today is below baseline", () => {
        // baseline = 0.80, today = 0.60
        const result = computeBaseline(makeScore(0.60, 0.70), makeHistory(5, 0.80, 0.70));
        expect(result.focusDelta).toBeLessThan(0);
    });

    test("focusDeltaPct reflects percentage change correctly", () => {
        // baseline avg = 0.50, today = 0.60 → Δ = +0.10 → +20.0%
        const result = computeBaseline(makeScore(0.60, 0.70), makeHistory(5, 0.50, 0.70));
        expect(result.focusDeltaPct).toBeCloseTo(20.0, 0);
    });

    test("avgFocus equals the mean of the supplied snapshots", () => {
        const history = [
            makeSnapshot("2024-02-28", 0.60, 0.70),
            makeSnapshot("2024-02-27", 0.80, 0.70),
            makeSnapshot("2024-02-26", 0.70, 0.70),
        ];
        const result = computeBaseline(makeScore(0.70, 0.70), history);
        expect(result.avgFocus).toBeCloseTo(0.70, 2);
    });
});

describe("computeBaseline — trend labels", () => {
    test("focusTrend is 'up' when today is >3 pp above baseline", () => {
        const result = computeBaseline(makeScore(0.80, 0.70), makeHistory(5, 0.70, 0.70));
        expect(result.focusTrend).toBe("up");
    });

    test("focusTrend is 'down' when today is >3 pp below baseline", () => {
        const result = computeBaseline(makeScore(0.60, 0.70), makeHistory(5, 0.70, 0.70));
        expect(result.focusTrend).toBe("down");
    });

    test("focusTrend is 'stable' within ±3 pp", () => {
        // baseline 0.70, today 0.71 → Δ = 0.01 < 0.03
        const result = computeBaseline(makeScore(0.71, 0.70), makeHistory(5, 0.70, 0.70));
        expect(result.focusTrend).toBe("stable");
    });

    test("trends are 'stable' when insufficient data", () => {
        const result = computeBaseline(makeScore(0.90, 0.90), makeHistory(1, 0.20, 0.20));
        expect(result.focusTrend).toBe("stable");
        expect(result.outdoorTrend).toBe("stable");
    });
});

describe("computeBaseline — summary string", () => {
    test("summary is a non-empty string", () => {
        const result = computeBaseline(makeScore(0.70, 0.70), makeHistory(5));
        expect(result.summary.length).toBeGreaterThan(10);
    });

    test("summary mentions 'better' when both trends are up", () => {
        const result = computeBaseline(makeScore(0.85, 0.90), makeHistory(5, 0.60, 0.60));
        expect(result.summary.toLowerCase()).toContain("better");
    });

    test("summary mentions 'below' when focus is down", () => {
        const result = computeBaseline(makeScore(0.50, 0.60), makeHistory(5, 0.75, 0.70));
        expect(result.summary.toLowerCase()).toContain("below");
    });
});

describe("computeBaseline — caps at 7 recent days", () => {
    test("daysUsed is capped at 7 even with 15 snapshots", () => {
        const result = computeBaseline(makeScore(0.70, 0.70), makeHistory(15));
        expect(result.daysUsed).toBe(7);
    });
});
