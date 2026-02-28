import { config } from "./config.js";
import { log } from "./utils/logger.js";
import { initDatabase } from "./memory/db.js";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

async function runCodexAgent(prompt: string, projectPath: string): Promise<void> {
    log.info(`[CloudWorker] Sending task to Codex CLI...`);

    try {
        // Use Codex CLI in non-interactive exec mode with full workspace access
        const safePrompt = prompt.replace(/"/g, '\\"');
        const command = `codex exec --sandbox danger-full-access "${safePrompt}"`;

        log.debug(`[CloudWorker] Executing: ${command.substring(0, 100)}...`);

        // Codex can generate large diffs, so we use a 10MB buffer
        const { stdout, stderr } = await execPromise(command, {
            cwd: projectPath,
            maxBuffer: 1024 * 1024 * 10
        });

        log.info(`[CloudWorker] Codex execution finished.`);
        if (stdout) log.info(`[CloudWorker] Codex Output:\n${stdout.substring(0, 500)}...`);
        if (stderr) log.warn(`[CloudWorker] Codex STDERR:\n${stderr.substring(0, 500)}...`);

    } catch (error: any) {
        log.error("[CloudWorker] Codex CLI Error", {
            error: error.message,
            stdout: error.stdout,
            stderr: error.stderr
        });
        throw error; // Let the caller handle the failure
    }
}

async function startWorker() {
    log.info("Starting Local AI Worker (Ollama) node...");
    const db = initDatabase();
    // Poll every 10 seconds
    const intervalMs = 10000;

    setInterval(async () => {
        try {
            const result = await db.execute(`
                SELECT id, project_path, prompt 
                FROM antigravity_tasks 
                WHERE status = 'pending' 
                ORDER BY created_at ASC 
                LIMIT 1
            `);

            if (result.rows.length === 0) return;

            const row = result.rows[0];
            const id = Number(row.id);
            const projectPath = row.project_path as string;
            const prompt = row.prompt as string;

            log.info(`[LocalWorker] Picked up task #${id}`);

            // Mark as in-progress (using a dummy status so others don't pick it up, although we're the only worker)
            await db.execute({
                sql: `UPDATE antigravity_tasks SET status = 'in_progress' WHERE id = ?`,
                args: [id]
            });

            // Execute the Codex CLI Agent
            await runCodexAgent(prompt, projectPath);

            // Mark as completed
            await db.execute({
                sql: `UPDATE antigravity_tasks SET status = 'completed' WHERE id = ?`,
                args: [id]
            });

            log.info(`[LocalWorker] Successfully completed task #${id}`);

        } catch (error) {
            log.error("[LocalWorker] Polling error", { error: error instanceof Error ? error.message : String(error) });
        }
    }, intervalMs);
}

startWorker().catch(console.error);
