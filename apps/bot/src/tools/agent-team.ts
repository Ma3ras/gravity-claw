import { Tool } from "./index.js";
import type { Client } from "@libsql/client";
import * as path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the tool config factory
export function createAgentTeamTool(db: Client): Tool {
    return {
        name: "start_agent_team",
        description: "Start a multi-agent orchestrated team to solve a massively complex task using the Codex Agent Teams framework. The team will spawn independent specialized agents (Architect, Researcher, Developer, Reviewer) scaling via the Railway Cloud Worker.",
        inputSchema: {
            type: "object",
            properties: {
                objective: {
                    type: "string",
                    description: "The global, highly complex objective for the agent team to accomplish.",
                },
                projectName: {
                    type: "string",
                    description: "A short, descriptive name for this project.",
                },
                repoUrl: {
                    type: "string",
                    description: "The GitHub repository URL where the agents will operate (e.g. 'github.com/Ma3ras/new-project.git'). Must be explicitly provided or inferred from conversation.",
                }
            },
            required: ["objective", "projectName", "repoUrl"],
        },
        execute: async (args: any) => {
            const { objective, projectName, repoUrl } = args;

            const workspacePath = path.join(".agent_workspace", projectName);

            const isCompiled = __filename.endsWith('.js');
            const orchestratorFile = isCompiled ? 'cloud-orchestrator.js' : 'cloud-orchestrator.ts';
            const orchestratorPath = path.resolve(__dirname, '..', orchestratorFile);

            const command = isCompiled ? process.execPath : 'npx';
            const processArgs = isCompiled
                ? [orchestratorPath, projectName, repoUrl, objective]
                : ['tsx', orchestratorPath, projectName, repoUrl, objective];

            console.log(`[Telegram Bot] Spawning ephemeral Orchestrator: ${command} ${processArgs.join(' ')}`);

            const orchestratorProcess = spawn(command, processArgs, {
                detached: true,
                stdio: 'ignore'
            });

            orchestratorProcess.unref(); // detach completely

            return JSON.stringify({
                status: "started",
                message: `Server-Side Agent Team started for project '${projectName}' in repo ${repoUrl}. The standalone Orchestrator daemon is now running in the background.`,
                workspace: workspacePath
            });
        }
    };
}
