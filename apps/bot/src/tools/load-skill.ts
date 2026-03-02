import type { Tool } from "./index.js";
import type { SkillStore } from "../skills/loader.js";

/**
 * Create the load_skill tool.
 * Allows the LLM to fetch full skill instructions on-demand.
 */
export function createLoadSkillTool(skillStore: SkillStore): Tool {
    return {
        name: "load_skill",

        description:
            "Load the full instructions of a skill by name. " +
            "Use this when you need specialized knowledge to handle the user's request. " +
            "Check the Available Skills section in your system prompt for what's available. " +
            "Only load skills relevant to the current request.",

        inputSchema: {
            type: "object",
            properties: {
                skill_name: {
                    type: "string",
                    description:
                        "Name of the skill to load (e.g., 'UI UX Pro Max'). " +
                        "Supports partial matching — 'ui ux' will match 'UI UX Pro Max'.",
                },
            },
            required: ["skill_name"],
        },

        async execute(input: Record<string, unknown>): Promise<string> {
            const skillName = input.skill_name as string;

            if (!skillName) {
                const available = skillStore.list().map((s) => s.name).join(", ");
                return JSON.stringify({
                    error: "Missing skill_name parameter.",
                    available_skills: available,
                });
            }

            const skill = skillStore.get(skillName);

            if (!skill) {
                const available = skillStore.list().map((s) => s.name).join(", ");
                return JSON.stringify({
                    error: `Skill "${skillName}" not found.`,
                    available_skills: available,
                });
            }

            // Return full instructions
            return `--- Skill: ${skill.name} ---\n${skill.description}\n\n${skill.instructions}\n--- End Skill: ${skill.name} ---`;
        },
    };
}
