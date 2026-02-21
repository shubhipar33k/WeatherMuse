"use client";

import { HourlyForecast as HourlyForecastType } from "@/types/weather";
import { getWeatherCondition } from "@/lib/weatherCodes";

interface HourlyForecastProps {
    forecast: HourlyForecastType[];
    accentColor: string;
}

export default function HourlyForecast({ forecast, accentColor }: HourlyForecastProps) {
    return (
        <div className="hourly-section">
            <h3 className="section-title">Hourly Forecast</h3>
            <div className="hourly-strip">
                {forecast.map((item, i) => {
                    const condition = getWeatherCondition(item.conditionCode);
                    return (
                        <div key={i} className="hourly-item">
                            <span className="hourly-time">{item.time}</span>
                            <span className="hourly-emoji" role="img" aria-label={condition.label}>
                                {condition.emoji}
                            </span>
                            <span
                                className="hourly-temp"
                                style={{ color: accentColor }}
                            >
                                {item.temperature}°
                            </span>
                            {item.precipitationProbability > 0 && (
                                <span className="hourly-rain">{item.precipitationProbability}%</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
