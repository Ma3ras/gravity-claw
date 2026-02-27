import { log } from "./utils/logger.js";
import { config } from "./config.js";
import { runAgent } from "./agent.js";
import type { ToolRegistry } from "./tools/index.js";
import type { MemoryManager } from "./memory/manager.js";
import type { Bot } from "grammy";

/**
 * Start the autonomous heartbeat loop.
 * Similar to OpenClaw, this wakes the agent up periodically and gives it
 * the opportunity to send a proactive message (like a reminder or summary).
 * If the agent replies "HEARTBEAT_OK", it stays silent.
 */
export function startHeartbeat(
    bot: Bot,
    toolRegistry: ToolRegistry,
    memory: MemoryManager,
    skillsPrompt: string | undefined,
    intervalMs = 60 * 60 * 1000 // default: 1 hour
): NodeJS.Timeout {
    log.info("Starting autonomous heartbeat loop", { intervalMinutes: intervalMs / 60000 });

    return setInterval(async () => {
        log.info("Heartbeat tick");

        const now = new Date().toLocaleString("en-US", { timeZone: "Europe/Berlin" });
        const systemPrompt = `[SYSTEM HEARTBEAT]
The current time is ${now}.
This is an autonomous background check. Analyze your memory and the current time.
Do you need to proactively send a message to the user? (e.g., a morning briefing, a reminder, or a follow-up on a previous conversation).

If you DO need to send a message, write the message normally.
If you DO NOT need to send anything right now, reply EXACTLY with the word "HEARTBEAT_OK" (and nothing else).`;

        // Check for each allowed user in Telegram
        for (const userId of config.allowedUserIds) {
            try {
                const today = new Date().toISOString().slice(0, 10);
                const sessionId = `${userId}-${today}`;

                log.debug("Running heartbeat evaluation", { userId });

                // Run the agent with the hidden system prompt
                // We do NOT log this prompt as a user message in the DB to avoid cluttering memory
                const reply = await runAgent(systemPrompt, toolRegistry, memory, sessionId, skillsPrompt, true);

                const cleanReply = reply.trim();

                // If it's the exact skip phrase, do nothing
                if (cleanReply.includes("HEARTBEAT_OK") || cleanReply === "") {
                    log.debug("Heartbeat suppressed (no action needed)", { userId });
                    continue;
                }

                // Otherwise, the agent wants to speak!
                log.info("Proactive heartbeat message triggered", { userId });
                await bot.api.sendMessage(userId, cleanReply, { parse_mode: "Markdown" }).catch(async () => {
                    await bot.api.sendMessage(userId, cleanReply);
                });

                // Also log the assistant's proactive message to memory so it remembers saying it
                await memory.logMessage("assistant", cleanReply, sessionId);

            } catch (error) {
                log.error("Heartbeat error", {
                    userId,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
    }, intervalMs);
}
