import * as fs from 'fs';
import * as path from 'path';
import { TaskState } from '../types/index.js';

export class StateManager {
    private workspacePath: string;
    private stateFilePath: string;
    private lockFilePath: string;

    constructor(workspacePath: string) {
        this.workspacePath = workspacePath;
        this.stateFilePath = path.join(this.workspacePath, 'stage.json');
        this.lockFilePath = path.join(this.workspacePath, 'stage.lock');

        if (!fs.existsSync(this.workspacePath)) {
            fs.mkdirSync(this.workspacePath, { recursive: true });
        }
    }

    /**
     * Acquires a file-based lock. Retries up to a maximum number of attempts.
     */
    private async acquireLock(maxRetries = 50, retryDelayMs = 100): Promise<void> {
        for (let i = 0; i < maxRetries; i++) {
            try {
                // 'wx' flag opens for writing but fails if the path exists.
                // This provides an atomic check-and-create operation.
                const fd = fs.openSync(this.lockFilePath, 'wx');
                fs.closeSync(fd);
                return;
            } catch (err: any) {
                if (err.code === 'EEXIST') {
                    // Lock exists, wait and retry
                    await new Promise(resolve => setTimeout(resolve, retryDelayMs));
                } else {
                    throw err; // Some other error
                }
            }
        }
        throw new Error(`Failed to acquire state lock after ${maxRetries} attempts.`);
    }

    /**
     * Releases the file-based lock.
     */
    private releaseLock(): void {
        try {
            if (fs.existsSync(this.lockFilePath)) {
                fs.unlinkSync(this.lockFilePath);
            }
        } catch (err) {
            console.error('[StateManager] Failed to release lock:', err);
        }
    }

    /**
     * Reads the current task state. Waits for lock if requested.
     */
    public async readState(): Promise<TaskState | null> {
        if (!fs.existsSync(this.stateFilePath)) {
            return null;
        }

        await this.acquireLock();
        try {
            const data = fs.readFileSync(this.stateFilePath, 'utf-8');
            return JSON.parse(data) as TaskState;
        } finally {
            this.releaseLock();
        }
    }

    /**
     * Writes a new task state under a lock.
     */
    public async writeState(state: TaskState): Promise<void> {
        state.updatedAt = Date.now();
        await this.acquireLock();
        try {
            fs.writeFileSync(this.stateFilePath, JSON.stringify(state, null, 2), 'utf-8');
        } finally {
            this.releaseLock();
        }
    }

    /**
     * Helper to safely read, modify, and rewrite the state in one transaction.
     */
    public async updateState(updater: (state: TaskState) => void | TaskState): Promise<void> {
        await this.acquireLock();
        try {
            if (!fs.existsSync(this.stateFilePath)) {
                throw new Error("State file does not exist yet.");
            }
            const data = fs.readFileSync(this.stateFilePath, 'utf-8');
            const state = JSON.parse(data) as TaskState;

            // Allow updater to mutate the object or return a new one
            const newState = updater(state) || state;
            newState.updatedAt = Date.now();

            fs.writeFileSync(this.stateFilePath, JSON.stringify(newState, null, 2), 'utf-8');
        } finally {
            this.releaseLock();
        }
    }

    /**
     * Watches the state file for changes and triggers a callback.
     * Useful for the Orchestrator to detect when an agent has updated the state.
     */
    public watchState(onChange: (newState: TaskState) => void): fs.FSWatcher {
        // Debounce to prevent multiple rapid firings
        let timeout: NodeJS.Timeout | null = null;
        return fs.watch(this.stateFilePath, (eventType, filename) => {
            if (eventType === 'change') {
                if (timeout) clearTimeout(timeout);
                timeout = setTimeout(async () => {
                    try {
                        // Read without getting stuck if locked, but ideally we await the lock
                        const state = await this.readState();
                        if (state) onChange(state);
                    } catch (e) {
                        console.error('[StateManager] Error reading watched state:', e);
                    }
                }, 100);
            }
        });
    }
}
