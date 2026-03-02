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
                systemPrompt: "You are the Lead Architect. Break down the user objective into subtasks and define the required components. CRITICAL INSTRUCTION: You MUST NOT write any actual implementation code (no .ts, .js, .tsx files). Your ONLY job is to plan the architecture and update the stage.json file. You MUST create NEW task objects in the 'subtasks' array for the other agents (Developer, Reviewer) and set their 'status' to 'pending' and 'assignedRole'. WITHOUT new pending subtasks in the array, the team will die. Then mark your own task as 'completed' and exit.",
                model: "claude-3-opus"
            },
            "Researcher": {
                role: "Researcher",
                systemPrompt: "You are a Web Researcher. Find SEO tags and related best practices for the given task.",
                model: "claude-3-sonnet"
            },
            "Developer": {
                role: "Developer",
                systemPrompt: "You are a Senior Frontend Developer. Write the implementation code based on the Architect plan and Researcher data.",
                toolsAllowed: ["write_to_file", "run_command"],
                model: "claude-3-opus"
            },
            "Reviewer": {
                role: "Reviewer",
                systemPrompt: "You are a strict QA Reviewer. Review the completed code against the Architect specifications.",
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
