import type { Client } from "@libsql/client";
import { AgentConfig, Subtask } from '../types/index.js';
import { randomUUID } from "crypto";

/**
 * Spawns a new codex agent by dispatching a task to the Cloud Worker via Turso database.
 * 
 * @param config The specific configuration for this agent role
 * @param workspacePath The shared workspace path for the team
 * @param subtask The subtask object containing the ID and description
 * @param repoUrl The github repository URL
 * @param db The Turso database client
 * @returns The database task ID inserted
 */
export async function spawnAgent(
    config: AgentConfig,
    workspacePath: string,
    subtask: Subtask,
    repoUrl: string,
    db: Client
): Promise<number> {
    console.log(`[Orchestrator] Dispatching ${config.role} agent for task ${subtask.id} to Cloud Worker...`);

    // Generate a chain_id so the cloud-worker can auto-chain follow-up tasks
    const chainId = randomUUID();

    const fullPrompt = `
${config.systemPrompt}

You are part of an Agent Team. You must work on the following specific subtask:
${subtask.description}

YOUR MISSION:
1. Complete the subtask described above in the provided remote repository.
2. Plan the architecture and output your design plan as files in the repository (e.g. ARCHITECTURE.md, or directly create the project structure).
3. The Cloud Worker will automatically chain your output to the next agent (Developer or Reviewer) when you are done.
4. Focus on doing excellent work. The pipeline handles coordination automatically.
`;

    const relativeProjectPath = './';

    try {
        const result = await db.execute({
            sql: `INSERT INTO antigravity_tasks (project_path, prompt, repo_url, role, chain_id) VALUES (?, ?, ?, ?, ?)`,
            args: [relativeProjectPath, fullPrompt, repoUrl, config.role, chainId]
        });

        const dbTaskId = Number(result.lastInsertRowid);
        console.log(`[Orchestrator] Successfully dispatched task #${dbTaskId} (role=${config.role}, chain=${chainId}) to cloud queue.`);
        return dbTaskId;

    } catch (error) {
        console.error(`[Orchestrator] Failed to dispatch agent ${config.role} to Turso DB:`, error);
        throw error;
    }
}
