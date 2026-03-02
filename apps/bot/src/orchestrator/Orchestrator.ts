import { randomUUID } from 'crypto';
import { StateManager } from '../state/StateManager.js';
import { MessageBus } from '../state/MessageBus.js';
import { spawnAgent } from '../engine/spawnAgent.js';
import { TeamConfig, TaskState, MessageBusEvent, AgentRole, Subtask } from '../types/index.js';

export class Orchestrator {
    private stateManager: StateManager;
    private messageBus: MessageBus;
    private config: TeamConfig;
    private pollingInterval: NodeJS.Timeout | null = null;

    constructor(config: TeamConfig) {
        this.config = config;
        this.stateManager = new StateManager(config.workspacePath);
        this.messageBus = new MessageBus(config.workspacePath);
    }

    /**
     * Starts a new project with a high-level objective.
     */
    public async start(globalObjective: string) {
        console.log(`[Orchestrator] Starting new team project: ${this.config.projectName}`);
        console.log(`[Orchestrator] Objective: ${globalObjective}`);

        // 1. Initialize State
        const initialState: TaskState = {
            id: randomUUID(),
            globalObjective,
            subtasks: [],
            activeAgents: [],
            logs: [{
                timestamp: Date.now(),
                agentRole: 'Orchestrator',
                message: 'Project initialized',
                type: 'info'
            }],
            status: 'pending',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        // Write the initial state file (acquires lock safely)
        await this.stateManager.writeState(initialState);

        // 2. Spawn Architect to break down the task
        await this.updateStatus('in_progress');
        await this.spawnRole('Architect', initialState.id);

        // 3. Watch State for progression
        this.stateManager.watchState((newState: TaskState) => {
            this.handleStateChange(newState);
        });

        // 4. Watch Message Bus for P2P and Dynamic Conjuring (Phase 6/7)
        this.messageBus.watch((msg: MessageBusEvent) => this.handleMessageBus(msg));

        // 5. Start DB Polling loop
        this.startDbPolling();
    }

    /**
     * Spawns a specific role for a specific piece of work.
     */
    private async spawnRole(role: string, taskId: string) {
        const agentConfig = this.config.agents[role];
        if (!agentConfig) {
            console.error(`[Orchestrator] No config found for role: ${role}`);
            return;
        }

        // Register the agent as active in the state
        await this.stateManager.updateState((state: TaskState) => {
            if (!state.activeAgents.includes(role)) {
                state.activeAgents.push(role);
            }
        });

        // Get the specific subtask so we can send its description
        const state = await this.stateManager.readState();
        const subtask = state?.subtasks.find(t => t.id === taskId);

        // If this is the initial Architect spawn, make a dummy subtask from global objective
        const passTask: Subtask = subtask || {
            id: taskId,
            description: state?.globalObjective || "Plan the project",
            status: 'in_progress'
        };

        const dbTaskId = await spawnAgent(agentConfig, this.config.workspacePath, passTask, this.config.repoUrl, this.config.db);

        // Store the DB task ID in the state file so we can track it
        if (subtask) {
            await this.stateManager.updateState((s: TaskState) => {
                const t = s.subtasks.find(x => x.id === taskId);
                if (t) t.dbTaskId = dbTaskId;
            });
        }
    }

    /**
     * The core decision loop that fires whenever the state file changes.
     */
    private async handleStateChange(state: TaskState) {
        if (state.status === 'completed' || state.status === 'failed') return;

        const hasSubtasks = state.subtasks.length > 0;
        const architectActive = state.activeAgents.includes('Architect');

        // Logic to dispatch workers once the Architect is done planning
        if (hasSubtasks && !architectActive) {
            for (const subtask of state.subtasks) {

                // Auto-Course Correction Loop (Phase 6)
                if (subtask.status === 'failed' && !subtask.dependencies?.includes('debug-' + subtask.id)) {
                    console.log(`[Orchestrator] Task ${subtask.id} failed! Spawning Debugger for course correction...`);
                    const debugTaskId = 'debug-' + subtask.id;
                    await this.stateManager.updateState((s: TaskState) => {
                        s.subtasks.push({
                            id: debugTaskId,
                            description: `Debug the failure in task ${subtask.id}`,
                            assignedRole: 'Debugger',
                            status: 'pending'
                        });

                        const failedTask = s.subtasks.find((t: Subtask) => t.id === subtask.id);
                        if (failedTask) {
                            failedTask.status = 'pending';
                            failedTask.dependencies = failedTask.dependencies || [];
                            failedTask.dependencies.push(debugTaskId);
                        }
                    });

                    // Dynamic Conjuring of Debugger if it doesn't exist
                    this.config.agents['Debugger'] = this.config.agents['Debugger'] || {
                        role: 'Debugger',
                        systemPrompt: 'You are a Senior Debugger. Fix issues reported by Reviewers or failing Developers.',
                    };
                }

                if (subtask.status === 'pending' && subtask.assignedRole) {

                    // Check Dependencies
                    let canStart = true;
                    if (subtask.dependencies && subtask.dependencies.length > 0) {
                        const deps = state.subtasks.filter((s: Subtask) => subtask.dependencies!.includes(s.id));
                        // All dependencies must be completed
                        canStart = deps.every((d: Subtask) => d.status === 'completed');
                    }

                    if (canStart) {
                        console.log(`[Orchestrator] Dispatching task ${subtask.id} to ${subtask.assignedRole}`);
                        // Update state to in_progress
                        await this.stateManager.updateState((s: TaskState) => {
                            const task = s.subtasks.find((t: Subtask) => t.id === subtask.id);
                            if (task) task.status = 'in_progress';
                        });

                        await this.spawnRole(subtask.assignedRole, subtask.id);
                    }
                }
            }
        }

        // Check if all subtasks are complete
        if (hasSubtasks && state.subtasks.every((s: Subtask) => s.status === 'completed')) {
            console.log(`[Orchestrator] All subtasks complete!`);
            await this.updateStatus('completed');

            // Finalize and shut down the watch loop
            console.log(`[Orchestrator] Project ${this.config.projectName} finalized successfully. Outputting artifacts.`);
            if (this.pollingInterval) clearInterval(this.pollingInterval);
            // DO NOT exit process here, as we run inside the Telegram bot now!
            // process.exit(0); 
        }
    }

    /**
     * Handles Cross-Agent requests from the Message Bus (Phase 6 / 7)
     */
    private async handleMessageBus(msg: MessageBusEvent) {
        if (!msg.resolved && msg.to) {
            // Unseen @tag triggers dynamic conjuring (Phase 7)
            const activeNow = await this.stateManager.readState();
            if (!activeNow?.activeAgents.includes(msg.to)) {
                console.log(`[Orchestrator] Message Bus Request: Dynamically conjuring ${msg.to} to answer ${msg.from}`);
                this.config.agents[msg.to] = this.config.agents[msg.to] || {
                    role: msg.to,
                    systemPrompt: `You are a ${msg.to}. Provide expertise and answer requests from ${msg.from}.`,
                };

                // Spawn the requested agent for a special P2P task
                const p2pTaskId = 'p2p-request-' + msg.id;

                // Add the task to state so it's tracked
                await this.stateManager.updateState((s: TaskState) => {
                    s.subtasks.push({
                        id: p2pTaskId,
                        description: `Answer P2P request from ${msg.from}: ${msg.content}`,
                        assignedRole: msg.to as AgentRole,
                        status: 'in_progress'
                    });
                });

                await this.spawnRole(msg.to, p2pTaskId);
            }
        }
    }

    private async updateStatus(status: TaskState['status']) {
        await this.stateManager.updateState((state: TaskState) => {
            state.status = status;
        });
    }

    /**
     * Polls the Turso database to check if any of the dispatched agents have completed or failed.
     */
    private startDbPolling() {
        this.pollingInterval = setInterval(async () => {
            const state = await this.stateManager.readState();
            if (!state || state.status === 'completed' || state.status === 'failed') {
                return;
            }

            const inProgressSubtasks = state.subtasks.filter(t => t.status === 'in_progress' && t.dbTaskId !== undefined);

            for (const subtask of inProgressSubtasks) {
                try {
                    const result = await this.config.db.execute({
                        sql: `SELECT status FROM antigravity_tasks WHERE id = ?`,
                        args: [subtask.dbTaskId!]
                    });

                    if (result.rows.length > 0) {
                        const dbStatus = result.rows[0].status as string;

                        // Note: The actual codex agent is supposed to update the state.json natively from inside the workspace.
                        // But if the server task completes/fails without doing so (e.g., node crash), we catch it here.
                        if (dbStatus === 'completed' || dbStatus === 'failed') {
                            console.log(`[Orchestrator] Cloud task #${subtask.dbTaskId} finished with status ${dbStatus}. Synchronizing state...`);

                            await this.stateManager.updateState(s => {
                                const t = s.subtasks.find(x => x.id === subtask.id);
                                // Only override if the agent didn't already set it correctly
                                if (t && t.status === 'in_progress') {
                                    t.status = dbStatus as 'completed' | 'failed';
                                }
                            });
                        }
                    }
                } catch (e) {
                    console.error(`[Orchestrator] Error polling DB for task ${subtask.dbTaskId}:`, e);
                }
            }
        }, 15000); // Check every 15s
    }
}
