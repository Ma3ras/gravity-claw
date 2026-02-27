import type { Tool } from "./index.js";
import { log } from "../utils/logger.js";

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

        log.info("Reading URL", { url });

        try {
            const response = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (compatible; GravityClaw/1.0)",
                    "Accept": "text/html,application/xhtml+xml,text/plain",
                },
                signal: AbortSignal.timeout(15000), // 15s timeout
            });

            if (!response.ok) {
                return `Failed to fetch URL: ${response.status} ${response.statusText}`;
            }

            const contentType = response.headers.get("content-type") || "";
            if (!contentType.includes("text/") && !contentType.includes("application/json")) {
                return `URL returned non-text content (${contentType}). Cannot read binary files.`;
            }

            const html = await response.text();

            // Strip HTML tags and extract readable text
            let text = html
                // Remove script and style blocks
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
                .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
                .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
                // Convert common elements to text equivalents
                .replace(/<br\s*\/?>/gi, "\n")
                .replace(/<\/p>/gi, "\n\n")
                .replace(/<\/h[1-6]>/gi, "\n\n")
                .replace(/<\/li>/gi, "\n")
                .replace(/<\/div>/gi, "\n")
                // Strip remaining HTML tags
                .replace(/<[^>]+>/g, "")
                // Decode common HTML entities
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&nbsp;/g, " ")
                // Clean up whitespace
                .replace(/\n{3,}/g, "\n\n")
                .replace(/[ \t]+/g, " ")
                .trim();

            // Truncate if too long (keep under 4000 chars for LLM context)
            const MAX_LENGTH = 4000;
            if (text.length > MAX_LENGTH) {
                text = text.substring(0, MAX_LENGTH) + "\n\n[... content truncated]";
            }

            if (!text || text.length < 20) {
                return "Could not extract meaningful text from this URL. The page might require JavaScript.";
            }

            return `Content from ${url}:\n\n${text}`;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            log.error("URL read failed", { error: msg, url });
            return `Error reading URL: ${msg}`;
        }
    },
};
