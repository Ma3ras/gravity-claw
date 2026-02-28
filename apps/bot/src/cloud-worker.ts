import { config } from "./config.js";
import { log } from "./utils/logger.js";
import { initDatabase } from "./memory/db.js";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import fs, { rmSync } from "fs";
import path from "path";
import os from "os";

const execPromise = promisify(exec);

// Cloud-specific configurations
const GITHUB_PAT = process.env.GITHUB_PAT;

async function sendTelegramNotification(message: string) {
    const userId = Array.from(config.allowedUserIds)[0];
    if (!userId || !config.telegramBotToken) return;

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

async function setupWorkspace(repoUrl: string, cloneDir: string): Promise<string> {
    if (!GITHUB_PAT) {
        throw new Error("GITHUB_PAT environment variable is required for the cloud worker.");
    }

    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
    const ownerAuth = match ? match[1] : "Ma3ras";
    const authRepoUrl = `https://${ownerAuth}:${GITHUB_PAT}@${repoUrl}`;

    if (fs.existsSync(cloneDir)) {
        // Check if it's actually a valid git repo (might be a broken partial clone from a crash)
        if (!fs.existsSync(path.join(cloneDir, ".git"))) {
            log.warn(`[CloudWorker] Found broken workspace directory without .git, removing it...`);
            fs.rmSync(cloneDir, { recursive: true, force: true });
        } else {
            log.info(`[CloudWorker] Updating existing workspace via git pull...`);
            await execPromise(`git checkout main && git pull origin main`, { cwd: cloneDir }).catch(() =>
                execPromise(`git checkout master && git pull origin master`, { cwd: cloneDir })
            ).catch(e => {
                log.warn(`[CloudWorker] Failed to pull existing branches, this might be a completely empty repo: ${e.message}`);
            });
        }
    }

    if (!fs.existsSync(cloneDir)) {
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

    // If repo is completely empty (no branches), create an initial commit so we have a 'main' branch to work on 
    try {
        await execPromise(`git log`, { cwd: cloneDir });
    } catch {
        log.info(`[CloudWorker] Repository appears completely empty. Creating initial commit on main branch...`);
        await execPromise(`git checkout -b main`, { cwd: cloneDir }).catch(() => { });
        fs.writeFileSync(path.join(cloneDir, "README.md"), "# Initialized by Gravity Claw Cloud Worker");
        await execPromise(`git add README.md`, { cwd: cloneDir });
        await execPromise(`git commit -m "chore: Initialize repository"`, { cwd: cloneDir });
        await execPromise(`git push -u origin main`, { cwd: cloneDir }).catch(e => log.warn("Failed to push initial commit", { error: String(e) }));
    }

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
        log.debug(`[CloudWorker] Executing Codex CLI...`);

        // Codex MUST run in the cloned directory so it edits the cloned files, not the worker's own files
        const targetDir = path.join(cloneDir, relativeProjectPath);

        if (!fs.existsSync(targetDir)) {
            log.warn(`[CloudWorker] Target directory ${targetDir} does not exist. Running at repo root.`);
        }

        const cwd = fs.existsSync(targetDir) ? targetDir : cloneDir;

        await new Promise<void>((resolve, reject) => {
            const child = spawn("codex", ["exec", "--sandbox", "danger-full-access", strictInstructions], {
                shell: process.platform === 'win32',
                cwd: cwd,
                env: { ...process.env }
            });

            child.stdout.on('data', (data) => {
                process.stdout.write(data);
            });

            child.stderr.on('data', (data) => {
                process.stderr.write(data);
            });

            child.on('close', (code) => {
                if (code === 0) {
                    log.info(`[CloudWorker] Codex execution finished successfully.`);
                    resolve();
                } else {
                    reject(new Error(`Codex process exited with code ${code}`));
                }
            });

            child.on('error', (err) => {
                reject(err);
            });
        });

    } catch (error: any) {
        log.error("[CloudWorker] Codex CLI Error", {
            error: error.message,
            stdout: error.stdout,
            stderr: error.stderr
        });
        throw error;
    }
}

async function verifyCodexAuth(): Promise<void> {
    log.info("[CloudWorker] Verifying Codex CLI authentication...");
    try {
        await execPromise(`codex exec "echo test"`, { timeout: 15000 });
        log.info("[CloudWorker] Codex is already authenticated.");
        return;
    } catch (e: any) {
        log.info("[CloudWorker] Codex is NOT authenticated (or token expired). Starting device auth flow...");
    }

    return new Promise<void>((resolve, reject) => {
        const child = spawn("codex", ["login", "--device-auth"], {
            shell: process.platform === 'win32'
        });

        let codeSent = false;
        let stdoutBuffer = "";

        const stripAnsi = (str: string) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

        child.stdout.on('data', async (data) => {
            const chunk = data.toString();
            stdoutBuffer += chunk;
            process.stdout.write(chunk);

            const cleanBuffer = stripAnsi(stdoutBuffer);
            const isCodeSection = cleanBuffer.includes("Enter this");
            const match = cleanBuffer.match(/([A-Z0-9]{4}-[A-Z0-9]{5})/i);

            if (match && isCodeSection && !codeSent && !cleanBuffer.includes("command-line")) {
                codeSent = true;
                const code = match[1].trim().toUpperCase();
                log.info(`[CloudWorker] Captured Device Auth Code: ${code}`);
                await sendTelegramNotification(`🚨 **Cloud Worker Authentication Required!** 🚨\n\nThe AI server needs to log into Codex to run tasks. Please authenticate it:\n\n1. Open: https://auth.openai.com/codex/device\n2. Enter this code: \`${code}\`\n\nThe Worker will pause and wait here until you approve it in your browser.`);
            }
        });

        child.stderr.on('data', (data) => {
            process.stderr.write(data);
        });

        child.on('close', async (code) => {
            if (code === 0) {
                log.info("[CloudWorker] Codex Device Auth successful!");
                await sendTelegramNotification(`✅ **Cloud Worker Successfully Authenticated!**\n\nResuming task polling...`);
                resolve();
            } else {
                log.error(`[CloudWorker] Codex Device Auth failed with code ${code}`);
                await sendTelegramNotification(`❌ **Cloud Worker Auth Failed!**\n\nPlease restart the server and try again.`);
                reject(new Error(`Codex login failed with code ${code}`));
            }
        });

        child.on('error', (err) => {
            reject(err);
        });
    });
}

async function startWorker() {
    log.info("[CloudWorker] Starting Autonomous Cloud Worker Node...");
    // Inject Codex CLI config directly into the container's home directory if provided
    const codexDir = path.join(os.homedir(), ".codex");
    if (!fs.existsSync(codexDir)) {
        fs.mkdirSync(codexDir, { recursive: true });
    }

    if (process.env.CODEX_AUTH_JSON) {
        fs.writeFileSync(path.join(codexDir, "auth.json"), process.env.CODEX_AUTH_JSON);
        log.info("[CloudWorker] Injected Codex auth.json from environment.");
    } else {
        log.warn("[CloudWorker] CODEX_AUTH_JSON is missing! Codex execution will fail.");
    }

    if (process.env.CODEX_CONFIG_TOML) {
        fs.writeFileSync(path.join(codexDir, "config.toml"), process.env.CODEX_CONFIG_TOML);
        log.info("[CloudWorker] Injected Codex config.toml from environment.");
    }

    const db = initDatabase();

    // Ensure we are authenticated before polling
    await verifyCodexAuth();

    // Poll every 15 seconds
    const intervalMs = 15000;

    setInterval(async () => {
        let currentTaskId: number | null = null;
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
            const repoUrl = (row.repo_url as string) || "github.com/Ma3ras/gravity-claw.git";
            const cloneDir = path.resolve(process.env.CLONE_DIR || `./cloud-workspace-${id}`);

            log.info(`[CloudWorker] Picked up task #${id} for repo ${repoUrl}`);

            currentTaskId = id;

            await db.execute({
                sql: `UPDATE antigravity_tasks SET status = 'in_progress' WHERE id = ?`,
                args: [id]
            });

            // 1. Sync from GitHub
            await sendTelegramNotification(`🔄 **Aufgabe #${id} in Bearbeitung!**\n\nDer Cloud Worker bereitet den Workspace für das Repository \`${repoUrl}\` vor...`);
            await setupWorkspace(repoUrl, cloneDir);

            // The rawProjectPath from Turso is likely an absolute path from the user's PC 
            // We only map gravity-claw specific apps paths if this is actually gravity-claw.
            let relativePath = "";
            if (repoUrl.includes("gravity-claw")) {
                if (rawProjectPath.includes("apps/bot") || rawProjectPath.includes("apps\\bot")) relativePath = "apps/bot";
                else if (rawProjectPath.includes("apps/web") || rawProjectPath.includes("apps\\web")) relativePath = "apps/web";
            }

            // 2. Run Codex
            await sendTelegramNotification(`🧠 **Codex generiert Code...**\n\nDas Repository ist bereit. Codex schreibt und testet jetzt den Code für Aufgabe #${id}. Dies kann je nach Komplexität einige Minuten dauern (ETA: ca. 5 bis 15 Minuten).`);
            await runCodexAgent(prompt, relativePath, cloneDir);

            // 3. Push back to GitHub
            await syncWorkspaceBack(`Codex auto-completed task #${id}`, cloneDir);

            await db.execute({
                sql: `UPDATE antigravity_tasks SET status = 'completed' WHERE id = ?`,
                args: [id]
            });

            log.info(`[CloudWorker] Successfully completed and pushed task #${id}`);

            // Send completion message directly to Telegram
            const completeMessage = `✅ *Aufgabe #${id} erledigt!*\n\n` +
                `Dein autonomer Cloud Worker hat die Aufgabe bearbeitet und den Code auf GitHub gepusht. ` +
                `Falls dies eine Web-App betrifft, sollte die Live-Seite in wenigen Sekunden unter [Gravity Claw Dev](https://gravity-claw-dev.netlify.app) erreichbar sein.`;

            await sendTelegramNotification(completeMessage);

        } catch (error) {
            console.error("CRITICAL ERROR IN POLLING LOOP:", error);
            log.error("[CloudWorker] Execution error", { error: error instanceof Error ? error.message : String(error) });

            // Mark task as failed if an ID is available
            if (currentTaskId !== null) {
                try {
                    await db.execute({
                        sql: `UPDATE antigravity_tasks SET status = 'failed' WHERE id = ?`,
                        args: [currentTaskId]
                    });
                    await sendTelegramNotification(`❌ **Fehler bei Aufgabe #${currentTaskId}**\n\nDer Cloud Worker ist während der Bearbeitung abgestürzt oder hat einen Fehler festgestellt:\n\`\`\`\n${error instanceof Error ? error.message : String(error).substring(0, 500)}\n\`\`\``);
                } catch (dbErr) {
                    console.error("Failed to update status to failed", dbErr);
                }
            }
        }
    }, intervalMs);
}

startWorker().catch(console.error);
