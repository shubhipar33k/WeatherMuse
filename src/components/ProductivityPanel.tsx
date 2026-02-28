"use client";

import { ProductivityScore, ProductivitySignal } from "@/lib/productivityEngine";
import { ConfidenceBand } from "@/lib/scoringModel";

interface ProductivityPanelProps {
    score: ProductivityScore;
    accentColor: string;
}

const SIGNAL_CONFIG: Record<ProductivitySignal, { label: string; icon: string; tagline: string }> = {
    "deep-focus": { label: "Deep Focus", icon: "🎯", tagline: "Optimal for sustained cognitive work" },
    "moderate-focus": { label: "Moderate Focus", icon: "📖", tagline: "Good for structured tasks and planning" },
    "low-focus": { label: "Low Focus", icon: "🌫️", tagline: "Favour light tasks and rest" },
    "outdoor-optimal": { label: "Outdoor Optimal", icon: "🌿", tagline: "Ideal window for outdoor activity" },
    "mixed": { label: "Mixed Conditions", icon: "⚖️", tagline: "Interleave indoor and outdoor tasks" },
};

const CONFIDENCE_COLORS: Record<ConfidenceBand, { color: string; label: string }> = {
    high: { color: "rgba(110,231,183,0.85)", label: "High confidence" },
    medium: { color: "rgba(251,191,36,0.85)", label: "Medium confidence" },
    low: { color: "rgba(248,113,113,0.85)", label: "Low confidence — check forecast" },
};

export default function ProductivityPanel({ score, accentColor }: ProductivityPanelProps) {
    const cfg = SIGNAL_CONFIG[score.signal];
    const confCfg = CONFIDENCE_COLORS[score.confidenceBand];
    const focusPct = Math.round(score.focusScore * 100);
    const outdoorPct = Math.round(score.outdoorViability * 100);
    const focusUncPct = Math.round(score.focusUncertainty * 100);
    const outUncPct = Math.round(score.outdoorUncertainty * 100);

    return (
        <div className="productivity-panel">
            {/* Signal header */}
            <div className="prod-header">
                <div className="prod-signal-row">
                    <span className="prod-icon">{cfg.icon}</span>
                    <div>
                        <p className="prod-signal-label" style={{ color: accentColor }}>{cfg.label}</p>
                        <p className="prod-tagline">{cfg.tagline}</p>
                    </div>
                </div>
                <div className="prod-header-right">
                    <h3 className="section-title">Productivity Signal</h3>
                    {/* Day 6: Confidence badge */}
                    <span
                        className="confidence-badge"
                        style={{ color: confCfg.color, borderColor: confCfg.color }}
                        title={`Model confidence: ${Math.round(score.confidence * 100)}%`}
                    >
                        ◉ {confCfg.label}
                    </span>
                </div>
            </div>

            {/* Reason */}
            <p className="prod-reason">{score.reason}</p>

            {/* Score pair */}
            <div className="prod-scores">
                <ScoreGauge
                    label="Focus Score"
                    value={focusPct}
                    uncertainty={focusUncPct}
                    accentColor={accentColor}
                    description="Indoor cognitive potential"
                />
                <div className="prod-divider" />
                <ScoreGauge
                    label="Outdoor Viability"
                    value={outdoorPct}
                    uncertainty={outUncPct}
                    accentColor={accentColor}
                    description="Conditions for going outside"
                />
            </div>

            {/* Breakdown */}
            <details className="prod-breakdown">
                <summary className="prod-breakdown-toggle">View scoring breakdown</summary>
                <div className="prod-breakdown-grid">
                    <BreakdownRow label="Rain penalty" value={score.breakdown.rainPenalty} inverse />
                    <BreakdownRow label="Humidity penalty" value={score.breakdown.humidityPenalty} inverse />
                    <BreakdownRow label="Wind penalty" value={score.breakdown.windPenalty} inverse />
                    <BreakdownRow label="Daylight bonus" value={score.breakdown.daylightBonus} />
                    <BreakdownRow label="Temp penalty" value={score.breakdown.temperaturePenalty} inverse />
                </div>
            </details>
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreGauge({
    label, value, uncertainty, accentColor, description,
}: {
    label: string; value: number; uncertainty?: number; accentColor: string; description: string;
}) {
    return (
        <div className="score-gauge">
            <div className="gauge-top">
                <span className="gauge-label">{label}</span>
                <span className="gauge-pct" style={{ color: accentColor }}>{value}<span className="gauge-pct-sign">%</span></span>
            </div>
            <div className="gauge-track">
                <div
                    className="gauge-fill"
                    style={{ width: `${value}%`, background: accentColor }}
                    role="meter"
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={100}
                />
            </div>
            {uncertainty !== undefined && uncertainty > 0 && (
                <span className="gauge-uncertainty">
                    ±{uncertainty}% uncertainty
                </span>
            )}
            <span className="gauge-desc">{description}</span>
        </div>
    );
}

function BreakdownRow({ label, value, inverse }: { label: string; value: number; inverse?: boolean }) {
    const pct = Math.round(value * 100);
    const color = inverse
        ? `rgba(248, 113, 113, ${0.4 + value * 0.5})`
        : `rgba(110, 231, 183, ${0.4 + value * 0.5})`;
    return (
        <div className="breakdown-row">
            <span className="breakdown-label">{label}</span>
            <div className="breakdown-bar-track">
                <div className="breakdown-bar-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="breakdown-val">{value.toFixed(2)}</span>
        </div>
    );
}
