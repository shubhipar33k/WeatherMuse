/**
 * ProductivityEngine — Day 3
 *
 * Rule-based scoring system that converts WeatherFeatures into structured
 * productivity signals. Deterministic and transparent — no ML yet.
 *
 * Designed so every rule is readable and the weights are explicit constants,
 * making it trivially replaceable by the weighted model on Day 6.
 */

import { WeatherFeatures } from "@/types/weather";

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

    // ── Focus score ─────────────────────────────────────────────────────────────
    // Rain and long daylight are the dominant signals for indoor focus.
    // High rain → stay in, good light → productive mood.
    // Humidity and extreme temps have minor suppression effects.
    const focusScore = clamp01(
        0.5                                  // base
        + rainPenalty * 0.35                 // rain pushes indoors (good for focus)
        + daylightBonus * 0.25               // more daylight → better mood
        - humidityPenalty * 0.15             // muggy = sluggish
        - temperaturePenalty * 0.10          // extreme temps = distraction
    );

    // ── Outdoor viability ────────────────────────────────────────────────────────
    // Penalties stack inversely to focusScore — bad weather is good for focus,
    // bad for going outside.
    const outdoorViability = clamp01(
        0.8                                  // optimistic base
        - rainPenalty * 0.55                 // rain is the dominant blocker
        - windPenalty * 0.20                 // wind is uncomfortable
        - temperaturePenalty * 0.20          // extreme temps discourage going out
        + daylightBonus * 0.10               // daylight gives a small boost
        - humidityPenalty * 0.05             // mild penalty
    );

    // ── Signal label ──────────────────────────────────────────────────────────
    const signal = deriveSignal(focusScore, outdoorViability);
    const reason = deriveReason(signal, features, rainPenalty, windPenalty);

    return {
        focusScore: r2(focusScore),
        outdoorViability: r2(outdoorViability),
        signal,
        reason,
        breakdown,
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
