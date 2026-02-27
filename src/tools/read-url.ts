import type { Tool } from "./index.js";
import { log } from "../utils/logger.js";
import { config } from "../config.js";

/**
 * URL reader tool — fetches a web page and extracts readable text content.
 * Useful for summarizing articles, reading documentation, etc.
 */
export const readUrl: Tool = {
    name: "read_url",
    description:
        "Fetch and read the text content of a web page URL. Use this when the user shares a link and wants you to read, summarize, or analyze its content.",
    inputSchema: {
        type: "object" as const,
        properties: {
            url: {
                type: "string",
                description: "The URL to fetch and read",
            },
        },
        required: ["url"],
    },
    execute: async (input: Record<string, unknown>): Promise<string> => {
        const url = input.url as string;
        if (!url) return "Error: No URL provided.";

        log.info("Reading URL via Jina Reader", { url });

        try {
            // Use Jina Reader API (r.jina.ai) to extract readable markdown, executing JS
            const jinaUrl = `https://r.jina.ai/${url}`;
            const headers: Record<string, string> = {
                "Accept": "text/plain",
            };

            // If we have a Jina API key from config, use it for higher limits
            if (config.embeddingApiKey && config.embeddingApiKey.startsWith("jina_")) {
                headers["Authorization"] = `Bearer ${config.embeddingApiKey}`;
            }

            const response = await fetch(jinaUrl, {
                headers,
                signal: AbortSignal.timeout(15000), // 15s timeout
            });

            if (!response.ok) {
                return `Failed to fetch URL: ${response.status} ${response.statusText}`;
            }

            let text = await response.text();

            // Truncate if too long (Balance: ~3500 tokens max to save API costs)
            const MAX_LENGTH = 15000;
            if (text.length > MAX_LENGTH) {
                text = text.substring(0, MAX_LENGTH) + "\n\n[... content truncated to save tokens]";
            }

            if (!text || text.length < 20) {
                return "Could not extract meaningful text from this URL. The page might be protected or completely empty.";
            }

            return `Content from ${url}:\n\n${text}`;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            log.error("URL read failed", { error: msg, url });
            return `Error reading URL: ${msg}`;
        }
    },
};
