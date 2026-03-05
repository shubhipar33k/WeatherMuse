"use client";

import { useState, useEffect } from "react";
import { AlertResult } from "@/lib/alertEngine";

interface StickyAlertBannerProps {
    alertResult: AlertResult;
    accentColor: string;
}

/**
 * StickyAlertBanner — Day 9
 *
 * A compact bar pinned to the top of the viewport that appears after the user
 * scrolls past 200px. Only shows when there are warning or danger alerts.
 * Clicking it scrolls back to the AlertPanel.
 */
export default function StickyAlertBanner({ alertResult, accentColor }: StickyAlertBannerProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        function handleScroll() {
            setVisible(window.scrollY > 200);
        }
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const { topAlert, hasDangers, hasWarnings } = alertResult;
    if (!topAlert || (!hasDangers && !hasWarnings)) return null;

    const isDanger = hasDangers;
    const bannerColor = isDanger ? "rgba(239,68,68,0.90)" : "rgba(251,191,36,0.85)";
    const bgColor = isDanger ? "rgba(239,68,68,0.12)" : "rgba(251,191,36,0.10)";
    const borderColor = isDanger ? "rgba(239,68,68,0.35)" : "rgba(251,191,36,0.30)";

    function scrollToAlerts() {
        document.querySelector(".alert-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    return (
        <div
            className={`sticky-alert-banner ${visible ? "sticky-alert-banner--visible" : ""}`}
            style={{ background: bgColor, borderBottomColor: borderColor }}
            onClick={scrollToAlerts}
            role="button"
            tabIndex={0}
            aria-label="View weather alerts"
        >
            <span className="sticky-alert-icon">{topAlert.emoji}</span>
            <span className="sticky-alert-text" style={{ color: bannerColor }}>
                {topAlert.title}
            </span>
            <span className="sticky-alert-hint">↓ view</span>
        </div>
    );
}
