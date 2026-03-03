import OpenAI from "openai";
import { config } from "../../config.js";
import { log } from "../../utils/logger.js";
import type { Tool } from "../../tools/index.js";

// ── Client setup ────────────────────────────────────────────────────────────

// Single OpenAI-compatible client — works with any provider:
// Ollama cloud, OpenRouter, NVIDIA, Groq, or any OpenAI-compatible API.
const isOpenRouter = config.llmBaseUrl.includes("openrouter.ai");

const client = new OpenAI({
    baseURL: config.llmBaseUrl,
    apiKey: config.llmApiKey || "no-key",
    ...(isOpenRouter && {
        defaultHeaders: {
            "HTTP-Referer": "https://github.com/gravity-claw",
            "X-Title": "Gravity Claw",
        },
    }),
});

// ── Types ────────────────────────────────────────────────────────────────────

export type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export interface LLMResponse {
    content: string | null;
    toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
    raw: OpenAI.Chat.Completions.ChatCompletionMessage;
    usage?: OpenAI.Completions.CompletionUsage;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function toolsToOpenAIFormat(tools: Tool[]): OpenAI.Chat.Completions.ChatCompletionTool[] {
    return tools.map((t) => ({
        type: "function" as const,
        function: {
            name: t.name,
            description: t.description,
            parameters: t.inputSchema as Record<string, unknown>,
        },
    }));
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export async function chat(
    messages: ChatMessage[],
    tools?: OpenAI.Chat.Completions.ChatCompletionTool[]
): Promise<LLMResponse> {
    log.debug("LLM request", {
        model: config.llmModel,
        messageCount: messages.length,
    });

    const response = await client.chat.completions.create({
        model: config.llmModel,
        messages,
        tools: tools && tools.length > 0 ? tools : undefined,
        max_tokens: 4096,
    });

    const choice = response.choices[0];
    if (!choice) throw new Error("LLM returned no choices");

    const message = choice.message;

    log.debug("LLM response", {
        hasContent: !!message.content,
        toolCalls: message.tool_calls?.length ?? 0,
        finishReason: choice.finish_reason,
    });

    return {
        content: message.content,
        toolCalls: message.tool_calls ?? [],
        raw: message,
        usage: response.usage ?? undefined,
    };
}
