/**
 * Unit tests for TimeBlockEngine (Day 5)
 * Run: npx jest --config jest.config.js --no-coverage
 */

import { buildDailySchedule } from "@/lib/timeBlockEngine";
import { ProductivityScore } from "@/lib/productivityEngine";
import { RecommendationResult, TaskCategory } from "@/lib/recommendationEngine";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeScore(overrides: Partial<ProductivityScore> = {}): ProductivityScore {
    return {
        focusScore: 0.75,
        outdoorViability: 0.4,
        signal: "deep-focus",
        reason: "Rain probability 80% — ideal for deep work.",
        breakdown: {
            rainPenalty: 0.8,
            humidityPenalty: 0.1,
            windPenalty: 0.0,
            daylightBonus: 0.7,
            temperaturePenalty: 0.0,
        },
        ...overrides,
    };
}

function makeCategory(id: string, type: "indoor" | "outdoor" | "flexible", priority: "primary" | "secondary" | "optional" = "secondary"): TaskCategory {
    return {
        id,
        label: id.replace("_", " "),
        description: `Do some ${id}`,
        emoji: "📝",
        type,
        priority,
    };
}

function makeRecs(cats: TaskCategory[]): RecommendationResult {
    return {
        categories: cats,
        primaryBlock: "Test block",
        secondaryNote: "Test note",
    };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("buildDailySchedule — structure", () => {
    test("returns a schedule with at least one block", () => {
        const cats = [
            makeCategory("deep_work", "indoor", "primary"),
            makeCategory("study", "indoor"),
        ];
        const schedule = buildDailySchedule(makeScore(), makeRecs(cats));
        expect(schedule.blocks.length).toBeGreaterThan(0);
    });

    test("schedule has a dayLabel", () => {
        const schedule = buildDailySchedule(makeScore(), makeRecs([makeCategory("deep_work", "indoor", "primary")]));
        expect(schedule.dayLabel).toBe("Deep Focus Day");
    });

    test("all signals produce a dayLabel", () => {
        const signals = ["deep-focus", "moderate-focus", "outdoor-optimal", "mixed", "low-focus"] as const;
        const cat = [makeCategory("study", "indoor", "primary")];
        signals.forEach((signal) => {
            const s = buildDailySchedule(makeScore({ signal }), makeRecs(cat));
            expect(s.dayLabel.length).toBeGreaterThan(0);
        });
    });

    test("generatedAt is a valid ISO timestamp", () => {
        const schedule = buildDailySchedule(makeScore(), makeRecs([makeCategory("study", "indoor", "primary")]));
        expect(new Date(schedule.generatedAt).getFullYear()).toBeGreaterThan(2020);
    });
});

describe("buildDailySchedule — time formatting", () => {
    test("blocks start at 09:00 or later", () => {
        const cats = [makeCategory("deep_work", "indoor", "primary")];
        const schedule = buildDailySchedule(makeScore(), makeRecs(cats));
        const firstStart = schedule.blocks[0].startTime;
        const [h] = firstStart.split(":").map(Number);
        expect(h).toBeGreaterThanOrEqual(9);
    });

    test("each block's endTime > startTime", () => {
        const cats = [
            makeCategory("deep_work", "indoor", "primary"),
            makeCategory("study", "indoor"),
            makeCategory("writing", "indoor"),
        ];
        const schedule = buildDailySchedule(makeScore(), makeRecs(cats));
        schedule.blocks.forEach((block) => {
            const [sh, sm] = block.startTime.split(":").map(Number);
            const [eh, em] = block.endTime.split(":").map(Number);
            const startMin = sh * 60 + sm;
            const endMin = eh * 60 + em;
            expect(endMin).toBeGreaterThan(startMin);
        });
    });

    test("no block extends past 18:00", () => {
        const cats = Array.from({ length: 10 }, (_, i) =>
            makeCategory(`task_${i}`, "indoor", i === 0 ? "primary" : "secondary")
        );
        const schedule = buildDailySchedule(makeScore(), makeRecs(cats));
        schedule.blocks.forEach((block) => {
            const [h, m] = block.endTime.split(":").map(Number);
            const endMin = h * 60 + m;
            expect(endMin).toBeLessThanOrEqual(18 * 60);
        });
    });

    test("consecutive block times are contiguous (no gaps)", () => {
        const cats = [
            makeCategory("deep_work", "indoor", "primary"),
            makeCategory("study", "indoor"),
        ];
        const schedule = buildDailySchedule(makeScore(), makeRecs(cats));
        for (let i = 1; i < schedule.blocks.length; i++) {
            expect(schedule.blocks[i].startTime).toBe(schedule.blocks[i - 1].endTime);
        }
    });
});

describe("buildDailySchedule — block types", () => {
    test("schedule includes break blocks", () => {
        const cats = [
            makeCategory("deep_work", "indoor", "primary"),
            makeCategory("study", "indoor"),
        ];
        const schedule = buildDailySchedule(makeScore(), makeRecs(cats));
        const hasBreak = schedule.blocks.some((b) => b.type === "break");
        expect(hasBreak).toBe(true);
    });

    test("outdoor tasks map to type 'outdoor'", () => {
        const cats = [
            makeCategory("exercise", "outdoor", "primary"),
            makeCategory("errands", "outdoor"),
        ];
        const schedule = buildDailySchedule(makeScore({ signal: "outdoor-optimal" }), makeRecs(cats));
        const outdoorBlocks = schedule.blocks.filter((b) => b.type === "outdoor");
        expect(outdoorBlocks.length).toBeGreaterThan(0);
    });

    test("outdoor-optimal signal puts outdoor blocks first", () => {
        const cats = [
            makeCategory("study", "indoor"),
            makeCategory("exercise", "outdoor", "primary"),
        ];
        const schedule = buildDailySchedule(makeScore({ signal: "outdoor-optimal" }), makeRecs(cats));
        const workBlocks = schedule.blocks.filter((b) => b.type !== "break");
        const firstWork = workBlocks[0];
        expect(firstWork.type).toBe("outdoor");
    });

    test("primary block has isPrimary=true", () => {
        const cats = [
            makeCategory("deep_work", "indoor", "primary"),
            makeCategory("study", "indoor"),
        ];
        const schedule = buildDailySchedule(makeScore(), makeRecs(cats));
        const primaryBlock = schedule.blocks.find((b) => b.isPrimary);
        expect(primaryBlock).toBeDefined();
        expect(primaryBlock?.taskCategoryId).toBe("deep_work");
    });

    test("totalWorkMinutes is positive", () => {
        const schedule = buildDailySchedule(makeScore(), makeRecs([makeCategory("study", "indoor", "primary")]));
        expect(schedule.totalWorkMinutes).toBeGreaterThan(0);
    });

    test("deep-focus blocks are longer than low-focus blocks", () => {
        const cats = [makeCategory("study", "indoor", "primary")];
        const deepSchedule = buildDailySchedule(makeScore({ signal: "deep-focus" }), makeRecs(cats));
        const lightSchedule = buildDailySchedule(makeScore({ signal: "low-focus" }), makeRecs(cats));

        const deepWork = deepSchedule.blocks.find((b) => b.type === "work");
        const lightWork = lightSchedule.blocks.find((b) => b.type !== "break");

        // deep-focus = 90 min blocks, low-focus = 40 min blocks
        expect(deepWork!.durationMinutes).toBeGreaterThan(lightWork!.durationMinutes);
    });
});
