/**
 * Unit tests for ProductivityEngine (Day 3)
 * Run: npx jest --config jest.config.js --no-coverage
 */

import { scoreProductivity } from "@/lib/productivityEngine";
import { WeatherFeatures } from "@/types/weather";

function makeFeatures(overrides: Partial<WeatherFeatures> = {}): WeatherFeatures {
    return {
        temperature: 14,
        rainProbability: 10,
        humidity: 60,
        windSpeed: 10,
        daylightHours: 10,
        daylightMinutes: 600,
        peakRainProbability: 15,
        avgHourlyTemp: 13,
        conditionCategory: "cloudy",
        ...overrides,
    };
}

describe("scoreProductivity — focus score", () => {
    test("heavy rain drives focus score high", () => {
        const result = scoreProductivity(makeFeatures({ rainProbability: 80, peakRainProbability: 90 }));
        expect(result.focusScore).toBeGreaterThan(0.70);
    });

    test("clear, comfortable conditions give moderate focus", () => {
        const result = scoreProductivity(makeFeatures({ rainProbability: 0, peakRainProbability: 0, humidity: 45 }));
        expect(result.focusScore).toBeGreaterThanOrEqual(0.5);
        expect(result.focusScore).toBeLessThan(0.8);
    });

    test("high humidity suppresses focus score", () => {
        const base = scoreProductivity(makeFeatures({ humidity: 40 }));
        const muggy = scoreProductivity(makeFeatures({ humidity: 90 }));
        expect(muggy.focusScore).toBeLessThan(base.focusScore);
    });

    test("more daylight boosts focus score", () => {
        const short = scoreProductivity(makeFeatures({ daylightHours: 4, daylightMinutes: 240 }));
        const long = scoreProductivity(makeFeatures({ daylightHours: 14, daylightMinutes: 840 }));
        expect(long.focusScore).toBeGreaterThan(short.focusScore);
    });
});

describe("scoreProductivity — outdoor viability", () => {
    test("no rain and mild temp → high outdoor viability", () => {
        const result = scoreProductivity(makeFeatures({
            rainProbability: 0, peakRainProbability: 0,
            windSpeed: 5, temperature: 18,
        }));
        expect(result.outdoorViability).toBeGreaterThan(0.65);
    });

    test("heavy rain strongly reduces outdoor viability", () => {
        const result = scoreProductivity(makeFeatures({ rainProbability: 85, peakRainProbability: 90 }));
        expect(result.outdoorViability).toBeLessThan(0.40); // effective rain = max(85, 90*0.7=63) → heavy penalty
    });

    test("strong wind reduces outdoor viability", () => {
        const calm = scoreProductivity(makeFeatures({ windSpeed: 5 }));
        const windy = scoreProductivity(makeFeatures({ windSpeed: 50 }));
        expect(windy.outdoorViability).toBeLessThan(calm.outdoorViability);
    });

    test("extreme cold reduces outdoor viability", () => {
        const mild = scoreProductivity(makeFeatures({ temperature: 18 }));
        const freezing = scoreProductivity(makeFeatures({ temperature: -5 }));
        expect(freezing.outdoorViability).toBeLessThan(mild.outdoorViability);
    });

    test("extreme heat reduces outdoor viability", () => {
        const mild = scoreProductivity(makeFeatures({ temperature: 20 }));
        const hot = scoreProductivity(makeFeatures({ temperature: 38 }));
        expect(hot.outdoorViability).toBeLessThan(mild.outdoorViability);
    });
});

describe("scoreProductivity — signal labels", () => {
    test("rainy conditions → deep-focus signal", () => {
        const result = scoreProductivity(makeFeatures({ rainProbability: 80, peakRainProbability: 85 }));
        expect(result.signal).toBe("deep-focus");
    });

    test("clear, calm conditions → productive signal (not low-focus)", () => {
        const result = scoreProductivity(makeFeatures({
            rainProbability: 0, peakRainProbability: 0,
            windSpeed: 5, humidity: 40, temperature: 20,
        }));
        // With no rain/wind, any productive signal is correct — just not low-focus
        expect(result.signal).not.toBe("low-focus");
    });

    test("scores are always in [0, 1]", () => {
        const extremes = [
            makeFeatures({ rainProbability: 100, peakRainProbability: 100, windSpeed: 80, temperature: -20 }),
            makeFeatures({ rainProbability: 0, peakRainProbability: 0, windSpeed: 0, temperature: 50 }),
            makeFeatures({ humidity: 100, daylightHours: 0, daylightMinutes: 0 }),
        ];
        extremes.forEach((f) => {
            const r = scoreProductivity(f);
            expect(r.focusScore).toBeGreaterThanOrEqual(0);
            expect(r.focusScore).toBeLessThanOrEqual(1);
            expect(r.outdoorViability).toBeGreaterThanOrEqual(0);
            expect(r.outdoorViability).toBeLessThanOrEqual(1);
        });
    });

    test("reason string is non-empty", () => {
        const result = scoreProductivity(makeFeatures());
        expect(result.reason.length).toBeGreaterThan(10);
    });

    test("breakdown contains all expected keys", () => {
        const { breakdown } = scoreProductivity(makeFeatures());
        expect(breakdown).toHaveProperty("rainPenalty");
        expect(breakdown).toHaveProperty("humidityPenalty");
        expect(breakdown).toHaveProperty("windPenalty");
        expect(breakdown).toHaveProperty("daylightBonus");
        expect(breakdown).toHaveProperty("temperaturePenalty");
    });
});
