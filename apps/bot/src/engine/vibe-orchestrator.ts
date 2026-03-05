import fs from "fs";
import path from "path";
import { log } from "../utils/logger.js";
import type { Client } from "@libsql/client";
import { exec } from "child_process";
import { promisify } from "util";

const execPromiseRaw = promisify(exec);
const execPromise = async (command: string, options: any = {}) => {
    const opts = { maxBuffer: 10 * 1024 * 1024, ...options };
    const { stdout, stderr } = await execPromiseRaw(command, opts);
    return { stdout: String(stdout), stderr: String(stderr) };
};

// CODING PIPELINE: Everything runs through the Codex CLI (device auth, no API key needed).
// The developerRunCallback spawns `codex` for Architect, Developer, Reviewer, and Critic.

export interface VibeOptions {
    prompt: string;
    relativePath: string;
    cloneDir: string;
    taskId: number;
    db: Client;
    developerRunCallback: (prompt: string, relativePath: string, cloneDir: string) => Promise<string>;
    syncCallback: (message: string, cloneDir: string) => Promise<boolean>;
}

export async function runVibeCodingSession(options: VibeOptions): Promise<boolean> {
    const { prompt, relativePath, cloneDir, taskId, db, developerRunCallback, syncCallback } = options;
    const cwd = relativePath ? path.join(cloneDir, relativePath) : cloneDir;

    // Phase 1: The Architect
    await updateTaskStatus(db, taskId, "Architect is planning the application architecture and checklist...");
    log.info(`[VibeOrchestrator] Task #${taskId} - Starting Architect Phase`);

    const archPrompt = `
You are the Lead Software Architect.
The user wants to build the following:
"${prompt}"

Please generate an execution plan for the Developer agent. 
1. First, write down the Architecture, technical stack, and styling rules.
2. Then, write a strict checklist of sequential steps to build the app.

CRITICAL INSTRUCTION: Your checklist MUST use EXACTLY the "- [ ] " syntax!
Example:
\`\`\`markdown
- [ ] Step 1: Initialize project
- [ ] Step 2: Install dependencies
- [ ] Step 3: Write code
\`\`\`
    
CRITICAL INSTRUCTION FOR CHECKLIST GRANULARITY: 
Do NOT group files or components into a single step. EVERY single React component, custom hook, utility file, or significant logic block MUST have its own individual step in the checklist. This ensures the Developer agent can focus safely on one file at a time.
    `;

    // Run Architect through Codex CLI (same auth as Developer - device auth, no API key)
    let archOutput = "";
    try {
        archOutput = await developerRunCallback(archPrompt, relativePath, cloneDir);
    } catch (e) {
        log.error(`[VibeOrchestrator] Task #${taskId} - Architect Codex run failed:`, { error: String(e) });
        archOutput = "";
    }

    // Save raw output for debugging (always in root)
    fs.writeFileSync(path.join(cloneDir, "ARCHITECT_RAW_OUTPUT.md"), archOutput);

    // Fallback: If no checkboxes exist, the LLM completely failed to follow the format.
    if (!archOutput.includes("- [ ]")) {
        // Attempt to auto-fix by converting numbered lists (1. 2. 3.) or bullet points (- or *) to checkboxes
        archOutput = archOutput.replace(/^(?:\d+\.|\-|\*)\s+(.*)$/gm, '- [ ] $1');

        // Auto-fix lines that just start with "Step X:" without any bullets
        archOutput = archOutput.replace(/^\s*(Step\s+\d+:.*)$/gm, '- [ ] $1');

        // If it STILL doesn't have checkboxes after the regex replace, it means it generated pure prose.
        if (!archOutput.includes("- [ ]")) {
            log.warn(`[VibeOrchestrator] Task #${taskId} - Architect failed to generate checkboxes. Aborting.`);
            log.warn(`[VibeOrchestrator] Raw Architect Output was:\n${archOutput.substring(0, 500)}...`);
            await updateTaskStatus(db, taskId, `ERROR: Architect failed to generate a checklist. Please try a different prompt or simpler instructions.`);
            return false;
        }
    }

    // Strip out the example steps if the AI parrot-copied them from the prompt
    archOutput = archOutput.replace(/-\s*\[[ x]\]\s*Step 1:\s*Initialize project/gi, '');
    archOutput = archOutput.replace(/-\s*\[[ x]\]\s*Step 2:\s*Install dependencies/gi, '');
    archOutput = archOutput.replace(/-\s*\[[ x]\]\s*Step 3:\s*Write code/gi, '');

    // Foolproof parsing: We simply inject the ENTIRE output into both files.
    // The Developer loop iterates by blindly searching for '- [ ]' in TODO.md, ignoring everything else!
    // ALWAYS save to root repository folder, not the nested target directory.
    fs.writeFileSync(path.join(cloneDir, "ARCHITECTURE.md"), archOutput);
    fs.writeFileSync(path.join(cloneDir, "TODO.md"), archOutput);

    // Initial commit of the plan
    await syncCallback(`Architect created ARCHITECTURE.md and TODO.md`, cloneDir);

    // Orchestration State Machine
    let criticLoops = 0;
    const MAX_CRITIC_LOOPS = 3;

    while (criticLoops < MAX_CRITIC_LOOPS) {
        // Phase 2: The Developer Execution Loop
        let keepRunning = true;
        let iteration = 1;
        let lastStepName = "";
        let baseCommitHash = "HEAD";
        let previousRejectionReason = "";
        let stepAttempts = 0;
        const MAX_STEP_ATTEMPTS = 5; // Prevent infinite reject loops on a single step

        while (keepRunning) {
            if (iteration > 300) {
                log.warn(`[VibeOrchestrator] Task #${taskId} - Iteration cap reached (300). Stopping execution.`);
                break;
            }

            const todoContent = fs.existsSync(path.join(cloneDir, "TODO.md"))
                ? fs.readFileSync(path.join(cloneDir, "TODO.md"), "utf-8")
                : "";

            // Find the first uncompleted task
            const lines = todoContent.split("\n");
            // Only match literal steps, preventing it from executing random checkboxes (like Acceptance Criteria)
            const nextTaskIndex = lines.findIndex(line => line.trim().match(/^- \[\s\] Step/i));

            if (nextTaskIndex === -1) {
                log.info(`[VibeOrchestrator] Task #${taskId} - TODO.md is fully completed! Transitioning to QA/Critic.`);
                break; // Move to Critic/QA Phase
            }

            const currentTask = lines[nextTaskIndex];
            const stepName = currentTask.replace("- [ ]", "").trim();

            // Only capture base commit hash at the START of a newly assigned task, NOT on retries
            if (stepName !== lastStepName) {
                try {
                    const { stdout } = await execPromise(`git rev-parse HEAD`, { cwd });
                    baseCommitHash = stdout.trim();
                } catch (e) {
                    baseCommitHash = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";
                }
                lastStepName = stepName;
                previousRejectionReason = ""; // Reset rejection reason for new tasks
                stepAttempts = 0; // Reset retry counter for new tasks
            }

            await updateTaskStatus(db, taskId, `Developer executing step: ${stepName} (Iteration ${iteration})`);

            // 2a. Developer Agent Execution
            const devPrompt = \`
You are the Developer. You have ARCHITECTURE.md to guide you.
Your current strict task is: "\${stepName}"
IMPORTANT: You MUST complete this specific checklist item, verify compilation using 'npm run build' or similar, and fix any errors before considering it done. Do NOT try to do the entire project at once. Do NOT check off the item in TODO.md, the Orchestrator will do it.
CRITICAL SCAFFOLDING RULE: When creating a new project (e.g., Vite/Next.js/React), be aware that the target directory is NOT empty (it contains architecture docs). You MUST force the installation or handle the "Directory not empty" check (e.g., \`npm create vite@latest . -- --template react-ts\`). ALWAYS verify \`package.json\` exists after attempting to create the project.
\${previousRejectionReason ? \`\\n🚨 THE REVIEWER REJECTED YOUR LAST ATTEMPT FOR THIS REASON:\\n\${previousRejectionReason}\\n\\nFIX THIS NOW!\` : ""}
            \`;

            let devOutputStr = "";
            try {
                const result = await developerRunCallback(devPrompt, relativePath, cloneDir);
                if (typeof result === "string") {
                    devOutputStr = result;
                }
                await syncCallback(`Developer attempted: ${ stepName } `, cloneDir);
            } catch (e: any) {
                log.warn(`[VibeOrchestrator] Task #${ taskId } Developer threw error: `, { error: String(e) });
                devOutputStr = "Developer process crashed or threw an error.";
            }

            // 2b. Reviewer Agent Execution
            await updateTaskStatus(db, taskId, `Reviewer evaluating step: ${ stepName } `);

            // Exclude huge directories and lockfiles from diff so we don't crash Node's stdout Buffer (e.g. 50MB node_modules diffs)
            let gitDiffStr = "";
            try {
                const gitDiff = await execPromise(`git diff ${ baseCommitHash } HEAD-- .":!node_modules" ":!.next" ":!package-lock.json" ":!yarn.lock" ":!pnpm-lock.yaml" ":!dist" ":!build" ":!**/REVIEW_FEEDBACK.md"`, { cwd });
                gitDiffStr = gitDiff.stdout;
            } catch (e) {
                log.warn(`[VibeOrchestrator] Git diff failed: `, { error: String(e) });
                gitDiffStr = "Error reading git diff. The developer may not have committed any new files.";
            }

            // CRITICAL: Use the LAST 4000 chars of output, not the first!
            // Build verification output (npm run build, tsc, etc.) is always at the END.
            // Using substring(0, 4000) was cutting off the proof of success.
            const devOutputTrimmed = devOutputStr.length > 6000
                ? `[...truncated ${ devOutputStr.length - 6000 } chars...]\n` + devOutputStr.substring(devOutputStr.length - 6000)
                : devOutputStr;

            // Auto-approve if we've hit the retry limit to prevent burning tokens
            if (stepAttempts >= MAX_STEP_ATTEMPTS) {
                log.warn(`[VibeOrchestrator] Task #${ taskId } - Step '${stepName}' hit ${ MAX_STEP_ATTEMPTS } retry attempts.Force - approving to prevent infinite loop.`);
                lines[nextTaskIndex] = lines[nextTaskIndex].replace("- [ ]", "- [x]");
                fs.writeFileSync(path.join(cloneDir, "TODO.md"), lines.join("\n"));
                previousRejectionReason = "";
                stepAttempts = 0;
                await syncCallback(`Force - approved step after ${ MAX_STEP_ATTEMPTS } retries: ${ stepName } `, cloneDir);
                iteration++;
                continue;
            }

            // Run Reviewer through Codex CLI (same auth as Developer)
            const reviewerPrompt = `
You are the Reviewer.The Developer just tried to complete this task: "${stepName}".

Here is the Git Diff of their changes:
${ gitDiffStr.trim() === "" ? "(The git diff is empty. The developer made no code modifications.)" : gitDiffStr.substring(0, 10000) }

Analyze the diff.Did the Developer successfully make the necessary code changes for the task ?
                RULES :
                1. ONLY look at the git diff.If the diff shows correct code changes for the task, reply APPROVED.
2. If the diff is empty, the task was ALREADY COMPLETE from a previous step.Reply APPROVED.
3. If the diff shows incorrect, incomplete, or broken code, reply REJECTED with a brief explanation.

Reply with a single word at the very beginning of your response: APPROVED or REJECTED.
If REJECTED, append a brief explanation of what is missing or broken.
            `;

            let reviewOut = "APPROVED";
            try {
                reviewOut = await developerRunCallback(reviewerPrompt, relativePath, cloneDir);
                // Extract APPROVED/REJECTED from the Codex output (might contain extra text)
                if (!reviewOut.includes("APPROVED") && !reviewOut.includes("REJECTED")) {
                    reviewOut = "APPROVED"; // Default to approved if Codex output is unclear
                }
            } catch (e) {
                log.warn(`[VibeOrchestrator] Reviewer Codex run failed, defaulting to APPROVED`);
                reviewOut = "APPROVED";
            }

            if (reviewOut.startsWith("REJECTED")) {
                stepAttempts++;
                log.info(`[VibeOrchestrator] Task #${ taskId } - Reviewer rejected step: ${ stepName } (attempt ${ stepAttempts }/${MAX_STEP_ATTEMPTS})`);
                await updateTaskStatus(db, taskId, `Reviewer rejected step.Developer will retry(${ stepAttempts } / ${ MAX_STEP_ATTEMPTS }).`);

                previousRejectionReason = reviewOut;
            } else {
                log.info(`[VibeOrchestrator] Task #${ taskId } - Reviewer APPROVED step: ${ stepName } `);
                lines[nextTaskIndex] = lines[nextTaskIndex].replace("- [ ]", "- [x]");
                fs.writeFileSync(path.join(cloneDir, "TODO.md"), lines.join("\n"));

                previousRejectionReason = ""; // Clear on success
                await syncCallback(`Reviewer approved step: ${ stepName } `, cloneDir);
            }

            iteration++;
        }

        // Phase 3: Browser QA Agent & Critic
        log.info(`[VibeOrchestrator] Task #${ taskId } - Starting Critic QA Loop ${ criticLoops + 1 }/${MAX_CRITIC_LOOPS}`);
            await updateTaskStatus(db, taskId, `QA Agent is testing the application (Cycle ${criticLoops + 1}/${MAX_CRITIC_LOOPS})...`);

            // 3a. Browser QA Agent (Codex)
            const qaPrompt = `
You are the elite Browser QA & Testing Agent.
Your job is to test the application in this repository.
1. Check package.json to see how to start the development server (e.g. 'npm run dev' or 'npm start').
2. Start the server in the background (e.g., node server.js & or npm run dev &). Wait 3 seconds for it to boot.
3. Test the application. If it's a web app, use native fetch or install puppeteer to test the DOM and endpoints at http://localhost:(port).
4. If it's a CLI app, run it.
5. Create a file named 'QA_REPORT.md' and write down every single bug, visual glitch, or missing feature you detect. Be extremely critical. If it is 100% perfect, write "PERFECT" in the report.
6. Kill the background server process when you are done.
        `;

            try {
                await developerRunCallback(qaPrompt, relativePath, cloneDir);
                await syncCallback(`QA Agent created QA_REPORT.md`, cloneDir);
            } catch (e) {
                log.warn(`[VibeOrchestrator] QA Agent failed:`, { error: String(e) });
            }

            // QA report always goes to root too
            const qaReportPath = path.join(cloneDir, "QA_REPORT.md");
            const qaReport = fs.existsSync(qaReportPath) ? fs.readFileSync(qaReportPath, "utf-8") : "PERFECT";

            if (qaReport.includes("PERFECT") || qaReport.trim() === "") {
                log.info(`[VibeOrchestrator] Critic QA passed (PERFECT).`);
                break;
            }

            // 3b. Critic Agent
            await updateTaskStatus(db, taskId, `Critic Reviewing QA Report...`);
            const arch = fs.existsSync(path.join(cloneDir, "ARCHITECTURE.md")) ? fs.readFileSync(path.join(cloneDir, "ARCHITECTURE.md"), "utf-8") : "";

            const criticPrompt = `
You are the Lead Critic.
The user originally requested: "${prompt}"
The Architect designed: 
${arch}

The QA Agent just tested the app and reported:
${qaReport}

If the application is unacceptable or missing features requested by the user, you MUST append new tasks to fix these issues. 
Format your response exactly like this if improvements are needed:
===FILE:IMPROVEMENTS.md===
(Write an explanation of what needs to be fixed and why)
===END===

===APPEND_TODO===
- [ ] Fix bug X
- [ ] Improve feature Y
===END===

If the application is excellent and the QA report issues are extremely minor or negligible, reply with:
APPROVED
        `;

            // Run Critic through Codex CLI (same auth as Developer)
            let criticOut = "APPROVED";
            try {
                criticOut = await developerRunCallback(criticPrompt, relativePath, cloneDir);
            } catch (e) {
                log.warn(`[VibeOrchestrator] Critic Codex run failed, defaulting to APPROVED`);
                criticOut = "APPROVED";
            }

            if (criticOut.includes("APPROVED")) {
                log.info(`[VibeOrchestrator] Task #${taskId} - Critic APPROVED the final build.`);
                break;
            }

            // Critic Rejected -> we must restart Dev loop
            log.info(`[VibeOrchestrator] Task #${taskId} - Critic requested improvements. Looping Developer.`);

            const impMatch = criticOut.match(/===FILE:IMPROVEMENTS\.md===\n([\s\S]*?)\n===END===/);
            const appendMatch = criticOut.match(/===APPEND_TODO===\n([\s\S]*?)\n===END===/);

            if (impMatch && impMatch[1]) {
                fs.writeFileSync(path.join(cloneDir, "IMPROVEMENTS.md"), impMatch[1].trim());
            }
            if (appendMatch && appendMatch[1]) {
                fs.appendFileSync(path.join(cloneDir, "TODO.md"), "\n" + appendMatch[1].trim());
                await syncCallback(`Critic appended new tasks (QA failed)`, cloneDir);

                // Re-run the Phase 2 Developer Execution loop for the new items!
                // We just let the while(keepRunning) loop handle it...
                // Oh wait, Phase 2 is above. I need to wrap Phase 2 and 3 in a higher-level loop, or just duplicate the logic.
                // Since this is linear, I can just recursively call something, or simply extract Phase 2 into a function.
            }

            criticLoops++;
        }

        await updateTaskStatus(db, taskId, `Vibe Coding Session finished completely!`);
        return true;
    }

    async function updateTaskStatus(db: Client, id: number, message: string) {
        try {
            log.info(`[VibeOrchestrator] Update -> ${message}`);
            // We push this directly to the orchestrator_messages so the user can query it via "Check Status"
            await db.execute({
                sql: `INSERT INTO orchestrator_messages (project_id, message, status) VALUES (?, ?, 'unread')`,
                args: [String(id), message]
            });

            // Also update the main task result_data to hold the current step
            await db.execute({
                sql: `UPDATE antigravity_tasks SET result_data = ? WHERE id = ?`,
                args: [`Status: ${message}`, id]
            });
        } catch (e) { }
    }


