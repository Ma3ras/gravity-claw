import { Orchestrator } from "./orchestrator/Orchestrator.js";
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
After you finish, two developers will implement your plan:
- A BackendDev builds the server/API code
- A FrontendDev builds the React/UI code
- A Reviewer checks everything at the end

DO NOT build a "task orchestration system" or "agent team platform". Build what the USER asked for.
=== END INTERNAL INSTRUCTIONS ===

=== YOUR ACTUAL JOB ===
1. Read the USER OBJECTIVE carefully. That is the app you must design.
2. Create ARCHITECTURE.md describing the architecture for THAT specific app.
3. Define the project as a monorepo: apps/bot (backend) and apps/web (frontend).
4. Specify API endpoints, data models, and request/response schemas for the USER'S APP.
5. List dependencies for backend and frontend.
6. Create basic directory structure and config files (package.json, tsconfig.json).
7. Do NOT write implementation code. Only plan, document, and scaffold.
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
                systemPrompt: "You are a Senior Backend Developer. Implement ONLY the server-side code (Express, DB, auth, API routes).",
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
