# AI Agent Instructions

## 🚨 MANDATORY SESSION START PROTOCOL

**This rule applies to EVERY session, EVERY request - no exceptions.**

### Before Making ANY Code Changes:

**Step 1: Acknowledge & Read Context**
```
"Loading project context..."
[Call mcp_aiknowsys_get_critical_invariants()]
"✅ Context loaded. Ready to proceed."
```

**Step 2: Create Work Plan** (even for "quick fixes")
```
[Call manage_todo_list with steps including validation]
```

**Step 3: Check TDD Requirement** (for new features/functionality)
```
If implementing new feature:
  - [ ] 🔴 RED: Write failing test FIRST
  - [ ] 🟢 GREEN: Implement minimal code to pass
  - [ ] 🔵 REFACTOR: Clean up while keeping tests green
  - [ ] ✅ VALIDATE: Run full test suite

If fixing bug:
  - [ ] Write test that reproduces bug (should fail)
  - [ ] Fix bug (test should pass)
  - [ ] Run full test suite
```

**Step 4: Proceed with Implementation**

### ⚠️ EMERGENCY HOTFIX PROTOCOL

**"Emergency" does NOT mean "skip the process"!**

Even for production-critical bugs:
1. ✅ **STILL load critical invariants** (`mcp_aiknowsys_get_critical_invariants()` - 2 seconds, prevents violations)
2. ✅ **STILL create todo list** (1 minute - prevents forgetting steps)
3. ✅ **STILL follow TDD** (test first = confidence the fix works)
4. ✅ **STILL request architectural review** (catches side effects)
5. ✅ **STILL document in session file** (documents the incident)

**Shortcuts create more emergencies.**

The only acceptable speed-up: Work faster WITHIN the process, not around it.

### Why This Protocol Exists:
- Prevents pattern violations
- Ensures validation happens before claiming work is complete
- Creates accountability trail for complex changes
- Catches architectural issues before they become bugs
- **Emergency pressure makes us skip steps - this protocol prevents that**

---

## ⚡ QUICK REFERENCE CHECKLIST

**Before ANY change (even small fixes):**
- [ ] Load MCP critical invariants (patterns, conventions)
- [ ] Read relevant skill if applicable
- [ ] **FOR NEW FEATURES:** Write test FIRST (RED), then implement (GREEN), then refactor (REFACTOR)
- [ ] **FOR BUG FIXES:** Write test reproducing bug, then fix
- [ ] Make changes + write/update tests
- [ ] **VALIDATE** (use MCP validation matrix)
- [ ] Update docs if patterns changed

**Validation Matrix:**

👉 **Call `mcp_aiknowsys_get_validation_matrix()`**

The validation matrix is served live via MCP as the single source of truth. Always run all commands from that matrix after making changes.

**🚨 RULE: Never claim work is complete without running validation!**

---

## 📋 SESSION WORKFLOW (Follow This Order!)

### 0️⃣ SESSION START: Check Context Continuity (FIRST!)

**Before coding, check for active plan and session continuity:**

```
1. Query active plan/session context (database-first)
   - `mcp_aiknowsys_get_active_plans()`
   - `mcp_aiknowsys_get_recent_sessions({ days: 7 })`
2. If MCP unavailable, use CLI JSON query commands
   - `npx aiknowsys query-plans --status ACTIVE --json`
   - `npx aiknowsys query-sessions --days 7 --json`
3. Use markdown exports only for human-readable review artifacts
```

**Why This Helps:**
- Prevents context loss between conversations
- Maintains continuity on complex features
- Reduces repeated explanations
- Tracks progress automatically

**Session Storage:** Database-first (`.aiknowsys/knowledge.db`)

**VSCode Hooks (Automated):**  
If VSCode hooks are installed (`.github/hooks/`), session files are automatically created/updated:
- `sessionStart` hook: Detects recent sessions and reminds you to load context
- `sessionEnd` hook: Creates/updates today's session file with timestamp
- Hooks complement manual workflow - you still populate the content
- If hooks aren't available, manual session management works the same

**Maintenance Note:** Session files are gitignored and accumulate locally. Consider archiving or removing files >30 days old to keep your working directory clean and focus on recent context.

### 1️⃣ START: Read Context (REQUIRED)

**ALWAYS read these files at the start of every conversation:**
1. **MCP invariants** - Call `mcp_aiknowsys_get_critical_invariants()` (MANDATORY)
2. **@AGENTS.md** - This file for workflow reminders

**When you need history:**
- **@CODEBASE_CHANGELOG.md** - Milestone-focused timeline (releases, breaking changes)
- **@.aiknowsys/learned/** - Project-specific patterns discovered over time
- **Query commands:** Use `query-sessions`, `search-context` for historical work (faster than file reading)

### 2️⃣ PLAN: Check Skills Before Coding

**Read the relevant skill FIRST based on trigger words:**

| Trigger Words | Skill to Read | Why |
|---------------|---------------|-----|
{{SKILL_MAPPING}}

**⚠️ DON'T start coding until you've read the relevant skill!**

**For breaking changes or new features, consider using OpenSpec:**
- See `openspec/AGENTS.md` for proposal workflow
- Create proposal: `openspec create add-feature-name`
- Get approval before implementing

### 3️⃣ IMPLEMENT: Write Code + Tests

Follow critical invariants from `mcp_aiknowsys_get_critical_invariants()` and the skill you read.

### 3️⃣½ TDD SELF-AUDIT: Did You Follow RED-GREEN-REFACTOR? (MANDATORY)

**Before proceeding to validation, ask yourself:**

- [ ] **Did I write the test BEFORE implementation?** (RED phase)
- [ ] **Did I see the test fail first?** (Confirms test actually tests something)
- [ ] **Did I implement minimal code to pass?** (GREEN phase)
- [ ] **Did I refactor while keeping tests green?** (REFACTOR phase)

**If NO to any:**
- You violated Critical Invariant #7 (TDD requirement)
- Document violation in session file under "Key Learning"
- Explain why TDD wasn't followed (time pressure, uncertainty, etc.)
- Note what was lost (design benefits, confidence, etc.)

**If YES to all:**
- ✅ Proceed to validation with confidence!
- Tests were written with intention, not retrofitted

### 4️⃣ VALIDATE: Run Tests & Checks (MANDATORY - DO NOT SKIP!)

**⚠️ CRITICAL: Run validation EVERY TIME you make a change (even small fixes!)**

**Use the Validation Matrix from Quick Reference above.**

**🚨 RULE: Never claim work is complete without running validation!**
**✅ Only say "done" after all relevant tests pass!**

### 5️⃣ DOCUMENT: Update Changelog (MANDATORY for significant changes)

**When to update CODEBASE_CHANGELOG.md** (milestone entries only):
- ✅ **Version releases** (v0.11.0, v0.12.0, etc.)
- ✅ **Major architectural changes** (storage layer redesign, new subsystems)
- ✅ **Breaking changes** (API changes, migration required)
- ✅ **Critical security fixes** (CVEs, vulnerability patches)

**When NOT to update CODEBASE_CHANGELOG.md** (record in DB context instead):
- ❌ Daily feature work (record via MCP/CLI context mutation tools)
- ❌ Bug fixes (unless revealing major design issue)
- ❌ Refactoring (unless changing fundamental patterns)
- ❌ Documentation updates (unless changing workflow)

**What to update**:
```bash
# For MILESTONES: Add entry to CODEBASE_CHANGELOG.md at the TOP
# For DAILY WORK: Persist progress via MCP/CLI mutation tools
# For PATTERNS: Update AGENTS.md and MCP invariant sources if rules changed
```

**Why this approach?** (v0.11.0+)
- Session files are **indexed** in `.aiknowsys/context-index.json` (queryable via CLI)
- Changelog stays **lean** (~500 lines) and scannable for major events
- Use `query-sessions` / `search-context` to find historical work
- See: [docs/milestone-changelog-format.md](docs/milestone-changelog-format.md)

⚠️ **ALWAYS: For complex/multi-task work, persist progress in database-backed context**

**Progress recording pattern**:
```typescript
mcp_aiknowsys_append_to_session({
   section: "## Progress",
   content: "Implemented X, validated Y"
})
```

### 6️⃣ END: Save Session Context & Confirm Completion

**Before ending your turn:**

1. **Create/Update Session Context** (for complex work):
   ```typescript
   mcp_aiknowsys_append_to_session({
     section: "## Current State",
     content: "[Brief summary of what was accomplished]"
   })
   ```

2. **Check for Pending Reviews:**
   - Read `.aiknowsys/reviews/PENDING_<username>.md` (your personal review file)
   - Architect reviews are written here, not in session file
   - Address all issues before continuing

3. **Update Session Context** (if Architect created one or for complex work):
    - If Architect created a review marker, append completion status via session mutation:
     ```markdown
     ## Architect Review: [Topic] (HH:MM) ✅
     **Status:** ADDRESSED (HH:MM)  
     **Issues found:** X  
     **Outcome:** All fixed, tests passing
     ```
    - Delete `.aiknowsys/reviews/PENDING_<username>.md` after addressing all issues

4. **Confirm to user:**
   - What you fixed/built
   - What tests passed
   - That changelog is updated (if applicable)
   - Session notes saved (if complex work)

---

## � PLAN MANAGEMENT

**Multiple plans can coexist.** Database-backed status tracks active work.

### Multi-Developer Plan Workflow

**How it works:**
- Plan state is stored in `.aiknowsys/knowledge.db`
- Query status via MCP/CLI (`query-plans`)
- Use mutation tools to set `ACTIVE` / `PAUSED` / `COMPLETE`
- Export markdown only when humans need a report

### Creating a New Plan (@Planner)

1. Create plan via mutation tools
2. Set new plan status to ACTIVE (🎯)
3. Set previous active plan to PAUSED (🔄)
4. Append progress via mutation tools

### Switching Plans

1. Change previous plan status: ACTIVE → PAUSED
2. Change target plan status: PAUSED → ACTIVE
3. Verify with query tools
3. **Don't delete anything!** Paused plans resume later

### Completing a Plan

1. Mark current plan status: COMPLETE (✅)
2. Add completion summary via mutation tools
3. Export plan markdown if human review artifact needed
4. Switch to next active plan or wait for new direction

### Plan Status Values

- 🎯 **ACTIVE** - Currently being worked on (only ONE at a time)
- 🔄 **PAUSED** - Work in progress, temporarily stopped
- 📋 **PLANNED** - Created but not started yet
- ✅ **COMPLETE** - Finished and validated
- ❌ **CANCELLED** - Started but abandoned

### Plan Naming Convention

**Format:** `PLAN_<topic>_<variant>.md`
- Use lowercase with underscores
- Be descriptive but concise
- Examples: `PLAN_terminal_ux.md`, `PLAN_sprint2_quality.md`

---

## �📚 CONTINUOUS LEARNING

**After complex sessions or when discovering patterns:**

### Pattern Extraction Protocol

**When you notice:**
- Recurring error with consistent solution
- User corrects same mistake multiple times
- Project-specific convention emerges
- Workaround for library/framework issue
- Debugging technique that works well

**Do this:**
1. Create learned skill in `.aiknowsys/personal/<username>/`
2. Use skill format with clear trigger words
3. Document the pattern for future reuse
4. **For team sharing:** User runs `npx aiknowsys share-pattern <pattern-name>`

**See `.github/skills/skill-creator/SKILL.md` for detailed format and examples.**

**Note:** Patterns save to `personal/` by default (prevents merge conflicts). Team sees patterns only after explicit sharing via `share-pattern` command.

**Pattern Types:**
- `error_resolution` - How specific errors were fixed
- `user_corrections` - Patterns from user feedback
- `workarounds` - Solutions to library quirks
- `debugging_techniques` - Effective debugging approaches
- `project_specific` - Project conventions and standards

**Why This Matters:**
- System gets smarter over time
- Reduces repeated explanations
- Captures project-specific knowledge
- Team can share discoveries (when ready)

---

## 🚫 When NOT to Update Changelog

- Trivial changes (typos, formatting)
- Work in progress (wait until complete)
- Exploratory research without implementation
- Simple bug fixes that don't reveal new patterns

---

## � Common Issues & Workarounds

### VSCode File Operation Conflicts (VSCode users only)

**If working in VSCode** and file operations fail mysteriously, see:  
**[.aiknowsys/learned/vscode-file-operations.md](.aiknowsys/learned/vscode-file-operations.md)**

**Quick fix:** Click "Keep" or "Discard" in VSCode's diff/conflict UI, then retry the operation.

**Trigger words for full guide:** "file doesn't exist", "file already exists", "can't delete file", "git add failed"

---

## �📚 Skills Workflow

**Skills are located in `.github/skills/` and provide step-by-step workflows.**

**Universal skills included:**
- `dependency-updates` - Safe upgrade procedures
- `documentation-management` - Changelog archiving
- `code-refactoring` - Test-driven refactoring
- `testing-best-practices` - Framework-agnostic testing
- `skill-creator` - How to create new skills
- `tdd-workflow` - Test-driven development (mandatory for features)

**To use a skill:**
1. AI detects trigger words
2. Reads relevant skill file
3. Follows step-by-step workflow
4. Applies to current task

---

## 🎯 General Best Practices

1. **Read first, code second** - Always load MCP critical invariants before coding
2. **Update proactively** - Don't wait for user to ask
3. **Be concise** - Keep summaries short and factual
4. **Link files** - Include line numbers when referencing code
5. **Maintain structure** - Follow existing organization

---

## 🔧 Custom Agents Integration

**If custom agents are installed:**

This project uses Developer + Architect agents for automated code review.

**Workflow:**
1. User requests feature
2. Developer implements
3. Developer auto-hands off to Architect
4. Architect reviews against MCP critical invariants and project patterns
5. Architect approves or requests changes

**See:** `.github/agents/USAGE.txt` for details

---

*This file helps AI agents follow a consistent workflow: Read → Plan → Implement → Validate → Document → Confirm*

*Part of aiknowsys. See [README](README.md) and [SETUP_GUIDE.md](SETUP_GUIDE.md) for full documentation.*
