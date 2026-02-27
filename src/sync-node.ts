import { log } from "./utils/logger.js";
import { initDatabase } from "./memory/db.js";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Safety constraint: Only allow operations inside this directory
const ALLOWED_ROOT = path.resolve(process.cwd());

/**
 * Validates that a requested path is inside the allowed root directory.
 * Prevents path traversal attacks (e.g. "../../../Windows/System32").
 */
function getSafePath(relativePath: string): string {
    if (!relativePath) throw new Error("Filepath is required.");

    // Resolve turns something like "src/../.env" into an absolute path
    const absolutePath = path.resolve(ALLOWED_ROOT, relativePath);

    if (!absolutePath.startsWith(ALLOWED_ROOT)) {
        throw new Error(`Security Violation: Path ${absolutePath} is outside the allowed root directory ${ALLOWED_ROOT}`);
    }

    return absolutePath;
}

/**
 * The Sync Node polls the Turso database for pending commands
 * left by the cloud-hosted Gravity Claw agent.
 */
async function startSyncNode() {
    log.info("Starting Headless Sync Node...", { allowedRoot: ALLOWED_ROOT });

    const db = initDatabase();
    // Poll every 5 seconds
    const intervalMs = 5000;

    log.info(`Sync node running. Polling database every ${intervalMs / 1000}s...`);

    setInterval(async () => {
        try {
            // Find one pending command
            const result = await db.execute(`
                SELECT id, command_type, filepath, content
                FROM remote_commands
                WHERE status = 'pending'
                ORDER BY created_at ASC
                LIMIT 1
            `);

            if (result.rows.length === 0) return;

            const row = result.rows[0];
            const id = row.id as string;
            const commandType = row.command_type as string;
            const filepath = row.filepath as string | null;
            const content = row.content as string | null;

            log.info("Found pending remote command", { id, commandType, filepath });

            let responseContent = "";
            let status = "completed";

            try {
                if (commandType === "read_file") {
                    const safePath = getSafePath(filepath!);
                    responseContent = fs.readFileSync(safePath, "utf-8");
                    log.debug("Read file successfully", { safePath });
                }
                else if (commandType === "write_file") {
                    const safePath = getSafePath(filepath!);
                    if (!content) throw new Error("Content is required for write_file.");

                    // Ensure directory exists
                    fs.mkdirSync(path.dirname(safePath), { recursive: true });
                    fs.writeFileSync(safePath, content, "utf-8");
                    responseContent = "File written successfully.";
                    log.debug("Wrote file successfully", { safePath });
                }
                else if (commandType === "run_command") {
                    if (!content) throw new Error("Command string is required in content field.");

                    // Dangerous: but it's the user's local PC running their own cloud bot
                    // Still, we run it strictly in the safe root
                    log.warn("Executing remote command", { command: content });
                    const { stdout, stderr } = await execAsync(content, { cwd: ALLOWED_ROOT });
                    responseContent = `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
                }
                else {
                    throw new Error(`Unknown command type: ${commandType}`);
                }
            } catch (error) {
                status = "error";
                responseContent = error instanceof Error ? error.message : String(error);
                log.error("Failed to execute remote command", { id, error: responseContent });
            }

            // Update row with results
            await db.execute({
                sql: `UPDATE remote_commands SET status = ?, content = ? WHERE id = ?`,
                args: [status, responseContent, id]
            });

            log.info("Remote command completed", { id, status });

        } catch (error) {
            log.error("Sync node polling error", { error: error instanceof Error ? error.message : String(error) });
        }
    }, intervalMs);
}

// Start if run directly
startSyncNode().catch(console.error);
