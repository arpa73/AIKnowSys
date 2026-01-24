# Knowledge System Template - Agents Configuration

> Defines the AI-assisted development workflow for this project.

---

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

**Step 3: Proceed with Implementation**

### Why This Protocol Exists:
- Prevents pattern violations (ES Modules, path handling, etc.)
- Ensures validation happens before claiming work is complete
- Creates accountability trail for complex changes
- Catches architectural issues before they become bugs

---

## ⚡ QUICK REFERENCE CHECKLIST

**Before ANY change (even small fixes):**
- [ ] Read @CODEBASE_ESSENTIALS.md (patterns, conventions)
- [ ] Read relevant skill if applicable
- [ ] Make changes
- [ ] **VALIDATE** (see validation matrix below)
- [ ] Update docs if patterns changed

---

## Validation Matrix

Before any change is considered complete, run these validations:

| Changed | Commands | Required |
|---------|----------|----------|
| Any JS file | `node bin/cli.js --help` | ✅ MANDATORY |
| CLI commands | `node bin/cli.js <command> --help` | ✅ MANDATORY |
| Templates | Verify no broken `{{VARIABLE}}` refs | ✅ MANDATORY |
| README | Links valid, examples accurate | ✅ MANDATORY |
| Package | `npm pack --dry-run` | ✅ Before publish |

**🚨 RULE: Never claim work is complete without running validation!**

---

## 📋 SESSION WORKFLOW (Follow This Order!)

### 1️⃣ START: Read Context (REQUIRED)

**ALWAYS read these files at the start of every conversation:**
1. **@CODEBASE_ESSENTIALS.md** - Current architecture, patterns, and guardrails (MANDATORY)
2. **@AGENTS.md** - This file for workflow reminders

**When you need history:**
- **@CODEBASE_CHANGELOG.md** - Session-by-session changes and validation notes

### 2️⃣ PLAN: Check Skills Before Coding

**Read the relevant skill FIRST based on trigger words:**

| Trigger Words | Skill to Read | Why |
|---------------|---------------|-----|
| "add command", "new feature", "implement" | `feature-implementation` | Proper command structure |
| "refactor", "clean up", "simplify" | `code-refactoring` | Test-driven refactoring |
| "update deps", "upgrade packages" | `dependency-updates` | Safe upgrade procedures |
| "update docs", "changelog" | `documentation-management` | AI-optimized docs |
| "create skill", "new skill" | `skill-creator` | Proper skill format |

**⚠️ DON'T start coding until you've read the relevant skill!**

**For breaking changes or new features, consider using OpenSpec:**
- See "Change Management (OpenSpec)" section in CODEBASE_ESSENTIALS.md
- Create proposal: `openspec create add-feature-name`
- Get approval before implementing

### 3️⃣ IMPLEMENT: Write Code

Follow patterns from CODEBASE_ESSENTIALS.md:
- ES Modules only (import/export)
- Use `path.resolve()` for user paths
- Use `getPackageDir()` for template paths
- Graceful error handling with helpful messages

### 4️⃣ VALIDATE: Run Tests & Checks (MANDATORY - DO NOT SKIP!)

```bash
# Always run after changes
node bin/cli.js --help
node bin/cli.js <changed-command> --help

# Before publishing
npm pack --dry-run
```

---

## 🛑 VALIDATION CHECKPOINT

**Before saying "done" to the user, ALWAYS paste this checklist:**

```
✅ Validation Results:
   [ ] Tests passed (npm test / pytest / cargo test)
   [ ] CLI commands work (node bin/cli.js --help)
   [ ] No syntax/linting errors
   [ ] Docs updated (if patterns changed)
```

**If you can't check all boxes, you're NOT done!**

**Never claim work is complete without showing this checklist with actual results.**

---

### 5️⃣ DOCUMENT: Update Changelog (for significant changes)

**Session entry template**:
```markdown
## Session: [Brief Title] (MMM D, YYYY)

**Goal**: [One sentence]

**Changes**:
- [file/path](file/path#L123): Description with line numbers

**Validation**:
- ✅ CLI: All commands work
- ✅ Templates: No broken variables

**Key Learning**: [Optional: pattern or gotcha for future reference]
```

### 6️⃣ END: Confirm Completion

Only end your turn after completing steps 1-5. Tell the user:
- What you fixed/built
- What tests passed
- That changelog is updated (if applicable)

---

## 📖 REAL EXAMPLE SCENARIOS

**These examples show the correct workflow for common situations:**

### Scenario 1: Simple Feature Request

**User says:** "Add dark mode"

**Correct workflow:**
1. Read CODEBASE_ESSENTIALS.md for existing styling patterns
2. Create todo list (3-5 items: research pattern, implement, test, validate, document)
3. Implement changes following documented patterns
4. Run validation matrix (tests, type-check, lint)
5. Update CODEBASE_ESSENTIALS.md if new patterns introduced
6. Show validation checkpoint checklist before claiming done

---

### Scenario 2: Multi-Phase Request (STOP BETWEEN PHASES!)

**User says:** "First plan the user authentication system, then we'll build it"

**Correct workflow:**
1. **Phase 1 - Planning:**
   - Read CODEBASE_ESSENTIALS.md for auth patterns
   - Research best practices (JWT vs sessions, etc.)
   - Create design document with approach
   - **STOP** - Present plan and say: "Here's the plan. Please review and let me know if you approve."
   - **WAIT** for explicit approval ("looks good", "proceed", "go ahead")

2. **Phase 2 - Implementation:**
   - Only start after user approval
   - Create todo list for implementation
   - Implement → Test → Validate → Document
   - Show validation checkpoint before claiming done

**🚨 Key:** Recognize stop signals ("first X, then Y") and WAIT between phases!

---

### Scenario 3: Quick Fix

**User says:** "Quick fix for that typo in the README"

**Correct workflow:**
1. Still read CODEBASE_ESSENTIALS.md (yes, even for quick fixes!)
2. Create todo (even if it's just one item: "Fix typo + validate")
3. Make the fix
4. Run validation: check links, verify formatting
5. No changelog needed for typos (unless it changed a pattern)
6. Show validation checkpoint

**Remember:** "Quick" doesn't mean "skip the process"!

---

### Scenario 4: Knowledge System Setup (NEW PROJECT)

**User says:** "Help me set up aiknowsys for my new React project"

**Correct workflow:**
1. **Phase 1 - Discuss & Design** (THEN STOP)
   - Ask about project goals, tech stack choices
   - Discuss architecture decisions
   - Present design summary
   - **WAIT** for approval

2. **Phase 2 - Document** (THEN STOP)
   - Fill CODEBASE_ESSENTIALS.md with agreed tech stack
   - Document patterns and conventions
   - Set up validation matrix
   - Show what you filled in
   - **WAIT** for approval

3. **Phase 3 - DONE!**
   - Knowledge system is ready
   - User can now build the project (separate session)

**🚫 DO NOT:** Build the full codebase, create package.json, or implement features!
**✅ ONLY:** Fill in the knowledge system documentation!

---

## Custom Agents

### @Developer

**Role:** Primary implementer for features and fixes.

**Workflow:**
1. Implement the requested change
2. Ensure code follows patterns in CODEBASE_ESSENTIALS.md
3. Auto-handoff to @SeniorArchitect for review

**Guidelines:**
- Use ES Modules (import/export)
- Follow existing command structure patterns
- Keep CLI output user-friendly with chalk/ora
- Handle errors gracefully

### @SeniorArchitect

**Role:** Code reviewer enforcing quality standards.

**Review Criteria:**
- **KISS:** Is this the simplest solution?
- **DRY:** Any duplication that should be abstracted?
- **SOLID:** Single responsibility, proper abstractions?
- **YAGNI:** Any speculative features?
- **CODEBASE_ESSENTIALS.md compliance:** Follows documented patterns?

**Checklist:**
- [ ] Code follows ES Module patterns
- [ ] Error handling is user-friendly
- [ ] No hardcoded paths (uses path.join/resolve)
- [ ] Templates use {{VARIABLE}} syntax consistently
- [ ] README updated if commands/options changed

---

## Agent Workflow

```
User Request
    ↓
@Developer implements
    ↓
Auto-handoff to @SeniorArchitect
    ↓
Review against CODEBASE_ESSENTIALS.md
    ↓
✅ Approved  OR  🔄 Request changes
```

---

## 📚 Skills Reference

**Skills are located in `.github/skills/` and provide step-by-step workflows.**

**Available skills:**
- `feature-implementation` - Adding new commands/features
- `code-refactoring` - Test-driven refactoring
- `dependency-updates` - Safe upgrade procedures
- `documentation-management` - Changelog archiving
- `skill-creator` - How to create new skills

---

## Quick Commands

```bash
# Test CLI
node bin/cli.js --help
node bin/cli.js init --help
node bin/cli.js scan --dir /tmp/test-project

# Check package contents
npm pack --dry-run

# Local install test
npm link
aiknowsys --help
```

---

*This file defines the AI-assisted development workflow for aiknowsys.*
