import { createClient } from "@libsql/client";
import { config as appConfig } from "./src/config.ts";

const db = createClient({
    url: appConfig.tursoDbUrl,
    authToken: appConfig.tursoAuthToken
});

async function run() {
    try {
        const res = await db.execute("SELECT * FROM orchestrator_messages WHERE project_id = '105' ORDER BY created_at ASC");
        for (const row of res.rows) {
            console.log(`\n\n[MESSAGE START]\n${row.message}\n[MESSAGE END]`);
        }
    } catch (e) {
        console.error(e);
    }
}
run();
