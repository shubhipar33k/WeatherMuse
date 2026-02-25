/**
 * Unit tests for RecommendationEngine (Day 4)
 * Run: npx jest --config jest.config.js --no-coverage
 */

import { recommendTasks } from "@/lib/recommendationEngine";
import { ProductivityScore } from "@/lib/productivityEngine";

function makeScore(overrides: Partial<ProductivityScore> = {}): ProductivityScore {
    return {
        focusScore: 0.7,
        outdoorViability: 0.4,
        signal: "moderate-focus",
        reason: "Moderate conditions.",
        breakdown: {
            rainPenalty: 0.3,
            humidityPenalty: 0.1,
            windPenalty: 0.0,
            daylightBonus: 0.8,
            temperaturePenalty: 0.0,
        },
        ...overrides,
    };
}

describe("recommendTasks — output structure", () => {
    test("returns non-empty category list", () => {
        const result = recommendTasks(makeScore());
        expect(result.categories.length).toBeGreaterThan(0);
    });

    test("first category always has priority 'primary'", () => {
        const signals = ["deep-focus", "moderate-focus", "low-focus", "outdoor-optimal", "mixed"] as const;
        signals.forEach((signal) => {
            const result = recommendTasks(makeScore({ signal }));
            expect(result.categories[0].priority).toBe("primary");
        });
    });

    test("primaryBlock is a non-empty string", () => {
        const result = recommendTasks(makeScore());
        expect(result.primaryBlock.length).toBeGreaterThan(10);
    });

    test("all categories have required fields", () => {
        const result = recommendTasks(makeScore({ signal: "deep-focus" }));
        result.categories.forEach((cat) => {
            expect(cat.id).toBeTruthy();
            expect(cat.label).toBeTruthy();
            expect(cat.emoji).toBeTruthy();
            expect(cat.description).toBeTruthy();
            expect(["indoor", "outdoor", "flexible"]).toContain(cat.type);
            expect(["primary", "secondary", "optional"]).toContain(cat.priority);
        });
    });
});

describe("recommendTasks — signal routing", () => {
    test("deep-focus → indoor-heavy tasks", () => {
        const result = recommendTasks(makeScore({ signal: "deep-focus", focusScore: 0.9 }));
        const indoorCount = result.categories.filter((c) => c.type === "indoor").length;
        expect(indoorCount).toBeGreaterThan(2);
        expect(result.categories[0].id).toBe("deep_work");
    });

    test("outdoor-optimal → outdoor-heavy tasks", () => {
        const result = recommendTasks(makeScore({ signal: "outdoor-optimal", outdoorViability: 0.9 }));
        const outdoorCount = result.categories.filter((c) => c.type === "outdoor").length;
        expect(outdoorCount).toBeGreaterThan(2);
    });

    test("low-focus → includes rest category", () => {
        const result = recommendTasks(makeScore({ signal: "low-focus", focusScore: 0.3 }));
        const hasRest = result.categories.some((c) => c.id === "rest");
        expect(hasRest).toBe(true);
    });

    test("primaryBlock interpolates focus score", () => {
        const result = recommendTasks(makeScore({ signal: "deep-focus", focusScore: 0.88 }));
        expect(result.primaryBlock).toContain("88%");
    });

    test("outdoor-optimal primaryBlock interpolates outdoor viability", () => {
        const result = recommendTasks(makeScore({ signal: "outdoor-optimal", outdoorViability: 0.92 }));
        expect(result.primaryBlock).toContain("92%");
    });

    test("time hints are present on primary categories", () => {
        const result = recommendTasks(makeScore({ signal: "deep-focus" }));
        const primary = result.categories.find((c) => c.id === "deep_work");
        expect(primary?.timeHint).toBeTruthy();
    });

    test("mixed signal includes both indoor and outdoor tasks", () => {
        const result = recommendTasks(makeScore({ signal: "mixed" }));
        const types = new Set(result.categories.map((c) => c.type));
        expect(types.has("indoor")).toBe(true);
        expect(types.has("outdoor")).toBe(true);
    });
});
