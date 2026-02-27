import { config } from "./config.js";
import { log } from "./utils/logger.js";
import { ToolRegistry } from "./tools/index.js";
import { getCurrentTime } from "./tools/get-current-time.js";
import { createMemoryRecallTool } from "./tools/memory-recall.js";
import { createMemorySaveTool } from "./tools/memory-save.js";
import { initDatabase } from "./memory/db.js";
import { MemoryManager } from "./memory/manager.js";
import { createBot } from "./bot.js";

async function main() {
    log.info("Starting Gravity Claw...", {
        model: config.llmModel,
        maxIterations: config.maxIterations,
        allowedUsers: config.allowedUserIds.size,
    });

    // ── Initialize memory ────────────────────────────────────────────
    const db = initDatabase(config.memoryDbPath);
    const memory = new MemoryManager(db);
    const stats = memory.getStats();
    log.info("Memory loaded", {
        dbPath: config.memoryDbPath,
        messages: stats.messages,
        facts: stats.facts,
        sessions: stats.sessions,
    });

    // ── Register tools ────────────────────────────────────────────
    const toolRegistry = new ToolRegistry();
    toolRegistry.register(getCurrentTime);
    toolRegistry.register(createMemoryRecallTool(memory));
    toolRegistry.register(createMemorySaveTool(memory));

    log.info(`Registered ${toolRegistry.getAll().length} tool(s)`, {
        tools: toolRegistry.getAll().map((t) => t.name),
    });

    // ── Start Telegram bot ────────────────────────────────────────
    const bot = createBot(toolRegistry, memory);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
        log.info(`Received ${signal}, shutting down...`);
        bot.stop();
        db.close();
        process.exit(0);
    };

    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));

    // Start long-polling (never exposes a port)
    await bot.start({
        onStart: (botInfo) => {
            log.info(`🦀 Gravity Claw is online!`, {
                botUsername: botInfo.username,
                botId: botInfo.id,
            });
            console.log("");
            console.log("  ╔══════════════════════════════════════════╗");
            console.log("  ║         🦀  GRAVITY CLAW  🦀            ║");
            console.log("  ║                                          ║");
            console.log(`  ║  Bot: @${botInfo.username.padEnd(33)}║`);
            console.log(`  ║  Model: ${config.llmModel.padEnd(32)}║`);
            console.log(`  ║  Tools: ${toolRegistry.getAll().length.toString().padEnd(32)}║`);
            console.log(`  ║  Memory: ${stats.facts} facts, ${stats.messages} msgs`.padEnd(42) + "║");
            console.log(`  ║  Allowed users: ${config.allowedUserIds.size.toString().padEnd(24)}║`);
            console.log("  ║                                          ║");
            console.log("  ║  Long-polling active. No ports exposed.  ║");
            console.log("  ║  Press Ctrl+C to stop.                   ║");
            console.log("  ╚══════════════════════════════════════════╝");
            console.log("");
        },
    });
}

main().catch((error) => {
    log.error("Fatal error", { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
});
