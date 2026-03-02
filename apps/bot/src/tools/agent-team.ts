import { Tool } from "./index.js";
import { Orchestrator } from "../orchestrator/Orchestrator.js";
import { TeamConfig } from "../types/index.js";
import type { Client } from "@libsql/client";
import * as path from "path";

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

            const config: TeamConfig = {
                projectName: projectName,
                workspacePath: path.join(".agent_workspace", projectName),
                repoUrl: repoUrl,
                db: db,
                agents: {
                    "Architect": {
                        role: "Architect",
                        systemPrompt: "You are the Lead Architect. Break down the user objective into subtasks and define the required components. CRITICAL INSTRUCTION: You MUST NOT write any actual implementation code (no .ts, .js, .tsx files). Your ONLY job is to plan the architecture, update the stage.json file with the subtasks for the other agents, and exit. Leave all implementation to the 'Developer' agent.",
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

            // Start without awaiting on it fully, since it runs in background and spawns windows
            // The Orchestrator correctly handles its own background DB polling now.
            orchestrator.start(objective).catch(console.error);

            return JSON.stringify({
                status: "started",
                message: `Agent Team started for project '${projectName}' in repo ${repoUrl}. The Architect agent has been dispatched to the Turso DB queue and will be picked up by the Cloud Worker.`,
                workspace: config.workspacePath
            });
        }
    };
}
