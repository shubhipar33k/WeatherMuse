export interface HourlyForecast {
    time: string;       // "14:00"
    temperature: number;
    conditionCode: number;
    precipitationProbability: number;
    windSpeed: number;
}

export interface WeatherData {
    temperature: number;
    feelsLike: number;
    conditionCode: number;
    humidity: number;
    windSpeed: number;
    precipitationProbability: number;
    city: string;
    latitude: number;
    longitude: number;
    sunrise: string;
    sunset: string;
    hourlyForecast: HourlyForecast[];
    isDay: boolean;
}

export interface WeatherFeatures {
    // Primary signals (all used by the scoring engine)
    temperature: number;          // °C, current
    rainProbability: number;      // 0–100, max over forecast window
    humidity: number;             // 0–100 %
    windSpeed: number;            // km/h, current
    daylightHours: number;        // computed from sunrise → sunset
    daylightMinutes: number;      // precise version for scoring

    // Derived signals
    peakRainProbability: number;  // highest hourly precipitation probability
    avgHourlyTemp: number;        // mean temperature over next 12 h
    conditionCategory: ConditionCategory; // grouped weather state
}

/** Broad grouping of WMO weather codes into 5 named states */
export type ConditionCategory =
    | "clear"
    | "cloudy"
    | "precipitation"
    | "storm"
    | "snow";

/** Provenance / debug info attached to every extraction */
export interface ExtractionMeta {
    extractedAt: string;   // ISO timestamp
    sourceCity: string;
    hoursAnalysed: number;
}

export interface GeoLocation {
    latitude: number;
    longitude: number;
}
