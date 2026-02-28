import type { Tool } from "./index.js";
import { log } from "../utils/logger.js";
import type { Client } from "@libsql/client";

/**
 * Creates the tool that allows Gravity Claw to insert tasks
 * into the database for Antigravity (Gemini 3.1 Pro) to execute locally.
 */
export function createAntigravityTaskTool(db: Client): Tool {
    return {
        name: "create_antigravity_task",
        description:
            "Create a coding task/ticket for Antigravity (the user's local senior AI developer) to execute later. Use this when the user asks you to build a complex feature, write code, or modify a codebase. You act as the Product Manager writing the ticket. Do NOT write the code yourself if you use this tool.",
        inputSchema: {
            type: "object",
            properties: {
                project_path: {
                    type: "string",
                    description: "The absolute path of the project on the user's PC (e.g., 'd:\\ai\\gravity-claw' or 'd:\\ai\\ark-bot'). If you aren't sure, assume 'd:\\ai\\gravity-claw'. Note that gravity-claw is a monorepo: 'd:\\ai\\gravity-claw\\apps\\bot' is the Node.js backend, and 'd:\\ai\\gravity-claw\\apps\\web' is the Vite React frontend. Adjust this path depending on what app the task is for.",
                },
                prompt: {
                    type: "string",
                    description: "A comprehensive prompt/specification for Codex (your senior AI peer) explaining what needs to be changed, added, or fixed. Codex has full autonomous access to the user's workspace, so you do NOT need to provide file contents or write the code yourself. Just tell Codex what the goal is and any specific architecture rules to follow.",
                },
            },
            required: ["project_path", "prompt"],
        },
        execute: async (input: Record<string, unknown>) => {
            const projectPath = input.project_path as string;
            const prompt = input.prompt as string;

            if (!projectPath || !prompt) return "Error: project_path and prompt are required.";

            try {
                const result = await db.execute({
                    sql: `INSERT INTO antigravity_tasks (project_path, prompt) VALUES (?, ?)`,
                    args: [projectPath, prompt]
                });

                log.info("Created Antigravity task", { taskId: Number(result.lastInsertRowid), projectPath });

                return `Ticket #${result.lastInsertRowid} successfully created for Antigravity! Tell the user they can pull this task by typing '/gravity_sync' in their VS Code Antigravity chat.`;
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                log.error("Failed to create Antigravity task", { error: msg });
                return `Database Error: ${msg}`;
            }
        },
    };
}
