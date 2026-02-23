/**
 * WeatherFeatureExtractor
 *
 * Day 2 of WeatherMuse.
 *
 * Responsibility: Convert raw WeatherData from the API layer into a clean,
 * normalised WeatherFeatures object ready for the scoring engine.
 *
 * Designed to be easily replaced or augmented — the ProductivityEngine
 * (Day 3+) depends only on WeatherFeatures, not on raw API shapes.
 */

import { WeatherData, WeatherFeatures, ExtractionMeta, ConditionCategory } from "@/types/weather";

// ── Constants ────────────────────────────────────────────────────────────────

/** Number of future hours to analyse for derived signals */
const ANALYSIS_WINDOW_HOURS = 12;

/**
 * WMO code ranges → ConditionCategory
 * https://open-meteo.com/en/docs#weathervariables
 */
const WMO_CONDITION_MAP: { range: [number, number]; category: ConditionCategory }[] = [
    { range: [0, 2], category: "clear" },
    { range: [3, 48], category: "cloudy" },
    { range: [51, 67], category: "precipitation" },
    { range: [71, 77], category: "snow" },
    { range: [80, 82], category: "precipitation" },
    { range: [85, 86], category: "snow" },
    { range: [95, 99], category: "storm" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse a "HH:MM" time string into fractional hours (e.g. "07:32" → 7.533).
 * Returns 0 on failure.
 */
function parseTimeToHours(timeStr: string): number {
    const parts = timeStr.split(":");
    if (parts.length < 2) return 0;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return 0;
    return h + m / 60;
}

/**
 * Compute daylight duration in minutes from "HH:MM" sunrise/sunset strings.
 * Clamps to a sensible range (0–1080 min = 0–18 h).
 */
export function computeDaylightMinutes(sunrise: string, sunset: string): number {
    const riseHours = parseTimeToHours(sunrise);
    const setHours = parseTimeToHours(sunset);
    if (riseHours === 0 && setHours === 0) return 480; // sensible default: 8 h
    const minutes = Math.max(0, (setHours - riseHours) * 60);
    return Math.min(1080, Math.round(minutes));
}

/**
 * Map a WMO weather code to a broad ConditionCategory.
 */
export function mapConditionCategory(wmoCode: number): ConditionCategory {
    for (const { range, category } of WMO_CONDITION_MAP) {
        if (wmoCode >= range[0] && wmoCode <= range[1]) return category;
    }
    return "cloudy"; // safe default
}

/**
 * Round a number to `decimals` decimal places.
 */
function round(value: number, decimals = 1): number {
    return Math.round(value * 10 ** decimals) / 10 ** decimals;
}

// ── Main extractor ───────────────────────────────────────────────────────────

export interface ExtractionResult {
    features: WeatherFeatures;
    meta: ExtractionMeta;
}

/**
 * Extract and normalise weather features from raw API data.
 *
 * @param data - Structured WeatherData from the weather service
 * @returns ExtractionResult containing features + provenance metadata
 */
export function extractWeatherFeatures(data: WeatherData): ExtractionResult {
    const window = data.hourlyForecast.slice(0, ANALYSIS_WINDOW_HOURS);

    // ── Daylight ────────────────────────────────────────────────────────────
    const daylightMinutes = computeDaylightMinutes(data.sunrise, data.sunset);
    const daylightHours = round(daylightMinutes / 60);

    // ── Rain ────────────────────────────────────────────────────────────────
    // Primary: use the current precipitation probability from the API.
    // Also compute peak over the analysis window for richer signal.
    const hourlyRainValues = window.map((h) => h.precipitationProbability);
    const peakRainProbability = hourlyRainValues.length
        ? Math.max(...hourlyRainValues)
        : data.precipitationProbability;
    const rainProbability = data.precipitationProbability;

    // ── Temperature ─────────────────────────────────────────────────────────
    const hourlyTemps = window.map((h) => h.temperature);
    const avgHourlyTemp = hourlyTemps.length
        ? round(hourlyTemps.reduce((a, b) => a + b, 0) / hourlyTemps.length)
        : data.temperature;

    // ── Condition category ──────────────────────────────────────────────────
    const conditionCategory = mapConditionCategory(data.conditionCode);

    const features: WeatherFeatures = {
        temperature: data.temperature,
        rainProbability,
        humidity: data.humidity,
        windSpeed: data.windSpeed,
        daylightHours,
        daylightMinutes,
        peakRainProbability,
        avgHourlyTemp,
        conditionCategory,
    };

    const meta: ExtractionMeta = {
        extractedAt: new Date().toISOString(),
        sourceCity: data.city,
        hoursAnalysed: window.length,
    };

    return { features, meta };
}
