import type { Tool } from "./index.js";
import { log } from "../utils/logger.js";

/**
 * Weather tool using wttr.in — free, no API key, supports any location.
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
            // wttr.in returns concise weather in JSON format
            const url = `https://wttr.in/${encodeURIComponent(location)}?format=j1`;
            const response = await fetch(url, {
                headers: { "User-Agent": "GravityClaw/1.0" },
                signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
                return `Weather lookup failed: ${response.status}`;
            }

            const data = (await response.json()) as {
                current_condition: Array<{
                    temp_C: string;
                    FeelsLikeC: string;
                    humidity: string;
                    weatherDesc: Array<{ value: string }>;
                    windspeedKmph: string;
                    winddir16Point: string;
                    uvIndex: string;
                }>;
                nearest_area: Array<{
                    areaName: Array<{ value: string }>;
                    country: Array<{ value: string }>;
                }>;
                weather: Array<{
                    date: string;
                    maxtempC: string;
                    mintempC: string;
                    hourly: Array<{
                        time: string;
                        tempC: string;
                        weatherDesc: Array<{ value: string }>;
                        chanceofrain: string;
                    }>;
                }>;
            };

            const current = data.current_condition[0];
            const area = data.nearest_area[0];
            const forecast = data.weather;

            if (!current || !area) {
                return `Could not find weather data for "${location}".`;
            }

            const areaName = area.areaName[0]?.value ?? location;
            const country = area.country[0]?.value ?? "";

            let result = `🌤️ **Weather for ${areaName}, ${country}**\n\n`;
            result += `**Now:** ${current.weatherDesc[0]?.value ?? "Unknown"}\n`;
            result += `🌡️ ${current.temp_C}°C (feels like ${current.FeelsLikeC}°C)\n`;
            result += `💧 Humidity: ${current.humidity}%\n`;
            result += `💨 Wind: ${current.windspeedKmph} km/h ${current.winddir16Point}\n`;
            result += `☀️ UV Index: ${current.uvIndex}\n`;

            if (forecast && forecast.length > 0) {
                result += `\n**Forecast:**\n`;
                for (const day of forecast.slice(0, 3)) {
                    result += `📅 ${day.date}: ${day.mintempC}°C – ${day.maxtempC}°C\n`;
                }
            }

            return result;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            log.error("Weather lookup failed", { error: msg });
            return `Weather error: ${msg}`;
        }
    },
};
