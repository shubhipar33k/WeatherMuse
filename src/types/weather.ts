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
    temperature: number;
    rainProbability: number;
    humidity: number;
    windSpeed: number;
    daylightHours: number;
}

export interface GeoLocation {
    latitude: number;
    longitude: number;
}
