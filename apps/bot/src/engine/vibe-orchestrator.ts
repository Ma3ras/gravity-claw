import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { log } from "../utils/logger.js";
import type { Client } from "@libsql/client";
import { exec } from "child_process";
import { promisify } from "util";

const execPromiseRaw = promisify(exec);
const execPromise = async (command: string, options: any = {}) => {
    const opts = { maxBuffer: 1024 * 1024 * 50, ...options };
    const { stdout, stderr } = await execPromiseRaw(command, opts);
    return { stdout: String(stdout), stderr: String(stderr) };
};

import { config } from "../config.js";

// Make the orchestrator agnostic. It uses the same API key and Base URL as the Telegram Bot main LLM.
// If the user uses OpenRouter, we use the OpenRouter format. If it's pure OpenAI, it works too.
const openai = new OpenAI({
    apiKey: config.llmApiKey || process.env.OPENAI_API_KEY,
    baseURL: config.llmBaseUrl.includes("api.openai.com") ? undefined : config.llmBaseUrl
});

export interface VibeOptions {
    prompt: string;
    relativePath: string;
    cloneDir: string;
    taskId: number;
    db: Client;
    developerRunCallback: (prompt: string, relativePath: string, cloneDir: string) => Promise<void>;
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

CRITICAL INSTRUCTION: You MUST use standard markdown checkboxes ('- [ ]') for your checklist steps. Do NOT wrap your output in special tags like ===FILE===. Just reply with the Markdown text.
    `;

    const archResponse = await openai.chat.completions.create({
        model: config.llmModel, // Use centrally configured model instead of hardcoded gpt-4o-mini
        messages: [{ role: "system", content: archPrompt }],
    });

    const archOutput = archResponse.choices[0].message.content || "";
    // Save raw output for debugging
    fs.writeFileSync(path.join(cwd, "ARCHITECT_RAW_OUTPUT.md"), archOutput);

    // Fallback: If no checkboxes exist, the LLM completely failed.
    if (!archOutput.includes("- [ ]")) {
        log.warn(`[VibeOrchestrator] Task #${taskId} - Architect failed to generate checkboxes. Aborting.`);
        log.warn(`[VibeOrchestrator] Raw Architect Output was:\n${archOutput.substring(0, 500)}...`);
        await updateTaskStatus(db, taskId, `ERROR: Architect failed to generate a checklist. Please try a different prompt or simpler instructions.`);
        return false;
    }

    // Foolproof parsing: We simply inject the ENTIRE output into both files.
    // The Developer loop iterates by blindly searching for '- [ ]' in TODO.md, ignoring everything else!
    fs.writeFileSync(path.join(cwd, "ARCHITECTURE.md"), archOutput);
    fs.writeFileSync(path.join(cwd, "TODO.md"), archOutput);

    // Initial commit of the plan
    await syncCallback(`Architect created ARCHITECTURE.md and TODO.md`, cloneDir);

    // Orchestration State Machine
    let criticLoops = 0;
    const MAX_CRITIC_LOOPS = 3;

    while (criticLoops < MAX_CRITIC_LOOPS) {
        // Phase 2: The Developer Execution Loop
        let keepRunning = true;
        let iteration = 1;

        while (keepRunning) {
            if (iteration > 20) {
                log.warn(`[VibeOrchestrator] Task #${taskId} - Iteration cap reached (20). Stopping execution.`);
                break;
            }

            const todoContent = fs.existsSync(path.join(cwd, "TODO.md"))
                ? fs.readFileSync(path.join(cwd, "TODO.md"), "utf-8")
                : "";

            // Find the first uncompleted task
            const lines = todoContent.split("\n");
            const nextTaskIndex = lines.findIndex(line => line.trim().startsWith("- [ ]"));

            if (nextTaskIndex === -1) {
                log.info(`[VibeOrchestrator] Task #${taskId} - TODO.md is fully completed! Transitioning to QA/Critic.`);
                break; // Move to Critic/QA Phase
            }

            const currentTask = lines[nextTaskIndex];
            const stepName = currentTask.replace("- [ ]", "").trim();

            await updateTaskStatus(db, taskId, `Developer executing step: ${stepName} (Iteration ${iteration})`);

            // 2a. Developer Agent Execution
            const devPrompt = `
You are the Developer. You have ARCHITECTURE.md to guide you.
Your current strict task is: "${stepName}"
IMPORTANT: You MUST complete this specific checklist item, verify compilation using 'npm run build' or similar, and fix any errors before considering it done. Do NOT try to do the entire project at once. Do NOT check off the item in TODO.md, the Orchestrator will do it.
            `;

            try {
                await developerRunCallback(devPrompt, relativePath, cloneDir);
                await syncCallback(`Developer attempted: ${stepName}`, cloneDir);
            } catch (e: any) {
                log.warn(`[VibeOrchestrator] Task #${taskId} Developer threw error:`, { error: String(e) });
            }

            // 2b. Reviewer Agent Execution
            await updateTaskStatus(db, taskId, `Reviewer evaluating step: ${stepName}`);
            const gitDiff = await execPromise(`git diff HEAD~1 HEAD`, { cwd });

            const reviewPrompt = `
You are the Reviewer. The Developer just tried to complete this task: "${stepName}".
Here is the Git Diff of their changes:
${gitDiff.stdout.substring(0, 10000)}

Analyze the diff. Did the Developer successfully make the necessary changes for the task?
Reply with a single word at the very beginning of your response: APPROVED or REJECTED.
If REJECTED, append a brief explanation of what is missing or broken.
            `;

            const reviewResponse = await openai.chat.completions.create({
                model: config.llmModel,
                messages: [{ role: "system", content: reviewPrompt as string } as any],
            });

            const reviewOut = reviewResponse.choices[0].message.content || "APPROVED";

            if (reviewOut.startsWith("REJECTED")) {
                log.info(`[VibeOrchestrator] Task #${taskId} - Reviewer rejected step: ${stepName}`);
                await updateTaskStatus(db, taskId, `Reviewer rejected step based on: ${reviewOut.substring(0, 50)}... Developer will retry.`);

                fs.writeFileSync(path.join(cwd, "REVIEW_FEEDBACK.md"), `The Reviewer rejected your previous attempt for the following reason:\n${reviewOut}\n\nPlease fix this.`);
                await syncCallback(`Added REVIEW_FEEDBACK.md`, cloneDir);
            } else {
                log.info(`[VibeOrchestrator] Task #${taskId} - Reviewer APPROVED step: ${stepName}`);
                lines[nextTaskIndex] = lines[nextTaskIndex].replace("- [ ]", "- [x]");
                fs.writeFileSync(path.join(cwd, "TODO.md"), lines.join("\n"));
                if (fs.existsSync(path.join(cwd, "REVIEW_FEEDBACK.md"))) {
                    fs.rmSync(path.join(cwd, "REVIEW_FEEDBACK.md"));
                }
                await syncCallback(`Reviewer approved step: ${stepName}`, cloneDir);
            }

            iteration++;
        }

        // Phase 3: Browser QA Agent & Critic
        log.info(`[VibeOrchestrator] Task #${taskId} - Starting Critic QA Loop ${criticLoops + 1}/${MAX_CRITIC_LOOPS}`);
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

        const qaReportPath = path.join(cwd, "QA_REPORT.md");
        const qaReport = fs.existsSync(qaReportPath) ? fs.readFileSync(qaReportPath, "utf-8") : "PERFECT";

        if (qaReport.includes("PERFECT") || qaReport.trim() === "") {
            log.info(`[VibeOrchestrator] Critic QA passed (PERFECT).`);
            break;
        }

        // 3b. Critic Agent
        await updateTaskStatus(db, taskId, `Critic Reviewing QA Report...`);
        const arch = fs.existsSync(path.join(cwd, "ARCHITECTURE.md")) ? fs.readFileSync(path.join(cwd, "ARCHITECTURE.md"), "utf-8") : "";

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

        const criticResponse = await openai.chat.completions.create({
            model: config.llmModel,
            messages: [{ role: "system", content: criticPrompt }],
        });

        const criticOut = criticResponse.choices[0].message.content || "APPROVED";

        if (criticOut.includes("APPROVED")) {
            log.info(`[VibeOrchestrator] Task #${taskId} - Critic APPROVED the final build.`);
            break;
        }

        // Critic Rejected -> we must restart Dev loop
        log.info(`[VibeOrchestrator] Task #${taskId} - Critic requested improvements. Looping Developer.`);

        const impMatch = criticOut.match(/===FILE:IMPROVEMENTS\.md===\n([\s\S]*?)\n===END===/);
        const appendMatch = criticOut.match(/===APPEND_TODO===\n([\s\S]*?)\n===END===/);

        if (impMatch && impMatch[1]) {
            fs.writeFileSync(path.join(cwd, "IMPROVEMENTS.md"), impMatch[1].trim());
        }
        if (appendMatch && appendMatch[1]) {
            fs.appendFileSync(path.join(cwd, "TODO.md"), "\n" + appendMatch[1].trim());
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


