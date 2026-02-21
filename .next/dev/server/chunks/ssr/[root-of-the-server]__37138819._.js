module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/Github_Projects/WeatherMuse/WeatherMuse/src/lib/weather.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fetchWeather",
    ()=>fetchWeather,
    "getDeviceLocation",
    ()=>getDeviceLocation
]);
// Default fallback: London
const DEFAULT_LOCATION = {
    latitude: 51.5074,
    longitude: -0.1278
};
const DEFAULT_CITY = "London";
/**
 * Reverse geocode lat/lon to a city name using Open-Meteo Geocoding API
 */ async function getCityName(lat, lon) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
            headers: {
                "User-Agent": "WeatherMuse/1.0"
            }
        });
        if (!res.ok) return DEFAULT_CITY;
        const data = await res.json();
        return data.address?.city || data.address?.town || data.address?.village || data.address?.county || DEFAULT_CITY;
    } catch  {
        return DEFAULT_CITY;
    }
}
/**
 * Fetch weather data from Open-Meteo for given coordinates
 */ async function fetchFromOpenMeteo(lat, lon) {
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
            "is_day"
        ].join(","),
        hourly: [
            "temperature_2m",
            "weather_code",
            "precipitation_probability",
            "wind_speed_10m"
        ].join(","),
        daily: [
            "sunrise",
            "sunset"
        ].join(","),
        timezone: "auto",
        forecast_days: "1"
    });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!res.ok) throw new Error(`Open-Meteo API error: ${res.status}`);
    return res.json();
}
/**
 * Parse hourly data for the next 24 hours (starting from current hour, up to 24)
 */ function parseHourlyForecast(data) {
    const now = new Date();
    const currentHour = now.getHours();
    return data.hourly.time.map((timeStr, i)=>{
        const date = new Date(timeStr);
        return {
            time: date.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit"
            }),
            temperature: Math.round(data.hourly.temperature_2m[i]),
            conditionCode: data.hourly.weather_code[i],
            precipitationProbability: data.hourly.precipitation_probability[i] ?? 0,
            windSpeed: Math.round(data.hourly.wind_speed_10m[i]),
            hour: date.getHours()
        };
    }).filter((item)=>item.hour >= currentHour).slice(0, 24);
}
async function fetchWeather(location) {
    const coords = location ?? DEFAULT_LOCATION;
    const cityName = location ? await getCityName(coords.latitude, coords.longitude) : DEFAULT_CITY;
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
        sunrise: data.daily.sunrise[0] ? new Date(data.daily.sunrise[0]).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit"
        }) : "--",
        sunset: data.daily.sunset[0] ? new Date(data.daily.sunset[0]).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit"
        }) : "--",
        hourlyForecast,
        isDay: data.current.is_day === 1
    };
}
function getDeviceLocation() {
    return new Promise((resolve)=>{
        if (!("geolocation" in navigator)) {
            resolve(undefined);
            return;
        }
        navigator.geolocation.getCurrentPosition((pos)=>resolve({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
            }), ()=>resolve(undefined), {
            timeout: 8000
        });
    });
}
}),
"[project]/Github_Projects/WeatherMuse/WeatherMuse/src/lib/gradient.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Returns a CSS linear-gradient string based on temperature (°C).
 * Uses a pastel palette — muted, analytical, not garish.
 */ __turbopack_context__.s([
    "getCardBackground",
    ()=>getCardBackground,
    "getTemperatureGradient",
    ()=>getTemperatureGradient
]);
function getTemperatureGradient(temp) {
    if (temp < 0) {
        // Freezing — deep indigo / midnight violet
        return {
            gradient: "linear-gradient(135deg, #1a1a3e 0%, #2d2060 40%, #3d1a5e 80%, #1e0a3c 100%)",
            textColor: "#e8e0f5",
            accentColor: "#a78bfa",
            rangeName: "Freezing"
        };
    } else if (temp < 10) {
        // Cold — slate periwinkle / dusty blue
        return {
            gradient: "linear-gradient(135deg, #1e3a5f 0%, #2d5282 40%, #3b6fa6 70%, #1a3a5c 100%)",
            textColor: "#dbeafe",
            accentColor: "#93c5fd",
            rangeName: "Cold"
        };
    } else if (temp < 18) {
        // Mild — sage teal / muted green-blue
        return {
            gradient: "linear-gradient(135deg, #0f3d3d 0%, #1a5c5c 40%, #2a7a6a 70%, #0d3535 100%)",
            textColor: "#d1fae5",
            accentColor: "#6ee7b7",
            rangeName: "Mild"
        };
    } else if (temp < 25) {
        // Pleasant — warm amber / soft peach
        return {
            gradient: "linear-gradient(135deg, #4a2c0a 0%, #7c4a1e 40%, #a0622a 70%, #3d2008 100%)",
            textColor: "#fefce8",
            accentColor: "#fbbf24",
            rangeName: "Pleasant"
        };
    } else {
        // Hot — dusty coral / terracotta rose
        return {
            gradient: "linear-gradient(135deg, #5c1a1a 0%, #8b3030 40%, #a84040 70%, #4a1010 100%)",
            textColor: "#fce7e7",
            accentColor: "#f87171",
            rangeName: "Hot"
        };
    }
}
function getCardBackground(temp) {
    const styles = {
        Freezing: "rgba(138, 112, 193, 0.12)",
        Cold: "rgba(96, 165, 250, 0.12)",
        Mild: "rgba(52, 211, 153, 0.12)",
        Pleasant: "rgba(251, 191, 36, 0.12)",
        Hot: "rgba(248, 113, 113, 0.12)"
    };
    const { rangeName } = getTemperatureGradient(temp);
    return styles[rangeName] ?? "rgba(255,255,255,0.1)";
}
}),
"[project]/Github_Projects/WeatherMuse/WeatherMuse/src/lib/weatherCodes.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Maps WMO Weather Interpretation Codes to human-readable labels and emojis.
 * https://open-meteo.com/en/docs#weathervariables
 */ __turbopack_context__.s([
    "getWeatherCondition",
    ()=>getWeatherCondition
]);
const WEATHER_CODES = {
    0: {
        label: "Clear Sky",
        emoji: "☀️",
        description: "Clear skies"
    },
    1: {
        label: "Mainly Clear",
        emoji: "🌤️",
        description: "Mainly clear"
    },
    2: {
        label: "Partly Cloudy",
        emoji: "⛅",
        description: "Partly cloudy"
    },
    3: {
        label: "Overcast",
        emoji: "☁️",
        description: "Overcast skies"
    },
    45: {
        label: "Foggy",
        emoji: "🌫️",
        description: "Foggy conditions"
    },
    48: {
        label: "Icy Fog",
        emoji: "🌫️",
        description: "Depositing rime fog"
    },
    51: {
        label: "Light Drizzle",
        emoji: "🌦️",
        description: "Light drizzle"
    },
    53: {
        label: "Drizzle",
        emoji: "🌦️",
        description: "Moderate drizzle"
    },
    55: {
        label: "Heavy Drizzle",
        emoji: "🌧️",
        description: "Dense drizzle"
    },
    61: {
        label: "Light Rain",
        emoji: "🌧️",
        description: "Slight rain"
    },
    63: {
        label: "Rain",
        emoji: "🌧️",
        description: "Moderate rain"
    },
    65: {
        label: "Heavy Rain",
        emoji: "🌧️",
        description: "Heavy rain"
    },
    66: {
        label: "Freezing Rain",
        emoji: "🌨️",
        description: "Light freezing rain"
    },
    67: {
        label: "Heavy Freezing Rain",
        emoji: "🌨️",
        description: "Heavy freezing rain"
    },
    71: {
        label: "Light Snow",
        emoji: "🌨️",
        description: "Slight snowfall"
    },
    73: {
        label: "Snow",
        emoji: "❄️",
        description: "Moderate snowfall"
    },
    75: {
        label: "Heavy Snow",
        emoji: "❄️",
        description: "Heavy snowfall"
    },
    77: {
        label: "Snow Grains",
        emoji: "🌨️",
        description: "Snow grains"
    },
    80: {
        label: "Light Showers",
        emoji: "🌦️",
        description: "Slight rain showers"
    },
    81: {
        label: "Showers",
        emoji: "🌦️",
        description: "Moderate rain showers"
    },
    82: {
        label: "Heavy Showers",
        emoji: "⛈️",
        description: "Violent rain showers"
    },
    85: {
        label: "Snow Showers",
        emoji: "🌨️",
        description: "Slight snow showers"
    },
    86: {
        label: "Heavy Snow Showers",
        emoji: "❄️",
        description: "Heavy snow showers"
    },
    95: {
        label: "Thunderstorm",
        emoji: "⛈️",
        description: "Thunderstorm"
    },
    96: {
        label: "Hail Storm",
        emoji: "⛈️",
        description: "Thunderstorm with slight hail"
    },
    99: {
        label: "Heavy Hail Storm",
        emoji: "⛈️",
        description: "Thunderstorm with heavy hail"
    }
};
function getWeatherCondition(code) {
    return WEATHER_CODES[code] ?? {
        label: "Unknown",
        emoji: "🌡️",
        description: "Unknown condition"
    };
}
}),
"[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>WeatherCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$weatherCodes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/src/lib/weatherCodes.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$gradient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/src/lib/gradient.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function WeatherCard({ data }) {
    const condition = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$weatherCodes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getWeatherCondition"])(data.conditionCode);
    const gradientStyle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$gradient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getTemperatureGradient"])(data.temperature);
    const cardBg = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$gradient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getCardBackground"])(data.temperature);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "weather-card",
        style: {
            "--card-bg": cardBg
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "card-location",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "location-pin",
                        children: "📍"
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                        lineNumber: 21,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "location-name",
                        children: data.city
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                        lineNumber: 22,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                lineNumber: 20,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "card-main",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "temperature-display",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "temp-value",
                                children: data.temperature
                            }, void 0, false, {
                                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                                lineNumber: 28,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "temp-unit",
                                children: "°C"
                            }, void 0, false, {
                                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                                lineNumber: 29,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                        lineNumber: 27,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "condition-display",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "condition-emoji",
                                role: "img",
                                "aria-label": condition.label,
                                children: condition.emoji
                            }, void 0, false, {
                                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                                lineNumber: 32,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "condition-text",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "condition-label",
                                        children: condition.label
                                    }, void 0, false, {
                                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                                        lineNumber: 36,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "feels-like",
                                        children: [
                                            "Feels like ",
                                            data.feelsLike,
                                            "°C"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                                        lineNumber: 37,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                                lineNumber: 35,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                        lineNumber: 31,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                lineNumber: 26,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "range-pill",
                style: {
                    color: gradientStyle.accentColor,
                    borderColor: `${gradientStyle.accentColor}40`
                },
                children: gradientStyle.rangeName
            }, void 0, false, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                lineNumber: 43,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "stats-grid",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatItem, {
                        icon: "💧",
                        label: "Humidity",
                        value: `${data.humidity}%`
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                        lineNumber: 49,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatItem, {
                        icon: "💨",
                        label: "Wind",
                        value: `${data.windSpeed} km/h`
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                        lineNumber: 50,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatItem, {
                        icon: "🌧️",
                        label: "Rain",
                        value: `${data.precipitationProbability}%`
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                        lineNumber: 51,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatItem, {
                        icon: "🌅",
                        label: "Sunrise",
                        value: data.sunrise
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                        lineNumber: 52,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatItem, {
                        icon: "🌇",
                        label: "Sunset",
                        value: data.sunset
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                        lineNumber: 53,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatItem, {
                        icon: data.isDay ? "☀️" : "🌙",
                        label: "Period",
                        value: data.isDay ? "Daytime" : "Night"
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                        lineNumber: 54,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                lineNumber: 48,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
        lineNumber: 18,
        columnNumber: 9
    }, this);
}
function StatItem({ icon, label, value }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "stat-item",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "stat-icon",
                children: icon
            }, void 0, false, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                lineNumber: 63,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "stat-content",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "stat-label",
                        children: label
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                        lineNumber: 65,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "stat-value",
                        children: value
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                        lineNumber: 66,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                lineNumber: 64,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
        lineNumber: 62,
        columnNumber: 9
    }, this);
}
}),
"[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/HourlyForecast.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HourlyForecast
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$weatherCodes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/src/lib/weatherCodes.ts [app-ssr] (ecmascript)");
"use client";
;
;
function HourlyForecast({ forecast, accentColor }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "hourly-section",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "section-title",
                children: "Hourly Forecast"
            }, void 0, false, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/HourlyForecast.tsx",
                lineNumber: 14,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "hourly-strip",
                children: forecast.map((item, i)=>{
                    const condition = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$weatherCodes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getWeatherCondition"])(item.conditionCode);
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "hourly-item",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "hourly-time",
                                children: item.time
                            }, void 0, false, {
                                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/HourlyForecast.tsx",
                                lineNumber: 20,
                                columnNumber: 29
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "hourly-emoji",
                                role: "img",
                                "aria-label": condition.label,
                                children: condition.emoji
                            }, void 0, false, {
                                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/HourlyForecast.tsx",
                                lineNumber: 21,
                                columnNumber: 29
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "hourly-temp",
                                style: {
                                    color: accentColor
                                },
                                children: [
                                    item.temperature,
                                    "°"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/HourlyForecast.tsx",
                                lineNumber: 24,
                                columnNumber: 29
                            }, this),
                            item.precipitationProbability > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "hourly-rain",
                                children: [
                                    item.precipitationProbability,
                                    "%"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/HourlyForecast.tsx",
                                lineNumber: 31,
                                columnNumber: 33
                            }, this)
                        ]
                    }, i, true, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/HourlyForecast.tsx",
                        lineNumber: 19,
                        columnNumber: 25
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/HourlyForecast.tsx",
                lineNumber: 15,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/HourlyForecast.tsx",
        lineNumber: 13,
        columnNumber: 9
    }, this);
}
}),
"[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>WeatherDashboard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$weather$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/src/lib/weather.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$gradient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/src/lib/gradient.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$components$2f$WeatherCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$components$2f$HourlyForecast$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/HourlyForecast.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
function WeatherDashboard() {
    const [weather, setWeather] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loadState, setLoadState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("locating");
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        async function init() {
            try {
                setLoadState("locating");
                const location = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$weather$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDeviceLocation"])();
                setLoadState("loading");
                const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$weather$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fetchWeather"])(location);
                setWeather(data);
                setLoadState("ready");
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load weather data.");
                setLoadState("error");
            }
        }
        init();
    }, []);
    const gradientStyle = weather ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$gradient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getTemperatureGradient"])(weather.temperature) : null;
    const bgStyle = gradientStyle ? {
        background: gradientStyle.gradient,
        color: gradientStyle.textColor
    } : {
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        color: "#e2e8f0"
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "dashboard-container",
        style: bgStyle,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "ambient-orb orb-1",
                style: gradientStyle ? {
                    background: `${gradientStyle.accentColor}18`
                } : {}
            }, void 0, false, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                lineNumber: 44,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "ambient-orb orb-2",
                style: gradientStyle ? {
                    background: `${gradientStyle.accentColor}10`
                } : {}
            }, void 0, false, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                lineNumber: 45,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "dashboard-header",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "logo-area",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "logo-mark",
                                children: "⬡"
                            }, void 0, false, {
                                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                                lineNumber: 50,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "logo-text",
                                children: "WeatherMuse"
                            }, void 0, false, {
                                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                                lineNumber: 51,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                        lineNumber: 49,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "logo-tagline",
                        children: "Weather optimised for productivity"
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                        lineNumber: 53,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                lineNumber: 48,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "dashboard-main",
                children: [
                    loadState === "locating" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(LoadingState, {
                        message: "Locating you...",
                        icon: "📍"
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                        lineNumber: 59,
                        columnNumber: 21
                    }, this),
                    loadState === "loading" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(LoadingState, {
                        message: "Fetching weather data...",
                        icon: "🌤️"
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                        lineNumber: 62,
                        columnNumber: 21
                    }, this),
                    loadState === "error" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ErrorState, {
                        message: error
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                        lineNumber: 65,
                        columnNumber: 21
                    }, this),
                    loadState === "ready" && weather && gradientStyle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$components$2f$WeatherCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                data: weather
                            }, void 0, false, {
                                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                                lineNumber: 69,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$components$2f$HourlyForecast$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                forecast: weather.hourlyForecast,
                                accentColor: gradientStyle.accentColor
                            }, void 0, false, {
                                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                                lineNumber: 70,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "coming-soon-card",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "coming-soon-icon",
                                        children: "🧠"
                                    }, void 0, false, {
                                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                                        lineNumber: 76,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "coming-soon-title",
                                                children: "Productivity Signal"
                                            }, void 0, false, {
                                                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                                                lineNumber: 78,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "coming-soon-sub",
                                                children: "Intelligence layer initialising — Day 3"
                                            }, void 0, false, {
                                                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                                                lineNumber: 79,
                                                columnNumber: 33
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                                        lineNumber: 77,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                                lineNumber: 75,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true)
                ]
            }, void 0, true, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                lineNumber: 57,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                className: "dashboard-footer",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: [
                        "Powered by ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            href: "https://open-meteo.com/",
                            target: "_blank",
                            rel: "noopener noreferrer",
                            style: {
                                color: gradientStyle?.accentColor ?? "#94a3b8"
                            },
                            children: "Open-Meteo"
                        }, void 0, false, {
                            fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                            lineNumber: 88,
                            columnNumber: 34
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                    lineNumber: 88,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                lineNumber: 87,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
        lineNumber: 42,
        columnNumber: 9
    }, this);
}
function LoadingState({ message, icon }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "loading-state",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "loading-icon",
                children: icon
            }, void 0, false, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                lineNumber: 97,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "loading-text",
                children: message
            }, void 0, false, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                lineNumber: 98,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "loading-dots",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                        lineNumber: 100,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                        lineNumber: 101,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                        lineNumber: 102,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                lineNumber: 99,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
        lineNumber: 96,
        columnNumber: 9
    }, this);
}
function ErrorState({ message }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "error-state",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "error-icon",
                children: "⚠️"
            }, void 0, false, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                lineNumber: 111,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "error-text",
                children: message
            }, void 0, false, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                lineNumber: 112,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>window.location.reload(),
                className: "retry-btn",
                children: "Retry"
            }, void 0, false, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                lineNumber: 113,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
        lineNumber: 110,
        columnNumber: 9
    }, this);
}
}),
"[project]/Github_Projects/WeatherMuse/WeatherMuse/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    else {
        if ("TURBOPACK compile-time truthy", 1) {
            if ("TURBOPACK compile-time truthy", 1) {
                module.exports = __turbopack_context__.r("[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)");
            } else //TURBOPACK unreachable
            ;
        } else //TURBOPACK unreachable
        ;
    }
} //# sourceMappingURL=module.compiled.js.map
}),
"[project]/Github_Projects/WeatherMuse/WeatherMuse/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/Github_Projects/WeatherMuse/WeatherMuse/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}),
"[project]/Github_Projects/WeatherMuse/WeatherMuse/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/Github_Projects/WeatherMuse/WeatherMuse/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].React; //# sourceMappingURL=react.js.map
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__37138819._.js.map