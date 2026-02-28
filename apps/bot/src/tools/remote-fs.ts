import type { Tool } from "./index.js";
import { log } from "../utils/logger.js";
import type { Client } from "@libsql/client";

function generateId(): string {
    return Math.random().toString(36).substring(2, 15);
}

/**
 * Helper to wait for a remote command to finish.
 * Polls the DB until status is 'completed' or 'error'.
 */
async function waitForRemoteCommand(db: Client, id: string, timeoutMs = 60000): Promise<string> {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
        const result = await db.execute({
            sql: `SELECT status, content FROM remote_commands WHERE id = ?`,
            args: [id]
        });

        if (result.rows.length === 0) {
            return "Error: Command vanished from database.";
        }

        const status = result.rows[0].status as string;
        const content = result.rows[0].content as string;

        if (status === "completed") {
            return content || "Success (no output).";
        }
        if (status === "error") {
            return `Remote Execution Error:\n${content}`;
        }

        // Wait 2 seconds before polling again
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return "Error: Timed out waiting for the local sync node. Make sure `npm run sync-node` is running on the target PC.";
}

export function createRemoteTools(db: Client): Tool[] {
    return [
        {
            name: "remote_read_file",
            description: "Read a local file from the user's PC via the sync node. The file path must be relative to the d:\\ai\\gravity-claw directory.",
            inputSchema: {
                type: "object",
                properties: {
                    filepath: {
                        type: "string",
                        description: "Relative file path (e.g. 'src/index.ts')",
                    },
                },
                required: ["filepath"],
            },
            execute: async (input: Record<string, unknown>) => {
                const filepath = input.filepath as string;
                if (!filepath) return "Error: filepath is required.";

                try {
                    const id = generateId();
                    await db.execute({
                        sql: `INSERT INTO remote_commands (id, command_type, filepath) VALUES (?, 'read_file', ?)`,
                        args: [id, filepath]
                    });

                    log.info("Dispatched remote_read_file", { id, filepath });
                    return await waitForRemoteCommand(db, id);
                } catch (error) {
                    return `Database Error: ${error instanceof Error ? error.message : String(error)}`;
                }
            },
        },
        {
            name: "remote_write_file",
            description: "Write or overwrite a local file on the user's PC via the sync node. Provide the FULL new content. The file path must be relative to the d:\\ai\\gravity-claw directory.",
            inputSchema: {
                type: "object",
                properties: {
                    filepath: {
                        type: "string",
                        description: "Relative file path (e.g. 'src/new-tool.ts')",
                    },
                    content: {
                        type: "string",
                        description: "The complete new content of the file to write.",
                    }
                },
                required: ["filepath", "content"],
            },
            execute: async (input: Record<string, unknown>) => {
                const filepath = input.filepath as string;
                const content = input.content as string;
                if (!filepath || !content) return "Error: filepath and content are required.";

                try {
                    const id = generateId();
                    await db.execute({
                        sql: `INSERT INTO remote_commands (id, command_type, filepath, content) VALUES (?, 'write_file', ?, ?)`,
                        args: [id, filepath, content]
                    });

                    log.info("Dispatched remote_write_file", { id, filepath });
                    return await waitForRemoteCommand(db, id);
                } catch (error) {
                    return `Database Error: ${error instanceof Error ? error.message : String(error)}`;
                }
            },
        },
        {
            name: "remote_run_command",
            description: "Run a bash/cmd command on the user's local PC inside the d:\\ai\\gravity-claw directory. E.g. `npx tsc --noEmit` or `npm test`.",
            inputSchema: {
                type: "object",
                properties: {
                    command: {
                        type: "string",
                        description: "The command to run locally.",
                    },
                },
                required: ["command"],
            },
            execute: async (input: Record<string, unknown>) => {
                const command = input.command as string;
                if (!command) return "Error: command is required.";

                try {
                    const id = generateId();
                    await db.execute({
                        sql: `INSERT INTO remote_commands (id, command_type, content) VALUES (?, 'run_command', ?)`,
                        args: [id, command]
                    });

                    log.info("Dispatched remote_run_command", { id, command });
                    return await waitForRemoteCommand(db, id);
                } catch (error) {
                    return `Database Error: ${error instanceof Error ? error.message : String(error)}`;
                }
            },
        }
    ];
}
