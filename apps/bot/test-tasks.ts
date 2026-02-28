import { createClient } from "@libsql/client";
import "dotenv/config";

async function run() {
    const db = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    try {
        const res = await db.execute("SELECT id, status, repo_url, created_at FROM antigravity_tasks ORDER BY id DESC LIMIT 10");
        console.log("Latest Tasks:");
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    }
}

run();
