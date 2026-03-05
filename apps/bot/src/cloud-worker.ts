import { config } from "./config.js";
import { log } from "./utils/logger.js";
import { initDatabase } from "./memory/db.js";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execPromiseRaw = promisify(exec);
const execPromise = async (command: string, options: any = {}) => {
    // 50MB buffer to prevent stdout maxBuffer exceeded on heavy NPM runs
    const opts = { maxBuffer: 50 * 1024 * 1024, ...options };
    const { stdout, stderr } = await execPromiseRaw(command, opts);
    return { stdout: String(stdout), stderr: String(stderr) };
};

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

    let finalRepoUrl = repoUrl;

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
            let [, owner, repo] = match;
            repo = repo.replace(/\.git$/, '');

            // AI often hallucinates generic usernames. If we see one, replace it with the authenticated user's real name.
            const genericNames = ["user", "username", "your-username", "yourusername", "testuser"];
            if (genericNames.includes(owner.toLowerCase())) {
                const userRes = await fetch("https://api.github.com/user", { headers: { Authorization: `token ${GITHUB_PAT}` } });
                if (userRes.ok) {
                    const userData = await userRes.json() as any;
                    log.info(`[CloudWorker] Interpolating hallucinated username '${owner}' to real user '${userData.login}'`);
                    owner = userData.login;
                    finalRepoUrl = `github.com/${owner}/${repo}.git`;
                }
            }

            const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
                headers: { Authorization: `token ${GITHUB_PAT}` }
            });
            if (res.status === 404) {
                log.info(`[CloudWorker] Repository ${owner}/${repo} not found. Creating it...`);
                const createRes = await fetch(`https://api.github.com/user/repos`, {
                    method: 'POST',
                    headers: {
                        Authorization: `token ${GITHUB_PAT}`,
                        "Content-Type": "application/json",
                        "Accept": "application/vnd.github.v3+json"
                    },
                    body: JSON.stringify({ name: repo, private: true, auto_init: true })
                });

                if (createRes.ok) {
                    const data = await createRes.json() as any;
                    finalRepoUrl = data.clone_url.replace("https://", "");
                    log.info(`[CloudWorker] Created repository successfully as ${data.full_name}, using clone URL: ${finalRepoUrl}`);
                } else {
                    const errText = await createRes.text();
                    log.warn(`[CloudWorker] Failed to create repository: ${createRes.status} ${errText}`);
                }

                await new Promise(r => setTimeout(r, 2000)); // Wait for GitHub creation propagation
            }
        }

        const authRepoUrl = `https://${GITHUB_PAT}@${finalRepoUrl}`;
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
        log.info(`[CloudWorker] Repository appears completely empty and without remote branch. Creating initial commit on main branch...`);
        await execPromise(`git checkout -b main`, { cwd: cloneDir }).catch(() => { });
        if (!fs.existsSync(path.join(cloneDir, "README.md"))) {
            fs.writeFileSync(path.join(cloneDir, "README.md"), "# Initialized by Gravity Claw Cloud Worker");
        }
        await execPromise(`git add .`, { cwd: cloneDir });
        await execPromise(`git commit -m "chore: Initialize repository"`, { cwd: cloneDir });

        // Push and set upstream tracking to main branch immediately
        try {
            await execPromise(`git push -u origin main`, { cwd: cloneDir });
            log.info(`[CloudWorker] Pushed initial commit to origin main`);
        } catch (e) {
            log.warn("[CloudWorker] Failed to push initial commit", { error: String(e) });
        }
    }

    return cloneDir;
}

export async function syncWorkspaceBack(message: string, cloneDir: string): Promise<boolean> {
    log.info(`[CloudWorker] Syncing changes back to GitHub...`);
    try {
        // Ensure .agent_workspace is explicitly added even if sometimes ignored by default git rules
        try { await execPromise(`git add .agent_workspace`, { cwd: cloneDir }); } catch (e) { }

        // MIGHTY SAFETY NET: Force `.gitignore` to contain node_modules and .next so git NEVER commits massive backend dependencies
        const gitIgnorePath = path.join(cloneDir, ".gitignore");
        if (!fs.existsSync(gitIgnorePath)) {
            fs.writeFileSync(gitIgnorePath, "node_modules\n.next\ndist\nbuild\npackage-lock.json\nyarn.lock\npnpm-lock.yaml\n");
        } else {
            const currentIgnore = fs.readFileSync(gitIgnorePath, "utf-8");
            if (!currentIgnore.includes("node_modules")) {
                fs.appendFileSync(gitIgnorePath, "\nnode_modules\n.next\ndist\nbuild\n");
            }
        }

        await execPromise(`git add .`, { cwd: cloneDir });
        const { stdout } = await execPromise(`git status --porcelain`, { cwd: cloneDir });
        if (!stdout.trim()) {
            log.info(`[CloudWorker] No changes to commit. Working tree is clean.`);
            return false;
        }

        // Escape quotes, backticks, dollar signs, and backslashes to prevent shell injection / syntax errors.
        // e.g. "Create `index.html`" was previously breaking the shell because backticks act as command substitution in /bin/sh
        const escapedMessage = message.replace(/(["`$\\])/g, '\\$1');
        await execPromise(`git commit -m "feat(ai): ${escapedMessage}"`, { cwd: cloneDir });

        // Extremely important: Sync with remote before pushing to avoid non-fast-forward errors
        // Step 1: Fetch the latest remote state
        try {
            await execPromise(`git fetch origin`, { cwd: cloneDir });
        } catch (e) {
            log.warn(`[CloudWorker] git fetch failed, remote might not exist yet. Continuing...`);
        }

        // Step 2: Try to rebase our local commits on top of the remote
        let rebaseSucceeded = false;
        try {
            log.info(`[CloudWorker] Rebasing local changes onto remote...`);
            await execPromise(`git rebase origin/main --autostash`, { cwd: cloneDir });
            rebaseSucceeded = true;
        } catch (e1) {
            // Rebase might fail due to conflicts or because origin/main doesn't exist yet
            try {
                await execPromise(`git rebase --abort`, { cwd: cloneDir });
            } catch { /* no rebase in progress */ }

            // Try master branch as fallback
            try {
                await execPromise(`git rebase origin/master --autostash`, { cwd: cloneDir });
                rebaseSucceeded = true;
            } catch (e2) {
                try { await execPromise(`git rebase --abort`, { cwd: cloneDir }); } catch { }
                log.warn(`[CloudWorker] Rebase failed (likely empty repo or conflict). Will force-push if normal push fails.`);
            }
        }

        // Detect the actual local branch name and push to it
        let branchName = 'main';
        try {
            const { stdout: branch } = await execPromise(`git rev-parse --abbrev-ref HEAD`, { cwd: cloneDir });
            const detected = branch.trim();
            // 'HEAD' means detached state (empty repo, no branches yet) — default to 'main'
            if (detected && detected !== 'HEAD') {
                branchName = detected;
            }
        } catch { /* default to main */ }

        // If detached HEAD (empty repo), create and checkout a real branch first
        if (branchName === 'main') {
            try {
                await execPromise(`git checkout -B main`, { cwd: cloneDir });
            } catch { /* branch might already exist */ }
        }

        // Step 3: Try normal push first
        try {
            await execPromise(`git push -u origin ${branchName}`, { cwd: cloneDir });
        } catch (e1) {
            // Step 4: If normal push fails, force-with-lease (safe force push that protects other people's commits)
            log.warn(`[CloudWorker] Normal push failed. Using --force-with-lease as fallback...`);
            try {
                await execPromise(`git push --force-with-lease origin ${branchName}`, { cwd: cloneDir });
            } catch (e2) {
                // Step 5: Last resort — force push (this is a solo AI workspace, so it's safe)
                log.warn(`[CloudWorker] force-with-lease also failed. Using --force as absolute last resort.`);
                await execPromise(`git push --force origin ${branchName}`, { cwd: cloneDir });
            }
        }
        log.info(`[CloudWorker] Changes successfully pushed to GitHub.`);
        return true;
    } catch (error: any) {
        log.error("[CloudWorker] Git Sync Error", { error: error.message, stderr: error.stderr });
        throw error;
    }
}

export async function runCodexAgent(prompt: string, relativeProjectPath: string, cloneDir: string): Promise<string> {
    log.info(`[CloudWorker] Sending task to Codex CLI...`);

    try {
        // Codex MUST run in the cloned directory so it edits the cloned files, not the worker's own files
        const targetDir = path.join(cloneDir, relativeProjectPath);
        if (!fs.existsSync(targetDir)) {
            log.warn(`[CloudWorker] Target directory ${targetDir} does not exist. Running at repo root.`);
        }
        const cwd = fs.existsSync(targetDir) ? targetDir : cloneDir;

        const strictInstructions = `
⚠️ CRITICAL SYSTEM INSTRUCTIONS FOR CODEX ⚠️
1. YOUR EXACT WORKSPACE PATH IS: ${cwd}
2. You MUST operate strictly within this directory. You are FORBIDDEN from accessing, searching, or modifying any files in other 'cloud-workspace-*' directories. Previous directories contain unrelated old projects.
3. MONOREPO STRUCTURE: If this is a monorepo, the Node.js backend is in 'apps/bot' and the React Vite frontend is in 'apps/web'. If this is a flat repo (no apps folder), just work in the root.
4. COMPONENT RULES: All React UI components MUST be created inside 'apps/web/src/components' or 'src/components'. Do NOT create React components in the backend bot folder.
5. MANDATORY VERIFICATION: You are an autonomous agent. Before you consider this task complete, you MUST verify your work compiles. 
6. HOW TO VERIFY: You MUST verify your isolated React/Next.js code compiles. You can run full build commands if necessary since this server has 12GB RAM.
7. 🚫 NO INTERACTIVE COMMANDS: You MUST append '-y', '--yes', or '-d' to any scaffolding commands (e.g. 'npx shadcn-ui@latest init -d'). If a command expects user input in the terminal, your process will HANG forever!

USER TASK:
${prompt}
`;
        log.debug(`[CloudWorker] Executing Codex CLI in ${cwd}...`);

        return await new Promise<string>((resolve, reject) => {
            const child = spawn("codex", ["exec", "--sandbox", "danger-full-access", strictInstructions], {
                shell: process.platform === 'win32',
                cwd: cwd,
                env: { ...process.env, CI: "true" }
            });

            let fullOutput = "";
            let stderrOutput = ""; // Capture stderr separately for debugging/logging

            // 10 minute timeout to prevent indefinite hangs on interactive prompts
            const timeoutId = setTimeout(() => {
                log.error(`[CloudWorker] Codex process timed out after 10 minutes. Killing process.`);
                child.kill('SIGKILL');
                reject(new Error(`Codex process timed out after 10 minutes.\nStdout:\n${fullOutput}\nStderr:\n${stderrOutput}`));
            }, 10 * 60 * 1000);

            child.stdout.on('data', (data) => {
                const chunk = data.toString();
                fullOutput += chunk;
                process.stdout.write(data);
            });

            child.stderr.on('data', (data) => {
                const chunk = data.toString();
                stderrOutput += chunk; // Do NOT append to fullOutput!
                process.stderr.write(data);
            });

            child.on('close', (code) => {
                clearTimeout(timeoutId);
                if (code === 0) {
                    log.info(`[CloudWorker] Codex execution finished successfully.`);
                    resolve(fullOutput);
                } else {
                    reject(new Error(`Codex process exited with code ${code} \nOutput:\n${fullOutput}`));
                }
            });

            child.on('error', (err) => {
                clearTimeout(timeoutId);
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

export async function runQAAgent(prompt: string, relativeProjectPath: string, cloneDir: string): Promise<string> {
    log.info(`[CloudWorker] Sending QA Task to Codex CLI...`);

    try {
        const targetDir = path.join(cloneDir, relativeProjectPath);
        const cwd = fs.existsSync(targetDir) ? targetDir : cloneDir;

        const strictInstructions = `
⚠️ CRITICAL SYSTEM INSTRUCTIONS FOR QA AGENT ⚠️
1. YOUR EXACT WORKSPACE PATH IS: ${cwd}
2. You are the QA Tester Agent. The Developer has just completed a major milestone.
3. Your job is to verify the application actually works in a browser environment.
4. You have full access to execute commands. You SHOULD boot the development server (e.g., \`npm run dev\`) in the background.
5. Once the server is running, write and execute a headless test script (e.g., using Node + Puppeteer/Playwright if installed, or basic fetch/curl if testing APIs) to verify the UI renders without fatal console errors.
6. If the page loads successfully and the main UI components are present, reply with "QA APPROVED".
7. If the server fails to boot, the page crashes, or there are breaking UI errors, reply with "QA REJECTED: [Reason]" and include the console logs.
8. DO NOT write production code. Only write tests or execute commands to verify the application.

QA TASK:
${prompt}
`;
        log.debug(`[CloudWorker] Executing QA Agent in ${cwd}...`);

        return await new Promise<string>((resolve, reject) => {
            const child = spawn("codex", ["exec", "--sandbox", "danger-full-access", strictInstructions], {
                shell: process.platform === 'win32',
                cwd: cwd,
                env: { ...process.env, CI: "true" }
            });

            let fullOutput = "";
            let stderrOutput = "";
            const timeoutId = setTimeout(() => {
                log.error(`[CloudWorker] QA Agent timed out.`);
                child.kill('SIGKILL');
                reject(new Error(`QA Agent timed out.\nStdout:\n${fullOutput}\nStderr:\n${stderrOutput}`));
            }, 10 * 60 * 1000);

            child.stdout.on('data', (data) => {
                const chunk = data.toString();
                fullOutput += chunk;
                process.stdout.write(data);
            });
            child.stderr.on('data', (data) => {
                const chunk = data.toString();
                stderrOutput += chunk;
                process.stderr.write(data);
            });
            child.on('close', (code) => {
                clearTimeout(timeoutId);
                if (code === 0) resolve(fullOutput);
                else reject(new Error(`QA Agent exited with ${code}\nOutput:\n${fullOutput}`));
            });
            child.on('error', (err) => {
                clearTimeout(timeoutId);
                reject(err);
            });
        });
    } catch (error: any) {
        log.error("[CloudWorker] QA Agent Error", { error: error.message });
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
            const match = cleanBuffer.match(/([A-Z0-9]{4}-[A-Z0-9]{5})/);

            if (match && isCodeSection && !codeSent) {
                codeSent = true;
                const code = match[1].trim().toUpperCase();
                log.info(`[CloudWorker] Captured Device Auth Code: ${code} `);
                await sendTelegramNotification(`🚨 ** Cloud Worker Authentication Required! ** 🚨\n\nThe AI server needs to log into Codex to run tasks.Please authenticate it: \n\n1.Open: https://auth.openai.com/codex/device\n2. Enter this code: \`${code}\`\n\nThe Worker will pause and wait here until you approve it in your browser.`);
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

async function deployToNetlify(cloneDir: string): Promise<string | null> {
    const authToken = process.env.NETLIFY_AUTH_TOKEN;
    const siteId = process.env.NETLIFY_SITE_ID;

    if (!authToken || !siteId) {
        log.warn("[CloudWorker] Netlify credentials missing. Skipping deployment.");
        return null;
    }

    try {
        let frontendDir: string | null = null;

        // Try apps/web, root, or any 1-level deep subdirectory (like chess-ai)
        const possibleDirs = [
            path.join(cloneDir, "apps/web"),
            cloneDir,
            ...fs.readdirSync(cloneDir)
                .filter(p => !p.startsWith('.') && fs.statSync(path.join(cloneDir, p)).isDirectory())
                .map(p => path.join(cloneDir, p))
        ];

        let buildScript = "";
        for (const dir of possibleDirs) {
            const pjsonPath = path.join(dir, "package.json");
            if (fs.existsSync(pjsonPath)) {
                try {
                    const pkg = JSON.parse(fs.readFileSync(pjsonPath, "utf-8"));
                    buildScript = pkg.scripts?.build || "";
                    if (buildScript.includes("vite") || buildScript.includes("next") || buildScript.includes("react-scripts")) {
                        frontendDir = dir;
                        log.info(`[CloudWorker] Found frontend project at ${dir}`);
                        break;
                    }
                } catch (e) { }
            }
        }

        if (!frontendDir) {
            log.info("[CloudWorker] No frontend application found. Skipping Netlify deployment.");
            return null;
        }

        log.info(`[CloudWorker] Building frontend at ${frontendDir}...`);
        await sendTelegramNotification(`🏗️ **Baue Frontend fuer Netlify...**`);

        const ciEnv = { ...process.env, CI: 'true', NEXT_TELEMETRY_DISABLED: '1' };
        await execPromise("npm install", { cwd: frontendDir, env: ciEnv, timeout: 120000 });

        // Run the actual package.json build script instead of hardcoding Vite
        await execPromise("npm run build", { cwd: frontendDir, env: ciEnv, timeout: 120000 });

        // Determine publish directory based on framework
        let publishDir = path.join(frontendDir, "dist"); // default Vite/React
        if (buildScript.includes("next")) {
            // Next.js static exports output to 'out', otherwise Netlify builds '.next' 
            // Better yet, Netlify CLI handles Next.js automatically if we just point to the frontend root.
            publishDir = frontendDir;
        }

        if (!fs.existsSync(publishDir)) {
            log.warn("[CloudWorker] Publish directory not found after build. Deployment might fail.");
        }

        log.info(`[CloudWorker] Deploying to Netlify...`);
        // We use --dir parameter but for Next.js it relies on the root of the next.js app.
        await execPromise(`npx netlify deploy --prod --dir="${publishDir}" --site="${siteId}" --build`, {
            cwd: frontendDir,
            env: { ...ciEnv, NETLIFY_AUTH_TOKEN: authToken },
            timeout: 60000
        });

        const url = "https://gravity-claw-dev.netlify.app";
        log.info("[CloudWorker] Netlify deployment successful.");
        await sendTelegramNotification(`🌐 Netlify Deploy erfolgreich: ${url}`);
        return url;
    } catch (e: any) {
        // Sanitize error: never leak auth tokens in Telegram messages
        const errMsg = String(e).replace(/--auth="[^"]*"/g, '--auth="***"').replace(/--site="[^"]*"/g, '--site="***"').substring(0, 300);
        log.error("[CloudWorker] Netlify deployment failed", { error: errMsg });
        await sendTelegramNotification(`⚠️ Netlify Deploy fehlgeschlagen: ${errMsg}`);
        return null;
    }
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
            // No telegram notification during setup
            await setupWorkspace(repoUrl, cloneDir);

            // Determine the relative path for Codex to operate in.
            let relativePath = "";
            if (fs.existsSync(path.join(cloneDir, "apps/web/package.json"))) {
                relativePath = "apps/web";
            } else if (fs.existsSync(path.join(cloneDir, "apps/bot/package.json")) && repoUrl.includes("gravity-claw")) {
                // Legacy fallback: if modifying gravity-claw backend specifically
                if (rawProjectPath.includes("apps/bot") || rawProjectPath.includes("apps\\bot")) {
                    relativePath = "apps/bot";
                }
            }

            // 2. Run Vibe Coding Multi-Agent Orchestrator
            const { runVibeCodingSession } = await import("./engine/vibe-orchestrator.js");
            const success = await runVibeCodingSession({
                prompt,
                relativePath,
                cloneDir,
                taskId: id,
                db,
                developerRunCallback: runCodexAgent,
                qaRunCallback: runQAAgent,
                syncCallback: syncWorkspaceBack
            });

            if (!success) {
                // The Orchestrator failed internally (e.g. Architect regex failed).
                // Do not mark as completed, throw an error to properly fail the task.
                throw new Error("Vibe Orchestrator aborted the session (see orchestrator messages for details).");
            }

            // 3. Deploy to Netlify (non-blocking)
            deployToNetlify(cloneDir).then(url => {
                db.execute({
                    sql: `INSERT INTO orchestrator_messages (project_id, message, status) VALUES (?, ?, 'unread')`,
                    args: [String(id), `Live Vorschau: ${url || "Netlify deployment skipped"}`]
                });
            }).catch(() => { });

            await db.execute({
                sql: `UPDATE antigravity_tasks SET status = 'completed' WHERE id = ?`,
                args: [id]
            });

            log.info(`[CloudWorker] Successfully completed task #${id}`);

            // Send ONE completion message directly to Telegram (The Weekly/Nightly Report)
            let text = `✅ **Schachmatt! Vibe-Coding-Session für Aufgabe #${id} beendet!**\n\nDein autonomer Cloud Worker hat über Nacht alle Agenten-Rollen durchgeführt (Architekt, Developer, Reviewer).\n\nDetails und Fortschritt wurden dokumentiert. Alle Code-Änderungen sind auf GitHub gepusht!`;
            await sendTelegramNotification(text);

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
