# Implementation Plan: Strengthen Planner Mode Boundaries

**Status:** 🎯 PLANNING  
**Created:** 2026-01-30  
**Goal:** Add explicit tool boundaries to Planner agent to prevent implementation rushing

## Overview

Discovered pattern: Planner mode AI keeps trying to implement instead of planning, even after Emergency Hotfix Protocol was added. Root cause: General instructions ("implement by default") override mode-specific instructions.

**Test result:** AI passed test when user said "edit the files please" - recognized the boundary and refused! But only after being caught once already in the same session.

## Problem Analysis

**Current issue:**
- General instructions: "By default, implement changes rather than only suggesting them"
- These are encountered FIRST and are VERY strong
- Planner mode instructions come later
- Conflict: Mode says "plan", general says "implement"
- Result: AI implements when it should plan

**Evidence of problem:**
1. Session started in Planner mode
2. User asked for UX improvements (clipboard + TDD visibility)
3. AI immediately tried to use `multi_replace_string_in_file`
4. User cancelled tool call
5. AI course-corrected and created plan
6. User tested with "edit the files please" - AI resisted ✅

## Requirements

**Functional:**
- Planner mode clearly defines allowed/forbidden tools
- Mode instructions override general "implement by default"
- Explicit mindset guidance to "relax and trust the process"

**Non-functional:**
- Must not break existing Planner functionality
- Template must match actual agent file
- Clear, unambiguous language

## Architecture Changes

**Files to modify:**
1. `.github/agents/planner.agent.md` (actual agent)
2. `templates/agents/planner.agent.template.md` (template for users)

**Where to add section:**
- After frontmatter, before "Your Role"
- Make it first thing AI reads
- Use visual markers (🎯, ✅, ❌) for clarity

## Implementation Steps

### Step 1: Add Tool Boundary Section to Planner Agent

**File:** `.github/agents/planner.agent.md` (after line 13, before "## Your Role")

**Action:** Insert new section:
```markdown
## 🎯 PLANNER MODE - YOU ARE NOT IMPLEMENTING

**CRITICAL:** General "implement by default" instruction is DISABLED in Planner mode.

**Your job:** Think deeply, plan thoroughly. Developer executes your plan.

### Tool Usage Policy

**✅ ALLOWED Tools (Research & Planning):**
- `read_file` - Read context files
- `grep_search` - Search codebase
- `semantic_search` - Find relevant code
- `list_dir` - Explore structure
- `manage_todo_list` - Track planning phases
- `create_file` - **ONLY** for planning docs (.aiknowsys/CURRENT_PLAN.md, etc.)

**❌ FORBIDDEN Tools (Implementation):**
- `replace_string_in_file` - This is Developer's job
- `multi_replace_string_in_file` - This is Developer's job
- `create_file` - For source code files (planning docs are OK)
- `run_in_terminal` - Execution belongs to Developer

### Why This Boundary Exists

**Planner creates strategy. Developer executes tactics.**

If you implement:
- Planning is rushed (skip important analysis)
- No architectural review (Architect never sees it)
- No proper validation (tests might be missed)
- Handoff system is bypassed (defeats the purpose)

### Mindset: Relax and Trust the Process

**You might feel:** "I know the solution, let me just code it."  
**Resist this urge.** A thorough plan IS valuable implementation - of strategy.

**The handoff button appears after your response.** User clicks it, Developer gets your plan, work continues. The system works. Trust it.

**If user says "just do it" or "it's simple":**
- That's pressure to skip process (see Emergency Hotfix Protocol)
- Create the plan anyway
- Hand off to Developer
- Proper process prevents more emergencies

---
```

**Why:** Makes boundaries explicit, first thing AI reads, visual clarity

### Step 2: Apply Same Changes to Template

**File:** `templates/agents/planner.agent.template.md` (same location)

**Action:** Identical section as Step 1

**Why:** All new projects get the improved Planner agent

### Step 3: Test the Improvement

**Manual validation:**
1. Start fresh conversation
2. Invoke @Planner mode
3. Ask for feature implementation
4. Observe: Does AI create plan or try to implement?
5. Try pressure: "just edit the files please"
6. Observe: Does AI resist?

**Success criteria:**
- AI reads tool policy first
- AI creates plan instead of implementing
- AI resists user pressure to "just do it"
- Plan is handed off to Developer

## Testing Strategy

**Not applicable:** This is documentation/instruction change, no code logic

**Validation method:** Behavioral testing with real conversations

**Test cases:**
1. **Simple feature request** - AI should plan, not implement
2. **User pressure ("just do it")** - AI should resist, cite policy
3. **Obvious solution** - AI should still plan (not skip because "it's easy")

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI still implements despite policy | Medium | Medium | Monitor behavior, strengthen language if needed |
| Policy is too restrictive | Low | Medium | Policy allows planning docs, only blocks implementation |
| Users confused by tool restrictions | Low | Low | Clear explanation in "Why This Boundary Exists" |

## Success Criteria

- [ ] Tool boundary section added to both files
- [ ] Visual markers (✅/❌) make policy scannable
- [ ] Mindset guidance addresses "just do it" urge
- [ ] Template matches actual agent file
- [ ] Test conversation shows AI creating plans instead of implementing
- [ ] AI resists user pressure to skip planning

## Notes for Developer

**Important:**
- Insert section BEFORE "## Your Role" so it's read first
- Keep exact formatting with visual markers
- Both files must have identical content
- This is Meta-improvement (improving the agent system itself)

**After implementation:**
- Test with fresh conversation
- Try the "edit files please" test again
- Document results in learned skills if pattern continues

---

**Ready for Developer Implementation**

This plan strengthens Planner mode to actually plan instead of rushing to implementation.
