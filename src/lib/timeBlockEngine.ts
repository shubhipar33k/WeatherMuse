/**
 * TimeBlockEngine — Day 5
 *
 * Generates a weather-adaptive daily schedule as a sequence of time blocks.
 * Takes ProductivityScore + RecommendationResult and produces a full
 * working-day timeline anchored to the current local time.
 *
 * Rules:
 *  - Focus blocks are longer on high-focus days (90 min vs 60 min)
 *  - Breaks are automatically inserted between work blocks
 *  - Outdoor tasks are scheduled mid-day (peak warmth/light window)
 *  - Low-focus days get shorter blocks with more rest
 */

import { ProductivityScore, ProductivitySignal } from "@/lib/productivityEngine";
import { RecommendationResult, TaskCategory } from "@/lib/recommendationEngine";

// ── Types ─────────────────────────────────────────────────────────────────────

export type BlockType = "work" | "break" | "outdoor" | "rest" | "admin";

export interface TimeBlock {
    id: string;
    startTime: string;    // "09:00"
    endTime: string;      // "10:30"
    durationMinutes: number;
    label: string;
    description: string;
    emoji: string;
    type: BlockType;
    taskCategoryId?: string;
    isPrimary: boolean;
}

export interface DailySchedule {
    blocks: TimeBlock[];
    dayLabel: string;         // e.g. "Deep Focus Day"
    totalWorkMinutes: number;
    totalBreakMinutes: number;
    generatedAt: string;      // ISO timestamp
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SCHEDULE_START_HOUR = 9;   // 09:00
const SCHEDULE_END_HOUR = 18;  // 18:00
const TOTAL_SCHEDULE_MINUTES = (SCHEDULE_END_HOUR - SCHEDULE_START_HOUR) * 60;

/** Standard break between blocks */
const BREAK_DURATION = 15;       // minutes

/** Block durations per signal (work blocks) */
const BLOCK_DURATIONS: Record<ProductivitySignal, number> = {
    "deep-focus": 90,
    "moderate-focus": 60,
    "outdoor-optimal": 50,
    "mixed": 50,
    "low-focus": 40,
};

/** Day labels per signal */
const DAY_LABELS: Record<ProductivitySignal, string> = {
    "deep-focus": "Deep Focus Day",
    "moderate-focus": "Structured Work Day",
    "outdoor-optimal": "Active Day",
    "mixed": "Balanced Day",
    "low-focus": "Light Day",
};

const BREAK_BLOCK: Omit<TimeBlock, "id" | "startTime" | "endTime" | "durationMinutes"> = {
    label: "Break",
    description: "Step away, hydrate, and reset",
    emoji: "☕",
    type: "break",
    isPrimary: false,
};

const REST_BLOCK: Omit<TimeBlock, "id" | "startTime" | "endTime" | "durationMinutes"> = {
    label: "Rest",
    description: "Low-stimulation recovery time",
    emoji: "🌿",
    type: "rest",
    isPrimary: false,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert fraction-of-day minutes from schedule start into "HH:MM" */
function minutesToTimeStr(minutesFromStart: number): string {
    const total = SCHEDULE_START_HOUR * 60 + minutesFromStart;
    const h = Math.floor(total / 60) % 24;
    const m = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function blockId(index: number): string {
    return `block_${index}`;
}

function categoryToBlock(
    cat: TaskCategory,
    durationMinutes: number,
    index: number,
    startMinutes: number,
    isPrimary: boolean
): TimeBlock {
    const type: BlockType =
        cat.type === "outdoor" ? "outdoor"
            : cat.type === "flexible" ? "rest"
                : cat.id === "admin" ? "admin"
                    : "work";

    return {
        id: blockId(index),
        startTime: minutesToTimeStr(startMinutes),
        endTime: minutesToTimeStr(startMinutes + durationMinutes),
        durationMinutes,
        label: cat.label,
        description: cat.description,
        emoji: cat.emoji,
        type,
        taskCategoryId: cat.id,
        isPrimary,
    };
}

// ── Schedule builder ──────────────────────────────────────────────────────────

export function buildDailySchedule(
    score: ProductivityScore,
    recs: RecommendationResult
): DailySchedule {
    const signal = score.signal;
    const blockDur = BLOCK_DURATIONS[signal];

    // For low-focus days insert more rest; for outdoor-optimal push outdoor first
    const orderedCategories = reorderForSignal(recs.categories, signal);

    const blocks: TimeBlock[] = [];
    let cursor = 0;         // minutes from SCHEDULE_START_HOUR
    let blockIdx = 0;
    let totalWork = 0;
    let totalBreak = 0;
    let restCount = 0;

    // Special lunch break at midday
    const LUNCH_START = (12 - SCHEDULE_START_HOUR) * 60;   // 180 min from 09:00
    let lunchInserted = false;

    for (const cat of orderedCategories) {
        if (cursor >= TOTAL_SCHEDULE_MINUTES) break;

        // --- Insert lunch break around 12:00 ---
        if (!lunchInserted && cursor >= LUNCH_START) {
            const lunchDur = 45;
            blocks.push({
                ...BREAK_BLOCK,
                id: blockId(blockIdx++),
                startTime: minutesToTimeStr(cursor),
                endTime: minutesToTimeStr(cursor + lunchDur),
                durationMinutes: lunchDur,
                label: "Lunch Break",
                description: "Eat, walk, or rest before the afternoon",
                emoji: "🍱",
            });
            cursor += lunchDur;
            totalBreak += lunchDur;
            lunchInserted = true;
        }

        const available = TOTAL_SCHEDULE_MINUTES - cursor;
        if (available < 20) break;

        // Adapt block length for low-focus rest blocks
        const isRestLike = cat.type === "flexible";
        const dur = isRestLike
            ? Math.min(30, available)
            : Math.min(blockDur, available);

        if (dur < 20) break;

        const isPrimary = cat.priority === "primary";
        blocks.push(categoryToBlock(cat, dur, blockIdx++, cursor, isPrimary));
        cursor += dur;
        isRestLike ? (restCount++) : (totalWork += dur);

        // Break after every work block (except the last that fits)
        const nextAvailable = TOTAL_SCHEDULE_MINUTES - cursor;
        if (nextAvailable >= BREAK_DURATION + 20 && !isRestLike) {
            blocks.push({
                ...BREAK_BLOCK,
                id: blockId(blockIdx++),
                startTime: minutesToTimeStr(cursor),
                endTime: minutesToTimeStr(cursor + BREAK_DURATION),
                durationMinutes: BREAK_DURATION,
            });
            cursor += BREAK_DURATION;
            totalBreak += BREAK_DURATION;
        }
    }

    // Fill any remaining time with a rest block
    const remaining = TOTAL_SCHEDULE_MINUTES - cursor;
    if (remaining >= 20) {
        blocks.push({
            ...REST_BLOCK,
            id: blockId(blockIdx++),
            startTime: minutesToTimeStr(cursor),
            endTime: minutesToTimeStr(cursor + remaining),
            durationMinutes: remaining,
            label: "Wrap-Up & Wind Down",
            description: "Review the day, clear your inbox, prepare for tomorrow",
        });
    }

    return {
        blocks,
        dayLabel: DAY_LABELS[signal],
        totalWorkMinutes: totalWork,
        totalBreakMinutes: totalBreak,
        generatedAt: new Date().toISOString(),
    };
}

// ── Signal-specific reordering ────────────────────────────────────────────────

function reorderForSignal(
    cats: TaskCategory[],
    signal: ProductivitySignal
): TaskCategory[] {
    if (signal === "outdoor-optimal") {
        // Outdoor tasks first, then indoor
        return [
            ...cats.filter((c) => c.type === "outdoor"),
            ...cats.filter((c) => c.type !== "outdoor"),
        ];
    }
    if (signal === "low-focus") {
        // Flexible/rest tasks first, then light admin, nothing cognitively heavy
        return [
            ...cats.filter((c) => c.type === "flexible"),
            ...cats.filter((c) => c.id === "admin"),
            ...cats.filter((c) => c.type !== "flexible" && c.id !== "admin"),
        ];
    }
    // All other signals: primary → secondary → optional (already ordered)
    return cats;
}
