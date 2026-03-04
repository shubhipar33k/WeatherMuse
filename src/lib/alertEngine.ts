/**
 * AlertEngine — Day 8
 *
 * Scans the hourly forecast window and fires contextual alerts when
 * significant weather shifts are detected. Each alert carries:
 *   - type: categorical alert kind
 *   - severity: info | warning | danger
 *   - emoji + title + body + time hint
 *
 * Algorithms (all tunable via thresholds):
 *   1. Rain onset  — rising precip probability crossing a threshold
 *   2. Rain ending — probability falling below a threshold after rain
 *   3. Wind surge  — windSpeed crossing HIGH threshold
 *   4. Temp drop   — temperature falling by TEMP_DROP_DELTA within 3h
 *   5. Temp spike  — temperature rising by TEMP_SPIKE_DELTA within 3h
 *   6. Clear window — sustained dry, mild window after rain or clouds
 *   7. Storm flag  — WMO condition code >79 (thunderstorm / heavy weather)
 */

import { HourlyForecast } from "@/types/weather";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AlertType =
    | "rain-onset"
    | "rain-ending"
    | "wind-surge"
    | "temp-drop"
    | "temp-spike"
    | "clear-window"
    | "storm";

export type AlertSeverity = "info" | "warning" | "danger";

export interface WeatherAlert {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    emoji: string;
    title: string;
    body: string;
    /** The forecast slot that triggered this alert, e.g. "14:00" */
    triggerTime: string;
    /** Hours from now until the alert condition kicks in */
    hoursFromNow: number;
}

export interface AlertResult {
    alerts: WeatherAlert[];
    hasWarnings: boolean;
    hasDangers: boolean;
    topAlert: WeatherAlert | null;
}

// ── Thresholds ─────────────────────────────────────────────────────────────────

const A = {
    RAIN_ONSET: 40,   // % — rising above this triggers onset alert
    RAIN_HIGH: 70,   // % — "heavy rain" threshold
    RAIN_CLEAR: 15,   // % — falling below this = "rain ending"
    WIND_WARNING: 30,   // km/h
    WIND_DANGER: 50,   // km/h
    TEMP_DROP_DELTA: 5,   // °C drop within TEMP_WINDOW hours
    TEMP_SPIKE_DELTA: 6,   // °C rise within TEMP_WINDOW hours
    TEMP_WINDOW_HOURS: 3,
    CLEAR_DURATION_H: 2,   // hours of dry+mild to call a "clear window"
    CLEAR_MAX_PRECIP: 15,   // %
    CLEAR_MAX_WIND: 25,   // km/h
    STORM_CODE_MIN: 80,   // WMO code threshold for storm
    SCAN_HOURS: 12,   // how far ahead to look
};

// ── Helpers ───────────────────────────────────────────────────────────────────

let idCounter = 0;
function nextId(): string { return `alert_${++idCounter}`; }

function hoursUntil(time: string, currentHour: number): number {
    const [h] = time.split(":").map(Number);
    const diff = h - currentHour;
    return diff < 0 ? diff + 24 : diff;
}

function timeLabel(h: number): string {
    if (h === 0) return "now";
    if (h === 1) return "in 1h";
    return `in ${h}h`;
}

// ── Detectors ─────────────────────────────────────────────────────────────────

function detectRainOnset(
    slots: HourlyForecast[],
    currentHour: number
): WeatherAlert | null {
    let wasWet = false;
    for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        const h = hoursUntil(s.time, currentHour);
        if (s.precipitationProbability >= A.RAIN_ONSET && !wasWet) {
            const heavy = s.precipitationProbability >= A.RAIN_HIGH;
            return {
                id: nextId(), type: "rain-onset",
                severity: heavy ? "warning" : "info",
                emoji: "🌧",
                title: heavy ? "Heavy rain arriving" : "Rain arriving",
                body: `${s.precipitationProbability}% chance of rain ${timeLabel(h)}. Wrap up any outdoor tasks beforehand.`,
                triggerTime: s.time, hoursFromNow: h,
            };
        }
        if (s.precipitationProbability >= A.RAIN_ONSET) wasWet = true;
    }
    return null;
}

function detectRainEnding(
    slots: HourlyForecast[],
    currentHour: number
): WeatherAlert | null {
    let inRain = false;
    for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        const h = hoursUntil(s.time, currentHour);
        if (s.precipitationProbability >= A.RAIN_ONSET) { inRain = true; continue; }
        if (inRain && s.precipitationProbability <= A.RAIN_CLEAR) {
            return {
                id: nextId(), type: "rain-ending",
                severity: "info",
                emoji: "🌤",
                title: "Rain clearing up",
                body: `Conditions improve ${timeLabel(h)}. Good window opening for outdoor activity.`,
                triggerTime: s.time, hoursFromNow: h,
            };
        }
    }
    return null;
}

function detectWindSurge(
    slots: HourlyForecast[],
    currentHour: number
): WeatherAlert | null {
    for (const s of slots) {
        const h = hoursUntil(s.time, currentHour);
        if (s.windSpeed >= A.WIND_DANGER) {
            return {
                id: nextId(), type: "wind-surge",
                severity: "danger",
                emoji: "💨",
                title: "Dangerous wind speeds",
                body: `Winds reaching ${Math.round(s.windSpeed)} km/h ${timeLabel(h)}. Avoid outdoor activity.`,
                triggerTime: s.time, hoursFromNow: h,
            };
        }
        if (s.windSpeed >= A.WIND_WARNING) {
            return {
                id: nextId(), type: "wind-surge",
                severity: "warning",
                emoji: "💨",
                title: "Strong winds expected",
                body: `Winds at ${Math.round(s.windSpeed)} km/h ${timeLabel(h)}. Take care outdoors.`,
                triggerTime: s.time, hoursFromNow: h,
            };
        }
    }
    return null;
}

function detectTempShift(
    slots: HourlyForecast[],
    currentHour: number
): WeatherAlert | null {
    const window = A.TEMP_WINDOW_HOURS;
    for (let i = 0; i + window < slots.length; i++) {
        const from = slots[i];
        const to = slots[i + window];
        const delta = to.temperature - from.temperature;
        const h = hoursUntil(from.time, currentHour);
        if (delta <= -A.TEMP_DROP_DELTA) {
            return {
                id: nextId(), type: "temp-drop",
                severity: "warning",
                emoji: "🌡",
                title: "Significant temperature drop",
                body: `Temperature falling ${Math.abs(Math.round(delta))}°C over 3h from ${timeLabel(h)}. Layer up if heading out.`,
                triggerTime: from.time, hoursFromNow: h,
            };
        }
        if (delta >= A.TEMP_SPIKE_DELTA) {
            return {
                id: nextId(), type: "temp-spike",
                severity: "info",
                emoji: "☀",
                title: "Warming up ahead",
                body: `Temperature rising ${Math.round(delta)}°C over 3h from ${timeLabel(h)}.`,
                triggerTime: from.time, hoursFromNow: h,
            };
        }
    }
    return null;
}

function detectClearWindow(
    slots: HourlyForecast[],
    currentHour: number
): WeatherAlert | null {
    // Find first run of ≥ CLEAR_DURATION_H consecutive clear slots
    let run = 0;
    let runStart: HourlyForecast | null = null;
    for (const s of slots) {
        const isClear =
            s.precipitationProbability <= A.CLEAR_MAX_PRECIP &&
            s.windSpeed <= A.CLEAR_MAX_WIND;
        if (isClear) {
            if (run === 0) runStart = s;
            run++;
            if (run >= A.CLEAR_DURATION_H) {
                const h = hoursUntil(runStart!.time, currentHour);
                return {
                    id: nextId(), type: "clear-window",
                    severity: "info",
                    emoji: "🌿",
                    title: "Clear outdoor window",
                    body: `At least ${A.CLEAR_DURATION_H}h of dry, calm conditions starting ${timeLabel(h)}. Good time for errands or exercise.`,
                    triggerTime: runStart!.time, hoursFromNow: h,
                };
            }
        } else {
            run = 0;
            runStart = null;
        }
    }
    return null;
}

function detectStorm(
    slots: HourlyForecast[],
    currentHour: number
): WeatherAlert | null {
    for (const s of slots) {
        if (s.conditionCode >= A.STORM_CODE_MIN) {
            const h = hoursUntil(s.time, currentHour);
            return {
                id: nextId(), type: "storm",
                severity: "danger",
                emoji: "⛈",
                title: "Severe weather",
                body: `Storm conditions expected ${timeLabel(h)}. Stay indoors and avoid travel if possible.`,
                triggerTime: s.time, hoursFromNow: h,
            };
        }
    }
    return null;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function detectAlerts(
    forecast: HourlyForecast[],
    currentHour: number = new Date().getHours()
): AlertResult {
    // Reset id counter each call so IDs are deterministic in tests
    idCounter = 0;

    // Slice to the configurable look-ahead window
    const slots = forecast.slice(0, A.SCAN_HOURS);

    // Run all detectors — order matters: dangers first
    const candidates: (WeatherAlert | null)[] = [
        detectStorm(slots, currentHour),
        detectWindSurge(slots, currentHour),
        detectRainOnset(slots, currentHour),
        detectTempShift(slots, currentHour),
        detectRainEnding(slots, currentHour),
        detectClearWindow(slots, currentHour),
    ];

    const alerts = candidates.filter((a): a is WeatherAlert => a !== null);

    // Deduplicate by type (keep first/most-severe)
    const seen = new Set<AlertType>();
    const deduped = alerts.filter((a) => {
        if (seen.has(a.type)) return false;
        seen.add(a.type);
        return true;
    });

    // Sort: danger → warning → info, then by hoursFromNow
    deduped.sort((a, b) => {
        const sev = { danger: 0, warning: 1, info: 2 };
        const diff = sev[a.severity] - sev[b.severity];
        return diff !== 0 ? diff : a.hoursFromNow - b.hoursFromNow;
    });

    return {
        alerts: deduped,
        hasWarnings: deduped.some((a) => a.severity === "warning"),
        hasDangers: deduped.some((a) => a.severity === "danger"),
        topAlert: deduped[0] ?? null,
    };
}
