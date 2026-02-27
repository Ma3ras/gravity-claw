import "dotenv/config";

export interface Config {
    telegramBotToken: string;
    llmApiKey: string;
    llmBaseUrl: string;
    allowedUserIds: Set<number>;
    llmModel: string;
    maxIterations: number;
    memoryDbPath: string;
    groqApiKey: string | null;
    embeddingBaseUrl: string;
    embeddingModel: string;
    embeddingApiKey: string;
    tursoDbUrl: string;
    tursoAuthToken: string;
    discordBotToken: string | null;
    heartbeatIntervalMs: number;
    localAiModel: string;
    ollamaBaseUrl: string;
}

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        console.error(`❌ Missing required environment variable: ${name}`);
        console.error(`   Copy .env.example to .env and fill in your values.`);
        process.exit(1);
    }
    return value;
}

function parseUserIds(raw: string): Set<number> {
    const ids = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number)
        .filter((n) => !isNaN(n) && n > 0);

    if (ids.length === 0) {
        console.error(`❌ ALLOWED_USER_IDS must contain at least one valid Telegram user ID.`);
        console.error(`   Find yours: send /start to @userinfobot on Telegram.`);
        process.exit(1);
    }

    return new Set(ids);
}

const llmBaseUrl = process.env["LLM_BASE_URL"] || "https://openrouter.ai/api/v1";
const isLocal = llmBaseUrl.includes("localhost") || llmBaseUrl.includes("127.0.0.1");

export const config: Config = {
    telegramBotToken: requireEnv("TELEGRAM_BOT_TOKEN"),
    llmApiKey: isLocal ? (process.env["LLM_API_KEY"] || "ollama") : requireEnv("LLM_API_KEY"),
    llmBaseUrl,
    allowedUserIds: parseUserIds(requireEnv("ALLOWED_USER_IDS")),
    llmModel: process.env["LLM_MODEL"] || (isLocal ? "llama3.1" : "anthropic/claude-sonnet-4-20250514"),
    maxIterations: Math.min(Math.max(parseInt(process.env["MAX_ITERATIONS"] || "10", 10), 1), 50),
    memoryDbPath: process.env["MEMORY_DB_PATH"] || "./data/memory.db",
    groqApiKey: process.env["GROQ_API_KEY"] || null,
    embeddingBaseUrl: process.env["EMBEDDING_BASE_URL"] || "https://api.jina.ai",
    embeddingModel: process.env["EMBEDDING_MODEL"] || "jina-embeddings-v3",
    embeddingApiKey: process.env["EMBEDDING_API_KEY"] || "",
    tursoDbUrl: process.env["TURSO_DATABASE_URL"] || "file:./data/memory.db",
    tursoAuthToken: process.env["TURSO_AUTH_TOKEN"] || "",
    discordBotToken: process.env["DISCORD_BOT_TOKEN"] || null,
    heartbeatIntervalMs: Number(process.env["HEARTBEAT_INTERVAL_MS"]) || 60 * 60 * 1000, // 1 hour
    localAiModel: process.env["LOCAL_AI_MODEL"] || "qwen2.5-coder:7b-instruct",
    ollamaBaseUrl: process.env["OLLAMA_BASE_URL"] || "http://localhost:11434/v1",
};
