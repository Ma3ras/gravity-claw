import { createClient } from "@libsql/client";
import { config } from "./src/config.js";

async function run() {
    const db = createClient({
        url: config.tursoDbUrl,
        authToken: config.tursoAuthToken || undefined,
    });

    try {
        await db.execute(`UPDATE antigravity_tasks SET status = 'pending' WHERE id = 13`);
        console.log("Reset Task 13 to pending!");
    } catch (e) {
        console.error(e);
    }
}

run();
