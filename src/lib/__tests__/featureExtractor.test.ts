/**
 * Unit tests for WeatherFeatureExtractor
 *
 * Run with: npx jest (or npx ts-node --esm to run inline)
 * These use Jest globals — install with: npm install --save-dev jest @types/jest ts-jest
 */

import {
    computeDaylightMinutes,
    mapConditionCategory,
    extractWeatherFeatures,
} from "@/lib/featureExtractor";
import { WeatherData } from "@/types/weather";

// ── Test helpers ─────────────────────────────────────────────────────────────

function makeWeatherData(overrides: Partial<WeatherData> = {}): WeatherData {
    return {
        temperature: 14,
        feelsLike: 12,
        conditionCode: 3,
        humidity: 75,
        windSpeed: 15,
        precipitationProbability: 30,
        city: "London",
        latitude: 51.5,
        longitude: -0.12,
        sunrise: "07:00",
        sunset: "17:00",
        isDay: true,
        hourlyForecast: [
            { time: "16:00", temperature: 13, conditionCode: 3, precipitationProbability: 20, windSpeed: 12 },
            { time: "17:00", temperature: 12, conditionCode: 61, precipitationProbability: 55, windSpeed: 14 },
            { time: "18:00", temperature: 11, conditionCode: 61, precipitationProbability: 70, windSpeed: 16 },
        ],
        ...overrides,
    };
}

// ── computeDaylightMinutes ────────────────────────────────────────────────────

describe("computeDaylightMinutes", () => {
    test("computes correct minutes for standard sunrise/sunset", () => {
        expect(computeDaylightMinutes("07:00", "17:00")).toBe(600); // 10 h
    });

    test("handles fractional minutes", () => {
        expect(computeDaylightMinutes("06:30", "19:30")).toBe(780); // 13 h
    });

    test("returns sensible default when both are 00:00", () => {
        // 00:00 and 00:00 both parse to 0h → riseHours === 0 && setHours === 0 → triggers default of 480
        expect(computeDaylightMinutes("00:00", "00:00")).toBe(480);
    });

    test("returns default 480 when input is empty / malformed", () => {
        expect(computeDaylightMinutes("--", "--")).toBe(480);
    });

    test("clamps to 1080 minutes maximum", () => {
        // 00:00 → 23:59 = ~1439 min → clamped to 1080
        expect(computeDaylightMinutes("00:00", "23:59")).toBe(1080);
    });
});

// ── mapConditionCategory ──────────────────────────────────────────────────────

describe("mapConditionCategory", () => {
    test("codes 0–2 → clear", () => {
        [0, 1, 2].forEach((code) => {
            expect(mapConditionCategory(code)).toBe("clear");
        });
    });

    test("codes 3–48 → cloudy (overcast / fog)", () => {
        [3, 45, 48].forEach((code) => {
            expect(mapConditionCategory(code)).toBe("cloudy");
        });
    });

    test("codes 51–67 → precipitation (drizzle / rain)", () => {
        [51, 61, 63, 65].forEach((code) => {
            expect(mapConditionCategory(code)).toBe("precipitation");
        });
    });

    test("codes 71–77 → snow", () => {
        [71, 73, 75, 77].forEach((code) => {
            expect(mapConditionCategory(code)).toBe("snow");
        });
    });

    test("codes 95–99 → storm", () => {
        [95, 96, 99].forEach((code) => {
            expect(mapConditionCategory(code)).toBe("storm");
        });
    });

    test("unknown code → cloudy (safe default)", () => {
        expect(mapConditionCategory(999)).toBe("cloudy");
    });
});

// ── extractWeatherFeatures ────────────────────────────────────────────────────

describe("extractWeatherFeatures", () => {
    test("primary features are passed through correctly", () => {
        const data = makeWeatherData();
        const { features } = extractWeatherFeatures(data);

        expect(features.temperature).toBe(14);
        expect(features.humidity).toBe(75);
        expect(features.windSpeed).toBe(15);
        expect(features.rainProbability).toBe(30);
    });

    test("daylightHours and daylightMinutes are correctly computed", () => {
        const data = makeWeatherData({ sunrise: "07:00", sunset: "17:00" });
        const { features } = extractWeatherFeatures(data);

        expect(features.daylightMinutes).toBe(600);
        expect(features.daylightHours).toBe(10);
    });

    test("peakRainProbability is max of hourly window", () => {
        const data = makeWeatherData();
        const { features } = extractWeatherFeatures(data);

        // hourly values: 20, 55, 70 → peak = 70
        expect(features.peakRainProbability).toBe(70);
    });

    test("avgHourlyTemp is mean of hourly window temps", () => {
        const data = makeWeatherData();
        const { features } = extractWeatherFeatures(data);

        // (13 + 12 + 11) / 3 = 12
        expect(features.avgHourlyTemp).toBe(12);
    });

    test("conditionCategory maps correctly from conditionCode", () => {
        const clearData = makeWeatherData({ conditionCode: 0 });
        expect(extractWeatherFeatures(clearData).features.conditionCategory).toBe("clear");

        const rainData = makeWeatherData({ conditionCode: 61 });
        expect(extractWeatherFeatures(rainData).features.conditionCategory).toBe("precipitation");
    });

    test("meta contains correct city and timestamp", () => {
        const data = makeWeatherData({ city: "Amsterdam" });
        const { meta } = extractWeatherFeatures(data);

        expect(meta.sourceCity).toBe("Amsterdam");
        expect(meta.hoursAnalysed).toBe(3);
        expect(new Date(meta.extractedAt).getFullYear()).toBeGreaterThan(2020);
    });

    test("handles empty hourly forecast gracefully", () => {
        const data = makeWeatherData({ hourlyForecast: [] });
        const { features } = extractWeatherFeatures(data);

        expect(features.peakRainProbability).toBe(30); // falls back to current
        expect(features.avgHourlyTemp).toBe(14);        // falls back to current
    });
});
