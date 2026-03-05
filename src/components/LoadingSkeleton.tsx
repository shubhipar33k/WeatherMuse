"use client";

/**
 * LoadingSkeleton — Day 9
 *
 * Replaces the plain text loading state with shimmer placeholder cards that
 * match the approximate shape of the real dashboard content.
 */
export default function LoadingSkeleton() {
    return (
        <div className="skeleton-container">
            {/* Weather card skeleton */}
            <div className="skeleton-card skeleton-card--tall">
                <div className="skeleton-line skeleton-line--sm" />
                <div className="skeleton-temp" />
                <div className="skeleton-line skeleton-line--md" style={{ marginTop: "auto" }} />
                <div className="skeleton-stats-row">
                    <div className="skeleton-stat" />
                    <div className="skeleton-stat" />
                    <div className="skeleton-stat" />
                </div>
            </div>

            {/* Hourly forecast skeleton */}
            <div className="skeleton-card skeleton-card--hourly">
                <div className="skeleton-line skeleton-line--sm" />
                <div className="skeleton-hourly-row">
                    {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} className="skeleton-hour-slot">
                            <div className="skeleton-dot" />
                            <div className="skeleton-dot skeleton-dot--small" />
                            <div className="skeleton-dot skeleton-dot--small" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Panel skeletons */}
            {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="skeleton-card">
                    <div className="skeleton-line skeleton-line--sm" />
                    <div className="skeleton-line skeleton-line--lg" />
                    <div className="skeleton-line skeleton-line--md" />
                    <div className="skeleton-bar-row">
                        <div className="skeleton-bar" style={{ width: `${55 + i * 10}%` }} />
                    </div>
                </div>
            ))}
        </div>
    );
}
