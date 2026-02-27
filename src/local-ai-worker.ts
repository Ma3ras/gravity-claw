import OpenAI from "openai";
import { config } from "./config.js";
import { log } from "./utils/logger.js";
import { initDatabase } from "./memory/db.js";
import { ToolRegistry } from "./tools/index.js";
import { createLocalFsTools } from "./tools/local-fs.js";
import { toolsToOpenAIFormat } from "./llm.js";

const MAX_ITERATIONS = config.maxIterations;

// Initialize OpenAI client specifically pointing to local Ollama
const localLlm = new OpenAI({
    baseURL: config.ollamaBaseUrl,
    apiKey: "ollama", // Required by SDK, but ignored by Ollama
});

async function runLocalAgent(prompt: string, projectPath: string): Promise<void> {
    const toolRegistry = new ToolRegistry();
    for (const tool of createLocalFsTools()) {
        toolRegistry.register(tool);
    }

    const tools = toolsToOpenAIFormat(toolRegistry.getAll());
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
            role: "system",
            content: `You are Antigravity (Local Worker) — an autonomous, senior full-stack AI developer.
You are running locally on the user's computer via Ollama. 
You have been assigned a task inside the project: ${projectPath}

Your goal is to complete the user's instruction fully and correctly.
You have tools to read files, list directories, write files, and run commands.
Use these tools to explore the codebase, understand where changes need to be made, and then apply them.

RULES:
1. THINK before you code. Read the relevant files first.
2. DO NOT make assumptions about variable names or imports. Read the code.
3. When using 'local_write_file', you must provide the ENTIRE new file content, do not output just a diff.
4. When you have completed the task and verified it, reply with a final message explaining what you did. You do not need to ask the user for permission.`,
        },
        { role: "user", content: prompt }
    ];

    let iteration = 0;
    while (iteration < MAX_ITERATIONS) {
        iteration++;
        log.debug(`[LocalWorker] ReAct iteration: ${iteration}/${MAX_ITERATIONS}`);

        try {
            const response = await localLlm.chat.completions.create({
                model: config.localAiModel,
                messages,
                tools: tools.length > 0 ? tools : undefined,
                temperature: 0.2, // Low temperature for coding tasks
            });

            const msg = response.choices[0].message;
            messages.push(msg as OpenAI.Chat.ChatCompletionMessageParam);

            if (msg.tool_calls && msg.tool_calls.length > 0) {
                log.info(`[LocalWorker] Tool calls requested: ${msg.tool_calls.length}`);

                for (const call of msg.tool_calls) {
                    const toolName = call.function.name;
                    const toolArgs = JSON.parse(call.function.arguments);
                    log.info(`[LocalWorker] Executing tool: ${toolName}`);

                    const tool = toolRegistry.get(toolName);
                    if (!tool) {
                        messages.push({
                            role: "tool",
                            tool_call_id: call.id,
                            content: `Error: Tool '${toolName}' not found.`
                        });
                        continue;
                    }

                    try {
                        const result = await tool.execute(toolArgs);
                        messages.push({
                            role: "tool",
                            tool_call_id: call.id,
                            content: typeof result === 'string' ? result : JSON.stringify(result)
                        });
                    } catch (err) {
                        const errMsg = err instanceof Error ? err.message : String(err);
                        log.error(`[LocalWorker] Tool execution error`, { toolName, error: errMsg });
                        messages.push({
                            role: "tool",
                            tool_call_id: call.id,
                            content: `Tool Execution Error: ${errMsg}`
                        });
                    }
                }
                // Loop continues to let LLM process tool results
            } else if (msg.content) {
                log.info(`[LocalWorker] Task complete. Final reply: ${msg.content.substring(0, 100)}...`);
                return; // Finished
            } else {
                log.warn("[LocalWorker] LLM returned no content and no tool calls.");
                return;
            }
        } catch (error) {
            log.error("[LocalWorker] LLM Error", { error: error instanceof Error ? error.message : String(error) });
            return;
        }
    }

    log.warn("[LocalWorker] Max iterations reached without completing the task.");
}

async function startWorker() {
    log.info("Starting Local AI Worker (Ollama) node...");
    const db = initDatabase();
    // Poll every 10 seconds
    const intervalMs = 10000;

    setInterval(async () => {
        try {
            const result = await db.execute(`
                SELECT id, project_path, prompt 
                FROM antigravity_tasks 
                WHERE status = 'pending' 
                ORDER BY created_at ASC 
                LIMIT 1
            `);

            if (result.rows.length === 0) return;

            const row = result.rows[0];
            const id = Number(row.id);
            const projectPath = row.project_path as string;
            const prompt = row.prompt as string;

            log.info(`[LocalWorker] Picked up task #${id}`);

            // Mark as in-progress (using a dummy status so others don't pick it up, although we're the only worker)
            await db.execute({
                sql: `UPDATE antigravity_tasks SET status = 'in_progress' WHERE id = ?`,
                args: [id]
            });

            // Execute the agent Loop
            await runLocalAgent(prompt, projectPath);

            // Mark as completed
            await db.execute({
                sql: `UPDATE antigravity_tasks SET status = 'completed' WHERE id = ?`,
                args: [id]
            });

            log.info(`[LocalWorker] Successfully completed task #${id}`);

        } catch (error) {
            log.error("[LocalWorker] Polling error", { error: error instanceof Error ? error.message : String(error) });
        }
    }, intervalMs);
}

startWorker().catch(console.error);
