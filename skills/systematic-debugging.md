---
name: Systematic Debugging
description: 4-phase root cause debugging process. Prevents random fixes and symptom patching. Use when encountering bugs, test failures, unexpected behavior, or build errors in any project.
triggers: debug, bug, error, fix, broken, failing, crash, issue, not working, test failure, exception
---
# Systematic Debugging

Random fixes waste time and create new bugs. ALWAYS find root cause before attempting fixes.

## THE IRON LAW

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you CANNOT propose fixes.

## When to Apply
- Test failures or unexpected behavior
- Build or deployment errors
- Performance problems
- Integration issues
- **Especially** when under pressure or when "just one quick fix" seems obvious

## Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read Error Messages Carefully**
   - Don't skip past errors or warnings
   - Read stack traces completely
   - Note line numbers, file paths, error codes

2. **Reproduce Consistently**
   - Can you trigger it reliably?
   - What are the exact steps?
   - If not reproducible → gather more data, don't guess

3. **Check Recent Changes**
   - Git diff, recent commits
   - New dependencies, config changes
   - Environmental differences

4. **Trace Data Flow**
   - Where does the bad value originate?
   - What called this with the bad value?
   - Keep tracing up until you find the source
   - Fix at source, not at symptom

5. **Multi-Component Systems — Add Diagnostics**
   ```
   For EACH component boundary:
     - Log what data enters the component
     - Log what data exits the component
     - Verify environment/config propagation
   Run once → analyze evidence → identify failing component
   ```

## Phase 2: Pattern Analysis

1. **Find Working Examples** — locate similar working code in the same codebase
2. **Compare Against References** — read reference implementations COMPLETELY, don't skim
3. **Identify Differences** — list every difference, don't assume "that can't matter"
4. **Understand Dependencies** — what settings, config, or environment does it need?

## Phase 3: Hypothesis and Testing

1. **Form Single Hypothesis** — "I think X is the root cause because Y"
2. **Test Minimally** — smallest possible change, one variable at a time
3. **Verify** — did it work? Yes → Phase 4. No → form NEW hypothesis. Don't stack fixes.
4. **When You Don't Know** — say "I don't understand X". Research more.

## Phase 4: Implementation

1. **Fix at Root Cause** — not at symptom
2. **Defense in Depth** — add validation/guards at key boundaries
3. **Verify Fix** — run original failing scenario, confirm it passes
4. **Check for Regressions** — run full test suite, not just the fixed test

## Red Flags — STOP and Follow Process

- About to change code without understanding WHY it's broken
- Trying a second fix when the first didn't work (without new investigation)
- "Let me just try..." without a clear hypothesis
- Changing multiple things at once
- Fixing a symptom instead of a cause

## For `create_antigravity_task` Prompts

When creating a bug-fix task, include:
```
DEBUGGING PROTOCOL:
1. Reproduce the issue first
2. Investigate root cause (check error logs, trace data flow)
3. Form hypothesis and test minimally
4. Fix at root cause, not symptom
5. Verify fix + run full test suite
6. Do NOT claim "fixed" without running verification
```
