---
name: Skill Creator
description: Creates new skills for the Gravity Claw bot. Use when the user asks to add a new capability, skill, or behavior to the bot.
triggers: create skill, new skill, add skill, add capability, build skill
---
# Antigravity Skill Creator

## When to use this skill
- User asks to create a new skill/capability for Gravity Claw
- User wants to add a new behavior pattern to the bot
- User provides a prompt/instructions that should become a reusable skill

## Skill Structure
Every skill is a markdown file in the `skills/` directory:
- **Path:** `skills/<skill-name>.md`
- For complex skills with scripts/examples, use a folder: `skills/<skill-name>/SKILL.md`

## YAML Frontmatter (Required)
```yaml
---
name: [Human-readable name]
description: [3rd-person description of what the skill does and when to use it]
triggers: [comma-separated keywords that activate this skill]
---
```

### Rules:
- `name`: Short, descriptive. Max 64 chars.
- `description`: Written in **third person**. Include specific triggers/keywords. Max 1024 chars.
- `triggers`: Lowercase keywords the bot uses to match user intent to this skill.

## Writing the Skill Body

### Principles:
- **Be concise** — the bot is smart, don't explain basics
- **Be specific** — focus on the unique logic of this skill
- **Use numbered lists** for step-by-step workflows
- **Use bullet points** for flexible heuristics
- **Use code blocks** for templates or exact commands
- **Keep under 500 lines** — link to secondary files if needed

### Structure:
1. Brief description of what the skill does
2. Step-by-step instructions or workflow
3. Rules/constraints the bot must follow
4. Examples if helpful

## Checklist for Creating a Skill
- [ ] Identify the core capability
- [ ] Define clear triggers (when should this skill activate?)
- [ ] Write concise, actionable instructions
- [ ] Add YAML frontmatter with name, description, triggers
- [ ] Save to `skills/<name>.md`
- [ ] Test by messaging the bot with a trigger phrase

## Example: Minimal Skill
```markdown
---
name: Weather Reporter
description: Provides weather forecasts with outfit suggestions. Use when user asks about weather or what to wear.
triggers: weather, forecast, temperature, what to wear
---
When reporting weather:

1. Use the get_weather tool to fetch current conditions
2. Include temperature, conditions, and humidity
3. Add a practical outfit suggestion based on the weather
4. If the user mentions a specific city, use that location
```

## Adapting External Prompts
When the user provides a prompt from another system (e.g., Claude, GPT, Cursor):
1. Extract the core behavior/logic
2. Remove references to other systems (claude.md, gemini.md, .cursor/, etc.)
3. Map to Gravity Claw equivalents:
   - File operations → `create_antigravity_task`
   - Memory/state → `memory_save` / `memory_recall`
   - Web research → `web_search` / `read_url`
   - Deployment → Cloud Worker auto-deploys to Netlify
4. Write as a Gravity Claw skill following the format above
5. Save to `skills/` directory
