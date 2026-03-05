---
name: Project Planning
description: Structured brainstorming and implementation planning for new projects. Guides the design process from idea to actionable task list. Use before building anything new — ensures proper understanding, exploration of alternatives, and bite-sized implementation steps.
triggers: plan, project, new app, new feature, brainstorm, design, architecture, spec, requirements, idea, build something
---
# Project Planning — From Idea to Implementation

## When to Apply
- User wants to build something new (app, feature, website)
- Complex task that needs planning before coding
- Unclear requirements that need refinement
- Any project where jumping straight into code would waste time

## Phase 1: Brainstorming (Understand Before Building)

### The Process

1. **Explore Context**
   - Check existing project files, docs, recent commits
   - Understand what already exists

2. **Discover Requirements (The BLAST Checklist)**
   - Ask clarifying questions — **ONE AT A TIME**. Never overwhelm the user.
   - You MUST cover ALL 5 discovery pillars before moving on. Ask at minimum ONE question per pillar:
     1. **Goal:** What is the single most important outcome? What should this DO? What features are must-have vs nice-to-have?
     2. **Tech & Integrations:** Any specific tech stack, APIs, or services? Framework preferences? What about styling (Tailwind, CSS Modules, shadcn)?
     3. **Data:** Where does the data come from? What is the input/output? Any database, API, or local storage?
     4. **Delivery:** New repo or existing repo? Repo name? Deploy target (Netlify, Vercel, static)?
     5. **Rules:** Any constraints? ("No auth", "Mobile-first", "Must work offline", performance targets)

   🚫 **HARD STOP**: You are FORBIDDEN from calling `create_antigravity_task` until you have asked AND received answers for ALL 5 pillars. If the user says "just do it" or gives a short answer, dig deeper with follow-up questions for each pillar.

   ✅ **Good Example** (Chess game):
   - Q1 (Goal): "Welche Features willst du? Nur lokal 2-Spieler oder auch AI-Gegner?"
   - Q2 (Goal follow-up): "Sollen Spezialzüge wie Rochade, En Passant, Bauernumwandlung alle dabei sein?"
   - Q3 (Tech): "React + Vite oder Next.js? Tailwind oder CSS Modules? Soll ich shadcn/ui für die Controls nutzen?"
   - Q4 (Data): "Soll der Spielstand lokal gespeichert werden (localStorage) oder ist es rein sessionbasiert?"
   - Q5 (Delivery): "Neues Repo? Wie soll es heißen? Deploy auf Netlify?"
   - Q6 (Rules): "Mobile-Support wichtig? Soll es offline funktionieren? Mindestgröße für Touch-Felder?"
   
   ❌ **Bad Example** (What NOT to do):
   - Q1: "Welche Features willst du?" → User: "C" → SOFORT Task erstellen ← VERBOTEN!

3. **Propose 2-3 Approaches**
   - Present options with trade-offs
   - Lead with your recommendation and reasoning
   - Let the user choose

4. **Present the Design**
   - Scale detail to complexity: short for simple, detailed for complex
   - Cover: architecture, components, data flow, tech stack
   - Include EXACT file paths for each component
   - Ask after each section: "Does this look right?"
   - Be ready to revise

5. **Get Explicit Approval Before Proceeding**
   - The user MUST say something like "ja", "passt", "mach das", "go", "start" before you create the task

### Anti-Pattern: "This Is Too Simple To Need A Design"
Every project goes through this process. "Simple" projects are where unexamined assumptions cause the most wasted work. A Chess game seems "simple" but has 50+ edge cases (castling, en passant, promotion, stalemate, draw by repetition, etc.).

### Key Principles
- **Minimum 5 questions** — one per discovery pillar, more for complex projects
- **One question at a time** — don't overwhelm
- **YAGNI ruthlessly** — remove unnecessary features
- **Explore alternatives** — always 2-3 approaches before settling
- **Incremental validation** — present design section by section

## Phase 2: Writing the Plan

Once the design is approved, break it into bite-sized tasks.

### Task Granularity
Each task should be completable in **2-5 minutes**:
- Write the file/component → task
- Wire it up to the main app → task
- Add error handling → task
- Test it → task
- Each task has its own commit

### Task Structure Template

```
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.ext`
- Modify: `exact/path/to/existing.ext`

**What to do:**
[Specific, unambiguous instructions with all necessary code/config]

**Verification:**
[Exact command to run + expected output]

**Commit:** `feat: add [component name]`
```

### Plan Rules
- **Exact file paths** — no "add a file somewhere"
- **Complete code/config** — not "add validation" but the actual validation code
- **Exact commands** — `npm test`, `npx tsc --noEmit`, not "run the tests"
- **DRY** — don't repeat yourself across tasks
- **YAGNI** — don't add features nobody asked for
- **Verification per task** — each task must be independently verifiable

## Phase 3: Execution Handoff

After the plan is complete, create the `create_antigravity_task` prompt with:

```
IMPLEMENTATION PLAN:

Design: [Summary from Phase 1]
Tech Stack: [From brainstorm]

Task 1: [exact instructions]
Task 2: [exact instructions]
...

VERIFICATION (per task):
[Exact commands to run after each task]

FINAL VERIFICATION:
[Commands to verify the whole project works]
```

## For `create_antigravity_task` Prompts

When creating a new project task, follow this structure:
```
PROJECT: [Name]
GOAL: [One sentence]
ARCHITECTURE: [2-3 sentences]
TECH STACK: [Key technologies]

TASKS (in order):
1. [Task with exact files + instructions + verification]
2. [Task with exact files + instructions + verification]
...

VERIFICATION CHECKLIST:
- [ ] [Test command]
- [ ] [Build command]
- [ ] [Manual check]
```
