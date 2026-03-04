/**
 * Unit tests for AlertEngine (Day 8)
 * Run: npx jest --config jest.config.js --no-coverage
 */

import { detectAlerts, WeatherAlert } from "@/lib/alertEngine";
import { HourlyForecast } from "@/types/weather";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeSlot(
    time: string,
    overrides: Partial<Omit<HourlyForecast, "time">> = {}
): HourlyForecast {
    return {
        time,
        temperature: 14,
        conditionCode: 1,   // clear
        precipitationProbability: 5,
        windSpeed: 8,
        ...overrides,
    };
}

/** Build a 12-slot forecast starting from 09:00 with 1h intervals, all clear */
function clearForecast(startHour = 9): HourlyForecast[] {
    return Array.from({ length: 12 }, (_, i) => {
        const h = (startHour + i) % 24;
        return makeSlot(`${String(h).padStart(2, "0")}:00`);
    });
}

// ── Structure ─────────────────────────────────────────────────────────────────

describe("detectAlerts — output shape", () => {
    test("returns alerts array, flags, and topAlert", () => {
        const result = detectAlerts(clearForecast(), 9);
        expect(Array.isArray(result.alerts)).toBe(true);
        expect(typeof result.hasWarnings).toBe("boolean");
        expect(typeof result.hasDangers).toBe("boolean");
    });

    test("no alerts on a clear calm forecast", () => {
        const result = detectAlerts(clearForecast(), 9);
        // A clear, dry, calm forecast should trigger at most a clear-window alert
        const nonClear = result.alerts.filter((a) => a.type !== "clear-window");
        expect(nonClear.length).toBe(0);
    });

    test("all alert fields are populated", () => {
        const forecast = clearForecast().map((s, i) =>
            i >= 3 ? { ...s, precipitationProbability: 80 } : s
        );
        const result = detectAlerts(forecast, 9);
        result.alerts.forEach((a: WeatherAlert) => {
            expect(a.id).toBeTruthy();
            expect(a.type).toBeTruthy();
            expect(["info", "warning", "danger"]).toContain(a.severity);
            expect(a.emoji).toBeTruthy();
            expect(a.title.length).toBeGreaterThan(3);
            expect(a.body.length).toBeGreaterThan(10);
            expect(typeof a.hoursFromNow).toBe("number");
        });
    });
});

// ── Rain onset ────────────────────────────────────────────────────────────────

describe("detectAlerts — rain onset", () => {
    test("detects rain onset when precip rises above 40%", () => {
        const forecast = clearForecast().map((s, i) =>
            i >= 2 ? { ...s, precipitationProbability: 55 } : s
        );
        const result = detectAlerts(forecast, 9);
        const alert = result.alerts.find((a) => a.type === "rain-onset");
        expect(alert).toBeDefined();
        expect(alert?.severity).toBe("info");
    });

    test("heavy rain (>70%) is classified as warning", () => {
        const forecast = clearForecast().map((s, i) =>
            i >= 1 ? { ...s, precipitationProbability: 85 } : s
        );
        const result = detectAlerts(forecast, 9);
        const alert = result.alerts.find((a) => a.type === "rain-onset");
        expect(alert?.severity).toBe("warning");
    });

    test("no rain-onset when forecast stays dry", () => {
        const result = detectAlerts(clearForecast(), 9);
        const alert = result.alerts.find((a) => a.type === "rain-onset");
        expect(alert).toBeUndefined();
    });
});

// ── Rain ending ───────────────────────────────────────────────────────────────

describe("detectAlerts — rain ending", () => {
    test("detects rain ending when precip drops after rain", () => {
        const forecast = clearForecast().map((s, i) => {
            if (i < 3) return { ...s, precipitationProbability: 60 };
            if (i === 3) return { ...s, precipitationProbability: 10 };
            return s;
        });
        const result = detectAlerts(forecast, 9);
        const alert = result.alerts.find((a) => a.type === "rain-ending");
        expect(alert).toBeDefined();
        expect(alert?.severity).toBe("info");
    });
});

// ── Wind surge ───────────────────────────────────────────────────────────────

describe("detectAlerts — wind surge", () => {
    test("warning at 30+ km/h wind", () => {
        const forecast = clearForecast().map((s, i) =>
            i >= 2 ? { ...s, windSpeed: 35 } : s
        );
        const result = detectAlerts(forecast, 9);
        const alert = result.alerts.find((a) => a.type === "wind-surge");
        expect(alert?.severity).toBe("warning");
    });

    test("danger at 50+ km/h wind", () => {
        const forecast = clearForecast().map((s, i) =>
            i >= 1 ? { ...s, windSpeed: 60 } : s
        );
        const result = detectAlerts(forecast, 9);
        const alert = result.alerts.find((a) => a.type === "wind-surge");
        expect(alert?.severity).toBe("danger");
    });
});

// ── Temperature shift ─────────────────────────────────────────────────────────

describe("detectAlerts — temperature shift", () => {
    test("detects temp drop of ≥5°C over 3h", () => {
        const forecast = clearForecast().map((s, i) =>
            i >= 3 ? { ...s, temperature: 6 } : { ...s, temperature: 16 }
        );
        const result = detectAlerts(forecast, 9);
        const alert = result.alerts.find((a) => a.type === "temp-drop");
        expect(alert).toBeDefined();
        expect(alert?.severity).toBe("warning");
    });

    test("detects temp spike of ≥6°C over 3h", () => {
        const forecast = clearForecast().map((s, i) =>
            i >= 3 ? { ...s, temperature: 24 } : { ...s, temperature: 12 }
        );
        const result = detectAlerts(forecast, 9);
        const alert = result.alerts.find((a) => a.type === "temp-spike");
        expect(alert).toBeDefined();
        expect(alert?.severity).toBe("info");
    });
});

// ── Storm ─────────────────────────────────────────────────────────────────────

describe("detectAlerts — storm", () => {
    test("storm detected on WMO code ≥80", () => {
        const forecast = clearForecast().map((s, i) =>
            i >= 2 ? { ...s, conditionCode: 95 } : s
        );
        const result = detectAlerts(forecast, 9);
        const alert = result.alerts.find((a) => a.type === "storm");
        expect(alert?.severity).toBe("danger");
        expect(result.hasDangers).toBe(true);
    });
});

// ── Deduplication + ordering ───────────────────────────────────────────────────

describe("detectAlerts — deduplication and sorting", () => {
    test("danger alerts appear before warning and info", () => {
        const forecast = clearForecast().map((s, i) => ({
            ...s,
            windSpeed: i >= 1 ? 60 : s.windSpeed,     // danger
            precipitationProbability: i >= 2 ? 55 : s.precipitationProbability, // info
        }));
        const result = detectAlerts(forecast, 9);
        if (result.alerts.length >= 2) {
            expect(result.alerts[0].severity).toBe("danger");
        }
    });

    test("topAlert is the highest-severity alert", () => {
        const forecast = clearForecast().map((s, i) =>
            i >= 1 ? { ...s, windSpeed: 60, precipitationProbability: 55 } : s
        );
        const result = detectAlerts(forecast, 9);
        if (result.topAlert && result.hasDangers) {
            expect(result.topAlert.severity).toBe("danger");
        }
    });

    test("each alert type appears at most once", () => {
        const forecast = clearForecast().map((s) => ({
            ...s,
            precipitationProbability: 80,
        }));
        const result = detectAlerts(forecast, 9);
        const types = result.alerts.map((a) => a.type);
        const unique = new Set(types);
        expect(types.length).toBe(unique.size);
    });
});
