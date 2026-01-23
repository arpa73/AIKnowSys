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

**Step 3: Proceed with Implementation**

### Why This Protocol Exists:
- Prevents pattern violations
- Ensures validation happens before claiming work is complete
- Creates accountability trail for complex changes
- Catches architectural issues before they become bugs

---

## ⚡ QUICK REFERENCE CHECKLIST

**Before ANY change (even small fixes):**
- [ ] Read @CODEBASE_ESSENTIALS.md (patterns, conventions)
- [ ] Read relevant skill if applicable
- [ ] Make changes + write/update tests
- [ ] **VALIDATE** (see validation matrix below)
- [ ] Update docs if patterns changed

**Validation Matrix (ALWAYS run after changes):**

| Changed | Commands | Required |
|---------|----------|----------|
{{VALIDATION_MATRIX}}

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
{{SKILL_MAPPING}}

**⚠️ DON'T start coding until you've read the relevant skill!**

**For breaking changes or new features, consider using OpenSpec:**
- See "Change Management (OpenSpec)" section in CODEBASE_ESSENTIALS.md
- Create proposal: `openspec create add-feature-name`
- Get approval before implementing

### 3️⃣ IMPLEMENT: Write Code + Tests

Follow patterns from CODEBASE_ESSENTIALS.md and the skill you read.

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

### 6️⃣ END: Confirm Completion

Only end your turn after completing steps 1-5. Tell the user:
- What you fixed/built
- What tests passed
- That changelog is updated (if applicable)

---

## 🚫 When NOT to Update Changelog

- Trivial changes (typos, formatting)
- Work in progress (wait until complete)
- Exploratory research without implementation
- Simple bug fixes that don't reveal new patterns

---

## 📚 Skills Workflow

**Skills are located in `.github/skills/` and provide step-by-step workflows.**

**Universal skills included:**
- `dependency-updates` - Safe upgrade procedures
- `documentation-management` - Changelog archiving
- `code-refactoring` - Test-driven refactoring
- `testing-best-practices` - Framework-agnostic testing
- `skill-creator` - How to create new skills

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
5. Architect approves or requests changes

**See:** `.github/agents/README.md` for details

---

## 📝 Customization Instructions

**This is a template file. To customize:**

1. **{{VALIDATION_MATRIX}}** - Replace with your actual validation commands
   ```markdown
   | Backend | pytest | ✅ MANDATORY |
   | Frontend | npm run type-check | ✅ MANDATORY |
   ```

2. **{{SKILL_MAPPING}}** - Add your project's skill trigger words
   ```markdown
   | "refactor", "clean up" | code-refactoring | Test-driven refactoring |
   | "update deps" | dependency-updates | Safe dependency updates |
   ```

3. **Add project-specific sections** as needed

4. **Remove placeholder text** and instructions

5. **Rename to `AGENTS.md`** when complete

---

*This file helps AI agents follow a consistent workflow: Read → Plan → Implement → Validate → Document → Confirm*

*Part of the Knowledge System Template. See [README](README.md) for full documentation.*
