/**
 * RecommendationEngine — Day 4
 *
 * Maps ProductivityScore signals into concrete, ordered task category
 * suggestions. Each suggestion carries a label, description, priority,
 * and an optional time hint (e.g. "09:00–11:00").
 *
 * Designed as a pure function layer on top of ProductivityEngine output —
 * no weather data needed here, only the computed scores.
 */

import { ProductivityScore, ProductivitySignal } from "@/lib/productivityEngine";

// ── Output types ──────────────────────────────────────────────────────────────

export interface TaskCategory {
    id: string;
    label: string;
    description: string;
    emoji: string;
    priority: "primary" | "secondary" | "optional";
    timeHint?: string;          // e.g. "09:00–11:00"
    type: "indoor" | "outdoor" | "flexible";
}

export interface RecommendationResult {
    categories: TaskCategory[];
    primaryBlock: string;       // headline scheduling advice
    secondaryNote?: string;     // supplementary note
}

// ── Task library ──────────────────────────────────────────────────────────────

const TASK_LIBRARY: Record<string, Omit<TaskCategory, "priority" | "timeHint">> = {
    deep_work: {
        id: "deep_work",
        label: "Deep Work",
        description: "Sustained, distraction-free cognitive effort",
        emoji: "🎯",
        type: "indoor",
    },
    study: {
        id: "study",
        label: "Study",
        description: "Reading, research, or skill acquisition",
        emoji: "📚",
        type: "indoor",
    },
    writing: {
        id: "writing",
        label: "Writing",
        description: "Drafting, journaling, or creative writing",
        emoji: "✍️",
        type: "indoor",
    },
    planning: {
        id: "planning",
        label: "Planning",
        description: "Reviewing goals, scheduling, and organising",
        emoji: "📋",
        type: "indoor",
    },
    admin: {
        id: "admin",
        label: "Admin Tasks",
        description: "Emails, filing, and low-cognition housekeeping",
        emoji: "📁",
        type: "indoor",
    },
    creative: {
        id: "creative",
        label: "Creative Work",
        description: "Design, brainstorming, or art projects",
        emoji: "🎨",
        type: "indoor",
    },
    errands: {
        id: "errands",
        label: "Errands",
        description: "Shopping, appointments, and outdoor tasks",
        emoji: "🛍️",
        type: "outdoor",
    },
    exercise: {
        id: "exercise",
        label: "Exercise",
        description: "Running, cycling, or an outdoor workout",
        emoji: "🏃",
        type: "outdoor",
    },
    social: {
        id: "social",
        label: "Social Plans",
        description: "Meeting friends or outdoor social activities",
        emoji: "👥",
        type: "outdoor",
    },
    nature: {
        id: "nature",
        label: "Nature & Walking",
        description: "A walk, park visit, or outdoor mindfulness",
        emoji: "🌿",
        type: "outdoor",
    },
    light_tasks: {
        id: "light_tasks",
        label: "Light Tasks",
        description: "Low-effort work: tidying, podcasts, short reads",
        emoji: "🌫️",
        type: "flexible",
    },
    rest: {
        id: "rest",
        label: "Rest & Recovery",
        description: "Slow down — recharge for higher focus later",
        emoji: "☕",
        type: "flexible",
    },
};

// ── Signal → Task mapping ────────────────────────────────────────────────────

type SignalMapping = {
    categories: (keyof typeof TASK_LIBRARY)[];
    primaryTimes: Partial<Record<keyof typeof TASK_LIBRARY, string>>;
    primaryBlock: (score: ProductivityScore) => string;
    secondaryNote?: (score: ProductivityScore) => string;
};

const SIGNAL_MAPPINGS: Record<ProductivitySignal, SignalMapping> = {
    "deep-focus": {
        categories: ["deep_work", "study", "writing", "planning", "creative"],
        primaryTimes: {
            deep_work: "09:00–11:00",
            study: "11:00–13:00",
            writing: "14:00–16:00",
        },
        primaryBlock: (s) =>
            `Deep work block recommended. Schedule your most demanding task first. Focus score: ${Math.round(s.focusScore * 100)}%.`,
        secondaryNote: () =>
            "Keep notifications off. Break at 90-minute intervals.",
    },

    "moderate-focus": {
        categories: ["study", "planning", "writing", "admin", "creative"],
        primaryTimes: {
            planning: "09:00–10:30",
            study: "10:30–12:00",
            admin: "14:00–15:30",
        },
        primaryBlock: (s) =>
            `Good conditions for structured work. Interleave moderate-intensity tasks. Focus: ${Math.round(s.focusScore * 100)}%.`,
        secondaryNote: () =>
            "Avoid ultra-demanding tasks — save those for a higher-focus day.",
    },

    "outdoor-optimal": {
        categories: ["exercise", "errands", "social", "nature", "planning"],
        primaryTimes: {
            exercise: "08:00–09:30",
            errands: "10:00–12:00",
            social: "14:00–17:00",
        },
        primaryBlock: (s) =>
            `Clear outdoor window. Prioritise errands and physical activity now. Outdoor viability: ${Math.round(s.outdoorViability * 100)}%.`,
        secondaryNote: () =>
            "Indoor cognitive tasks can follow the outdoor block in the afternoon.",
    },

    "mixed": {
        categories: ["planning", "admin", "errands", "study", "light_tasks"],
        primaryTimes: {
            planning: "09:00–10:00",
            errands: "12:00–14:00",
            admin: "15:00–16:30",
        },
        primaryBlock: (s) =>
            `Mixed conditions. Alternate indoor and outdoor tasks. Focus: ${Math.round(s.focusScore * 100)}% · Outdoor: ${Math.round(s.outdoorViability * 100)}%.`,
        secondaryNote: () =>
            "Monitor conditions — dry windows may open for outdoor tasks.",
    },

    "low-focus": {
        categories: ["light_tasks", "rest", "admin", "planning"],
        primaryTimes: {
            light_tasks: "10:00–12:00",
            rest: "14:00–15:00",
        },
        primaryBlock: (s) =>
            `Conditions suggest lower cognitive energy today. Favour light work. Focus: ${Math.round(s.focusScore * 100)}%.`,
        secondaryNote: () =>
            "Use this time for catch-up tasks or to prepare for tomorrow.",
    },
};

// ── Main engine ───────────────────────────────────────────────────────────────

export function recommendTasks(score: ProductivityScore): RecommendationResult {
    const mapping = SIGNAL_MAPPINGS[score.signal];

    const categories: TaskCategory[] = mapping.categories.map((id, index) => ({
        ...TASK_LIBRARY[id],
        priority: index === 0 ? "primary" : index <= 2 ? "secondary" : "optional",
        timeHint: mapping.primaryTimes[id],
    }));

    return {
        categories,
        primaryBlock: mapping.primaryBlock(score),
        secondaryNote: mapping.secondaryNote?.(score),
    };
}
