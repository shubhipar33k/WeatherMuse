"use client";

import { WeatherFeatures, ExtractionMeta, ConditionCategory } from "@/types/weather";

interface FeaturePanelProps {
    features: WeatherFeatures;
    meta: ExtractionMeta;
    accentColor: string;
}

const CONDITION_LABELS: Record<ConditionCategory, { label: string; emoji: string }> = {
    clear: { label: "Clear", emoji: "☀️" },
    cloudy: { label: "Cloudy", emoji: "☁️" },
    precipitation: { label: "Precipitation", emoji: "🌧️" },
    storm: { label: "Storm", emoji: "⛈️" },
    snow: { label: "Snow", emoji: "❄️" },
};

export default function FeaturePanel({ features, meta, accentColor }: FeaturePanelProps) {
    const condition = CONDITION_LABELS[features.conditionCategory];
    const formattedTime = new Date(meta.extractedAt).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="feature-panel">
            {/* Header */}
            <div className="feature-panel-header">
                <h3 className="section-title">Feature Extraction</h3>
                <span className="feature-meta-badge">
                    {meta.sourceCity} · {meta.hoursAnalysed}h window · extracted {formattedTime}
                </span>
            </div>

            {/* Feature rows */}
            <div className="feature-grid">
                <FeatureRow
                    label="Temperature"
                    raw={`${features.temperature}°C`}
                    derived={`avg next ${meta.hoursAnalysed}h: ${features.avgHourlyTemp}°C`}
                    bar={normaliseTemp(features.temperature)}
                    accentColor={accentColor}
                />
                <FeatureRow
                    label="Rain Probability"
                    raw={`${features.rainProbability}%`}
                    derived={`peak: ${features.peakRainProbability}%`}
                    bar={features.rainProbability / 100}
                    accentColor={accentColor}
                />
                <FeatureRow
                    label="Humidity"
                    raw={`${features.humidity}%`}
                    bar={features.humidity / 100}
                    accentColor={accentColor}
                />
                <FeatureRow
                    label="Wind Speed"
                    raw={`${features.windSpeed} km/h`}
                    bar={Math.min(features.windSpeed / 80, 1)}
                    accentColor={accentColor}
                />
                <FeatureRow
                    label="Daylight"
                    raw={`${features.daylightHours}h`}
                    derived={`${features.daylightMinutes} min`}
                    bar={features.daylightHours / 18}
                    accentColor={accentColor}
                />
            </div>

            {/* Condition category pill */}
            <div className="feature-condition-row">
                <span className="feature-label-sm">Condition Category</span>
                <span
                    className="condition-category-pill"
                    style={{ color: accentColor, borderColor: `${accentColor}50` }}
                >
                    {condition.emoji} {condition.label}
                </span>
            </div>

            {/* Pipeline hint */}
            <p className="feature-pipeline-note">
                ↓ These features feed the <strong>ProductivityEngine</strong> (Day 3)
            </p>
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface FeatureRowProps {
    label: string;
    raw: string;
    derived?: string;
    bar: number;         // 0–1
    accentColor: string;
}

function FeatureRow({ label, raw, derived, bar, accentColor }: FeatureRowProps) {
    const clampedBar = Math.max(0, Math.min(1, bar));
    return (
        <div className="feature-row">
            <div className="feature-row-top">
                <span className="feature-label-sm">{label}</span>
                <span className="feature-value-sm">{raw}{derived && <span className="feature-derived"> · {derived}</span>}</span>
            </div>
            <div className="feature-bar-track">
                <div
                    className="feature-bar-fill"
                    style={{ width: `${Math.round(clampedBar * 100)}%`, background: accentColor }}
                    role="meter"
                    aria-valuenow={Math.round(clampedBar * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                />
            </div>
        </div>
    );
}

// ── Utilities ─────────────────────────────────────────────────────────────────

/** Normalise temperature to a 0–1 bar value (maps −20°C → 0, 40°C → 1) */
function normaliseTemp(temp: number): number {
    return (temp + 20) / 60;
}
