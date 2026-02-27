import { initDatabase } from "../src/memory/db.js";
import { log } from "../src/utils/logger.js";

async function completeTask() {
    const taskId = process.argv[2];
    if (!taskId) {
        console.error("Please provide a task ID: npm run complete-task <id>");
        process.exit(1);
    }

    log.info(`Marking task ${taskId} as completed in Turso...`);
    const db = initDatabase();

    try {
        await db.execute({
            sql: `UPDATE antigravity_tasks SET status = 'completed' WHERE id = ?`,
            args: [Number(taskId)]
        });

        console.log(`\nSuccessfully marked task #${taskId} as completed!`);
    } catch (error) {
        log.error("Failed to complete task", { error: error instanceof Error ? error.message : String(error) });
        process.exit(1);
    }
}

completeTask();
