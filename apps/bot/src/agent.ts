import { chat, toolsToOpenAIFormat } from "./llm.js";
import { ToolRegistry } from "./tools/index.js";
import { config } from "./config.js";
import { log } from "./utils/logger.js";
import type { ChatMessage } from "./llm.js";
import type { MemoryManager } from "./memory/index.js";

const SYSTEM_PROMPT = `You are Gravity Claw — a personal AI assistant and System Pilot running for your owner.

You are direct, helpful, and concise. You have access to tools and should use them when appropriate.

=== IDENTITY & MEMORY ===
- Answer questions naturally and conversationally
- Use tools when you need real data (time, weather, web search)
- Use memory_recall to search your memory when the user references past conversations
- Use memory_save to store important facts (name, preferences, projects, decisions, people, technical setups)
- You run on Telegram and Discord — format messages appropriately (Markdown supported)
- You are not a generic chatbot. You are a personal agent that belongs to your owner.

=== B.L.A.S.T. PROTOCOL (For Coding/Building Tasks) ===

When the user asks you to BUILD, CODE, or CREATE something, follow these 5 phases IN ORDER.
Do NOT skip phases. Do NOT immediately create a task without understanding what to build.

--- PHASE 1: B — BLUEPRINT (Understand Before Building) ---
Before writing ANY task, ask the user these discovery questions (skip ones already answered):
1. **Goal:** What is the single most important outcome? What should this app/feature DO?
2. **Tech & Integrations:** Any specific tech stack, APIs, or services needed? Any keys/credentials ready?
3. **Data:** Where does the data come from? What does the input/output look like?
4. **Delivery:** Where should the result live? (New repo, existing repo, specific URL?)
5. **Rules:** Any specific constraints? ("No auth", "Mobile-first", "Must use library X", etc.)

After getting answers, save the project plan via memory_save for future reference.

--- PHASE 2: L — LINK (Research) ---
Use web_search and read_url to research:
- Best libraries/frameworks for this task
- Design references if it's a UI project
- Technical patterns and best practices
- Similar open-source projects for inspiration

Share key findings with the user before proceeding.

--- PHASE 3: A — ARCHITECT (Build the Spec, Then Delegate) ---
Write a COMPREHENSIVE, DETAILED prompt for Codex that includes:
- Exact feature requirements from the Blueprint
- Tech stack decisions from the Research
- Design specifications (colors, layout, UX patterns)
- What to INCLUDE and what to EXCLUDE
- Verification steps (what should work when done)

Then call create_antigravity_task with this detailed prompt.
The Cloud Worker + Codex CLI handles the actual coding autonomously.

--- PHASE 4: S — STYLIZE (Review & Refine) ---
After Codex delivers and the live preview is available:
- Ask the user for feedback on the result
- Create follow-up tasks for polish, bug fixes, or design improvements
- Each follow-up uses create_antigravity_task with specific, targeted changes

--- PHASE 5: T — TRIGGER (Deployment Confirmation) ---
- Netlify deployment happens automatically after each task.
- The live deployment URL is ALWAYS AND ONLY: https://gravity-claw-dev.netlify.app
- ALWAYS include this exact URL in your confirmation message. NEVER invent or guess a domain like "gravity-coffee.netlify.app".
- Confirm with the user that the live version works as expected
- Save the final project state to memory for future reference

=== CRITICAL RULES ===
- You MUST use create_antigravity_task for ALL coding work. You are the Product Manager, not the developer.
- NEVER tell the user "Task created" unless you have ACTUALLY invoked the tool and received confirmation.
- NEVER tell the user to run localhost, npm run dev, or /gravity_sync. The Cloud Worker handles everything automatically.
- Use repo URL "github.com/Ma3ras/gravity-claw.git" ONLY for changes to the bot itself. For new projects, create/use the appropriate repo.
- For QUICK follow-up tasks (small fixes, tweaks): skip Phases 1-2, go straight to Phase 3 with a focused prompt.
- For LARGE new projects: follow ALL 5 phases. The extra 2 minutes of planning saves hours of rework.`;

/**
 * Run the agentic ReAct loop for a single user message.
 *
 * Flow:
 * 1. Log the user message to memory
 * 2. Recall relevant memories and inject into context
 * 3. Build messages array with system prompt + memories + user message
 * 4. Call LLM with available tools
 * 5. If LLM wants to use tools → execute them → append results → call LLM again
 * 6. Repeat until LLM gives a text reply or max iterations hit
 * 7. Log the assistant reply and extract facts in background
 */
export async function runAgent(
    userMessage: string,
    toolRegistry: ToolRegistry,
    memory?: MemoryManager,
    sessionId?: string,
    skillsPrompt?: string,
    skipLogging = false
): Promise<string> {
    const tools = toolsToOpenAIFormat(toolRegistry.getAll());
    const sid = sessionId ?? "default";

    // ── Step 1: Log user message ─────────────────────────────────────
    let userMsgId: number | undefined;
    if (memory && !skipLogging) {
        userMsgId = await memory.logMessage("user", userMessage, sid);

        // Periodic memory evolution (every ~50 messages)
        if (userMsgId && userMsgId % 50 === 0) {
            void memory.evolve();
        }
    }

    // ── Step 2: Recall relevant memories ─────────────────────────────
    let memoryContext = "";
    if (memory) {
        try {
            const memories = await memory.recall(userMessage, 5);
            if (memories.length > 0) {
                memoryContext =
                    "\n\n--- Relevant Memories ---\n" +
                    memories
                        .map((m) => {
                            const label = m.type === "fact" ? `[Fact/${m.category}]` : `[Message]`;
                            return `${label} ${m.content}`;
                        })
                        .join("\n") +
                    "\n--- End Memories ---\n";
            }
        } catch (error) {
            log.debug("Memory recall failed", {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    // ── Step 3: Build message array ──────────────────────────────────
    const systemContent = SYSTEM_PROMPT + (skillsPrompt ?? "") + memoryContext;

    const messages: ChatMessage[] = [
        { role: "system", content: systemContent },
    ];

    // Inject recent conversation buffer (with auto-summarization for long conversations)
    if (memory) {
        const totalMessages = await memory.getSessionMessageCount(sid);
        const RECENT_BUFFER_SIZE = 10;
        const SUMMARIZE_THRESHOLD = 20;

        if (totalMessages > SUMMARIZE_THRESHOLD) {
            // Long conversation — summarize older messages, keep recent ones verbatim
            let summary = await memory.getSessionSummary(sid);

            if (!summary) {
                // Generate summary of older messages
                const olderMessages = await memory.getOlderMessages(sid, totalMessages - RECENT_BUFFER_SIZE);
                const conversationText = olderMessages
                    .map((m) => `${m.role}: ${m.content}`)
                    .join("\n");

                try {
                    const summaryResponse = await chat([
                        {
                            role: "system",
                            content: "Summarize this conversation into a compact paragraph. Focus on key facts, decisions, and context. Be concise.",
                        },
                        { role: "user", content: conversationText },
                    ]);
                    summary = summaryResponse.content ?? "";
                    if (summary) {
                        await memory.saveSessionSummary(sid, summary);
                        log.info("Auto-summarized conversation buffer", {
                            olderMessages: olderMessages.length,
                            summaryLength: summary.length,
                        });
                    }
                } catch (error) {
                    log.debug("Failed to summarize conversation", {
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            }

            // Inject summary as context
            if (summary) {
                messages.push({
                    role: "user",
                    content: `[Earlier conversation summary: ${summary}]`,
                });
                messages.push({
                    role: "assistant",
                    content: "Got it, I have context from our earlier conversation.",
                });
            }

            // Add recent messages verbatim
            const recentMessages = await memory.getRecentMessages(sid, RECENT_BUFFER_SIZE);
            for (const msg of recentMessages) {
                messages.push({ role: msg.role, content: msg.content });
            }
        } else {
            // Short conversation — include all messages
            const recentMessages = await memory.getRecentMessages(sid, SUMMARIZE_THRESHOLD);
            for (const msg of recentMessages) {
                messages.push({ role: msg.role, content: msg.content });
            }
        }
    }

    // Add current user message
    messages.push({ role: "user", content: userMessage });

    let iterations = 0;

    while (iterations < config.maxIterations) {
        iterations++;
        log.debug(`Agent loop iteration ${iterations}/${config.maxIterations}`);

        const response = await chat(messages, tools);

        // If the LLM didn't request any tool calls, we're done
        if (response.toolCalls.length === 0) {
            const reply = response.content ?? "(No response generated)";

            // --- STRICT HALLUCINATION GUARD ---
            // If the LLM claims to have created a task but we know it didn't call the tool
            // (The actual tool always returns "Ticket #XYZ successfully created", which the LLM would see in the loop)
            const isProbablyHallucinatingTask = (
                (/Task\s*#\d+/i.test(reply) || /Aufgabe\s*#\d+/i.test(reply) || /erstellt/i.test(reply) || /Antigravity/i.test(reply)) &&
                !messages.some(m => m.role === "tool" && typeof m.content === "string" && m.content.includes("Ticket #")) &&
                (/test_projekt/i.test(userMessage) || /design/i.test(userMessage) || /repo/i.test(userMessage) || /füge/i.test(userMessage) || /add/i.test(userMessage))
            );

            if (isProbablyHallucinatingTask) {
                log.warn("Intercepted hallucinated task confirmation. Forcing LLM to retry with tool call.");
                messages.push({ role: "assistant", content: reply });
                messages.push({
                    role: "system",
                    content: "SYSTEM ERROR: You just told the user you created a task, but YOU DID NOT CALL THE `create_antigravity_task` TOOL! You hallucinated the success message. You must actually invoke the tool to create the task. Try again and USE THE TOOL."
                });
                continue; // Force another iteration
            }
            // --- END GUARD ---

            log.info("Agent completed", { iterations, replyLength: reply.length });

            // ── Step 7: Log reply + background fact extraction ───────
            if (memory) {
                await memory.logMessage("assistant", reply, sid);

                // Extract facts in background (don't block the reply)
                extractFactsBackground(userMessage, reply, memory, userMsgId);
            }

            return reply;
        }

        // LLM wants to use tools — add the assistant message with tool calls
        messages.push(response.raw);

        // Execute each tool call and add results
        for (const toolCall of response.toolCalls) {
            const toolName = toolCall.function.name;
            let toolInput: Record<string, unknown> = {};

            try {
                toolInput = JSON.parse(toolCall.function.arguments || "{}");
            } catch {
                log.warn("Failed to parse tool arguments", {
                    tool: toolName,
                    raw: toolCall.function.arguments,
                });
            }

            log.info(`Executing tool: ${toolName}`, { input: toolInput });
            const result = await toolRegistry.execute(toolName, toolInput);
            log.debug(`Tool result: ${toolName}`, { result: result.substring(0, 200) });

            messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: result,
            });
        }
    }

    // Safety limit reached
    log.warn("Agent hit max iterations", { maxIterations: config.maxIterations });
    return "⚠️ I hit my iteration limit while processing your request. This is a safety measure. Please try a simpler request.";
}

/**
 * Background fact extraction — runs after the reply is sent.
 * Uses the LLM to identify important facts from the exchange, then saves them.
 */
function extractFactsBackground(
    userMessage: string,
    assistantReply: string,
    memory: MemoryManager,
    sourceMessageId?: number
): void {
    // Fire-and-forget — don't block the reply
    void (async () => {
        try {
            const extractionPrompt = `Analyze this conversation exchange and extract any important facts worth remembering about the user.

User said: "${userMessage}"
Assistant replied: "${assistantReply}"

Extract facts as a JSON array. Each fact should be:
- A clear, standalone statement
- About the USER (not about you the assistant)
- Something worth remembering long-term (name, preferences, projects, decisions, personal details)

If there are no important facts worth saving, return an empty array.

Respond ONLY with a JSON array like: [{"fact": "...", "category": "preference|person|project|decision|personal|technical|general"}]`;

            const response = await chat([
                { role: "system", content: "You are a fact extraction system. Respond only with valid JSON." },
                { role: "user", content: extractionPrompt },
            ]);

            const content = response.content ?? "[]";

            // Parse the JSON response
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (!jsonMatch) return;

            const facts = JSON.parse(jsonMatch[0]) as Array<{
                fact: string;
                category: string;
            }>;

            for (const { fact, category } of facts) {
                if (fact && fact.length > 3) {
                    await memory.saveFact(fact, category || "general", sourceMessageId);
                }
            }

            if (facts.length > 0) {
                log.info(`Extracted ${facts.length} fact(s) from exchange`);
            }
        } catch (error) {
            log.debug("Fact extraction failed (non-critical)", {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    })();
}
