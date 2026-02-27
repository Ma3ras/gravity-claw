import type { Tool } from "./index.js";
import { log } from "../utils/logger.js";

/**
 * Weather tool using wttr.in — free, no API key, supports any location.
 * Uses the compact text format for speed and reliability.
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
            // Use the compact text format — much faster than JSON
            const format = "%l:+%C+%t+(feels+%f)+💧%h+💨%w+UV:%u";
            const url = `https://wttr.in/${encodeURIComponent(location)}?format=${encodeURIComponent(format)}`;
            const response = await fetch(url, {
                headers: {
                    "User-Agent": "curl/8.0",
                    "Accept": "text/plain",
                },
                signal: AbortSignal.timeout(15000),
            });

            if (!response.ok) {
                return `Weather lookup failed: ${response.status}`;
            }

            const text = (await response.text()).trim();

            if (text.includes("Unknown location") || text.includes("Sorry")) {
                return `Could not find weather data for "${location}".`;
            }

            // Also fetch 3-day forecast (compact format)
            const forecastUrl = `https://wttr.in/${encodeURIComponent(location)}?format=3`;
            let forecast = "";
            try {
                const fRes = await fetch(forecastUrl, {
                    headers: { "User-Agent": "curl/8.0", "Accept": "text/plain" },
                    signal: AbortSignal.timeout(10000),
                });
                if (fRes.ok) {
                    forecast = (await fRes.text()).trim();
                }
            } catch {
                // Forecast is optional
            }

            let result = `🌤️ **Weather:**\n${text}`;
            if (forecast) {
                result += `\n\n**Forecast:**\n${forecast}`;
            }

            return result;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            log.error("Weather lookup failed", { error: msg });
            return `Weather error: ${msg}`;
        }
    },
};
