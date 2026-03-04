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

    // --- XML Tool Call Fallback for DeepSeek/Ollama ---
    let parsedToolCalls = message.tool_calls ?? [];
    let parsedContent = message.content;

    if (!parsedToolCalls.length && parsedContent && parsedContent.includes("<function_calls>")) {
        const invokeRegex = /<invoke\s+name="([^"]+)">([\s\S]*?)<\/invoke>/g;
        let match;
        const newCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] = [];

        while ((match = invokeRegex.exec(parsedContent)) !== null) {
            const num = newCalls.length;
            const toolName = match[1];
            const paramBlock = match[2];

            const params: Record<string, any> = {};
            const paramRegex = /<parameter\s+name="([^"]+)"[^>]*>([\s\S]*?)<\/parameter>/g;
            let pMatch;
            while ((pMatch = paramRegex.exec(paramBlock)) !== null) {
                params[pMatch[1]] = pMatch[2].trim();
            }

            newCalls.push({
                id: `call_xml_${Date.now()}_${num}`,
                type: 'function',
                function: {
                    name: toolName,
                    arguments: JSON.stringify(params)
                }
            });
        }

        if (newCalls.length > 0) {
            parsedToolCalls = newCalls;
            // Optionally clear the content or keep it for the user to see what the LLM tried to do.
            // For now, let's keep it but just execute the tools!
            log.info("Intercepted and parsed XML tool calls from content", { count: newCalls.length });
        }
    }
    // --- End XML Fallback ---

    log.debug("LLM response", {
        hasContent: !!parsedContent,
        toolCalls: parsedToolCalls.length,
        finishReason: choice.finish_reason,
    });

    return {
        content: parsedContent,
        toolCalls: parsedToolCalls,
        raw: {
            ...message,
            content: parsedContent,
            tool_calls: parsedToolCalls.length > 0 ? parsedToolCalls : undefined
        },
        usage: response.usage ?? undefined,
    };
}
