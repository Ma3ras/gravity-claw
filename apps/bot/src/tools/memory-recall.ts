import type { Tool } from "./index.js";
import type { MemoryManager } from "../memory/index.js";

/**
 * Tool: memory_recall
 *
 * Lets the LLM explicitly search memory for relevant information.
 * Uses hybrid search (FTS5 keywords + vector semantic similarity).
 */
export function createMemoryRecallTool(memory: MemoryManager): Tool {
    return {
        name: "memory_recall",

        description:
            "Search your memory for information the user has told you before. " +
            "Use this when the user asks about something they mentioned previously, " +
            'or when you need context about their preferences, name, projects, etc. ' +
            "Returns relevant past messages and stored facts ranked by relevance.",

        inputSchema: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description:
                        "The search query — describe what you're looking for " +
                        'semantically. Example: "user\'s favorite programming language" ' +
                        'or "what project is the user working on".',
                },
                limit: {
                    type: "number",
                    description: "Maximum number of results to return (default: 5).",
                },
            },
            required: ["query"],
        },

        async execute(input: Record<string, unknown>): Promise<string> {
            const query = input.query as string;
            const limit = (input.limit as number) || 5;

            if (!query) {
                return JSON.stringify({ error: "Query is required" });
            }

            const results = await memory.recall(query, limit);

            if (results.length === 0) {
                return JSON.stringify({
                    message: "No relevant memories found.",
                    results: [],
                });
            }

            return JSON.stringify({
                message: `Found ${results.length} relevant memorie(s).`,
                results: results.map((r) => ({
                    type: r.type,
                    content: r.content,
                    category: r.category,
                    relevance: r.score.toFixed(3),
                    date: r.created_at,
                })),
            });
        },
    };
}
