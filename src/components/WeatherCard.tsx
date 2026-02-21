"use client";

import React from "react";
import { WeatherData } from "@/types/weather";
import { getWeatherCondition } from "@/lib/weatherCodes";
import { getTemperatureGradient, getCardBackground } from "@/lib/gradient";

interface WeatherCardProps {
    data: WeatherData;
}

export default function WeatherCard({ data }: WeatherCardProps) {
    const condition = getWeatherCondition(data.conditionCode);
    const gradientStyle = getTemperatureGradient(data.temperature);
    const cardBg = getCardBackground(data.temperature);

    return (
        <div className="weather-card" style={{ "--card-bg": cardBg } as React.CSSProperties}>
            {/* Location */}
            <div className="card-location">
                <span className="location-pin">📍</span>
                <span className="location-name">{data.city}</span>
            </div>

            {/* Main temp + condition */}
            <div className="card-main">
                <div className="temperature-display">
                    <span className="temp-value">{data.temperature}</span>
                    <span className="temp-unit">°C</span>
                </div>
                <div className="condition-display">
                    <span className="condition-emoji" role="img" aria-label={condition.label}>
                        {condition.emoji}
                    </span>
                    <div className="condition-text">
                        <span className="condition-label">{condition.label}</span>
                        <span className="feels-like">Feels like {data.feelsLike}°C</span>
                    </div>
                </div>
            </div>

            {/* Range label pill */}
            <div className="range-pill" style={{ color: gradientStyle.accentColor, borderColor: `${gradientStyle.accentColor}40` }}>
                {gradientStyle.rangeName}
            </div>

            {/* Stats grid */}
            <div className="stats-grid">
                <StatItem icon="💧" label="Humidity" value={`${data.humidity}%`} />
                <StatItem icon="💨" label="Wind" value={`${data.windSpeed} km/h`} />
                <StatItem icon="🌧️" label="Rain" value={`${data.precipitationProbability}%`} />
                <StatItem icon="🌅" label="Sunrise" value={data.sunrise} />
                <StatItem icon="🌇" label="Sunset" value={data.sunset} />
                <StatItem icon={data.isDay ? "☀️" : "🌙"} label="Period" value={data.isDay ? "Daytime" : "Night"} />
            </div>
        </div>
    );
}

function StatItem({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div className="stat-item">
            <span className="stat-icon">{icon}</span>
            <div className="stat-content">
                <span className="stat-label">{label}</span>
                <span className="stat-value">{value}</span>
            </div>
        </div>
    );
}
