import type { Client } from "@libsql/client";
import { AgentConfig, Subtask } from '../types/index.js';

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

    const fullPrompt = `
${config.systemPrompt}

You are part of an Agent Team. You must work on the following specific subtask:
${subtask.description}

YOUR MISSION:
1. Complete the subtask described above in the provided remote repository.
2. The team shares a central state file located at:
   ${workspacePath}/stage.json
3. When you are finished, you MUST read that stage.json file, find the subtask object with id "${subtask.id}", set its "status" to "completed", and add any necessary details to "result".
4. If you fail or get stuck, set its "status" to "failed" and describe why in "result".
5. Save the updated stage.json file. This is how the Orchestrator knows you are done.
`;

    // Construct the relative path that the cloud worker should use
    // For safety, we'll just pass the standard project path, but Codex instructions
    // will ask it to respect the stage.json path

    // The Cloud Worker clones the repo. We want the agent to operate at the root,
    // so it can find the .agent_workspace folder.
    const relativeProjectPath = './';

    try {
        const result = await db.execute({
            sql: `INSERT INTO antigravity_tasks (project_path, prompt, repo_url) VALUES (?, ?, ?)`,
            args: [relativeProjectPath, fullPrompt, repoUrl]
        });

        const dbTaskId = Number(result.lastInsertRowid);
        console.log(`[Orchestrator] Successfully dispatched task #${dbTaskId} to cloud queue.`);
        return dbTaskId;

    } catch (error) {
        console.error(`[Orchestrator] Failed to dispatch agent ${config.role} to Turso DB:`, error);
        throw error;
    }
}

