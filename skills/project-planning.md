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
   - Use these 5 discovery pillars to guide your questions:
     1. **Goal:** What is the single most important outcome? What should this DO?
     2. **Tech & Integrations:** Any specific tech stack, APIs, or services?
     3. **Data:** Where does the data come from? What is the input/output?
     4. **Delivery:** New repo, existing repo, specific URL?
     5. **Rules:** Any constraints? ("No auth", "Mobile-first")
   
3. **Propose 2-3 Approaches**
   - Present options with trade-offs
   - Lead with your recommendation and reasoning
   - Let the user choose

4. **Present the Design**
   - Scale detail to complexity: short for simple, detailed for complex
   - Cover: architecture, components, data flow, tech stack
   - Ask after each section: "Does this look right?"
   - Be ready to revise

5. **Get Explicit Approval Before Proceeding**

### Anti-Pattern: "This Is Too Simple To Need A Design"
Every project goes through this process. "Simple" projects are where unexamined assumptions cause the most wasted work.

### Key Principles
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
