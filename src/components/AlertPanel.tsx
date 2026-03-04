"use client";

import { AlertResult, WeatherAlert, AlertSeverity } from "@/lib/alertEngine";

interface AlertPanelProps {
    alertResult: AlertResult;
    accentColor: string;
}

const SEVERITY_STYLES: Record<AlertSeverity, {
    bg: string; border: string; iconBg: string; textColor: string;
}> = {
    danger: {
        bg: "rgba(239, 68, 68, 0.08)",
        border: "rgba(239, 68, 68, 0.30)",
        iconBg: "rgba(239, 68, 68, 0.18)",
        textColor: "rgba(252,165,165,0.95)",
    },
    warning: {
        bg: "rgba(251, 191, 36, 0.07)",
        border: "rgba(251, 191, 36, 0.28)",
        iconBg: "rgba(251, 191, 36, 0.15)",
        textColor: "rgba(253,230,138,0.95)",
    },
    info: {
        bg: "rgba(99, 179, 255, 0.07)",
        border: "rgba(99, 179, 255, 0.22)",
        iconBg: "rgba(99, 179, 255, 0.14)",
        textColor: "rgba(186,230,253,0.95)",
    },
};

export default function AlertPanel({ alertResult, accentColor }: AlertPanelProps) {
    const { alerts } = alertResult;

    if (alerts.length === 0) return null;   // nothing to show → render nothing

    const hasDanger = alertResult.hasDangers;
    const hasWarning = alertResult.hasWarnings;

    const panelLabel = hasDanger
        ? "⚠ Weather Alerts"
        : hasWarning
            ? "⚡ Weather Heads-Up"
            : "ℹ Weather Notices";

    return (
        <div className={`alert-panel ${hasDanger ? "alert-panel--danger" : hasWarning ? "alert-panel--warning" : ""}`}>
            <div className="alert-panel-header">
                <h3 className="section-title">{panelLabel}</h3>
                <span className="alert-count-badge" style={{ color: accentColor }}>
                    {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
                </span>
            </div>

            <div className="alert-list">
                {alerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} />
                ))}
            </div>
        </div>
    );
}

// ── Alert Card ────────────────────────────────────────────────────────────────

function AlertCard({ alert }: { alert: WeatherAlert }) {
    const style = SEVERITY_STYLES[alert.severity];

    return (
        <div
            className="alert-card"
            style={{
                background: style.bg,
                borderColor: style.border,
            }}
        >
            {/* Icon */}
            <div
                className="alert-icon"
                style={{ background: style.iconBg }}
            >
                <span className="alert-emoji">{alert.emoji}</span>
            </div>

            {/* Content */}
            <div className="alert-content">
                <div className="alert-top-row">
                    <span className="alert-title" style={{ color: style.textColor }}>
                        {alert.title}
                    </span>
                    <span className="alert-time-chip">
                        {alert.hoursFromNow === 0 ? "now" : `+${alert.hoursFromNow}h`}
                    </span>
                </div>
                <p className="alert-body">{alert.body}</p>
                <div className="alert-meta">
                    <span className="alert-trigger-time">📍 {alert.triggerTime}</span>
                    <SeverityPill severity={alert.severity} color={style.textColor} />
                </div>
            </div>
        </div>
    );
}

// ── Severity pill ─────────────────────────────────────────────────────────────

function SeverityPill({ severity, color }: { severity: AlertSeverity; color: string }) {
    const labels: Record<AlertSeverity, string> = {
        danger: "DANGER",
        warning: "WARNING",
        info: "INFO",
    };
    return (
        <span
            className="alert-severity-pill"
            style={{ color, borderColor: color }}
        >
            {labels[severity]}
        </span>
    );
}
