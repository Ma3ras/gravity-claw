import type { Tool } from "./index.js";
import { log } from "../utils/logger.js";
import type { MemoryManager } from "../memory/manager.js";

/**
 * Creates the schedule_monitor tool, allowing the agent to save cheap background checks.
 */
export function createScheduleMonitorTool(memory: MemoryManager, userId: number): Tool {
    return {
        name: "schedule_monitor",
        description:
            "Schedule a background task to check something regularly (e.g., 'Let me know when the game ends' or 'Check if the website changed'). The prompt must clearly state what to check and the EXACT end condition for when to notify you. When the condition is met, you will be notified and the monitor will be deleted.",
        inputSchema: {
            type: "object",
            properties: {
                prompt: {
                    type: "string",
                    description:
                        "The exact instruction for the background monitor. Must include tools to use (like read_url or web_search) and the condition to trigger a notification. E.g., 'Use web_search for LEC live score. If Game 2 is over, reply with YES and the final score. If not, reply NO.'",
                },
                interval_minutes: {
                    type: "number",
                    description: "How often to run this check in minutes. Minimum is 1.",
                },
            },
            required: ["prompt", "interval_minutes"],
        },
        execute: async (input: Record<string, unknown>) => {
            const prompt = input.prompt as string;
            const interval = Math.max(1, input.interval_minutes as number);

            if (!prompt) return "Error: prompt is required.";

            try {
                const id = await memory.createMonitor(userId, prompt, interval);
                return `Successfully scheduled background monitor ID ${id} to run every ${interval} minutes.\nInstruction: ${prompt}`;
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                log.error("Failed to schedule monitor", { error: msg });
                return `Error scheduling monitor: ${msg}`;
            }
        },
    };
}
