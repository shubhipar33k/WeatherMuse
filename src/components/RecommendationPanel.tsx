"use client";

import { RecommendationResult, TaskCategory } from "@/lib/recommendationEngine";

interface RecommendationPanelProps {
    result: RecommendationResult;
    accentColor: string;
}

export default function RecommendationPanel({ result, accentColor }: RecommendationPanelProps) {
    return (
        <div className="recommendation-panel">
            {/* Header */}
            <div className="rec-header">
                <h3 className="section-title">Suggested Tasks</h3>
                <p className="rec-primary-block">{result.primaryBlock}</p>
            </div>

            {/* Task cards */}
            <div className="rec-task-grid">
                {result.categories.map((cat) => (
                    <TaskCard key={cat.id} task={cat} accentColor={accentColor} />
                ))}
            </div>

            {/* Secondary note */}
            {result.secondaryNote && (
                <p className="rec-secondary-note">
                    <span className="rec-note-icon">💡</span>
                    {result.secondaryNote}
                </p>
            )}
        </div>
    );
}

// ── Task Card ─────────────────────────────────────────────────────────────────

function TaskCard({ task, accentColor }: { task: TaskCategory; accentColor: string }) {
    const isPrimary = task.priority === "primary";
    const isSecondary = task.priority === "secondary";

    const borderStyle = isPrimary
        ? { borderColor: `${accentColor}60`, background: `${accentColor}12` }
        : isSecondary
            ? { borderColor: "rgba(255,255,255,0.12)" }
            : { borderColor: "rgba(255,255,255,0.07)", opacity: 0.75 };

    return (
        <div
            className={`task-card task-card--${task.priority} task-card--${task.type}`}
            style={borderStyle}
        >
            {/* Priority badge */}
            {isPrimary && (
                <span className="task-priority-badge" style={{ color: accentColor, borderColor: `${accentColor}50` }}>
                    Primary
                </span>
            )}

            {/* Emoji + label */}
            <div className="task-card-top">
                <span className="task-emoji">{task.emoji}</span>
                <div className="task-meta">
                    <p className="task-label">{task.label}</p>
                    {task.timeHint && (
                        <p className="task-time-hint" style={{ color: accentColor }}>{task.timeHint}</p>
                    )}
                </div>
                <span className={`task-type-pill task-type-pill--${task.type}`}>{task.type}</span>
            </div>

            {/* Description */}
            <p className="task-description">{task.description}</p>
        </div>
    );
}
