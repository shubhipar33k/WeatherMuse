"use client";

import { BaselineResult, TrendDirection } from "@/lib/baselineEngine";

interface BaselinePanelProps {
    baseline: BaselineResult;
    accentColor: string;
}

const TREND_ICONS: Record<TrendDirection, string> = {
    up: "↑",
    down: "↓",
    stable: "→",
};

const TREND_COLORS: Record<TrendDirection, string> = {
    up: "rgba(110,231,183,0.9)",
    down: "rgba(248,113,113,0.9)",
    stable: "rgba(148,163,184,0.8)",
};

function formatDelta(delta: number, pct: number): string {
    const sign = delta >= 0 ? "+" : "";
    return `${sign}${pct}%`;
}

export default function BaselinePanel({ baseline, accentColor }: BaselinePanelProps) {
    const hasData = !baseline.insufficientData;

    return (
        <div className="baseline-panel">
            {/* Header */}
            <div className="baseline-header">
                <h3 className="section-title">Personal Baseline</h3>
                <span className="baseline-window-badge">
                    {hasData ? `${baseline.daysUsed}-day avg` : "Building baseline…"}
                </span>
            </div>

            {/* Summary text */}
            <p className="baseline-summary">{baseline.summary}</p>

            {/* Delta rows — only meaningful when we have enough data */}
            {hasData ? (
                <div className="baseline-deltas">
                    <DeltaRow
                        label="Focus Score"
                        avgValue={baseline.avgFocus}
                        delta={baseline.focusDelta}
                        deltaPct={baseline.focusDeltaPct}
                        trend={baseline.focusTrend}
                        accentColor={accentColor}
                    />
                    <div className="baseline-divider" />
                    <DeltaRow
                        label="Outdoor Viability"
                        avgValue={baseline.avgOutdoor}
                        delta={baseline.outdoorDelta}
                        deltaPct={baseline.outdoorDeltaPct}
                        trend={baseline.outdoorTrend}
                        accentColor={accentColor}
                    />
                </div>
            ) : (
                <BaselineProgress daysUsed={baseline.daysUsed} accentColor={accentColor} />
            )}
        </div>
    );
}

// ── Delta Row ─────────────────────────────────────────────────────────────────

function DeltaRow({
    label, avgValue, delta, deltaPct, trend, accentColor,
}: {
    label: string;
    avgValue: number;
    delta: number;
    deltaPct: number;
    trend: TrendDirection;
    accentColor: string;
}) {
    const trendColor = TREND_COLORS[trend];
    const icon = TREND_ICONS[trend];
    const avgPct = Math.round(avgValue * 100);

    return (
        <div className="delta-row">
            <div className="delta-row-top">
                <span className="delta-label">{label}</span>
                <div className="delta-right">
                    {/* Trend arrow + delta */}
                    <span className="delta-change" style={{ color: trendColor }}>
                        {icon} {formatDelta(delta, deltaPct)}
                    </span>
                </div>
            </div>

            {/* Baseline bar showing the 7-day average */}
            <div className="delta-bar-row">
                <span className="delta-avg-label">avg {avgPct}%</span>
                <div className="delta-bar-track">
                    {/* Historical average fill */}
                    <div
                        className="delta-bar-baseline"
                        style={{ width: `${avgPct}%`, background: "rgba(255,255,255,0.15)" }}
                    />
                    {/* Delta marker — overlaid offset to show today's position */}
                    {delta !== 0 && (
                        <div
                            className="delta-bar-marker"
                            style={{
                                left: `${Math.max(0, Math.min(100, avgPct + deltaPct * avgPct / 100))}%`,
                                background: trendColor,
                            }}
                        />
                    )}
                </div>
                <span className="delta-today-label" style={{ color: accentColor }}>
                    today {Math.round((avgValue + delta) * 100)}%
                </span>
            </div>
        </div>
    );
}

// ── Progress toward first baseline ───────────────────────────────────────────

function BaselineProgress({ daysUsed, accentColor }: { daysUsed: number; accentColor: string }) {
    const progress = Math.round((daysUsed / 3) * 100);

    return (
        <div className="baseline-progress-wrap">
            <div className="baseline-progress-track">
                <div
                    className="baseline-progress-fill"
                    style={{ width: `${progress}%`, background: accentColor }}
                />
            </div>
            <p className="baseline-progress-label">
                {daysUsed}/3 days recorded to unlock baseline insights
            </p>
        </div>
    );
}
