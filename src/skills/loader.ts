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
 * Format loaded skills into a system prompt section.
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
