"use client";

import { DailySchedule, TimeBlock, BlockType } from "@/lib/timeBlockEngine";

interface SchedulePanelProps {
    schedule: DailySchedule;
    accentColor: string;
}

const TYPE_CONFIG: Record<BlockType, { color: string; bg: string }> = {
    work: { color: "#a5b4fc", bg: "rgba(139,122,255,0.12)" },
    outdoor: { color: "#6ee7b7", bg: "rgba(52,211,153,0.12)" },
    break: { color: "#94a3b8", bg: "rgba(148,163,184,0.08)" },
    rest: { color: "#fcd34d", bg: "rgba(251,191,36,0.08)" },
    admin: { color: "#93c5fd", bg: "rgba(147,197,253,0.10)" },
};

function formatMinutes(mins: number): string {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function SchedulePanel({ schedule, accentColor }: SchedulePanelProps) {
    const totalMin = schedule.totalWorkMinutes + schedule.totalBreakMinutes;

    return (
        <div className="schedule-panel">
            {/* Header */}
            <div className="schedule-header">
                <div>
                    <h3 className="section-title">Today&apos;s Schedule</h3>
                    <p className="schedule-day-label" style={{ color: accentColor }}>
                        {schedule.dayLabel}
                    </p>
                </div>
                <div className="schedule-summary-pills">
                    <span className="schedule-pill">🧠 {formatMinutes(schedule.totalWorkMinutes)} work</span>
                    <span className="schedule-pill">☕ {formatMinutes(schedule.totalBreakMinutes)} breaks</span>
                </div>
            </div>

            {/* Compact progress bar showing day pacing */}
            <div className="schedule-progress-track" title="Day overview">
                {schedule.blocks.map((block) => {
                    const widthPct = (block.durationMinutes / (totalMin || 1)) * 100;
                    const cfg = TYPE_CONFIG[block.type];
                    return (
                        <div
                            key={block.id}
                            className="schedule-progress-segment"
                            style={{
                                width: `${widthPct}%`,
                                background: cfg.color,
                                opacity: block.type === "break" ? 0.35 : 0.75,
                            }}
                            title={`${block.label} (${block.startTime}–${block.endTime})`}
                        />
                    );
                })}
            </div>
            <div className="schedule-progress-legend">
                {(["work", "outdoor", "break", "rest", "admin"] as BlockType[]).map((type) => {
                    const cfg = TYPE_CONFIG[type];
                    const hasType = schedule.blocks.some((b) => b.type === type);
                    if (!hasType) return null;
                    return (
                        <span key={type} className="legend-item">
                            <span className="legend-dot" style={{ background: cfg.color }} />
                            {type}
                        </span>
                    );
                })}
            </div>

            {/* Timeline */}
            <div className="schedule-timeline">
                {schedule.blocks.map((block, idx) => (
                    <TimeBlockRow
                        key={block.id}
                        block={block}
                        isLast={idx === schedule.blocks.length - 1}
                        accentColor={accentColor}
                    />
                ))}
            </div>
        </div>
    );
}

// ── Time Block Row ────────────────────────────────────────────────────────────

function TimeBlockRow({
    block, isLast, accentColor,
}: {
    block: TimeBlock; isLast: boolean; accentColor: string;
}) {
    const cfg = TYPE_CONFIG[block.type];
    const isBreak = block.type === "break" || block.type === "rest";

    return (
        <div className={`time-block-row ${isBreak ? "time-block-row--break" : ""}`}>
            {/* Time column */}
            <div className="time-block-time-col">
                <span className="time-block-start">{block.startTime}</span>
                {isLast && <span className="time-block-end">{block.endTime}</span>}
            </div>

            {/* Connector line */}
            <div className="time-block-connector">
                <div
                    className="time-block-dot"
                    style={{
                        background: block.isPrimary ? accentColor : cfg.color,
                        boxShadow: block.isPrimary ? `0 0 10px ${accentColor}60` : "none",
                    }}
                />
                {!isLast && (
                    <div className="time-block-line" style={{ background: `${cfg.color}40` }} />
                )}
            </div>

            {/* Content */}
            <div
                className="time-block-content"
                style={{ background: isBreak ? "transparent" : cfg.bg, borderColor: isBreak ? "transparent" : `${cfg.color}30` }}
            >
                <div className="time-block-content-top">
                    <span className="time-block-emoji">{block.emoji}</span>
                    <div className="time-block-text">
                        <span
                            className="time-block-label"
                            style={{ color: block.isPrimary ? accentColor : undefined }}
                        >
                            {block.label}
                            {block.isPrimary && <span className="time-block-primary-tag"> ★</span>}
                        </span>
                        {!isBreak && (
                            <span className="time-block-desc">{block.description}</span>
                        )}
                    </div>
                    <span className="time-block-dur">{formatMinutes(block.durationMinutes)}</span>
                </div>
            </div>
        </div>
    );
}
