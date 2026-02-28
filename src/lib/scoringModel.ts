/**
 * ScoringModel — Day 6
 *
 * Replaces the ad-hoc linear formula in ProductivityEngine with a proper
 * weighted dot-product model. Every coefficient is named and grouped so
 * they can be tuned independently or loaded from a config file later.
 *
 * Also provides confidence scoring: a 0–1 measure of how certain the model
 * is about its output given the current set of weather signals.
 *
 * Uncertainty sources (each reduces confidence):
 *   - Rain probability in the ambiguous 25–55% range → "maybe it rains?"
 *   - Temperature near comfort-zone boundaries (±3°C of thresholds)
 *   - Wind speed in the moderate range (15–35 km/h)
 *   - Humidity mid-range (55–75%)
 */

import { WeatherFeatures } from "@/types/weather";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConfidenceBand = "high" | "medium" | "low";

export interface WeightedScores {
    /** 0–1 weighted focus score */
    focusScore: number;
    /** 0–1 weighted outdoor viability */
    outdoorViability: number;
    /** 0–1 overall model confidence */
    confidence: number;
    /** high / medium / low label */
    confidenceBand: ConfidenceBand;
    /** ±δ uncertainty radius on focusScore */
    focusUncertainty: number;
    /** ±δ uncertainty radius on outdoorViability */
    outdoorUncertainty: number;
    /** Named weight contribution breakdown */
    weightedBreakdown: WeightedBreakdown;
}

export interface WeightedBreakdown {
    /** Positive contributions */
    rainIndoorBoost: number;   // rain → good for indoor focus
    daylightFocusBoost: number;  // daylight → mood + energy
    comfortBoost: number;   // comfortable temp → general boost
    /** Negative contributions */
    humidityDrag: number;   // humidity → cognitive fatigue
    tempExtremeDrag: number;   // extreme cold or heat → distraction
    windOutdoorDrag: number;   // wind → outdoor discomfort
    rainOutdoorDrag: number;   // rain → blocks outdoor
}

// ── Weight vectors ────────────────────────────────────────────────────────────
// Each weight is a named constant — easy to tune and audit.

const FOCUS_WEIGHTS = {
    base: 0.48,
    rainIndoorBoost: 0.32,  // rain → stay inside, focus improves
    daylightBoost: 0.22,  // daylight hours → energy / mood
    humidityDrag: -0.14,  // high humidity → sluggish
    tempExtremeDrag: -0.09,  // very cold or hot → distraction
};

const OUTDOOR_WEIGHTS = {
    base: 0.78,
    rainDrag: -0.52,  // rain → primary outdoor blocker
    windDrag: -0.18,  // wind → physical discomfort
    tempExtremeDrag: -0.18,  // extreme cold/heat → stay inside
    daylightBoost: +0.09,  // more daylight → more viable outdoor window
    humidityDrag: -0.04,  // slight drag from mugginess
};

// ── Uncertainty thresholds ────────────────────────────────────────────────────

const U = {
    RAIN_AMBIG_LO: 25,     // % — below this: dry (certain)
    RAIN_AMBIG_HI: 55,     // % — above this: rainy (certain)
    WIND_AMBIG_LO: 15,     // km/h
    WIND_AMBIG_HI: 35,     // km/h
    HUMID_AMBIG_LO: 55,     // %
    HUMID_AMBIG_HI: 75,     // %
    TEMP_AMBIG_MARGIN: 3,   // ±°C around comfort boundaries
    TEMP_COMFORT_LO: 12,    // °C
    TEMP_COMFORT_HI: 22,    // °C
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp01(v: number): number { return Math.max(0, Math.min(1, v)); }
function r2(v: number): number { return Math.round(v * 100) / 100; }

/** How ambiguous is a value in [lo, hi]? Returns 0 (certain) → 1 (maximally uncertain) */
function ambiguity(value: number, lo: number, hi: number): number {
    if (value < lo || value > hi) return 0;
    const mid = (lo + hi) / 2;
    return 1 - Math.abs(value - mid) / ((hi - lo) / 2);
}

// ── Sub-score normalisation (same as productivityEngine to stay consistent) ──

function rainPenalty(effectiveRain: number): number {
    if (effectiveRain >= 60) return 1.0;
    if (effectiveRain >= 30) return 0.5;
    if (effectiveRain > 0) return (effectiveRain / 30) * 0.4;
    return 0;
}

function humidityPenalty(humidity: number): number {
    if (humidity >= 80) return 0.35;
    if (humidity >= 60) return 0.15;
    return 0;
}

function windPenalty(windSpeed: number): number {
    if (windSpeed >= 40) return 1.0;
    if (windSpeed >= 20) return 0.4;
    return 0;
}

function daylightBonus(daylightHours: number): number {
    if (daylightHours >= 10) return 1.0;
    if (daylightHours >= 6) return (daylightHours - 6) / 4;
    return 0;
}

function tempPenalty(temp: number): number {
    if (temp <= 5) return clamp01((5 - temp) / 15);
    if (temp >= 30) return clamp01((temp - 30) / 15);
    return 0;
}

function tempComfortBonus(temp: number): number {
    // 0 at edges of [12,22], 1 at centre (17°C)
    if (temp < U.TEMP_COMFORT_LO || temp > U.TEMP_COMFORT_HI) return 0;
    const mid = (U.TEMP_COMFORT_LO + U.TEMP_COMFORT_HI) / 2;
    return 1 - Math.abs(temp - mid) / ((U.TEMP_COMFORT_HI - U.TEMP_COMFORT_LO) / 2);
}

// ── Main export ───────────────────────────────────────────────────────────────

export function computeWeightedScores(features: WeatherFeatures): WeightedScores {
    const {
        rainProbability, peakRainProbability,
        humidity, windSpeed, daylightHours, temperature,
    } = features;

    const effectiveRain = Math.max(rainProbability, peakRainProbability * 0.7);

    // Sub-signals
    const rp = rainPenalty(effectiveRain);
    const hp = humidityPenalty(humidity);
    const wp = windPenalty(windSpeed);
    const db = daylightBonus(daylightHours);
    const tp = tempPenalty(temperature);
    const cb = tempComfortBonus(temperature);

    // ── Named contributions ───────────────────────────────────────────────────
    const rainIndoorBoost = r2(rp * FOCUS_WEIGHTS.rainIndoorBoost);
    const daylightFocusBoost = r2(db * FOCUS_WEIGHTS.daylightBoost);
    const comfortBoost = r2(cb * 0.08);                          // small uplift
    const humidityDrag = r2(hp * Math.abs(FOCUS_WEIGHTS.humidityDrag));
    const tempExtremeDrag = r2(tp * Math.abs(FOCUS_WEIGHTS.tempExtremeDrag));
    const windOutdoorDrag = r2(wp * Math.abs(OUTDOOR_WEIGHTS.windDrag));
    const rainOutdoorDrag = r2(rp * Math.abs(OUTDOOR_WEIGHTS.rainDrag));

    // ── Weighted scores ───────────────────────────────────────────────────────
    const focusScore = clamp01(
        FOCUS_WEIGHTS.base
        + rainIndoorBoost
        + daylightFocusBoost
        + comfortBoost
        - humidityDrag
        - tempExtremeDrag
    );

    const outdoorViability = clamp01(
        OUTDOOR_WEIGHTS.base
        - rainOutdoorDrag
        - windOutdoorDrag
        - tempExtremeDrag
        + r2(db * OUTDOOR_WEIGHTS.daylightBoost)
        - r2(hp * Math.abs(OUTDOOR_WEIGHTS.humidityDrag))
    );

    // ── Confidence calculation ────────────────────────────────────────────────
    // Each ambiguous signal reduces confidence by a weighted amount.
    const rainAmb = ambiguity(effectiveRain, U.RAIN_AMBIG_LO, U.RAIN_AMBIG_HI) * 0.35;
    const windAmb = ambiguity(windSpeed, U.WIND_AMBIG_LO, U.WIND_AMBIG_HI) * 0.20;
    const humidAmb = ambiguity(humidity, U.HUMID_AMBIG_LO, U.HUMID_AMBIG_HI) * 0.20;
    const tempAmb = (
        ambiguity(temperature, U.TEMP_COMFORT_LO - U.TEMP_AMBIG_MARGIN, U.TEMP_COMFORT_LO + U.TEMP_AMBIG_MARGIN) * 0.15 +
        ambiguity(temperature, U.TEMP_COMFORT_HI - U.TEMP_AMBIG_MARGIN, U.TEMP_COMFORT_HI + U.TEMP_AMBIG_MARGIN) * 0.15
    ) / 2;

    const totalAmbiguity = clamp01(rainAmb + windAmb + humidAmb + tempAmb);
    const confidence = r2(1 - totalAmbiguity);

    const confidenceBand: ConfidenceBand =
        confidence >= 0.75 ? "high"
            : confidence >= 0.45 ? "medium"
                : "low";

    // Uncertainty radius scales inversely with confidence
    const uncertaintyRadius = r2((1 - confidence) * 0.12);

    return {
        focusScore: r2(focusScore),
        outdoorViability: r2(outdoorViability),
        confidence,
        confidenceBand,
        focusUncertainty: uncertaintyRadius,
        outdoorUncertainty: uncertaintyRadius,
        weightedBreakdown: {
            rainIndoorBoost,
            daylightFocusBoost,
            comfortBoost,
            humidityDrag,
            tempExtremeDrag,
            windOutdoorDrag,
            rainOutdoorDrag,
        },
    };
}
