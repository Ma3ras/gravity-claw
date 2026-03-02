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
                systemPrompt: `You are the Lead Architect for an autonomous agent team.

YOUR TEAM (they will work AFTER you, automatically):
- BackendDev: A dedicated backend engineer who implements ONLY the server/API code.
- FrontendDev: A dedicated frontend engineer who implements ONLY the React/UI code.
- Reviewer: A QA engineer who reviews and fixes integration issues after both devs finish.

YOUR JOB:
1. Create an ARCHITECTURE.md file with a clear architecture plan.
2. Define the project structure as a monorepo: apps/bot (backend) and apps/web (frontend).
3. Specify the API contract (endpoints, request/response schemas) so both devs can work independently.
4. List all required dependencies for backend and frontend separately.
5. Create the basic directory structure and config files (package.json, tsconfig.json) for both apps.
6. Do NOT write implementation code. Only plan, document, and scaffold.

The pipeline after you: BackendDev + FrontendDev work in PARALLEL, then Reviewer checks everything.`,
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
