import { log } from "./utils/logger.js";
import { runAgent } from "./engine/runtime.js";
import type { ToolRegistry } from "./tools/index.js";
import type { MemoryManager } from "./memory/manager.js";
import type { Bot } from "grammy";

/**
 * Start the fast background monitor loop.
 * This runs every 60 seconds, fetches due monitors from the DB,
 * and runs a cheap, stateless agent loop to check the condition.
 */
export function startMonitorLoop(
    bot: Bot,
    toolRegistry: ToolRegistry,
    memory: MemoryManager,
    intervalMs = 60000 // 60 seconds
): NodeJS.Timeout {
    log.info("Starting background monitor loop", { intervalMs });

    return setInterval(async () => {
        try {
            const dueMonitors = await memory.getDueMonitors();
            if (dueMonitors.length === 0) return;

            log.debug(`Found ${dueMonitors.length} due background monitors`);

            for (const task of dueMonitors) {
                log.info("Running background monitor", { monitorId: task.id, userId: task.user_id });

                // Update last run time so we don't double-execute
                await memory.updateMonitorLastRun(task.id);

                const systemPrompt = `[BACKGROUND MONITOR TASK]
You are an isolated background worker. You have NO persistent memory of previous conversations, but you DO have access to tools like read_url and web_search.
Your ONLY job is to execute the user's prompt below, check the real-world condition using tools, and determine if the condition is met.

RULES:
1. If the condition is NOT MET yet (e.g. game is still going), OR if you encounter ANY errors checking the data (e.g. website blocked, fetch failed, content truncated), you MUST reply with exactly one word: "NO". Do not output anything else. Do not apologize or report errors.
2. If the condition IS MET (e.g. game is over, score is found, website changed), reply starting with "YES: " followed by the message you want to send to the user (e.g. "YES: Game 2 is over! Karmine Corp won 2-0.").
3. NEVER reply with "YES" if you are just reporting an error or connection issue. Only "YES" if the actual success condition is explicitly met.`;

                const sessionId = `monitor-${task.id}`;

                // Run the isolated agent (no skills appended, memory logging skipped to avoid DB clutter)
                const reply = await runAgent(
                    systemPrompt + "\n\nUser Prompt: " + task.prompt,
                    toolRegistry,
                    memory,
                    sessionId,
                    undefined, // no skills
                    true // skip logging
                );

                const cleanReply = reply.trim();

                if (cleanReply.toUpperCase() === "NO" || cleanReply.toUpperCase().startsWith("NO.")) {
                    log.debug("Monitor condition not met, waiting for next tick", { monitorId: task.id });
                    continue;
                }

                if (cleanReply.toUpperCase().startsWith("YES")) {
                    log.info("Monitor condition MET, notifying user!", { monitorId: task.id });

                    // Extract the actual notification message
                    let notification = cleanReply;
                    if (cleanReply.toUpperCase().startsWith("YES:")) {
                        notification = cleanReply.substring(4).trim();
                    } else if (cleanReply.toUpperCase().startsWith("YES")) {
                        notification = cleanReply.substring(3).trim();
                    }

                    // Send the notification to the user
                    await bot.api.sendMessage(task.user_id, `🔔 **Background Monitor Alert:**\n\n${notification}`, { parse_mode: "Markdown" }).catch(async () => {
                        await bot.api.sendMessage(task.user_id, `🔔 Background Monitor Alert:\n\n${notification}`);
                    });

                    // Log the notification to their actual memory so the main agent knows it happened
                    const realSessionId = `${task.user_id}-${new Date().toISOString().slice(0, 10)}`;
                    await memory.logMessage("assistant", `[Monitor Alert Sent]: ${notification}`, realSessionId);

                    // Delete the monitor since it completed
                    await memory.deleteMonitor(task.id);
                } else {
                    // Agent returned something confusing, assume NOT met
                    log.warn("Monitor returned unexpected format", { monitorId: task.id, reply: cleanReply });
                }
            }
        } catch (error) {
            log.error("Monitor loop error", {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }, intervalMs);
}

/**
 * Polling loop to check for messages from the Server-Side Orchestrator
 * and forward them to the Telegram Bot user.
 */
export function startOrchestratorMonitorLoop(
    bot: Bot,
    memory: MemoryManager,
    userId: number,
    intervalMs = 5000 // 5 seconds
): NodeJS.Timeout {
    log.info("Starting Orchestrator message monitor loop", { intervalMs });

    return setInterval(async () => {
        try {
            const unread = await memory.getUnreadOrchestratorMessages();
            if (unread.length === 0) return;

            for (const msg of unread) {
                log.info("Forwarding Orchestrator message to user", { projectId: msg.project_id });

                await bot.api.sendMessage(
                    userId,
                    `🤖 **Orchestrator [${msg.project_id}]:**\n\n${msg.message}`,
                    { parse_mode: "Markdown" }
                ).catch(async () => {
                    await bot.api.sendMessage(
                        userId,
                        `🤖 Orchestrator [${msg.project_id}]:\n\n${msg.message}`
                    );
                });

                // Mark as read so we don't spam
                await memory.markOrchestratorMessageRead(msg.id);
            }
        } catch (error) {
            log.error("Orchestrator monitor loop error", {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }, intervalMs);
}
