import type { Tool } from "./index.js";

export const getCurrentTime: Tool = {
    name: "get_current_time",

    description:
        "Get the current date and time. Returns ISO 8601 format and a human-readable string. " +
        "Use this when the user asks about the current time, date, or day of the week.",

    inputSchema: {
        type: "object",
        properties: {
            timezone: {
                type: "string",
                description:
                    'IANA timezone name (e.g., "Europe/Berlin", "America/New_York"). ' +
                    "Defaults to the system's local timezone if not specified.",
            },
        },
    },

    async execute(input: Record<string, unknown>): Promise<string> {
        const timezone = (input.timezone as string) || undefined;

        const now = new Date();

        try {
            const formatter = new Intl.DateTimeFormat("en-US", {
                timeZone: timezone,
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
                timeZoneName: "longGeneric",
            });

            const iso = now.toISOString();
            const readable = formatter.format(now);

            return JSON.stringify({ iso, readable, timezone: timezone ?? "local" });
        } catch {
            return JSON.stringify({
                error: `Invalid timezone: "${timezone}". Use IANA format like "Europe/Berlin".`,
            });
        }
    },
};
