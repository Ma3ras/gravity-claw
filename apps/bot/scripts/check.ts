import { initDatabase } from "../src/memory/db.js";

async function check() {
    const db = initDatabase();
    const result = await db.execute("SELECT * FROM antigravity_tasks WHERE id = 1");
    console.log("Task 1 status:", result.rows);
}
check();
