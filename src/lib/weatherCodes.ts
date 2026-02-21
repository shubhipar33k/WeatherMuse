/**
 * Maps WMO Weather Interpretation Codes to human-readable labels and emojis.
 * https://open-meteo.com/en/docs#weathervariables
 */
export interface WeatherCondition {
    label: string;
    emoji: string;
    description: string;
}

const WEATHER_CODES: Record<number, WeatherCondition> = {
    0: { label: "Clear Sky", emoji: "☀️", description: "Clear skies" },
    1: { label: "Mainly Clear", emoji: "🌤️", description: "Mainly clear" },
    2: { label: "Partly Cloudy", emoji: "⛅", description: "Partly cloudy" },
    3: { label: "Overcast", emoji: "☁️", description: "Overcast skies" },
    45: { label: "Foggy", emoji: "🌫️", description: "Foggy conditions" },
    48: { label: "Icy Fog", emoji: "🌫️", description: "Depositing rime fog" },
    51: { label: "Light Drizzle", emoji: "🌦️", description: "Light drizzle" },
    53: { label: "Drizzle", emoji: "🌦️", description: "Moderate drizzle" },
    55: { label: "Heavy Drizzle", emoji: "🌧️", description: "Dense drizzle" },
    61: { label: "Light Rain", emoji: "🌧️", description: "Slight rain" },
    63: { label: "Rain", emoji: "🌧️", description: "Moderate rain" },
    65: { label: "Heavy Rain", emoji: "🌧️", description: "Heavy rain" },
    66: { label: "Freezing Rain", emoji: "🌨️", description: "Light freezing rain" },
    67: { label: "Heavy Freezing Rain", emoji: "🌨️", description: "Heavy freezing rain" },
    71: { label: "Light Snow", emoji: "🌨️", description: "Slight snowfall" },
    73: { label: "Snow", emoji: "❄️", description: "Moderate snowfall" },
    75: { label: "Heavy Snow", emoji: "❄️", description: "Heavy snowfall" },
    77: { label: "Snow Grains", emoji: "🌨️", description: "Snow grains" },
    80: { label: "Light Showers", emoji: "🌦️", description: "Slight rain showers" },
    81: { label: "Showers", emoji: "🌦️", description: "Moderate rain showers" },
    82: { label: "Heavy Showers", emoji: "⛈️", description: "Violent rain showers" },
    85: { label: "Snow Showers", emoji: "🌨️", description: "Slight snow showers" },
    86: { label: "Heavy Snow Showers", emoji: "❄️", description: "Heavy snow showers" },
    95: { label: "Thunderstorm", emoji: "⛈️", description: "Thunderstorm" },
    96: { label: "Hail Storm", emoji: "⛈️", description: "Thunderstorm with slight hail" },
    99: { label: "Heavy Hail Storm", emoji: "⛈️", description: "Thunderstorm with heavy hail" },
};

export function getWeatherCondition(code: number): WeatherCondition {
    return WEATHER_CODES[code] ?? { label: "Unknown", emoji: "🌡️", description: "Unknown condition" };
}
