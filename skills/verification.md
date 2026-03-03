---
name: Verification Before Completion
description: Forces evidence-based completion claims. No saying "done" or "fixed" without running verification commands and showing output. Prevents false completion and trust erosion.
triggers: done, complete, finished, fixed, verify, check, test, working, ship, deploy, ready
---
# Verification Before Completion

Claiming work is complete without verification is dishonesty, not efficiency.

## THE IRON LAW

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command, you cannot claim it passes.

## The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = not verified
```

## What Requires Verification

| Claim | Requires | NOT Sufficient |
|-------|----------|----------------|
| Tests pass | Test output showing 0 failures | "should pass", previous run |
| Build succeeds | Build command exit 0 | "linter passes" |
| Bug fixed | Original symptom no longer occurs | "code changed" |
| Linter clean | Linter output: 0 errors | Partial check |
| Requirements met | Line-by-line checklist verified | "tests pass" |
| Agent completed | VCS diff shows actual changes | Agent says "success" |

## Red Flags — STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before running verification
- About to commit/push without verification
- Trusting agent success reports without checking
- Relying on partial verification
- "Just this once" thinking

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence ≠ evidence |
| "Just this once" | No exceptions |
| "Agent said success" | Verify independently |
| "Linter passed" | Linter ≠ compiler ≠ tests |

## For `create_antigravity_task` Prompts

Always include at the end of any task:
```
VERIFICATION (MANDATORY before claiming complete):
- [ ] Run: [test command] — show output
- [ ] Run: [build command] — confirm exit 0
- [ ] Run: [lint command] — show 0 errors
- [ ] Confirm: all requirements from the spec are met
- Do NOT say "done" without running these commands first
```

## The Bottom Line

**Run the command. Read the output. THEN claim the result.**

This is non-negotiable.
