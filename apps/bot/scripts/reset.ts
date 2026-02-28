import { initDatabase } from "../src/memory/db.js";

async function reset() {
    const db = initDatabase();
    await db.execute("UPDATE antigravity_tasks SET status = 'pending' WHERE id = 1");
    console.log("Reset task 1 to pending");
}
reset();
