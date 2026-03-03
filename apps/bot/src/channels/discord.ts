import {
    Client,
    GatewayIntentBits,
    Events,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder,
} from "discord.js";
import type { Interaction, Message as DiscordMessage } from "discord.js";
import { config } from "../config.js";
import { log } from "../utils/logger.js";
import { runAgent } from "../engine/runtime.js";
import type { ToolRegistry } from "../tools/index.js";
import type { MemoryManager } from "../memory/index.js";

// ── Slash command definitions ────────────────────────────────────────────────

const askCommand = new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask Gravity Claw a question")
    .addStringOption((opt) =>
        opt.setName("question").setDescription("Your question").setRequired(true)
    );

const memoryCommand = new SlashCommandBuilder()
    .setName("memory")
    .setDescription("Check Gravity Claw's memory stats");

const commands = [askCommand, memoryCommand];

// ── Discord bot ──────────────────────────────────────────────────────────────

export function createDiscordBot(
    toolRegistry: ToolRegistry,
    memory: MemoryManager,
    skillsPrompt?: string
): Client | null {
    const token = config.discordBotToken;
    if (!token) {
        log.info("Discord bot disabled (no DISCORD_BOT_TOKEN set)");
        return null;
    }

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.DirectMessages,
        ],
    });

    // ── Register slash commands on ready ──────────────────────────────
    client.once(Events.ClientReady, async (readyClient) => {
        log.info("Discord bot online!", {
            username: readyClient.user.tag,
            guilds: readyClient.guilds.cache.size,
        });

        // Register global slash commands
        try {
            const rest = new REST().setToken(token);
            await rest.put(Routes.applicationCommands(readyClient.user.id), {
                body: commands.map((c) => c.toJSON()),
            });
            log.info("Discord slash commands registered");
        } catch (error) {
            log.error("Failed to register slash commands", {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    });

    // ── Handle slash commands ─────────────────────────────────────────
    client.on(Events.InteractionCreate, async (interaction: Interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const userId = interaction.user.id;
        const sessionId = `discord-${userId}-${new Date().toISOString().slice(0, 10)}`;

        if (interaction.commandName === "ask") {
            const question = interaction.options.getString("question", true);
            log.info("Discord /ask command", { userId, question: question.substring(0, 50) });

            await interaction.deferReply();

            try {
                const reply = await runAgent(question, toolRegistry, memory, sessionId, skillsPrompt);
                await sendLongReply(interaction, reply);
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                log.error("Discord agent error", { error: msg });
                await interaction.editReply("❌ Something went wrong. Try again.");
            }
        }

        if (interaction.commandName === "memory") {
            const stats = await memory.getStats();
            const embed = new EmbedBuilder()
                .setTitle("🧠 Gravity Claw Memory")
                .setColor(0x00ff88)
                .addFields(
                    { name: "Messages", value: stats.messages.toString(), inline: true },
                    { name: "Facts", value: stats.facts.toString(), inline: true },
                    { name: "Sessions", value: stats.sessions.toString(), inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    });

    // ── Handle direct messages and @mentions ──────────────────────────
    client.on(Events.MessageCreate, async (message: DiscordMessage) => {
        // Ignore bots and system messages
        if (message.author.bot) return;

        // Only respond to DMs or when mentioned
        const isDM = !message.guild;
        const isMentioned = message.mentions.has(client.user!);

        if (!isDM && !isMentioned) return;

        let content = message.content;
        // Remove mention from the message
        if (isMentioned && client.user) {
            content = content.replace(`<@${client.user.id}>`, "").trim();
        }
        if (!content) return;

        const userId = message.author.id;
        const sessionId = `discord-${userId}-${new Date().toISOString().slice(0, 10)}`;

        log.info("Discord message", { userId, isDM, length: content.length });

        try {
            if ('sendTyping' in message.channel) {
                await message.channel.sendTyping();
            }
            const reply = await runAgent(content, toolRegistry, memory, sessionId, skillsPrompt);

            // Split long messages (Discord 2000 char limit)
            const chunks = splitMessage(reply, 2000);
            for (const chunk of chunks) {
                await message.reply(chunk);
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            log.error("Discord agent error", { error: msg, userId });
            await message.reply("❌ Something went wrong. Try again.");
        }
    });

    // ── Login ────────────────────────────────────────────────────────
    client.login(token).catch((error) => {
        log.error("Discord login failed", {
            error: error instanceof Error ? error.message : String(error),
        });
    });

    return client;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function splitMessage(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) return [text];

    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
        if (remaining.length <= maxLength) {
            chunks.push(remaining);
            break;
        }
        // Try to split at newline
        let splitIndex = remaining.lastIndexOf("\n", maxLength);
        if (splitIndex < maxLength / 2) splitIndex = maxLength;

        chunks.push(remaining.substring(0, splitIndex));
        remaining = remaining.substring(splitIndex).trimStart();
    }

    return chunks;
}

async function sendLongReply(
    interaction: { editReply: (content: string) => Promise<unknown> },
    text: string
): Promise<void> {
    const chunks = splitMessage(text, 2000);
    await interaction.editReply(chunks[0] ?? "No response.");
    // Discord can only editReply once, additional chunks would need followUp
}
