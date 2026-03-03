import type { Tool } from "./index.js";
import type { Client } from "@libsql/client";
import * as cheerio from "cheerio";
import { config } from "../config.js";
import { log } from "../utils/logger.js";

/**
 * Web search tool using Jina Search API with local SQLite Caching.
 */
export function createWebSearchTool(db: Client): Tool {
    return {
        name: "web_search",
        description:
            "Search the web for current information. Use this when the user asks about recent events, facts you're unsure about, or anything that requires up-to-date information. ESPORTS RULE: If looking for esports schedules or results (like Prime League), append 'site:liquipedia.net' to your query. DO NOT use fandom.com or primeleague.gg as they block scraping. QUERY RULE: Use short, concise, broad keyword strings (e.g. 'Prime League schedule 2026') and never use full conversational sentences.",
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
                // Check cache first
                const cacheRes = await db.execute({
                    sql: `SELECT results, timestamp FROM search_cache WHERE query = ?`,
                    args: [query]
                });

                if (cacheRes.rows.length > 0) {
                    const row = cacheRes.rows[0]!;
                    const timestamp = new Date(row.timestamp as string).getTime();
                    const hoursOld = (Date.now() - timestamp) / (1000 * 60 * 60);

                    // Cache for 3 hours
                    if (hoursOld < 3) {
                        log.info("Web search cache hit", { query, ageHours: Math.round(hoursOld * 10) / 10 });
                        return row.results as string;
                    }
                }

                // Use DuckDuckGo Lite (ultra-fast HTML snippets)
                const url = "https://lite.duckduckgo.com/lite/";
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    },
                    body: `q=${encodeURIComponent(query)}`
                });

                if (!response.ok) {
                    return `Search failed with status ${response.status} ${response.statusText}`;
                }

                const html = await response.text();
                const $ = cheerio.load(html);

                const titleElements = $('.result-link');
                const snippetElements = $('.result-snippet');

                let markdown = "";
                let count = 0;

                titleElements.each((i, elem) => {
                    if (count >= 5) return;

                    const title = $(elem).text().trim();
                    let link = $(elem).attr('href') || "";
                    if (link.includes('uddg=')) {
                        const match = link.match(/uddg=([^&]+)/);
                        if (match) link = decodeURIComponent(match[1]);
                    }

                    const snippet = snippetElements[i] ? $(snippetElements[i]).text().trim() : "";

                    if (title && link) {
                        markdown += `### ${title}\n**URL:** ${link}\n**Snippet:** ${snippet}\n\n`;
                        count++;
                    }
                });

                if (!markdown || markdown.trim().length === 0) {
                    return `No results found for "${query}".`;
                }

                // Truncate to save token context (30k chars is ~8k tokens, safe for Claude)
                if (markdown.length > 30000) {
                    markdown = markdown.substring(0, 30000) + "\n\n... (results truncated)";
                }

                // Save to cache
                await db.execute({
                    sql: `INSERT INTO search_cache (query, results, timestamp) VALUES (?, ?, CURRENT_TIMESTAMP)
                          ON CONFLICT(query) DO UPDATE SET results = excluded.results, timestamp = CURRENT_TIMESTAMP`,
                    args: [query, markdown]
                });

                return markdown;
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                log.error("Web search failed", { error: msg });
                return `Search error: ${msg}`;
            }
        }
    };
}
