import { Orchestrator } from "./engine/orchestrator.js";
import { TeamConfig } from "./types/index.js";
import { initDatabase } from "./memory/db.js";
import * as path from "path";

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 3) {
        console.error("Usage: node cloud-orchestrator.js <projectName> <repoUrl> <objective>");
        process.exit(1);
    }

    const [projectName, repoUrl, ...objectiveWords] = args;
    const objective = objectiveWords.join(" ");

    const db = initDatabase();

    const config: TeamConfig = {
        projectName,
        workspacePath: path.join(".agent_workspace", projectName),
        repoUrl,
        db,
        onComplete: () => {
            console.log(`[Cloud Orchestrator] Project ${projectName} finished. Shutting down daemon.`);
            process.exit(0);
        },
        agents: {
            "Architect": {
                role: "Architect",
                systemPrompt: `=== INTERNAL INSTRUCTIONS (DO NOT BUILD THIS — THIS IS HOW YOUR TEAM WORKS) ===
You are a Lead Architect. Your job is to plan the architecture for the USER'S PROJECT described below.
After you finish, developers will implement your plan and a Reviewer will check it.

DO NOT build a "task orchestration system" or "agent team platform". Build what the USER asked for.
=== END INTERNAL INSTRUCTIONS ===

=== DEPLOYMENT REALITY ===
The finished app will be deployed to NETLIFY (static hosting). There is NO backend server running.
This means:
- ALL game logic, state management, and UI MUST work entirely in the browser (client-side).
- Do NOT design APIs that require a running Express/Node server unless the user explicitly needs multiplayer, databases, or server-side features.
- For games (chess, etc.): use libraries like chess.js DIRECTLY in the React frontend. No backend needed.
- For data: use localStorage, IndexedDB, or client-side state. No PostgreSQL, no SQLite.
- The app must be FULLY FUNCTIONAL as a static site with zero API calls to a backend.
=== END ===

=== YOUR ACTUAL JOB ===
1. Read the USER OBJECTIVE carefully. That is the app you must design.
2. Create ARCHITECTURE.md describing the architecture for THAT specific app.
3. Design a FRONTEND-ONLY React + Vite app in apps/web directory.
4. ALL logic runs in the browser. Use client-side libraries (chess.js, etc.) directly in React.
5. List all frontend dependencies.
6. Create directory structure and config files (package.json, tsconfig.json, vite.config.ts, index.html).
7. Do NOT write implementation code. Only plan, document, and scaffold.

=== IMPORTANT: NO AUTH BY DEFAULT ===
Do NOT include user authentication (login, register, JWT, bcrypt) UNLESS the user EXPLICITLY asks for it.
The app should work immediately without requiring account creation.
=== END ===`,
                model: "claude-3-opus"
            },
            "Researcher": {
                role: "Researcher",
                systemPrompt: "You are a Web Researcher. Find SEO tags and related best practices for the given task.",
                model: "claude-3-sonnet"
            },
            "BackendDev": {
                role: "BackendDev",
                systemPrompt: "You are a Senior Backend Developer. Implement ONLY the server-side code according to the ARCHITECTURE.md plan. Do NOT add authentication/login unless the architecture explicitly requires it.",
                toolsAllowed: ["write_to_file", "run_command"],
                model: "claude-3-opus"
            },
            "FrontendDev": {
                role: "FrontendDev",
                systemPrompt: "You are a Senior Frontend Developer. Implement ONLY the React/Vite UI (components, routing, styling).",
                toolsAllowed: ["write_to_file", "run_command"],
                model: "claude-3-opus"
            },
            "Reviewer": {
                role: "Reviewer",
                systemPrompt: "You are a strict QA Reviewer. Review both backend and frontend code, verify integration, and fix issues.",
                model: "claude-3-opus"
            }
        }
    };

    const orchestrator = new Orchestrator(config);
    console.log(`[Cloud Orchestrator] Starting standalone daemon for ${projectName}...`);

    try {
        await orchestrator.start(objective);
    } catch (e) {
        console.error("[Cloud Orchestrator] Error starting orchestrator:", e);
        process.exit(1);
    }
}

main();
