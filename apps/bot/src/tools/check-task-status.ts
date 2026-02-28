import type { Tool } from "./index.js";
import { log } from "../utils/logger.js";
import type { Client } from "@libsql/client";

/**
 * Tool for the LLM to query the status of autonomous Cloud Worker tasks.
 */
export function createCheckTaskStatusTool(db: Client): Tool {
    return {
        name: "check_task_status",
        description: "Check the current execution status of all active or recent Antigravity cloud worker tasks. Use this when the user asks 'Are you still working?', 'How far along is my task?', or 'Did the task fail?'.",
        inputSchema: {
            type: "object",
            properties: {} // No strict properties needed, it just pulls the latest
        },
        execute: async () => {
            try {
                // Fetch up to 5 most recent tasks
                const result = await db.execute(`
                    SELECT id, project_path, status, repo_url, created_at
                    FROM antigravity_tasks
                    ORDER BY created_at DESC
                    LIMIT 5
                `);

                if (result.rows.length === 0) {
                    return "There are no tasks in the database.";
                }

                const tasks = result.rows.map(row => {
                    return `- Task #${row.id}: Status is '${row.status}'. Action targets repo '${row.repo_url}' (Path: ${row.project_path}).`;
                });

                return `Here are the most recent tasks and their real-time Cloud Worker status:\n${tasks.join("\n")}\n\nNote: 'pending' means it's waiting for the cloud worker to pick it up. 'in_progress' means Codex is currently building or cloning it. 'completed' means it was successfully pushed to GitHub. 'failed' means it crashed.`;
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                log.error("Failed to check task status", { error: msg });
                return `Database Error: ${msg}`;
            }
        },
    };
}
