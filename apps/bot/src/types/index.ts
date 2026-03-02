import type { Client } from "@libsql/client";

export type AgentRole = 'Architect' | 'Researcher' | 'Developer' | 'Reviewer' | 'Orchestrator' | string;

export interface TeamConfig {
    projectName: string;
    workspacePath: string; // The path where the agents operate (e.g., .agent_workspace)
    repoUrl: string; // The github repo URL where the remote agents will work
    db: Client; // The Turso DB connection to dispatch tasks to the Cloud Worker
    agents: Record<string, AgentConfig>; // specific configurations for each role
    maxConcurrentAgents?: number;
}

export interface AgentConfig {
    role: AgentRole;
    systemPrompt: string;
    toolsAllowed?: string[]; // E.g., ['run_command', 'write_to_file']
    temperature?: number;
    model?: string;
}

export interface TaskState {
    id: string;
    globalObjective: string;
    subtasks: Subtask[];
    activeAgents: string[]; // List of roles currently running
    logs: TaskLog[];
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    createdAt: number;
    updatedAt: number;
}

export interface Subtask {
    id: string;
    description: string;
    assignedRole?: AgentRole;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    result?: string;
    dependencies?: string[]; // IDs of subtasks that must be completed first
    dbTaskId?: number; // The antigravity_tasks ID if currently running on the cloud worker
}

export interface TaskLog {
    timestamp: number;
    agentRole: AgentRole;
    message: string;
    type: 'info' | 'error' | 'completion' | 'request';
}

export interface MessageBusEvent {
    id: string;
    timestamp: number;
    from: AgentRole;
    to?: AgentRole; // If undefined, it's a broadcast
    content: string;
    resolved: boolean;
}
