import type { Tool } from "./index.js";
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
            // Use DuckDuckGo HTML search (more reliable than the API)
            const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
            const response = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (compatible; GravityClaw/1.0)",
                },
            });

            if (!response.ok) {
                return `Search failed with status ${response.status}`;
            }

            const html = await response.text();

            // Extract search results from HTML
            const results: string[] = [];
            const resultRegex = /<a rel="nofollow" class="result__a" href="([^"]*)"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>/g;
            const snippetRegex = /<a class="result__snippet"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>/g;

            const links: string[] = [];
            const titles: string[] = [];
            const snippets: string[] = [];

            let match;
            while ((match = resultRegex.exec(html)) !== null) {
                links.push(match[1] ?? "");
                titles.push((match[2] ?? "").replace(/<[^>]*>/g, "").trim());
            }
            while ((match = snippetRegex.exec(html)) !== null) {
                snippets.push((match[1] ?? "").replace(/<[^>]*>/g, "").trim());
            }

            const count = Math.min(links.length, 5);
            for (let i = 0; i < count; i++) {
                results.push(
                    `${i + 1}. **${titles[i]}**\n   ${snippets[i] || "No snippet"}\n   ${links[i]}`
                );
            }

            if (results.length === 0) {
                return `No results found for "${query}".`;
            }

            return `Search results for "${query}":\n\n${results.join("\n\n")}`;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            log.error("Web search failed", { error: msg });
            return `Search error: ${msg}`;
        }
    },
};
