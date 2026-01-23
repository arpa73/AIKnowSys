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
knowledge-system --help
```

---

*This file defines the AI-assisted development workflow for knowledge-system-template.*
