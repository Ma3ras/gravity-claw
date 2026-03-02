import { initDatabase } from './src/memory/db.js';

async function main() {
    const db = initDatabase();
    try {
        const res = await db.execute('SELECT result_data FROM antigravity_tasks WHERE id = 39');
        if (res.rows.length > 0) {
            const data = JSON.parse(res.rows[0].result_data?.toString() || '{}');
            console.log("Subtasks found:", data.subtasks?.length);
            data.subtasks?.forEach((s: any) => console.log(`- [${s.status}] ${s.id} (Role: ${s.assignedRole})`));
        } else {
            console.log("No row found");
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

main();
