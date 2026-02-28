import { config } from "./config.js";
import { log } from "./utils/logger.js";
import { initDatabase } from "./memory/db.js";
import { exec } from "child_process";
import { promisify } from "util";
import fs, { rmSync } from "fs";
import path from "path";

const execPromise = promisify(exec);

// Cloud-specific configurations
const GITHUB_PAT = process.env.GITHUB_PAT;

async function setupWorkspace(repoUrl: string, cloneDir: string): Promise<string> {
    if (!GITHUB_PAT) {
        throw new Error("GITHUB_PAT environment variable is required for the cloud worker.");
    }

    const authRepoUrl = `https://Maxik92:${GITHUB_PAT}@${repoUrl}`;

    if (fs.existsSync(cloneDir)) {
        log.info(`[CloudWorker] Updating existing workspace via git pull...`);
        await execPromise(`git checkout master && git pull origin master`, { cwd: cloneDir });
    } else {
        // Auto-create repo on GitHub if it doesn't exist yet
        const match = repoUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
        if (match) {
            const [, owner, repo] = match;
            const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
                headers: { Authorization: `token ${GITHUB_PAT}` }
            });
            if (res.status === 404) {
                log.info(`[CloudWorker] Repository ${owner}/${repo} not found. Creating it...`);
                await fetch(`https://api.github.com/user/repos`, {
                    method: 'POST',
                    headers: {
                        Authorization: `token ${GITHUB_PAT}`,
                        "Content-Type": "application/json",
                        "Accept": "application/vnd.github.v3+json"
                    },
                    body: JSON.stringify({ name: repo, private: true, auto_init: true })
                });
                await new Promise(r => setTimeout(r, 2000)); // Wait for GitHub creation propagation
            }
        }

        log.info(`[CloudWorker] Cloning workspace to ${cloneDir}...`);
        await execPromise(`git clone ${authRepoUrl} ${cloneDir}`);
    }

    // Identify who made the change
    await execPromise(`git config user.name "Gravity Claw AI Worker"`, { cwd: cloneDir });
    await execPromise(`git config user.email "bot@gravity-claw.local"`, { cwd: cloneDir });

    return cloneDir;
}

async function syncWorkspaceBack(message: string, cloneDir: string): Promise<void> {
    log.info(`[CloudWorker] Syncing changes back to GitHub...`);
    try {
        await execPromise(`git add .`, { cwd: cloneDir });

        // We might not have any changes, so don't fail if commit is empty
        try {
            await execPromise(`git commit -m "feat(ai): ${message}"`, { cwd: cloneDir });
            // Try pushing to master, fallback to main if it fails
            await execPromise(`git push origin master`, { cwd: cloneDir }).catch(() =>
                execPromise(`git push origin main`, { cwd: cloneDir })
            );
            log.info(`[CloudWorker] Changes successfully pushed to GitHub.`);
        } catch (e: any) {
            if (e.message && e.message.includes("nothing to commit")) {
                log.info(`[CloudWorker] No changes to commit.`);
            } else {
                throw e;
            }
        }
    } catch (error: any) {
        log.error("[CloudWorker] Git Sync Error", { error: error.message, stderr: error.stderr });
        throw error;
    }
}

async function runCodexAgent(prompt: string, relativeProjectPath: string, cloneDir: string): Promise<void> {
    log.info(`[CloudWorker] Sending task to Codex CLI...`);

    try {
        const strictInstructions = `
⚠️ CRITICAL SYSTEM INSTRUCTIONS FOR CODEX ⚠️
1. MONOREPO STRUCTURE: This is a monorepo. The Node.js backend is in 'apps/bot'. The React Vite frontend is in 'apps/web'.
2. COMPONENT RULES: All React UI components MUST be created inside 'apps/web/src/components' or 'apps/web/src'. Do NOT create React components in 'apps/bot'.
3. MANDATORY VERIFICATION: You are an autonomous agent. Before you consider this task complete, you MUST verify your work compiles. You MUST run 'npm run build' or 'npx tsc' in the directory you modified.
4. SELF-CORRECTION: If your build or verification commands fail with errors, you MUST read the errors, fix your code, and run the build again until it succeeds. Do NOT return or finish until the code builds without errors.

USER TASK:
${prompt}
`;
        const safePrompt = strictInstructions.replace(/"/g, '\\"');
        const command = `codex exec --sandbox danger-full-access "${safePrompt}"`;

        log.debug(`[CloudWorker] Executing: ${command.substring(0, 100)}...`);

        // Codex MUST run in the cloned directory so it edits the cloned files, not the worker's own files
        const targetDir = path.join(cloneDir, relativeProjectPath);

        if (!fs.existsSync(targetDir)) {
            log.warn(`[CloudWorker] Target directory ${targetDir} does not exist. Running at repo root.`);
        }

        const cwd = fs.existsSync(targetDir) ? targetDir : cloneDir;

        const { stdout, stderr } = await execPromise(command, {
            cwd: cwd,
            maxBuffer: 1024 * 1024 * 10,
            env: {
                ...process.env, // Pass NETLIFY_AUTH_TOKEN and CODEX_API_KEY
            }
        });

        log.info(`[CloudWorker] Codex execution finished.`);
        if (stdout) log.info(`[CloudWorker] Codex Output:\n${stdout.substring(0, 500)}...`);
        if (stderr) log.warn(`[CloudWorker] Codex STDERR:\n${stderr.substring(0, 500)}...`);

    } catch (error: any) {
        log.error("[CloudWorker] Codex CLI Error", {
            error: error.message,
            stdout: error.stdout,
            stderr: error.stderr
        });
        throw error;
    }
}

async function startWorker() {
    log.info("Starting Autonomous Cloud Worker Node...");
    const db = initDatabase();
    // Poll every 15 seconds
    const intervalMs = 15000;

    setInterval(async () => {
        try {
            console.log("[Trace] Polling Turso...");
            const result = await db.execute(`
                SELECT id, project_path, prompt, repo_url 
                FROM antigravity_tasks 
                WHERE status = 'pending' 
                ORDER BY created_at ASC 
                LIMIT 1
            `);
            console.log(`[Trace] Query returned ${result.rows.length} rows.`);

            if (result.rows.length === 0) {
                console.log("[Trace] No pending tasks found.");
                return;
            }
            console.log(`[Trace] Found task:`, result.rows[0]);

            const row = result.rows[0];
            const id = Number(row.id);
            const rawProjectPath = row.project_path as string;
            const prompt = row.prompt as string;
            const repoUrl = (row.repo_url as string) || "github.com/Maxik92/gravity-claw.git";
            const cloneDir = path.resolve(process.env.CLONE_DIR || `./cloud-workspace-${id}`);

            log.info(`[CloudWorker] Picked up task #${id} for repo ${repoUrl}`);

            await db.execute({
                sql: `UPDATE antigravity_tasks SET status = 'in_progress' WHERE id = ?`,
                args: [id]
            });

            // 1. Sync from GitHub
            await setupWorkspace(repoUrl, cloneDir);

            // The rawProjectPath from Turso is likely an absolute path from the user's PC 
            // We only map gravity-claw specific apps paths if this is actually gravity-claw.
            let relativePath = "";
            if (repoUrl.includes("gravity-claw")) {
                if (rawProjectPath.includes("apps/bot") || rawProjectPath.includes("apps\\bot")) relativePath = "apps/bot";
                else if (rawProjectPath.includes("apps/web") || rawProjectPath.includes("apps\\web")) relativePath = "apps/web";
            }

            // 2. Run Codex
            await runCodexAgent(prompt, relativePath, cloneDir);

            // 3. Push back to GitHub
            await syncWorkspaceBack(`Codex auto-completed task #${id}`, cloneDir);

            await db.execute({
                sql: `UPDATE antigravity_tasks SET status = 'completed' WHERE id = ?`,
                args: [id]
            });

            log.info(`[CloudWorker] Successfully completed and pushed task #${id}`);

            // Send completion message directly to Telegram
            const userId = Array.from(config.allowedUserIds)[0];
            if (userId) {
                const message = `✅ *Aufgabe #${id} erledigt!*\n\n` +
                    `Dein autonomer Cloud Worker hat die Aufgabe bearbeitet und den Code auf GitHub gepusht. ` +
                    `Die Live-Seite sollte in wenigen Sekunden unter [Gravity Claw Dev](https://gravity-claw-dev.netlify.app) erreichbar sein.`;

                try {
                    await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            chat_id: userId,
                            text: message,
                            parse_mode: "Markdown"
                        })
                    });
                } catch (e) {
                    log.error("[CloudWorker] Failed to send Telegram notification", { error: String(e) });
                }
            }

        } catch (error) {
            console.error("CRITICAL ERROR IN POLLING LOOP:", error);
            log.error("[CloudWorker] Execution error", { error: error instanceof Error ? error.message : String(error) });
        }
    }, intervalMs);
}

startWorker().catch(console.error);
