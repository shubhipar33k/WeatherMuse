/**
 * ProductivityEngine — Days 3 + 6
 *
 * Rule-based scoring system (Day 3) upgraded with a weighted scoring model
 * and confidence bands (Day 6). The weighted model replaces the ad-hoc linear
 * formula; confidence is derived from signal ambiguity across all features.
 *
 * External consumers (RecommendationEngine, TimeBlockEngine) depend only on
 * ProductivityScore — adding fields here is fully backward-compatible.
 */

import { WeatherFeatures } from "@/types/weather";
import { computeWeightedScores, ConfidenceBand } from "@/lib/scoringModel";

// ── Output types ──────────────────────────────────────────────────────────────

export interface ProductivityScore {
    /** 0–1: likelihood of sustained indoor cognitive focus */
    focusScore: number;
    /** 0–1: suitability for outdoor activity or errands */
    outdoorViability: number;
    /** High-level label summarising the productivity state */
    signal: ProductivitySignal;
    /** Human-readable reason for the primary signal */
    reason: string;
    /** Sub-scores for transparency / future UI */
    breakdown: ScoreBreakdown;
    // ── Day 6 additions ────────────────────────────────
    /** 0–1 overall model confidence in the current scores */
    confidence: number;
    /** high / medium / low confidence band label */
    confidenceBand: ConfidenceBand;
    /** ±δ uncertainty radius — focusScore lies in [focusScore±focusUncertainty] */
    focusUncertainty: number;
    /** ±δ uncertainty radius for outdoor viability */
    outdoorUncertainty: number;
}

export type ProductivitySignal =
    | "deep-focus"
    | "moderate-focus"
    | "low-focus"
    | "outdoor-optimal"
    | "mixed";

export interface ScoreBreakdown {
    rainPenalty: number;       // 0–1, higher = worse for outdoors
    humidityPenalty: number;   // 0–1, higher = worse for focus
    windPenalty: number;       // 0–1, higher = worse for outdoors
    daylightBonus: number;     // 0–1, higher = better for everything
    temperaturePenalty: number;// 0–1, higher = extreme temp hurts outdoors
}

// ── Thresholds (all configurable) ────────────────────────────────────────────

const T = {
    // Rain
    RAIN_HIGH: 60,   // % → strongly reduces outdoor score
    RAIN_MODERATE: 30,   // % → moderately reduces outdoor score
    // Humidity  
    HUMIDITY_HIGH: 80,   // % → high humidity reduces focus slightly
    HUMIDITY_MODERATE: 60, // % → moderate effect
    // Wind
    WIND_HIGH: 40,   // km/h → uncomfortable outside
    WIND_MODERATE: 20,   // km/h → mild outdoor concern
    // Daylight
    DAYLIGHT_LONG: 10,   // h → long days boost everything
    DAYLIGHT_SHORT: 6,    // h → short days suppress outdoor viability
    // Temperature
    TEMP_COLD: 5,    // °C → cold hurts outdoors
    TEMP_HOT: 30,   // °C → heat hurts outdoor comfort
    TEMP_COMFORT_LO: 12,   // °C → comfort zone lower bound
    TEMP_COMFORT_HI: 22,   // °C → comfort zone upper bound
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Clamp a value between 0 and 1 */
function clamp01(v: number): number {
    return Math.max(0, Math.min(1, v));
}

/** Round to 2 decimal places */
function r2(v: number): number {
    return Math.round(v * 100) / 100;
}

// ── Rule engine ───────────────────────────────────────────────────────────────

export function scoreProductivity(features: WeatherFeatures): ProductivityScore {
    const { rainProbability, peakRainProbability, humidity, windSpeed, daylightHours, temperature } = features;

    // Use the more conservative of current + peak rain
    const effectiveRain = Math.max(rainProbability, peakRainProbability * 0.7);

    // ── Sub-scores (each penalty: 0 = no effect, 1 = maximum penalty) ──────────

    const rainPenalty = effectiveRain >= T.RAIN_HIGH
        ? 1.0
        : effectiveRain >= T.RAIN_MODERATE
            ? 0.5
            : effectiveRain > 0
                ? effectiveRain / T.RAIN_MODERATE * 0.4
                : 0;

    const humidityPenalty = humidity >= T.HUMIDITY_HIGH
        ? 0.35
        : humidity >= T.HUMIDITY_MODERATE
            ? 0.15
            : 0;

    const windPenalty = windSpeed >= T.WIND_HIGH
        ? 1.0
        : windSpeed >= T.WIND_MODERATE
            ? 0.4
            : 0;

    const daylightBonus = daylightHours >= T.DAYLIGHT_LONG
        ? 1.0
        : daylightHours >= T.DAYLIGHT_SHORT
            ? (daylightHours - T.DAYLIGHT_SHORT) / (T.DAYLIGHT_LONG - T.DAYLIGHT_SHORT)
            : 0;

    const temperaturePenalty =
        temperature <= T.TEMP_COLD ? clamp01((T.TEMP_COLD - temperature) / 15)
            : temperature >= T.TEMP_HOT ? clamp01((temperature - T.TEMP_HOT) / 15)
                : 0;

    const breakdown: ScoreBreakdown = {
        rainPenalty: r2(rainPenalty),
        humidityPenalty: r2(humidityPenalty),
        windPenalty: r2(windPenalty),
        daylightBonus: r2(daylightBonus),
        temperaturePenalty: r2(temperaturePenalty),
    };

    // ── Day 6: Weighted model scores + confidence ─────────────────────────────
    const weighted = computeWeightedScores(features);

    // Blend: weighted model drives the primary scores from Day 6 onward
    const focusScore = weighted.focusScore;
    const outdoorViability = weighted.outdoorViability;

    // ── Signal label ──────────────────────────────────────────────────────────
    const signal = deriveSignal(focusScore, outdoorViability);
    const reason = deriveReason(signal, features, rainPenalty, windPenalty);

    return {
        focusScore,
        outdoorViability,
        signal,
        reason,
        breakdown,
        // Day 6 fields
        confidence: weighted.confidence,
        confidenceBand: weighted.confidenceBand,
        focusUncertainty: weighted.focusUncertainty,
        outdoorUncertainty: weighted.outdoorUncertainty,
    };
}

function deriveSignal(focus: number, outdoor: number): ProductivitySignal {
    if (focus >= 0.75) return "deep-focus";
    if (outdoor >= 0.70 && focus < 0.55) return "outdoor-optimal";
    if (focus >= 0.60) return "moderate-focus";
    if (focus >= 0.45) return "mixed";
    return "low-focus";
}

function deriveReason(
    signal: ProductivitySignal,
    f: WeatherFeatures,
    rainPenalty: number,
    windPenalty: number
): string {
    switch (signal) {
        case "deep-focus":
            return rainPenalty > 0.4
                ? `Rain probability ${f.rainProbability}% — ideal conditions for sustained indoor work.`
                : f.daylightHours >= 10
                    ? `${f.daylightHours}h of daylight with comfortable conditions supports strong focus.`
                    : `Overcast and still — low distraction environment for deep work.`;
        case "outdoor-optimal":
            return `Clear conditions, ${f.temperature}°C — good window for errands or outdoor activity.`;
        case "moderate-focus":
            return `Moderate conditions. ${f.humidity}% humidity may cause some fatigue — take breaks.`;
        case "mixed":
            return `Variable weather. Mix indoor focus blocks with outdoor tasks when conditions allow.`;
        case "low-focus":
            return windPenalty > 0.5
                ? `High winds (${f.windSpeed} km/h) and unsettled weather — light tasks recommended.`
                : `High humidity (${f.humidity}%) and ${f.rainProbability}% rain — energy may be lower than usual.`;
    }
}
