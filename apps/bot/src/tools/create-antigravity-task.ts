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
                    description: "The absolute path of the project on the user's PC (e.g., 'd:\\ai\\gravity-claw' or 'd:\\ai\\ark-bot'). If you aren't sure, assume 'd:\\ai\\gravity-claw'. Note that gravity-claw is a monorepo, however Codex is aware of this automatically.",
                },
                repo_url: {
                    type: "string",
                    description: "Optional. The GitHub repository URL to clone and modify (e.g. 'github.com/Maxik92/new-project.git'). If the repo does not exist, the cloud worker will create it automatically for the user. If omitted, the default gravity-claw repository will be used.",
                },
                prompt: {
                    type: "string",
                    description: "A comprehensive prompt/specification for Codex (your senior AI peer) explaining what needs to be changed, added, or fixed. Codex has full autonomous access to the user's workspace and will automatically verify its own code, so just tell it what the goal is.",
                },
            },
            required: ["project_path", "prompt"],
        },
        execute: async (input: Record<string, unknown>) => {
            const projectPath = input.project_path as string;
            const prompt = input.prompt as string;
            const repoUrl = (input.repo_url as string) || null;

            if (!projectPath || !prompt) return "Error: project_path and prompt are required.";

            try {
                const result = await db.execute({
                    sql: `INSERT INTO antigravity_tasks (project_path, prompt, repo_url) VALUES (?, ?, ?)`,
                    args: [projectPath, prompt, repoUrl]
                });

                log.info("Created Antigravity task", { taskId: Number(result.lastInsertRowid), projectPath, repoUrl });

                return `Ticket #${result.lastInsertRowid} successfully created for Antigravity! Tell the user that the autonomous Cloud Worker has received the task and is now working on it automatically in the background.`;
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                log.error("Failed to create Antigravity task", { error: msg });
                return `Database Error: ${msg}`;
            }
        },
    };
}
