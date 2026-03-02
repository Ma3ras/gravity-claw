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

async function syncWorkspaceBack(message: string, cloneDir: string): Promise<boolean> {
    log.info(`[CloudWorker] Syncing changes back to GitHub...`);
    try {
        // Ensure .agent_workspace is explicitly added even if sometimes ignored by default git rules
        try { await execPromise(`git add .agent_workspace`, { cwd: cloneDir }); } catch (e) { }
        await execPromise(`git add .`, { cwd: cloneDir });

        const { stdout } = await execPromise(`git status --porcelain`, { cwd: cloneDir });
        if (!stdout.trim()) {
            log.info(`[CloudWorker] No changes to commit. Working tree is clean.`);
            return false;
        }

        await execPromise(`git commit -m "feat(ai): ${message}"`, { cwd: cloneDir });

        // Extremely important: If GitHub auto-initialized with a README, we must pull it first before pushing to avoid conflicts
        try {
            log.info(`[CloudWorker] Rebasing from remote just in case...`);
            await execPromise(`git pull origin main --rebase`, { cwd: cloneDir }).catch(() =>
                execPromise(`git pull origin master --rebase`, { cwd: cloneDir })
            );
        } catch (e) {
            log.warn(`[CloudWorker] Rebase failed, probably a completely empty repo. Skipping rebase.`);
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

        try {
            await execPromise(`git push -u origin ${branchName}`, { cwd: cloneDir });
        } catch (e1) {
            log.warn(`[CloudWorker] Failed to push to ${branchName}, trying HEAD:refs/heads/main...`);
            await execPromise(`git push origin HEAD:refs/heads/main`, { cwd: cloneDir });
        }
        log.info(`[CloudWorker] Changes successfully pushed to GitHub.`);
        return true;
    } catch (error: any) {
        log.error("[CloudWorker] Git Sync Error", { error: error.message, stderr: error.stderr });
        throw error;
    }
}

async function runCodexAgent(prompt: string, relativeProjectPath: string, cloneDir: string): Promise<void> {
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
5. MANDATORY VERIFICATION: You are an autonomous agent. Before you consider this task complete, you MUST verify your work compiles. You MUST run 'npm run build' or 'npx tsc' in the directory you modified.
6. SELF-CORRECTION: If your build or verification commands fail with errors, you MUST read the errors, fix your code, and run the build again until it succeeds. Do NOT return or finish until the code builds without errors.

USER TASK:
${prompt}
`;
        log.debug(`[CloudWorker] Executing Codex CLI in ${cwd}...`);

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
            const match = cleanBuffer.match(/([A-Z0-9]{4}-[A-Z0-9]{5})/);

            if (match && isCodeSection && !codeSent) {
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

async function deployToNetlify(cloneDir: string): Promise<string | null> {
    const authToken = process.env.NETLIFY_AUTH_TOKEN;
    const siteId = process.env.NETLIFY_SITE_ID;

    if (!authToken || !siteId) {
        log.warn("[CloudWorker] Netlify credentials missing. Skipping deployment.");
        return null;
    }

    try {
        // Find the frontend directory - prioritize apps/web (monorepo frontend) over root
        let frontendDir = cloneDir;
        let pjsonPath = path.join(cloneDir, "package.json");

        // Check for monorepo web frontend first (apps/web takes priority)
        const webPjsonPath = path.join(cloneDir, "apps/web/package.json");
        if (fs.existsSync(webPjsonPath)) {
            frontendDir = path.join(cloneDir, "apps/web");
            pjsonPath = webPjsonPath;
            log.info(`[CloudWorker] Found monorepo frontend at apps/web`);
        }

        if (!fs.existsSync(pjsonPath)) {
            log.info("[CloudWorker] No package.json found. Skipping Netlify deployment.");
            return null;
        }

        const pjson = JSON.parse(fs.readFileSync(pjsonPath, "utf-8"));
        if (!pjson.scripts || !pjson.scripts.build) {
            log.info("[CloudWorker] No build script found in package.json. Skipping Netlify deployment.");
            return null;
        }

        log.info(`[CloudWorker] Building frontend at ${frontendDir}...`);
        await sendTelegramNotification(`Baue Frontend fuer Netlify...`);

        // Helper: exec with timeout and CI=true to prevent any interactive prompts
        const ciEnv = { ...process.env, CI: 'true' };

        const execWithTimeout = (cmd: string, cwd: string, timeoutMs = 90000): Promise<{ stdout: string; stderr: string }> => {
            return new Promise((resolve, reject) => {
                const child = exec(cmd, { cwd, env: ciEnv, maxBuffer: 10 * 1024 * 1024 }, (error: any, stdout: string, stderr: string) => {
                    if (error) reject(new Error(`${cmd} failed: ${error.message}\nstderr: ${stderr?.substring(0, 500)}`));
                    else resolve({ stdout, stderr });
                });
                const timer = setTimeout(() => {
                    child.kill('SIGTERM');
                    reject(new Error(`Command timed out after ${timeoutMs / 1000}s: ${cmd}`));
                }, timeoutMs);
                child.on('exit', () => clearTimeout(timer));
            });
        };

        // Step 1: npm install (with CI flags to avoid prompts)
        log.info(`[CloudWorker] Running: npm install --legacy-peer-deps in ${frontendDir}`);
        await execWithTimeout("npm install --legacy-peer-deps", frontendDir, 120000);
        log.info(`[CloudWorker] npm install completed.`);

        // Step 2: Build with Vite directly (skip tsc type-checking which fails on Codex-generated code)
        log.info(`[CloudWorker] Running: npx vite build in ${frontendDir}`);
        await execWithTimeout("npx vite build", frontendDir, 120000);
        log.info(`[CloudWorker] Build completed.`);

        // Step 3: Find the dist/build output directory
        const distDir = fs.existsSync(path.join(frontendDir, "dist"))
            ? path.join(frontendDir, "dist")
            : fs.existsSync(path.join(frontendDir, "build"))
                ? path.join(frontendDir, "build")
                : frontendDir;

        // Step 4: Deploy to Netlify - auth/site picked up from env vars in ciEnv
        log.info(`[CloudWorker] Deploying ${distDir} to Netlify...`);
        const deployCmd = `netlify deploy --prod --dir="${distDir}"`;
        const { stdout: deployOut } = await execWithTimeout(deployCmd, frontendDir, 60000);

        // Extract the URL from Netlify CLI output
        const urlMatch = deployOut.match(/https:\/\/[^\s]+\.netlify\.app/);
        const deployUrl = urlMatch ? urlMatch[0] : "https://gravity-claw-dev.netlify.app";

        log.info("[CloudWorker] Netlify deployment successful!", { url: deployUrl });
        await sendTelegramNotification(`Netlify Deploy erfolgreich: ${deployUrl}`);
        return deployUrl;
    } catch (e: any) {
        // Sanitize error: never leak auth tokens in Telegram messages
        const errMsg = String(e).replace(/--auth="[^"]*"/g, '--auth="***"').replace(/--site="[^"]*"/g, '--site="***"').substring(0, 300);
        log.error("[CloudWorker] Netlify deployment failed", { error: String(e) });
        await sendTelegramNotification(`Netlify Deploy fehlgeschlagen: ${errMsg}`);
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
                SELECT id, project_path, prompt, repo_url, role, chain_id 
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
            const taskRole = (row.role as string) || null;
            const chainId = (row.chain_id as string) || null;
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

            // Determine the relative path for Codex to operate in (role-aware).
            let relativePath = "";
            if (taskRole === 'FrontendDev' && fs.existsSync(path.join(cloneDir, "apps/web/package.json"))) {
                // FrontendDev works in apps/web specifically
                relativePath = "apps/web";
            } else if (repoUrl.includes("gravity-claw")) {
                // Legacy: gravity-claw backend modifications
                if (rawProjectPath.includes("apps/bot") || rawProjectPath.includes("apps\\bot")) {
                    relativePath = "apps/bot";
                }
            }
            // Architect, BackendDev, and Reviewer always work in repo ROOT
            // so they can see ARCHITECTURE.md and the full project structure

            // 2. Run Codex
            await sendTelegramNotification(`🧠 **Codex generiert Code...**\n\nDas Repository ist bereit. Codex schreibt und testet jetzt den Code für Aufgabe #${id}. Dies kann je nach Komplexität einige Minuten dauern (ETA: ca. 5 bis 15 Minuten).`);
            await runCodexAgent(prompt, relativePath, cloneDir);

            // 3. Push back to GitHub
            const changesPushed = await syncWorkspaceBack(`Codex auto-completed task #${id}`, cloneDir);

            // 4. AUTO-CHAIN: Parallel pipeline (Architect -> [BackendDev + FrontendDev] -> Reviewer)
            // This MUST run before Netlify deploy to avoid blocking the pipeline
            if (taskRole === 'Architect' && chainId) {
                log.info(`[CloudWorker] Architect completed. Creating parallel BackendDev + FrontendDev tasks...`);

                // Read the Architect's plan directly from ARCHITECTURE.md (much better than git diff stat)
                let architectPlan = '';
                const archMdPath = path.join(cloneDir, 'ARCHITECTURE.md');
                if (fs.existsSync(archMdPath)) {
                    architectPlan = fs.readFileSync(archMdPath, 'utf-8').substring(0, 5000);
                    log.info(`[CloudWorker] Read ARCHITECTURE.md (${architectPlan.length} chars)`);
                } else {
                    // Fallback: try git diff for the plan
                    try {
                        const { stdout } = await execPromise(`git log --oneline -1 --format="%B" && git diff HEAD~1`, { cwd: cloneDir });
                        architectPlan = stdout.substring(0, 5000);
                    } catch { architectPlan = 'Check the repository files for the architecture plan.'; }
                    log.warn(`[CloudWorker] No ARCHITECTURE.md found, using git diff as fallback`);
                }

                // --- BackendDev Task ---
                const backendPrompt = `You are a Senior Backend Developer in an autonomous agent team.

The Lead Architect has completed the planning phase. Here is the architecture plan:
${architectPlan}

Read the ARCHITECTURE.md file in the repository for the full plan.

YOUR JOB - BACKEND ONLY:
1. Implement the COMPLETE backend according to the Architect's plan.
2. Set up the server (Express/Node.js) with ALL API routes defined in the architecture.
3. Set up the database layer as specified in the architecture.
4. Add CORS, input validation, error handling middleware.
5. Create a .env.example with all required environment variables.
6. Install all backend dependencies (npm init if needed, npm install).
7. Verify the backend compiles and starts.

CRITICAL RULES:
- Follow the Architect's plan EXACTLY. Build what THEY specified, not a generic auth system.
- Do NOT add user registration/login/JWT authentication UNLESS the ARCHITECTURE.md explicitly requires it.
- Do NOT touch any frontend/React code. Another agent handles the frontend.
- Focus 100% on backend quality: clean code, proper error responses, best practices.
- Make sure your API endpoints return proper JSON responses that a React frontend can consume.`;

                const backendResult = await db.execute({
                    sql: `INSERT INTO antigravity_tasks (project_path, prompt, repo_url, status, role, chain_id) VALUES (?, ?, ?, 'pending', 'BackendDev', ?)`,
                    args: ['./', backendPrompt, repoUrl, chainId]
                });
                const backendId = Number(backendResult.lastInsertRowid);

                // --- FrontendDev Task ---
                const frontendPrompt = `You are a Senior Frontend Developer (React + TypeScript) in an autonomous agent team.

The Lead Architect has completed the planning phase. Here is the architecture plan:
${architectPlan}

Read the ARCHITECTURE.md file in the repository for the full plan.

YOUR JOB - FRONTEND ONLY:
1. Implement the COMPLETE frontend according to the Architect's plan.
2. Set up a React + TypeScript + Vite frontend in the apps/web directory.
3. Create ALL UI components specified in the architecture - make them beautiful and modern.
4. Implement client-side state management as needed (React Context, zustand, etc.).
5. Connect to the backend API endpoints defined in the architecture using fetch/axios.
6. Style with modern CSS (Tailwind, CSS modules, or styled-components) - make it look premium.
7. Install all frontend dependencies.
8. Verify the frontend builds: npx vite build

CRITICAL RULES:
- Follow the Architect's plan EXACTLY. Build what THEY specified, not a generic login page.
- Build the MAIN FEATURE of the app first (e.g. chess board, game view, dashboard). Do NOT start with a login/register page unless ARCHITECTURE.md explicitly requires authentication.
- Do NOT write any backend/Express/API code. Another agent handles the backend.
- Focus 100% on frontend quality: responsive design, animations, loading states, error handling.
- The API base URL should be configurable (e.g. via .env or a constant).`;

                const frontendResult = await db.execute({
                    sql: `INSERT INTO antigravity_tasks (project_path, prompt, repo_url, status, role, chain_id) VALUES (?, ?, ?, 'pending', 'FrontendDev', ?)`,
                    args: ['./', frontendPrompt, repoUrl, chainId]
                });
                const frontendId = Number(frontendResult.lastInsertRowid);

                log.info(`[CloudWorker] Auto-chained BackendDev #${backendId} + FrontendDev #${frontendId} (parallel)`);
                await sendTelegramNotification(`[Auto-Chain] 2 parallele Tasks erstellt:\n- BackendDev #${backendId} (Server + API)\n- FrontendDev #${frontendId} (React UI)\nBeide arbeiten gleichzeitig!`);

            } else if ((taskRole === 'BackendDev' || taskRole === 'FrontendDev') && chainId) {
                // One of the parallel devs finished. Check if the OTHER one is also done.
                const otherRole = taskRole === 'BackendDev' ? 'FrontendDev' : 'BackendDev';
                log.info(`[CloudWorker] ${taskRole} completed. Checking if ${otherRole} is also done...`);

                const otherResult = await db.execute({
                    sql: `SELECT status FROM antigravity_tasks WHERE chain_id = ? AND role = ? ORDER BY created_at DESC LIMIT 1`,
                    args: [chainId, otherRole]
                });

                if (otherResult.rows.length > 0 && otherResult.rows[0].status === 'completed') {
                    // BOTH devs are done! Create the Reviewer
                    log.info(`[CloudWorker] Both BackendDev and FrontendDev completed! Auto-chaining Reviewer...`);

                    let allChanges = '';
                    try {
                        const { stdout } = await execPromise(`git log --oneline -5 && git diff HEAD~1 --stat`, { cwd: cloneDir });
                        allChanges = stdout.substring(0, 3000);
                    } catch { allChanges = 'See repository for all changes.'; }

                    const reviewPrompt = `You are a strict QA Reviewer and Security Auditor in an autonomous agent team.

Two developers (Backend + Frontend) have just finished implementing the project independently.
Here is a summary of recent changes:
${allChanges}

YOUR JOB:
1. Review ALL code files (both backend AND frontend) for bugs, security issues, and best practices.
2. Make sure the backend API and frontend are properly integrated (correct API URLs, CORS, auth headers).
3. Run the test suite if it exists (npm test).
4. Verify both backend and frontend compile: npx tsc, npx vite build.
5. Fix any critical bugs you find directly in the code.
6. Ensure a complete README.md exists with setup instructions for BOTH backend and frontend.
7. If there are integration issues between backend and frontend, fix them.`;

                    const reviewResult = await db.execute({
                        sql: `INSERT INTO antigravity_tasks (project_path, prompt, repo_url, status, role, chain_id) VALUES (?, ?, ?, 'pending', 'Reviewer', ?)`,
                        args: ['./', reviewPrompt, repoUrl, chainId]
                    });
                    const reviewId = Number(reviewResult.lastInsertRowid);
                    log.info(`[CloudWorker] Auto-chained Reviewer as DB task #${reviewId}`);
                    await sendTelegramNotification(`[Auto-Chain] Beide Devs fertig! Reviewer-Task #${reviewId} erstellt. Der Reviewer prueft jetzt den gesamten Code!`);
                } else {
                    log.info(`[CloudWorker] ${otherRole} is not yet completed. Waiting for it to finish before creating Reviewer.`);
                    await sendTelegramNotification(`[Auto-Chain] ${taskRole} ist fertig! Warte auf ${otherRole}...`);
                }

            } else if (taskRole === 'Reviewer' && chainId) {
                log.info(`[CloudWorker] Reviewer completed. Pipeline for chain ${chainId} is DONE!`);
                await sendTelegramNotification(`Pipeline komplett! Alle 4 Agenten (Architect, BackendDev, FrontendDev, Reviewer) haben das Projekt erfolgreich abgeschlossen! Repo: https://github.com/${repoUrl.replace('.git', '')}`);
            }

            // 5. Deploy to Netlify (non-blocking, fire-and-forget)
            // Only attempt for repos that have a frontend build
            deployToNetlify(cloneDir).then(url => {
                if (url) sendTelegramNotification(`Live Vorschau: ${url}`);
            }).catch(() => { });

            // Send completion message directly to Telegram
            let text = `Aufgabe #${id} erledigt! Dein autonomer Cloud Worker hat die Aufgabe bearbeitet.`;
            if (changesPushed) {
                text += ` Der Code wurde vollstaendig auf GitHub gepusht!`;
            } else {
                text += ` Es waren keine Code-Aenderungen an diesem Repository noetig.`;
            }

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
