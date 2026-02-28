import { initDatabase } from "../src/memory/db.js";
import { log } from "../src/utils/logger.js";

async function pullTasks() {
    log.info("Checking Turso for pending Antigravity tasks...");
    const db = initDatabase();

    try {
        const result = await db.execute(`
            SELECT id, project_path, prompt, created_at
            FROM antigravity_tasks
            WHERE status = 'pending'
            ORDER BY created_at ASC
        `);

        if (result.rows.length === 0) {
            console.log("\n[ANTIGRAVITY_TASKS_OUTPUT]");
            console.log(JSON.stringify([], null, 2));
            process.exit(0);
        }

        const tasks = result.rows.map(row => ({
            id: Number(row.id),
            projectPath: row.project_path as string,
            prompt: row.prompt as string,
            createdAt: row.created_at as string
        }));

        // The workflow will look for this exact string to parse the JSON
        console.log("\n[ANTIGRAVITY_TASKS_OUTPUT]");
        console.log(JSON.stringify(tasks, null, 2));

    } catch (error) {
        log.error("Failed to pull tasks", { error: error instanceof Error ? error.message : String(error) });
        process.exit(1);
    }
}

pullTasks();
