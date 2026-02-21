"use client";

import { useState, useEffect } from "react";
import { WeatherData } from "@/types/weather";
import { fetchWeather, getDeviceLocation } from "@/lib/weather";
import { getTemperatureGradient } from "@/lib/gradient";
import WeatherCard from "./WeatherCard";
import HourlyForecast from "./HourlyForecast";

type LoadState = "locating" | "loading" | "ready" | "error";

export default function WeatherDashboard() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loadState, setLoadState] = useState<LoadState>("locating");
    const [error, setError] = useState<string>("");

    useEffect(() => {
        async function init() {
            try {
                setLoadState("locating");
                const location = await getDeviceLocation();

                setLoadState("loading");
                const data = await fetchWeather(location);
                setWeather(data);
                setLoadState("ready");
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load weather data.");
                setLoadState("error");
            }
        }
        init();
    }, []);

    const gradientStyle = weather ? getTemperatureGradient(weather.temperature) : null;

    const bgStyle = gradientStyle
        ? { background: gradientStyle.gradient, color: gradientStyle.textColor }
        : { background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#e2e8f0" };

    return (
        <div className="dashboard-container" style={bgStyle as React.CSSProperties}>
            {/* Animated ambient orbs */}
            <div className="ambient-orb orb-1" style={gradientStyle ? { background: `${gradientStyle.accentColor}18` } : {}} />
            <div className="ambient-orb orb-2" style={gradientStyle ? { background: `${gradientStyle.accentColor}10` } : {}} />

            {/* Header */}
            <header className="dashboard-header">
                <div className="logo-area">
                    <span className="logo-mark">⬡</span>
                    <span className="logo-text">WeatherMuse</span>
                </div>
                <p className="logo-tagline">Weather optimised for productivity</p>
            </header>

            {/* Main content */}
            <main className="dashboard-main">
                {loadState === "locating" && (
                    <LoadingState message="Locating you..." icon="📍" />
                )}
                {loadState === "loading" && (
                    <LoadingState message="Fetching weather data..." icon="🌤️" />
                )}
                {loadState === "error" && (
                    <ErrorState message={error} />
                )}
                {loadState === "ready" && weather && gradientStyle && (
                    <>
                        <WeatherCard data={weather} />
                        <HourlyForecast
                            forecast={weather.hourlyForecast}
                            accentColor={gradientStyle.accentColor}
                        />
                        {/* Day 3+ placeholder: productivity signal */}
                        <div className="coming-soon-card">
                            <div className="coming-soon-icon">🧠</div>
                            <div>
                                <p className="coming-soon-title">Productivity Signal</p>
                                <p className="coming-soon-sub">Intelligence layer initialising — Day 3</p>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="dashboard-footer">
                <span>Powered by <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" style={{ color: gradientStyle?.accentColor ?? "#94a3b8" }}>Open-Meteo</a></span>
            </footer>
        </div>
    );
}

function LoadingState({ message, icon }: { message: string; icon: string }) {
    return (
        <div className="loading-state">
            <span className="loading-icon">{icon}</span>
            <span className="loading-text">{message}</span>
            <div className="loading-dots">
                <span />
                <span />
                <span />
            </div>
        </div>
    );
}

function ErrorState({ message }: { message: string }) {
    return (
        <div className="error-state">
            <span className="error-icon">⚠️</span>
            <p className="error-text">{message}</p>
            <button onClick={() => window.location.reload()} className="retry-btn">
                Retry
            </button>
        </div>
    );
}
