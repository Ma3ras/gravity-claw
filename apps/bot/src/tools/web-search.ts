import type { Tool } from "./index.js";
import { config } from "../config.js";
import { log } from "../utils/logger.js";

/**
 * Web search tool using DuckDuckGo Instant Answer API.
 * Free, no API key required.
 */
export const webSearch: Tool = {
    name: "web_search",
    description:
        "Search the web for current information. Use this when the user asks about recent events, facts you're unsure about, or anything that requires up-to-date information.",
    inputSchema: {
        type: "object" as const,
        properties: {
            query: {
                type: "string",
                description: "The search query",
            },
        },
        required: ["query"],
    },
    execute: async (input: Record<string, unknown>): Promise<string> => {
        const query = input.query as string;
        if (!query) return "Error: No search query provided.";

        log.info("Web search", { query });

        try {
            // Use Jina Search API (returns markdown optimized for LLMs)
            const url = `https://s.jina.ai/${encodeURIComponent(query)}`;
            const response = await fetch(url, {
                headers: {
                    "Accept": "text/plain",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 GravityClaw/1.0",
                    "X-Return-Format": "markdown",
                    ...(config.embeddingApiKey && { "Authorization": `Bearer ${config.embeddingApiKey}` })
                },
            });

            if (!response.ok) {
                return `Search failed with status ${response.status} ${response.statusText}`;
            }

            const markdown = await response.text();

            if (!markdown || markdown.trim().length === 0) {
                return `No results found for "${query}".`;
            }

            // Truncate to save token context
            if (markdown.length > 5000) {
                return markdown.substring(0, 5000) + "\n\n... (results truncated)";
            }

            return markdown;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            log.error("Web search failed", { error: msg });
            return `Search error: ${msg}`;
        }
    },
};
