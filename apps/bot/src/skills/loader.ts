import { readdir, readFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { log } from "../utils/logger.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Skill {
    name: string;
    description: string;
    instructions: string;
    triggers: string[];
    filename: string;
}

// ── Skill Store ──────────────────────────────────────────────────────────────

/**
 * In-memory store for skills. Holds full content but only exposes
 * a lightweight index to the system prompt. Full content is loaded
 * on-demand via the `load_skill` tool.
 */
export class SkillStore {
    private skills = new Map<string, Skill>();

    constructor(skills: Skill[]) {
        for (const skill of skills) {
            this.skills.set(skill.name.toLowerCase(), skill);
        }
    }

    /** Get a skill by name (case-insensitive, supports partial match). */
    get(name: string): Skill | undefined {
        const key = name.toLowerCase().trim();

        // Exact match first
        if (this.skills.has(key)) {
            return this.skills.get(key);
        }

        // Partial match — find the first skill whose name contains the query
        for (const [skillKey, skill] of this.skills) {
            if (skillKey.includes(key) || key.includes(skillKey)) {
                return skill;
            }
        }

        return undefined;
    }

    /** List all skill names with descriptions (lightweight). */
    list(): Array<{ name: string; description: string; triggers: string[] }> {
        return Array.from(this.skills.values()).map((s) => ({
            name: s.name,
            description: s.description,
            triggers: s.triggers,
        }));
    }

    /** Total number of skills loaded. */
    get size(): number {
        return this.skills.size;
    }
}

// ── Loader ───────────────────────────────────────────────────────────────────

/**
 * Load all skill files from the /skills directory.
 * Each .md file defines a skill with YAML-like frontmatter.
 *
 * Format:
 * ```
 * ---
 * name: Calculator
 * description: Perform math calculations
 * triggers: calculate, math, compute
 * ---
 * You can perform mathematical calculations...
 * ```
 */
export async function loadSkills(skillsDir: string): Promise<Skill[]> {
    const skills: Skill[] = [];

    try {
        const files = await readdir(skillsDir);
        const mdFiles = files.filter((f) => f.endsWith(".md"));

        for (const file of mdFiles) {
            try {
                const content = await readFile(join(skillsDir, file), "utf-8");
                const skill = parseSkillFile(content, file);
                if (skill) {
                    skills.push(skill);
                    log.info("Loaded skill", { name: skill.name, triggers: skill.triggers });
                }
            } catch (error) {
                log.warn("Failed to load skill file", {
                    file,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
    } catch {
        // Skills directory doesn't exist — that's fine
        log.info("No skills directory found, skipping skill loading", { dir: skillsDir });
    }

    return skills;
}

/**
 * Parse a skill markdown file with frontmatter.
 */
function parseSkillFile(content: string, filename: string): Skill | null {
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);

    if (!frontmatterMatch) {
        // No frontmatter — treat entire file as instructions
        return {
            name: basename(filename, ".md"),
            description: `Skill from ${filename}`,
            instructions: content.trim(),
            triggers: [],
            filename,
        };
    }

    const frontmatter = frontmatterMatch[1] ?? "";
    const body = frontmatterMatch[2] ?? "";

    // Simple YAML-like parsing
    const meta: Record<string, string> = {};
    for (const line of frontmatter.split("\n")) {
        const colonIndex = line.indexOf(":");
        if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim().toLowerCase();
            const value = line.substring(colonIndex + 1).trim();
            meta[key] = value;
        }
    }

    const name = meta["name"] || basename(filename, ".md");
    const description = meta["description"] || `Skill: ${name}`;
    const triggers = (meta["triggers"] || "")
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

    return {
        name,
        description,
        instructions: body.trim(),
        triggers,
        filename,
    };
}

/**
 * Generate a lightweight skill INDEX for the system prompt.
 * Only includes name, description, and triggers — NOT full instructions.
 * The LLM uses the `load_skill` tool to fetch full content when needed.
 */
export function skillsIndexToPrompt(store: SkillStore): string {
    const skills = store.list();
    if (skills.length === 0) return "";

    let prompt = "\n\n--- Available Skills ---\n";
    prompt += "You have specialized skills available. To use a skill, call the `load_skill` tool with the skill name.\n";
    prompt += "Only load a skill when the user's request matches its description/triggers.\n\n";

    for (let i = 0; i < skills.length; i++) {
        const skill = skills[i]!;
        prompt += `${i + 1}. **${skill.name}**: ${skill.description}\n`;
        if (skill.triggers.length > 0) {
            prompt += `   Triggers: ${skill.triggers.join(", ")}\n`;
        }
    }

    prompt += "\n--- End Available Skills ---\n";
    return prompt;
}

/**
 * @deprecated Use skillsIndexToPrompt() + load_skill tool instead.
 * Format loaded skills into a system prompt section (includes FULL content).
 */
export function skillsToPrompt(skills: Skill[]): string {
    if (skills.length === 0) return "";

    let prompt = "\n\n--- Available Skills ---\n";
    prompt += "You have the following specialized skills:\n\n";

    for (const skill of skills) {
        prompt += `### ${skill.name}\n`;
        prompt += `${skill.description}\n`;
        if (skill.triggers.length > 0) {
            prompt += `Triggers: ${skill.triggers.join(", ")}\n`;
        }
        prompt += `\n${skill.instructions}\n\n`;
    }

    prompt += "--- End Skills ---\n";
    return prompt;
}
