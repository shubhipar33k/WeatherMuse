/**
 * HistoryStore — Day 7
 *
 * Persists daily WeatherFeatures + ProductivityScore snapshots in
 * localStorage so the BaselineEngine can compute rolling averages.
 *
 * Storage key: "weathermuse_history"
 * Format: JSON array of DailySnapshot, capped at MAX_DAYS entries.
 *
 * Designed to be safely called in a browser-only context —
 * any call in SSR will be a no-op (typeof window guard).
 */

import { WeatherFeatures } from "@/types/weather";
import { ProductivityScore } from "@/lib/productivityEngine";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DailySnapshot {
    /** ISO date string: "2024-03-02" */
    date: string;
    features: Pick<WeatherFeatures,
        | "temperature"
        | "rainProbability"
        | "humidity"
        | "windSpeed"
        | "daylightHours"
    >;
    scores: {
        focusScore: number;
        outdoorViability: number;
        confidence: number;
    };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "weathermuse_history";
const MAX_DAYS = 30;   // keep up to 30 snapshots

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);   // "2024-03-02"
}

function isBrowser(): boolean {
    return typeof window !== "undefined";
}

// ── Store API ─────────────────────────────────────────────────────────────────

/**
 * Load all stored snapshots, most-recent first.
 * Returns an empty array when storage is unavailable.
 */
export function loadHistory(): DailySnapshot[] {
    if (!isBrowser()) return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * Append today's snapshot, replacing any existing entry for today.
 * Trims the store to MAX_DAYS before saving.
 */
export function saveSnapshot(
    features: WeatherFeatures,
    score: ProductivityScore
): void {
    if (!isBrowser()) return;

    const today = todayISO();
    const snapshot: DailySnapshot = {
        date: today,
        features: {
            temperature: features.temperature,
            rainProbability: features.rainProbability,
            humidity: features.humidity,
            windSpeed: features.windSpeed,
            daylightHours: features.daylightHours,
        },
        scores: {
            focusScore: score.focusScore,
            outdoorViability: score.outdoorViability,
            confidence: score.confidence,
        },
    };

    const existing = loadHistory().filter((s) => s.date !== today);
    const updated = [snapshot, ...existing].slice(0, MAX_DAYS);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
        // localStorage quota exceeded — silently fail
    }
}

/**
 * Return only snapshots from the last N days (ignoring today).
 */
export function getRecentSnapshots(
    history: DailySnapshot[],
    days: number = 7
): DailySnapshot[] {
    const today = todayISO();
    return history
        .filter((s) => s.date !== today)
        .slice(0, days);
}

/**
 * Clear all stored history (useful for testing/reset).
 */
export function clearHistory(): void {
    if (!isBrowser()) return;
    localStorage.removeItem(STORAGE_KEY);
}
