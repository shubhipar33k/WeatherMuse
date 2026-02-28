/**
 * Unit tests for ScoringModel (Day 6)
 * Run: npx jest --config jest.config.js --no-coverage
 */

import { computeWeightedScores } from "@/lib/scoringModel";
import { WeatherFeatures } from "@/types/weather";

function makeFeatures(overrides: Partial<WeatherFeatures> = {}): WeatherFeatures {
    return {
        temperature: 14,
        rainProbability: 10,
        humidity: 55,
        windSpeed: 10,
        daylightHours: 10,
        daylightMinutes: 600,
        peakRainProbability: 15,
        avgHourlyTemp: 13,
        conditionCategory: "cloudy",
        ...overrides,
    };
}

describe("computeWeightedScores — output shape", () => {
    test("returns all required fields", () => {
        const result = computeWeightedScores(makeFeatures());
        expect(typeof result.focusScore).toBe("number");
        expect(typeof result.outdoorViability).toBe("number");
        expect(typeof result.confidence).toBe("number");
        expect(["high", "medium", "low"]).toContain(result.confidenceBand);
        expect(typeof result.focusUncertainty).toBe("number");
        expect(typeof result.outdoorUncertainty).toBe("number");
    });

    test("all numeric outputs are in [0, 1]", () => {
        const extremes = [
            makeFeatures({ rainProbability: 100, windSpeed: 80, temperature: -20, humidity: 100 }),
            makeFeatures({ rainProbability: 0, windSpeed: 0, temperature: 50, humidity: 10 }),
            makeFeatures({ rainProbability: 40, windSpeed: 25, temperature: 17, humidity: 65 }),
        ];
        extremes.forEach((f) => {
            const r = computeWeightedScores(f);
            [r.focusScore, r.outdoorViability, r.confidence, r.focusUncertainty, r.outdoorUncertainty].forEach((v) => {
                expect(v).toBeGreaterThanOrEqual(0);
                expect(v).toBeLessThanOrEqual(1);
            });
        });
    });
});

describe("computeWeightedScores — focus score", () => {
    test("heavy rain raises focusScore (indoor conditions better)", () => {
        const dry = computeWeightedScores(makeFeatures({ rainProbability: 0, peakRainProbability: 0 }));
        const rainy = computeWeightedScores(makeFeatures({ rainProbability: 80, peakRainProbability: 90 }));
        expect(rainy.focusScore).toBeGreaterThan(dry.focusScore);
    });

    test("more daylight raises focusScore", () => {
        const short = computeWeightedScores(makeFeatures({ daylightHours: 4, daylightMinutes: 240 }));
        const long = computeWeightedScores(makeFeatures({ daylightHours: 14, daylightMinutes: 840 }));
        expect(long.focusScore).toBeGreaterThan(short.focusScore);
    });

    test("high humidity lowers focusScore", () => {
        const dry = computeWeightedScores(makeFeatures({ humidity: 30 }));
        const muggy = computeWeightedScores(makeFeatures({ humidity: 90 }));
        expect(muggy.focusScore).toBeLessThan(dry.focusScore);
    });
});

describe("computeWeightedScores — outdoor viability", () => {
    test("heavy rain heavily reduces outdoorViability", () => {
        const dry = computeWeightedScores(makeFeatures({ rainProbability: 0, peakRainProbability: 0 }));
        const rainy = computeWeightedScores(makeFeatures({ rainProbability: 85, peakRainProbability: 90 }));
        expect(rainy.outdoorViability).toBeLessThan(dry.outdoorViability);
    });

    test("high wind reduces outdoorViability", () => {
        const calm = computeWeightedScores(makeFeatures({ windSpeed: 5 }));
        const windy = computeWeightedScores(makeFeatures({ windSpeed: 60 }));
        expect(windy.outdoorViability).toBeLessThan(calm.outdoorViability);
    });

    test("extreme cold reduces outdoorViability", () => {
        const mild = computeWeightedScores(makeFeatures({ temperature: 18 }));
        const freezing = computeWeightedScores(makeFeatures({ temperature: -10 }));
        expect(freezing.outdoorViability).toBeLessThan(mild.outdoorViability);
    });
});

describe("computeWeightedScores — confidence", () => {
    test("clear definitive conditions yield high confidence", () => {
        // Very rainy, calm, not humid → unambiguous signal
        const result = computeWeightedScores(makeFeatures({
            rainProbability: 90, peakRainProbability: 95,
            windSpeed: 5, humidity: 40, temperature: 18,
        }));
        expect(result.confidence).toBeGreaterThan(0.6);
        expect(["high", "medium"]).toContain(result.confidenceBand);
    });

    test("ambiguous mid-range rain lowers confidence", () => {
        const clear = computeWeightedScores(makeFeatures({ rainProbability: 0, peakRainProbability: 0 }));
        const ambig = computeWeightedScores(makeFeatures({ rainProbability: 40, peakRainProbability: 45 }));
        expect(ambig.confidence).toBeLessThan(clear.confidence);
    });

    test("confidenceBand is high when confidence >= 0.75", () => {
        const result = computeWeightedScores(makeFeatures({
            rainProbability: 0, peakRainProbability: 0, windSpeed: 5, humidity: 40, temperature: 20,
        }));
        // Should be unambiguous → high confidence
        expect(result.confidence).toBeGreaterThanOrEqual(0.75);
        expect(result.confidenceBand).toBe("high");
    });

    test("uncertainty radius is higher when confidence is lower", () => {
        const clear = computeWeightedScores(makeFeatures({ rainProbability: 0, peakRainProbability: 0 }));
        const ambig = computeWeightedScores(makeFeatures({ rainProbability: 38, peakRainProbability: 40 }));
        expect(ambig.focusUncertainty).toBeGreaterThanOrEqual(clear.focusUncertainty);
    });
});

describe("computeWeightedScores — weighted breakdown", () => {
    test("all breakdown keys are present", () => {
        const { weightedBreakdown: b } = computeWeightedScores(makeFeatures());
        expect(b).toHaveProperty("rainIndoorBoost");
        expect(b).toHaveProperty("daylightFocusBoost");
        expect(b).toHaveProperty("comfortBoost");
        expect(b).toHaveProperty("humidityDrag");
        expect(b).toHaveProperty("tempExtremeDrag");
        expect(b).toHaveProperty("windOutdoorDrag");
        expect(b).toHaveProperty("rainOutdoorDrag");
    });

    test("all breakdown values are non-negative", () => {
        const { weightedBreakdown: b } = computeWeightedScores(makeFeatures({ rainProbability: 80, windSpeed: 50 }));
        Object.values(b).forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
    });
});
