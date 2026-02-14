# Emergency Hotfix Workflow

**Pattern Type:** `error_resolution` + `debugging_techniques`  
**Discovered:** Jan 30, 2026 (v0.7.1 hotfix incident)  
**Trigger Words:** emergency, hotfix, production bug, critical fix, urgent

## Problem Pattern

**Symptom:** AI rushes through fixes under "emergency" pressure, skipping mandatory workflow steps.

**What happened during v0.7.1:**
- Production bug: `aiknowsys init --yes` crashed (SETUP_GUIDE.md missing from package)
- AI skipped: reading ESSENTIALS, creating plan, requesting review, updating changelog
- Only followed TDD (1 out of 5 required steps)
- Risk: Could have introduced MORE bugs while "fixing" urgently

## Why Emergencies Are Dangerous

1. **Pressure blinds us to side effects**
   - Quick fix might break something else
   - No architectural review = no safety net

2. **Shortcuts compound problems**
   - Skip tests → introduce new bugs
   - Skip docs → repeat same mistake later
   - Skip review → miss better solutions

3. **"Fast" fixes take longer when they fail**
   - Rushed v0.7.0 → broken publish → emergency v0.7.1
   - Proper process first time = no v0.7.1 needed

## Correct Emergency Workflow

**CRITICAL: Emergency does NOT mean skip the process!**

### 1. Read Context (30 seconds)
```
✅ MUST: Read CODEBASE_ESSENTIALS.md
Why: Prevents violating patterns while "fixing"
Time saved: Hours of fixing the fix
```

### 2. Create Plan (1 minute)
```
✅ MUST: Call manage_todo_list with steps
Why: Prevents forgetting validation, review, docs
Time saved: No missed steps = no rework
```

### 3. Follow TDD (2-5 minutes)
```
✅ MUST: Write test FIRST (RED → GREEN → REFACTOR)
Why: Confidence the fix actually works
Time saved: No deploy → realize it doesn't work → redeploy
```

### 4. Request Review (2 minutes)
```
✅ MUST: @SeniorArchitect review changes
Why: Catches side effects and better approaches
Time saved: Avoiding bigger incidents from rushed fixes
```

### 5. Document (1 minute)
```
✅ MUST: Update CODEBASE_CHANGELOG.md
Why: Captures pattern, prevents repeat incidents
Time saved: Not debugging same issue in 6 months
```

**Total time "wasted" on process: ~10 minutes**  
**Time saved avoiding rushed-fix bugs: Hours to days**

## Speed-Up Strategy

**WRONG:** Skip steps to go faster  
**RIGHT:** Do steps faster with focus

- Read ESSENTIALS at 2x speed (scan for relevant patterns)
- Create minimal but complete todo list
- Write focused test (not comprehensive test suite)
- Request review while doing next step
- Write brief changelog entry (can expand later)

**Key insight:** Work faster WITHIN the process, not around it.

## Red Flags (When To Use This Skill)

- [ ] You feel pressure to "just fix it quick"
- [ ] User says "emergency" or "production down"
- [ ] You're tempted to skip reading ESSENTIALS
- [ ] You want to "come back and add tests later"
- [ ] You think "I'll document this after it's fixed"

**When you see these flags:** SLOW DOWN and follow this workflow.

## Success Metrics

**Good emergency response:**
- All 5 workflow steps completed
- Tests written BEFORE fix
- Architectural review requested
- Bug fixed AND documented
- No new bugs introduced

**Bad emergency response:**
- Skipped workflow steps
- Tests added after (or never)
- No review requested
- Bug fixed but pattern not captured
- New bugs introduced by rush

## Example: v0.7.1 Hotfix (What We Learned)

**Bug:** SETUP_GUIDE.md missing from package.json, init crashes  
**Pressure:** User waiting to use at work, production broken  
**AI's mistake:** Skipped 4 out of 5 workflow steps  
**What saved us:** Still followed TDD (prevented worse bugs)  
**Prevention added:** Emergency Hotfix Protocol in AGENTS.md  
**Outcome:** Bug fixed, pattern captured, future emergencies handled better

## Integration with Other Skills

- Pairs with: `tdd-workflow` (always follow RED-GREEN-REFACTOR)
- Pairs with: `validation-troubleshooting` (when fix doesn't work)
- Informs: `skill-creator` (how to capture emergency patterns)

## Automation Opportunity

**Future enhancement:** Pre-commit hook that detects "emergency" in commit message and:
1. Checks if CHANGELOG updated
2. Checks if tests added
3. Warns if validation not run
4. Requires confirmation to proceed

---

**Remember:** The fastest way to fix an emergency is to NOT create more emergencies.  
**Shortcuts in crisis = Crisis in the making.**
