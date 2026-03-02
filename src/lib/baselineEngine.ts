/**
 * BaselineEngine — Day 7
 *
 * Computes a 7-day rolling baseline from stored DailySnapshots and
 * derives relative productivity deltas (Δ) for today vs that baseline.
 *
 * Used to power the "↑ 12% above your recent average" insight.
 */

import { DailySnapshot, getRecentSnapshots } from "@/lib/historyStore";
import { ProductivityScore } from "@/lib/productivityEngine";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TrendDirection = "up" | "down" | "stable";

export interface BaselineResult {
    /** How many past days fed into the baseline */
    daysUsed: number;
    /** 7-day average focus score (0–1) */
    avgFocus: number;
    /** 7-day average outdoor viability (0–1) */
    avgOutdoor: number;
    /** Today's focus vs baseline: +0.12 means 12 pp above average */
    focusDelta: number;
    /** Today's outdoor vs baseline */
    outdoorDelta: number;
    /** Percentage change in focus vs baseline (e.g. +14.3) */
    focusDeltaPct: number;
    /** Percentage change in outdoor vs baseline */
    outdoorDeltaPct: number;
    /** Whether today's focus is trending up / down / stable (±3 pp) */
    focusTrend: TrendDirection;
    /** Whether today's outdoor is trending up / down / stable */
    outdoorTrend: TrendDirection;
    /** Human-readable summary of the baseline comparison */
    summary: string;
    /** True when fewer than 3 past days exist (baseline not yet reliable) */
    insufficientData: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const WINDOW_DAYS = 7;
const STABLE_BAND = 0.03;   // ±3 pp → "stable"
const MIN_DAYS = 3;      // minimum past days for a reliable baseline

// ── Helpers ───────────────────────────────────────────────────────────────────

function avg(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
}

function r2(v: number): number {
    return Math.round(v * 100) / 100;
}

function pct(v: number): number {
    return Math.round(v * 1000) / 10;   // → one decimal, e.g. 14.3
}

function trend(delta: number): TrendDirection {
    if (delta > STABLE_BAND) return "up";
    if (delta < -STABLE_BAND) return "down";
    return "stable";
}

function buildSummary(result: Omit<BaselineResult, "summary">): string {
    if (result.insufficientData) {
        return `Only ${result.daysUsed} day${result.daysUsed !== 1 ? "s" : ""} of history recorded. Keep using WeatherMuse to unlock your personal baseline!`;
    }

    const focusSign = result.focusDelta >= 0 ? "+" : "";
    const outdoorSign = result.outdoorDelta >= 0 ? "+" : "";

    if (result.focusTrend === "up" && result.outdoorTrend === "up") {
        return `Today's conditions are better across the board — ${focusSign}${result.focusDeltaPct}% focus, ${outdoorSign}${result.outdoorDeltaPct}% outdoor vs your ${result.daysUsed}-day average.`;
    }
    if (result.focusTrend === "up") {
        return `Focus conditions are ${focusSign}${result.focusDeltaPct}% above your ${result.daysUsed}-day average. Outdoor viability is ${result.outdoorDeltaPct}% relative to baseline.`;
    }
    if (result.focusTrend === "down") {
        return `Today's focus conditions are ${result.focusDeltaPct}% below your recent average. Consider lighter tasks or outdoor time.`;
    }
    return `Today is broadly in line with your ${result.daysUsed}-day average (focus ${focusSign}${result.focusDeltaPct}%, outdoor ${outdoorSign}${result.outdoorDeltaPct}%).`;
}

// ── Main engine ───────────────────────────────────────────────────────────────

export function computeBaseline(
    today: ProductivityScore,
    history: DailySnapshot[]
): BaselineResult {
    const recent = getRecentSnapshots(history, WINDOW_DAYS);
    const daysUsed = recent.length;
    const insufficient = daysUsed < MIN_DAYS;

    const avgFocus = r2(avg(recent.map((s) => s.scores.focusScore)));
    const avgOutdoor = r2(avg(recent.map((s) => s.scores.outdoorViability)));

    const focusDelta = r2(today.focusScore - (daysUsed > 0 ? avgFocus : today.focusScore));
    const outdoorDelta = r2(today.outdoorViability - (daysUsed > 0 ? avgOutdoor : today.outdoorViability));

    // Avoid dividing by zero when baseline is 0
    const focusDeltaPct = daysUsed > 0 && avgFocus > 0 ? pct(focusDelta / avgFocus) : 0;
    const outdoorDeltaPct = daysUsed > 0 && avgOutdoor > 0 ? pct(outdoorDelta / avgOutdoor) : 0;

    const partial: Omit<BaselineResult, "summary"> = {
        daysUsed,
        avgFocus,
        avgOutdoor,
        focusDelta,
        outdoorDelta,
        focusDeltaPct,
        outdoorDeltaPct,
        focusTrend: daysUsed >= MIN_DAYS ? trend(focusDelta) : "stable",
        outdoorTrend: daysUsed >= MIN_DAYS ? trend(outdoorDelta) : "stable",
        insufficientData: insufficient,
    };

    return { ...partial, summary: buildSummary(partial) };
}
