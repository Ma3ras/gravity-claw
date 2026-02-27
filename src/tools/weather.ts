import type { Tool } from "./index.js";
import { log } from "../utils/logger.js";

/**
 * Weather tool using Open-Meteo API — free, no API key, reliable.
 * First geocodes the location, then fetches weather data.
 */
export const getWeather: Tool = {
    name: "get_weather",
    description:
        "Get current weather and forecast for a location. Use this when the user asks about weather, temperature, or forecast.",
    inputSchema: {
        type: "object" as const,
        properties: {
            location: {
                type: "string",
                description: "City name or location (e.g. 'Berlin', 'London', 'New York')",
            },
        },
        required: ["location"],
    },
    execute: async (input: Record<string, unknown>): Promise<string> => {
        const location = input.location as string;
        if (!location) return "Error: No location provided.";

        log.info("Getting weather", { location });

        try {
            // Step 1: Geocode the location
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en`;
            const geoRes = await fetch(geoUrl);
            if (!geoRes.ok) return `Geocoding failed: ${geoRes.status}`;

            const geoData = (await geoRes.json()) as {
                results?: Array<{
                    name: string;
                    country: string;
                    latitude: number;
                    longitude: number;
                }>;
            };

            const place = geoData.results?.[0];
            if (!place) return `Could not find location "${location}".`;

            // Step 2: Fetch weather
            const wxUrl =
                `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
                `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,uv_index` +
                `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
                `&timezone=auto&forecast_days=3`;

            const wxRes = await fetch(wxUrl);
            if (!wxRes.ok) return `Weather API failed: ${wxRes.status}`;

            const wx = (await wxRes.json()) as {
                current: {
                    temperature_2m: number;
                    relative_humidity_2m: number;
                    apparent_temperature: number;
                    weather_code: number;
                    wind_speed_10m: number;
                    wind_direction_10m: number;
                    uv_index: number;
                };
                daily: {
                    time: string[];
                    temperature_2m_max: number[];
                    temperature_2m_min: number[];
                    precipitation_probability_max: number[];
                    weather_code: number[];
                };
            };

            const c = wx.current;
            const weatherDesc = weatherCodeToText(c.weather_code);

            let result = `🌤️ **Weather for ${place.name}, ${place.country}**\n\n`;
            result += `**Now:** ${weatherDesc}\n`;
            result += `🌡️ ${c.temperature_2m}°C (feels like ${c.apparent_temperature}°C)\n`;
            result += `💧 Humidity: ${c.relative_humidity_2m}%\n`;
            result += `💨 Wind: ${c.wind_speed_10m} km/h\n`;
            result += `☀️ UV Index: ${c.uv_index}\n`;

            result += `\n**Forecast:**\n`;
            for (let i = 0; i < wx.daily.time.length; i++) {
                const desc = weatherCodeToText(wx.daily.weather_code[i]!);
                result += `📅 ${wx.daily.time[i]}: ${wx.daily.temperature_2m_min[i]}°C – ${wx.daily.temperature_2m_max[i]}°C, ${desc}, 🌧️ ${wx.daily.precipitation_probability_max[i]}%\n`;
            }

            return result;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            log.error("Weather lookup failed", { error: msg });
            return `Weather error: ${msg}`;
        }
    },
};

function weatherCodeToText(code: number): string {
    const map: Record<number, string> = {
        0: "☀️ Clear sky",
        1: "🌤️ Mostly clear",
        2: "⛅ Partly cloudy",
        3: "☁️ Overcast",
        45: "🌫️ Fog",
        48: "🌫️ Rime fog",
        51: "🌦️ Light drizzle",
        53: "🌦️ Drizzle",
        55: "🌧️ Heavy drizzle",
        61: "🌧️ Light rain",
        63: "🌧️ Rain",
        65: "🌧️ Heavy rain",
        71: "🌨️ Light snow",
        73: "🌨️ Snow",
        75: "❄️ Heavy snow",
        77: "🌨️ Snow grains",
        80: "🌦️ Light showers",
        81: "🌧️ Showers",
        82: "⛈️ Heavy showers",
        85: "🌨️ Light snow showers",
        86: "❄️ Heavy snow showers",
        95: "⛈️ Thunderstorm",
        96: "⛈️ Thunderstorm with hail",
        99: "⛈️ Severe thunderstorm",
    };
    return map[code] ?? `Weather code ${code}`;
}
