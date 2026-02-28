import { createClient } from "@libsql/client";
import "dotenv/config";

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

const prompt = `The Tic-Tac-Toe React app in this directory is already written. Do the following steps IN ORDER:

1. Run: npm run build    (this produces a dist/ folder with static HTML/JS/CSS)
2. You have a registered MCP server called "netlify". Use the Netlify MCP tools to deploy the contents of the dist/ folder as a production deploy to the EXISTING Netlify site with ID: 54a6697b-cfad-4458-971c-43f1462057d2
3. Do NOT use the netlify CLI command at all. ONLY use MCP tools.
4. The NETLIFY_AUTH_TOKEN environment variable is already set in your environment.
5. Output the final live URL when done.`;

await client.execute({
    sql: "INSERT INTO antigravity_tasks (project_path, prompt) VALUES (?, ?)",
    args: ["d:\\ai\\gravity-claw\\apps\\web", prompt]
});

console.log("✅ Deploy task inserted!");
