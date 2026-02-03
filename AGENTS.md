# AI Agent Instructions

## 🚨 MANDATORY SESSION START PROTOCOL

**This rule applies to EVERY session, EVERY request - no exceptions.**

### Before Making ANY Code Changes:

**Step 1: Acknowledge & Read Context**
```
"Reading required context files..."
[Actually call read_file on @CODEBASE_ESSENTIALS.md]
"Context review complete. Ready to proceed."
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
1. ✅ **STILL read CODEBASE_ESSENTIALS.md** (30 seconds - prevents making it worse)
2. ✅ **STILL create todo list** (1 minute - prevents forgetting steps)
3. ✅ **STILL follow TDD** (test first = confidence the fix works)
4. ✅ **STILL request architectural review** (catches side effects)
5. ✅ **STILL update CODEBASE_CHANGELOG.md** (documents the incident)

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
- [ ] Read @CODEBASE_ESSENTIALS.md (patterns, conventions)
- [ ] Read relevant skill if applicable
- [ ] **FOR NEW FEATURES:** Write test FIRST (RED), then implement (GREEN), then refactor (REFACTOR)
- [ ] **FOR BUG FIXES:** Write test reproducing bug, then fix
- [ ] Make changes + write/update tests
- [ ] **VALIDATE** (see validation matrix in ESSENTIALS)
- [ ] Update docs if patterns changed

**Validation Matrix (ALWAYS run after changes):**

| Changed | Commands | Required |
|---------|----------|----------|
| Any JS file | `node bin/cli.js --help` | ✅ MANDATORY |
| CLI commands | `node bin/cli.js <command> --help` | ✅ MANDATORY |
| Templates | `npx aiknowsys validate-deliverables` | ✅ MANDATORY |
| Templates | Verify no broken `{{VARIABLE}}` refs | ✅ MANDATORY |
| README | Links valid, examples accurate | ✅ MANDATORY |
| Package | `npm pack --dry-run` | ✅ Before publish |

**🚨 RULE: Never claim work is complete without running validation!**

**🚨 DELIVERABLES CHECK:** If you change templates/, you MUST:
- Run `npx aiknowsys validate-deliverables` before committing
- Verify templates match non-template equivalents
- Pre-commit hook will block broken templates automatically
- Use `--fix` flag to auto-fix simple pattern issues

---

## 📋 SESSION WORKFLOW (Follow This Order!)

### 0️⃣ SESSION START: Check Context Continuity (FIRST!)

**Before reading ESSENTIALS, check for active plan and session continuity:**

```
1. **Check .aiknowsys/plans/active-<username>.md** (personal plan pointer)
   - Read to find your active plan
   - Open the linked PLAN_*.md file
   - Review current progress and next steps
   - Acknowledge: "Continuing with [active plan name]..."

2. Check .aiknowsys/sessions/ for recent session files
   - If recent session exists (< 7 days old):
     - Read the latest session file
     - Review "Notes for Next Session"
     - Continue from where previous session ended

3. If no active plan and no recent session:
   - Read CODEBASE_ESSENTIALS.md for context
   - Wait for user direction
```

**Why This Helps:**
- Prevents context loss between conversations
- Maintains continuity on complex features
- Reduces repeated explanations
- Tracks progress automatically

**Session File Location:** `.aiknowsys/sessions/YYYY-MM-DD-session.md`

**VSCode Hooks (Automated):**  
If VSCode hooks are installed (`.github/hooks/`), session files are automatically created/updated:
- `sessionStart` hook: Detects recent sessions and reminds you to load context
- `sessionEnd` hook: Creates/updates today's session file with timestamp
- Hooks complement manual workflow - you still populate the content
- If hooks aren't available, manual session management works the same

**Maintenance Note:** Session files are gitignored and accumulate locally. Consider archiving or removing files >30 days old to keep your working directory clean and focus on recent context.

### 1️⃣ START: Read Context (REQUIRED)

**ALWAYS read these files at the start of every conversation:**
1. **@CODEBASE_ESSENTIALS.md** - Current architecture, patterns, and guardrails (MANDATORY)
2. **@AGENTS.md** - This file for workflow reminders

**When you need history:**
- **@CODEBASE_CHANGELOG.md** - Session-by-session changes and validation notes
- **@.aiknowsys/learned/** - Project-specific patterns discovered over time

### 2️⃣ PLAN: Check Skills Before Coding

**Read the relevant skill FIRST based on trigger words:**

| Trigger Words | Skill to Read | Why |
|---------------|---------------|-----|
| "add command", "new feature", "implement" | `feature-implementation` | Proper command structure |
| "refactor", "clean up", "simplify" | `refactoring-workflow` | Test-driven refactoring |
| "update deps", "upgrade packages" | `dependency-management` | Safe upgrade procedures |
| "update docs", "changelog" | `ai-friendly-documentation` | AI-optimized docs |
| "ESSENTIALS bloat", "compress essentials", "compress-essentials" | `essentials-compression` (learned) | Compression workflow |
| "create skill", "new skill" | `skill-creator` | Proper skill format |
| "write tests", "TDD", "test first" | `tdd-workflow` | Test-driven development |
| "test fail", "validation error", "build broken" | `validation-troubleshooting` | Debug validation failures |

**⚠️ DON'T start coding until you've read the relevant skill!**

**For breaking changes or new features, consider using OpenSpec:**
- See "Change Management (OpenSpec)" section in CODEBASE_ESSENTIALS.md
- Create proposal: `openspec create add-feature-name`
- Get approval before implementing

### 3️⃣ IMPLEMENT: Write Code + Tests

Follow patterns from CODEBASE_ESSENTIALS.md and the skill you read.

### 3️⃣½ TDD SELF-AUDIT: Did You Follow RED-GREEN-REFACTOR? (MANDATORY)

**Before proceeding to validation, ask yourself:**

- [ ] **Did I write the test BEFORE implementation?** (RED phase)
- [ ] **Did I see the test fail first?** (Confirms test actually tests something)
- [ ] **Did I implement minimal code to pass?** (GREEN phase)
- [ ] **Did I refactor while keeping tests green?** (REFACTOR phase)

**If NO to any:**
- You violated Critical Invariant #7 (TDD requirement)
- Document violation in CODEBASE_CHANGELOG.md under "Key Learning"
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

**When to update** (automatic, don't ask):
- After architectural changes, new features, performance fixes
- After bug fixes that reveal design issues
- When you discover missing/outdated patterns

**What to update**:
```bash
# Add session entry to CODEBASE_CHANGELOG.md at the TOP
# Update CODEBASE_ESSENTIALS.md if patterns/invariants changed
```

⚠️ **ALSO: For complex/multi-task work, maintain `.aiknowsys/sessions/YYYY-MM-DD-session.md`**

**Session entry template**:
```markdown
## Session: [Brief Title] (MMM D, YYYY)

**Goal**: [One sentence]

**Changes**:
- [file/path](file/path#L123): Description with line numbers
- [another/file](another/file): What changed

**Validation**:
- ✅ Tests: X passed
- ✅ Type check: No errors

**Key Learning**: [Optional: pattern or gotcha for future reference]
```

### 6️⃣ END: Save Session Context & Confirm Completion

**Before ending your turn:**

1. **Check for Pending Reviews:**
   - Check `.aiknowsys/reviews/PENDING_<username>.md` (if exists)
   - Architect reviews are written here, not in session file
   - Address all issues before continuing

3. **Update Session File** (if Architect created one or for complex work):
   - If Architect created session file with review marker, update it with completion status:
     ```markdown
     ## Architect Review: [Topic] (HH:MM) ✅
     **Status:** ADDRESSED (HH:MM)  
     **Issues found:** X  
     **Outcome:** All fixed, tests passing
     ```
   - For complex multi-step work without review, create/update session file:
     ```markdown
     ## Current State
     [Brief summary]
     
     ### Completed
     - [x] Feature X implemented
     
     ### Notes for Next Session
     - [Future work]
     ```
   - Delete `.aiknowsys/reviews/PENDING_<username>.md` after addressing all issues

4. **Confirm to user:**
   - What you fixed/built
   - What tests passed
   - That changelog is updated (if applicable)
   - Session notes saved (if complex work)

---

## � PLAN MANAGEMENT

**Multi-Developer Plan Workflow (Mandatory v0.9.0+)**

### Plan File Locations

- **`.aiknowsys/plans/active-<username>.md`** - Your personal active plan pointer (committed)
- **`.aiknowsys/CURRENT_PLAN.md`** - Team index (auto-generated, DO NOT EDIT)
- **`.aiknowsys/PLAN_*.md`** - Full plan details (committed)

### Creating a New Plan (@Planner)

1. Create `PLAN_<descriptive-name>.md` in `.aiknowsys/`
2. Update your plan pointer:
   ```bash
   # Edit .aiknowsys/plans/active-<username>.md
   # Point to new plan, set status to ACTIVE (🎯)
   # Set previous plan to PAUSED (🔄) if switching
   ```
3. Regenerate team index:
   ```bash
   npx aiknowsys sync-plans
   ```
4. Write plan details in the new PLAN_*.md file

### Switching Plans

1. Edit your plan pointer: `.aiknowsys/plans/active-<username>.md`
   - Change previous ACTIVE → PAUSED
   - Change target plan PAUSED → ACTIVE
2. Run `npx aiknowsys sync-plans` to update team index
3. **Don't delete anything!** Paused plans resume later

### Completing a Plan

1. Edit your plan pointer: `.aiknowsys/plans/active-<username>.md`
   - Mark status COMPLETE (✅)
   - Add completion date
2. Run `npx aiknowsys sync-plans` to update team index
3. Leave plan file in place (historical record)
4. Point to next active plan or wait for new direction

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
1. Create learned skill in `.aiknowsys/learned/`
2. Use skill format with clear trigger words
3. Document the pattern for future reuse

**See `.github/skills/skill-creator/SKILL.md` for detailed format and examples.**

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
- Team can share discoveries

---

## 🚫 When NOT to Update Changelog

- Trivial changes (typos, formatting)
- Work in progress (wait until complete)
- Exploratory research without implementation
- Simple bug fixes that don't reveal new patterns

---

## 🐛 Common Issues & Workarounds

### VSCode File Operation Conflicts (VSCode users only)

**If working in VSCode** and file operations fail mysteriously, see:  
**[.aiknowsys/learned/vscode-file-operations.md](.aiknowsys/learned/vscode-file-operations.md)**

**Quick fix:** Click "Keep" or "Discard" in VSCode's diff/conflict UI, then retry the operation.

**Trigger words for full guide:** "file doesn't exist", "file already exists", "can't delete file", "git add failed"

## �📚 Skills Workflow

**Skills are located in `.github/skills/` and provide step-by-step workflows.**

**Universal skills included:**
- `refactoring-workflow` - Test-driven refactoring patterns
- `ai-friendly-documentation` - AI-optimized docs and changelog archiving
- `dependency-management` - Safe upgrade procedures (npm, pip, cargo, go mod)
- `feature-implementation` - Step-by-step feature planning and implementation
- `skill-creator` - How to create new skills
- `tdd-workflow` - Test-driven development (mandatory for features)
- `validation-troubleshooting` - Debug validation failures
- `context7-usage` - Query framework documentation with Context7 MCP
- `skill-validation` - Validate skill format and content

**To use a skill:**
1. AI detects trigger words
2. Reads relevant skill file
3. Follows step-by-step workflow
4. Applies to current task

---

## 🎯 General Best Practices

1. **Read first, code second** - Always check CODEBASE_ESSENTIALS.md for existing patterns
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
4. Architect reviews against CODEBASE_ESSENTIALS.md
5. Architect writes review to `.aiknowsys/PENDING_REVIEW.md`
6. Developer reads PENDING_REVIEW.md and addresses issues
7. Developer updates session with brief status, deletes PENDING_REVIEW.md

**Review Workflow:**

**Architect writes review:**
```markdown
# .aiknowsys/PENDING_REVIEW.md (created by Architect)
⚠️ Full detailed review with issues, recommendations, code examples
```

**Session file gets brief marker:**
```markdown
## ⚠️ Architect Review Pending (18:15)
**Topic:** Logger refactoring  
**See:** `.aiknowsys/PENDING_REVIEW.md` for details
```

**After Developer addresses issues:**
```markdown
## Architect Review: Logger Refactoring (18:15) ✅
**Status:** ADDRESSED (18:30)  
**Issues found:** 3 (method naming, chalk usage, icons)  
**Outcome:** All fixed, 164 tests passing, committed as 8a970ab

[PENDING_REVIEW.md deleted - no longer needed]
```

**Benefits:**
- Session file stays lean (timeline, not archive)
- PENDING_REVIEW.md is ephemeral (exists only during action)
- No clutter accumulation
- Easy to scan what happened without full review text

**See:** `.github/agents/README.md` for details

---

*This file helps AI agents follow a consistent workflow: Read → Plan → Implement → Validate → Document → Confirm*

*Part of aiknowsys. See [README](README.md) and [SETUP_GUIDE.md](SETUP_GUIDE.md) for full documentation.*
