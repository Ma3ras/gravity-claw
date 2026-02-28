import type { Tool } from "./index.js";
import type { MemoryManager } from "../memory/index.js";

/**
 * Tool: memory_save
 *
 * Lets the LLM explicitly save an important fact to long-term memory.
 * Automatically deduplicates — if a similar fact exists, it will be updated.
 */
export function createMemorySaveTool(memory: MemoryManager): Tool {
    return {
        name: "memory_save",

        description:
            "Save an important fact or preference to long-term memory. " +
            "Use this when the user tells you something important about themselves, " +
            "their preferences, projects, people they know, or anything they'd " +
            "want you to remember. Duplicates are automatically handled — " +
            "if a similar fact exists, it will be updated rather than duplicated.",

        inputSchema: {
            type: "object",
            properties: {
                fact: {
                    type: "string",
                    description:
                        "The fact to remember, written as a clear, standalone statement. " +
                        'Example: "User\'s name is Max" or "User prefers dark mode in all apps".',
                },
                category: {
                    type: "string",
                    description:
                        "Category for the fact. One of: preference, person, project, " +
                        "decision, personal, technical, general.",
                },
            },
            required: ["fact"],
        },

        async execute(input: Record<string, unknown>): Promise<string> {
            const fact = input.fact as string;
            const category = (input.category as string) || "general";

            if (!fact) {
                return JSON.stringify({ error: "Fact is required" });
            }

            const result = await memory.saveFact(fact, category);

            return JSON.stringify({
                message:
                    result.action === "added"
                        ? "Saved to memory."
                        : result.action === "updated"
                            ? "Updated existing memory (similar fact already existed)."
                            : "Skipped (already known).",
                action: result.action,
                factId: result.factId,
            });
        },
    };
}
