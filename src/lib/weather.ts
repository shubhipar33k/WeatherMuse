import { WeatherData, HourlyForecast, GeoLocation } from "@/types/weather";

// Default fallback: London
const DEFAULT_LOCATION: GeoLocation = { latitude: 51.5074, longitude: -0.1278 };
const DEFAULT_CITY = "London";

interface OpenMeteoResponse {
    current: {
        temperature_2m: number;
        apparent_temperature: number;
        weather_code: number;
        relative_humidity_2m: number;
        wind_speed_10m: number;
        precipitation_probability: number;
        is_day: number;
    };
    daily: {
        sunrise: string[];
        sunset: string[];
    };
    hourly: {
        time: string[];
        temperature_2m: number[];
        weather_code: number[];
        precipitation_probability: number[];
        wind_speed_10m: number[];
    };
}

interface GeocodingResult {
    name: string;
    country: string;
    admin1?: string;
}

/**
 * Reverse geocode lat/lon to a city name using Open-Meteo Geocoding API
 */
async function getCityName(lat: number, lon: number): Promise<string> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { "User-Agent": "WeatherMuse/1.0" } }
        );
        if (!res.ok) return DEFAULT_CITY;
        const data = await res.json();
        return (
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            DEFAULT_CITY
        );
    } catch {
        return DEFAULT_CITY;
    }
}

/**
 * Fetch weather data from Open-Meteo for given coordinates
 */
async function fetchFromOpenMeteo(lat: number, lon: number): Promise<OpenMeteoResponse> {
    const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        current: [
            "temperature_2m",
            "apparent_temperature",
            "weather_code",
            "relative_humidity_2m",
            "wind_speed_10m",
            "precipitation_probability",
            "is_day",
        ].join(","),
        hourly: [
            "temperature_2m",
            "weather_code",
            "precipitation_probability",
            "wind_speed_10m",
        ].join(","),
        daily: ["sunrise", "sunset"].join(","),
        timezone: "auto",
        forecast_days: "1",
    });

    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!res.ok) throw new Error(`Open-Meteo API error: ${res.status}`);
    return res.json();
}

/**
 * Parse hourly data for the next 24 hours (starting from current hour, up to 24)
 */
function parseHourlyForecast(data: OpenMeteoResponse): HourlyForecast[] {
    const now = new Date();
    const currentHour = now.getHours();

    return data.hourly.time
        .map((timeStr, i) => {
            const date = new Date(timeStr);
            return {
                time: date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
                temperature: Math.round(data.hourly.temperature_2m[i]),
                conditionCode: data.hourly.weather_code[i],
                precipitationProbability: data.hourly.precipitation_probability[i] ?? 0,
                windSpeed: Math.round(data.hourly.wind_speed_10m[i]),
                hour: date.getHours(),
            };
        })
        .filter((item) => item.hour >= currentHour)
        .slice(0, 24);
}

/**
 * Main entry point: resolve location → fetch weather → return structured WeatherData
 */
export async function fetchWeather(location?: GeoLocation): Promise<WeatherData> {
    const coords = location ?? DEFAULT_LOCATION;
    const cityName = location
        ? await getCityName(coords.latitude, coords.longitude)
        : DEFAULT_CITY;

    const data = await fetchFromOpenMeteo(coords.latitude, coords.longitude);

    const hourlyForecast = parseHourlyForecast(data);

    return {
        temperature: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.apparent_temperature),
        conditionCode: data.current.weather_code,
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        precipitationProbability: data.current.precipitation_probability ?? 0,
        city: cityName,
        latitude: coords.latitude,
        longitude: coords.longitude,
        sunrise: data.daily.sunrise[0]
            ? new Date(data.daily.sunrise[0]).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
            : "--",
        sunset: data.daily.sunset[0]
            ? new Date(data.daily.sunset[0]).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
            : "--",
        hourlyForecast,
        isDay: data.current.is_day === 1,
    };
}

/**
 * Browser geolocation wrapper — returns coords or undefined on failure
 */
export function getDeviceLocation(): Promise<GeoLocation | undefined> {
    return new Promise((resolve) => {
        if (!("geolocation" in navigator)) {
            resolve(undefined);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => resolve(undefined),
            { timeout: 8000 }
        );
    });
}
