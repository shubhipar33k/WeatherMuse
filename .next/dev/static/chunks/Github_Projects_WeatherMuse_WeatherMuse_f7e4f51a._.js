(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/Github_Projects/WeatherMuse/WeatherMuse/src/lib/weather.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Github_Projects/WeatherMuse/WeatherMuse/src/lib/gradient.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Github_Projects/WeatherMuse/WeatherMuse/src/lib/weatherCodes.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>WeatherCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$weatherCodes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/src/lib/weatherCodes.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$gradient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/src/lib/gradient.ts [app-client] (ecmascript)");
"use client";
;
;
;
function WeatherCard({ data }) {
    const condition = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$weatherCodes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getWeatherCondition"])(data.conditionCode);
    const gradientStyle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$gradient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTemperatureGradient"])(data.temperature);
    const cardBg = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$gradient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCardBackground"])(data.temperature);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "weather-card",
        style: {
            "--card-bg": cardBg
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "card-location",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "location-pin",
                        children: "📍"
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                        lineNumber: 21,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "card-main",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "temperature-display",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "temp-value",
                                children: data.temperature
                            }, void 0, false, {
                                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                                lineNumber: 28,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "condition-display",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "condition-emoji",
                                role: "img",
                                "aria-label": condition.label,
                                children: condition.emoji
                            }, void 0, false, {
                                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                                lineNumber: 32,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "condition-text",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "condition-label",
                                        children: condition.label
                                    }, void 0, false, {
                                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                                        lineNumber: 36,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "stats-grid",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatItem, {
                        icon: "💧",
                        label: "Humidity",
                        value: `${data.humidity}%`
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                        lineNumber: 49,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatItem, {
                        icon: "💨",
                        label: "Wind",
                        value: `${data.windSpeed} km/h`
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                        lineNumber: 50,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatItem, {
                        icon: "🌧️",
                        label: "Rain",
                        value: `${data.precipitationProbability}%`
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                        lineNumber: 51,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatItem, {
                        icon: "🌅",
                        label: "Sunrise",
                        value: data.sunrise
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                        lineNumber: 52,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatItem, {
                        icon: "🌇",
                        label: "Sunset",
                        value: data.sunset
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                        lineNumber: 53,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatItem, {
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
_c = WeatherCard;
function StatItem({ icon, label, value }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "stat-item",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "stat-icon",
                children: icon
            }, void 0, false, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                lineNumber: 63,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "stat-content",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "stat-label",
                        children: label
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx",
                        lineNumber: 65,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
_c1 = StatItem;
var _c, _c1;
__turbopack_context__.k.register(_c, "WeatherCard");
__turbopack_context__.k.register(_c1, "StatItem");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/HourlyForecast.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HourlyForecast
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$weatherCodes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/src/lib/weatherCodes.ts [app-client] (ecmascript)");
"use client";
;
;
function HourlyForecast({ forecast, accentColor }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "hourly-section",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "section-title",
                children: "Hourly Forecast"
            }, void 0, false, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/HourlyForecast.tsx",
                lineNumber: 14,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "hourly-strip",
                children: forecast.map((item, i)=>{
                    const condition = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$weatherCodes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getWeatherCondition"])(item.conditionCode);
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "hourly-item",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "hourly-time",
                                children: item.time
                            }, void 0, false, {
                                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/HourlyForecast.tsx",
                                lineNumber: 20,
                                columnNumber: 29
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "hourly-emoji",
                                role: "img",
                                "aria-label": condition.label,
                                children: condition.emoji
                            }, void 0, false, {
                                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/HourlyForecast.tsx",
                                lineNumber: 21,
                                columnNumber: 29
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                            item.precipitationProbability > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
_c = HourlyForecast;
var _c;
__turbopack_context__.k.register(_c, "HourlyForecast");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>WeatherDashboard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$weather$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/src/lib/weather.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$gradient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/src/lib/gradient.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$components$2f$WeatherCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherCard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$components$2f$HourlyForecast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/HourlyForecast.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
function WeatherDashboard() {
    _s();
    const [weather, setWeather] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loadState, setLoadState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("locating");
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WeatherDashboard.useEffect": ()=>{
            async function init() {
                try {
                    setLoadState("locating");
                    const location = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$weather$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDeviceLocation"])();
                    setLoadState("loading");
                    const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$weather$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchWeather"])(location);
                    setWeather(data);
                    setLoadState("ready");
                } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to load weather data.");
                    setLoadState("error");
                }
            }
            init();
        }
    }["WeatherDashboard.useEffect"], []);
    const gradientStyle = weather ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$lib$2f$gradient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTemperatureGradient"])(weather.temperature) : null;
    const bgStyle = gradientStyle ? {
        background: gradientStyle.gradient,
        color: gradientStyle.textColor
    } : {
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        color: "#e2e8f0"
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "dashboard-container",
        style: bgStyle,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "ambient-orb orb-1",
                style: gradientStyle ? {
                    background: `${gradientStyle.accentColor}18`
                } : {}
            }, void 0, false, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                lineNumber: 44,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "ambient-orb orb-2",
                style: gradientStyle ? {
                    background: `${gradientStyle.accentColor}10`
                } : {}
            }, void 0, false, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                lineNumber: 45,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "dashboard-header",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "logo-area",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "logo-mark",
                                children: "⬡"
                            }, void 0, false, {
                                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                                lineNumber: 50,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "dashboard-main",
                children: [
                    loadState === "locating" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LoadingState, {
                        message: "Locating you...",
                        icon: "📍"
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                        lineNumber: 59,
                        columnNumber: 21
                    }, this),
                    loadState === "loading" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LoadingState, {
                        message: "Fetching weather data...",
                        icon: "🌤️"
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                        lineNumber: 62,
                        columnNumber: 21
                    }, this),
                    loadState === "error" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ErrorState, {
                        message: error
                    }, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                        lineNumber: 65,
                        columnNumber: 21
                    }, this),
                    loadState === "ready" && weather && gradientStyle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$components$2f$WeatherCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                data: weather
                            }, void 0, false, {
                                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                                lineNumber: 69,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$src$2f$components$2f$HourlyForecast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                forecast: weather.hourlyForecast,
                                accentColor: gradientStyle.accentColor
                            }, void 0, false, {
                                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                                lineNumber: 70,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "coming-soon-card",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "coming-soon-icon",
                                        children: "🧠"
                                    }, void 0, false, {
                                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                                        lineNumber: 76,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "coming-soon-title",
                                                children: "Productivity Signal"
                                            }, void 0, false, {
                                                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                                                lineNumber: 78,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                className: "dashboard-footer",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: [
                        "Powered by ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
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
_s(WeatherDashboard, "i1dfOJ84hgBePDF55VvsghURCIo=");
_c = WeatherDashboard;
function LoadingState({ message, icon }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "loading-state",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "loading-icon",
                children: icon
            }, void 0, false, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                lineNumber: 97,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "loading-text",
                children: message
            }, void 0, false, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                lineNumber: 98,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "loading-dots",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                        lineNumber: 100,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                        fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                        lineNumber: 101,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
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
_c1 = LoadingState;
function ErrorState({ message }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "error-state",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "error-icon",
                children: "⚠️"
            }, void 0, false, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                lineNumber: 111,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "error-text",
                children: message
            }, void 0, false, {
                fileName: "[project]/Github_Projects/WeatherMuse/WeatherMuse/src/components/WeatherDashboard.tsx",
                lineNumber: 112,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
_c2 = ErrorState;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "WeatherDashboard");
__turbopack_context__.k.register(_c1, "LoadingState");
__turbopack_context__.k.register(_c2, "ErrorState");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Github_Projects/WeatherMuse/WeatherMuse/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
/**
 * @license React
 * react-jsx-dev-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ "use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch(type){
            case REACT_FRAGMENT_TYPE:
                return "Fragment";
            case REACT_PROFILER_TYPE:
                return "Profiler";
            case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
            case REACT_SUSPENSE_TYPE:
                return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
                return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
                return "ViewTransition";
        }
        if ("object" === typeof type) switch("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof){
            case REACT_PORTAL_TYPE:
                return "Portal";
            case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
            case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                    return getComponentNameFromType(type(innerType));
                } catch (x) {}
        }
        return null;
    }
    function testStringCoercion(value) {
        return "" + value;
    }
    function checkKeyStringCoercion(value) {
        try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
        } catch (e) {
            JSCompiler_inline_result = !0;
        }
        if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
            return testStringCoercion(value);
        }
    }
    function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
        } catch (x) {
            return "<...>";
        }
    }
    function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
        return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return !1;
        }
        return void 0 !== config.key;
    }
    function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = !0;
        Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: !0
        });
    }
    function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
            enumerable: !1,
            value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null
        });
        Object.defineProperty(type, "_debugStack", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
            for(isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
        } else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
                return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
            maybeKey = {};
            for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        return ReactElement(type, children, maybeKey, getOwner(), debugStack, debugTask);
    }
    function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
    }
    function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    var React = __turbopack_context__.r("[project]/Github_Projects/WeatherMuse/WeatherMuse/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
    };
    React = {
        react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
        }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function(type, config, maybeKey, isStaticChildren) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
        } else debugStackDEV = unknownOwnerDebugStack;
        return jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStackDEV, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
}();
}),
"[project]/Github_Projects/WeatherMuse/WeatherMuse/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$Github_Projects$2f$WeatherMuse$2f$WeatherMuse$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/Github_Projects/WeatherMuse/WeatherMuse/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = __turbopack_context__.r("[project]/Github_Projects/WeatherMuse/WeatherMuse/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)");
}
}),
]);

//# sourceMappingURL=Github_Projects_WeatherMuse_WeatherMuse_f7e4f51a._.js.map