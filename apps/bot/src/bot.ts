import { Bot, Context } from "grammy";
import { config } from "./config.js";
import { log } from "./utils/logger.js";
import { runAgent } from "./agent.js";
import type { ToolRegistry } from "./tools/index.js";
import type { MemoryManager } from "./memory/index.js";
import { transcribeAudio, isVoiceEnabled } from "./voice/transcribe.js";

/**
 * Create and configure the Telegram bot.
 *
 * Security:
 * - User ID whitelist: only responds to ALLOWED_USER_IDS
 * - Long-polling only: never exposes a web server or port
 * - No message content logged from unauthorized users
 */
export function createBot(toolRegistry: ToolRegistry, memory?: MemoryManager, skillsPrompt?: string): Bot {
    const bot = new Bot(config.telegramBotToken);

    // ── Security middleware: user ID whitelist ───────────────────────
    bot.use(async (ctx, next) => {
        const userId = ctx.from?.id;

        if (!userId || !config.allowedUserIds.has(userId)) {
            // Silently ignore — no response, no content logged
            log.debug("Ignored message from unauthorized user", { userId: userId ?? "unknown" });
            return;
        }

        await next();
    });

    // ── /start command ──────────────────────────────────────────────
    bot.command("start", async (ctx) => {
        const voiceStatus = isVoiceEnabled() ? "🎤 Voice messages enabled" : "🔇 Voice disabled (no GROQ_API_KEY)";
        await ctx.reply(
            "🦀 *Gravity Claw is online.*\n\n" +
            "I'm your personal AI agent. Send me any message and I'll help.\n\n" +
            "I can use tools to get real information — try asking me what time it is!\n\n" +
            `${voiceStatus}`,
            { parse_mode: "Markdown" }
        );
    });

    // ── Handle all text messages ────────────────────────────────────
    bot.on("message:text", async (ctx) => {
        const text = ctx.message.text;
        const userId = ctx.from.id;
        const chatId = ctx.chat.id;

        const today = new Date().toISOString().slice(0, 10);
        const sessionId = `${chatId}-${today}`;

        log.info("Received message", { userId, length: text.length, sessionId });
        await handleAgentReply(ctx, text, toolRegistry, memory, sessionId, userId, skillsPrompt);
    });

    // ── Handle voice messages ───────────────────────────────────────
    bot.on("message:voice", async (ctx) => {
        const userId = ctx.from.id;
        const chatId = ctx.chat.id;

        const today = new Date().toISOString().slice(0, 10);
        const sessionId = `${chatId}-${today}`;

        if (!isVoiceEnabled()) {
            await ctx.reply("🔇 Voice messages are not enabled. Set GROQ_API_KEY in .env to enable.");
            return;
        }

        log.info("Received voice message", {
            userId,
            duration: ctx.message.voice.duration,
            sessionId,
        });

        await ctx.replyWithChatAction("typing");

        try {
            // Download the voice file from Telegram
            const file = await ctx.getFile();
            const fileUrl = `https://api.telegram.org/file/bot${config.telegramBotToken}/${file.file_path}`;

            const response = await fetch(fileUrl);
            if (!response.ok) {
                throw new Error(`Failed to download voice file: ${response.status}`);
            }

            const audioBuffer = Buffer.from(await response.arrayBuffer());

            // Transcribe via Groq Whisper
            const transcribedText = await transcribeAudio(audioBuffer, file.file_path ?? "voice.ogg");

            if (!transcribedText) {
                await ctx.reply("🔇 Couldn't understand the voice message. Please try again.");
                return;
            }

            // Show what was transcribed
            await ctx.reply(`🎤 _"${transcribedText}"_`, { parse_mode: "Markdown" }).catch(() => { });

            // Process through the agent like a text message
            log.info("Processing transcribed voice", { textLength: transcribedText.length });
            await handleAgentReply(ctx, transcribedText, toolRegistry, memory, sessionId, userId, skillsPrompt);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            log.error("Voice processing error", { error: message, userId });
            await ctx.reply("❌ Failed to process voice message. Please try again.");
        }
    });

    // ── Error handler ───────────────────────────────────────────────
    bot.catch((err) => {
        log.error("Bot error", { error: err.message });
    });

    return bot;
}

/**
 * Run the agent and send the reply — shared by text and voice handlers.
 */
async function handleAgentReply(
    ctx: Context,
    text: string,
    toolRegistry: ToolRegistry,
    memory: MemoryManager | undefined,
    sessionId: string,
    userId: number,
    skillsPrompt?: string
): Promise<void> {
    await ctx.replyWithChatAction("typing");

    try {
        const reply = await runAgent(text, toolRegistry, memory, sessionId, skillsPrompt);

        // Telegram has a 4096 char limit per message — split if needed
        if (reply.length <= 4096) {
            await ctx.reply(reply, { parse_mode: "Markdown" }).catch(async () => {
                await ctx.reply(reply);
            });
        } else {
            const chunks = splitMessage(reply, 4096);
            for (const chunk of chunks) {
                await ctx.reply(chunk, { parse_mode: "Markdown" }).catch(async () => {
                    await ctx.reply(chunk);
                });
            }
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log.error("Agent error", { error: message, userId });
        await ctx.reply("❌ Something went wrong. Please try again.");
    }
}

/**
 * Split a long message into chunks at natural boundaries.
 */
function splitMessage(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
        if (remaining.length <= maxLength) {
            chunks.push(remaining);
            break;
        }

        let splitAt = remaining.lastIndexOf("\n", maxLength);
        if (splitAt === -1 || splitAt < maxLength * 0.5) {
            splitAt = remaining.lastIndexOf(" ", maxLength);
        }
        if (splitAt === -1) {
            splitAt = maxLength;
        }

        chunks.push(remaining.substring(0, splitAt));
        remaining = remaining.substring(splitAt).trimStart();
    }

    return chunks;
}
