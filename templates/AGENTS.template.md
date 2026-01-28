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
- [ ] **FOR NEW FEATURES:** Write test FIRST (RED), then implement (GREEN), then refactor (REFACTOR)
- [ ] **FOR BUG FIXES:** Write test reproducing bug, then fix
- [ ] Make changes + write/update tests
- [ ] **VALIDATE** (see validation matrix in ESSENTIALS)
- [ ] Update docs if patterns changed

**Validation Matrix:**

👉 **See [CODEBASE_ESSENTIALS.md - Validation Matrix](CODEBASE_ESSENTIALS.md#validation-matrix)**

The validation matrix lives in CODEBASE_ESSENTIALS.md as the single source of truth. Always run all commands from that matrix after making changes.

**🚨 RULE: Never claim work is complete without running validation!**

---

## 📋 SESSION WORKFLOW (Follow This Order!)

### 0️⃣ SESSION START: Check Context Continuity (FIRST!)

**Before reading ESSENTIALS, check for session continuity:**

```
1. Check .aiknowsys/sessions/ for recent session files
2. If recent session exists (< 7 days old):
   - Read the latest session file
   - Review "Notes for Next Session"
   - Continue from where previous session ended
3. Acknowledge continuity: "Continuing from [date] session..."
```

**Why This Helps:**
- Prevents context loss between conversations
- Maintains continuity on complex features
- Reduces repeated explanations
- Tracks progress automatically

**Session File Location:** `.aiknowsys/sessions/YYYY-MM-DD-session.md`

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
{{SKILL_MAPPING}}

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

1. **Create/Update Session File** (for complex work):
   ```markdown
   # Save to .aiknowsys/sessions/YYYY-MM-DD-session.md
   
   ## Current State
   [Brief summary of what was accomplished]
   
   ### Completed
   - [x] Feature X implemented
   - [x] Tests passing
   
   ### In Progress
   - [ ] Documentation update pending
   
   ### Notes for Next Session
   - Need to add error handling for edge case Y
   - Consider refactoring Z for clarity
   
   ### Context to Load
   ```
   src/components/NewFeature.tsx - Main implementation
   tests/NewFeature.test.ts - Test coverage
   ```
   ```

1. **Check for Pending Reviews:**
   - If `.aiknowsys/PENDING_REVIEW.md` exists, read it FIRST
   - Architect reviews are written here, not in session file
   - Address all issues before continuing

2. **Update Session File** (if Architect created one or for complex work):
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
   - Delete PENDING_REVIEW.md after addressing all issues

3. **Confirm to user:**
   - What you fixed/built
   - What tests passed
   - That changelog is updated (if applicable)
   - Session notes saved (if complex work)

---

## 📚 CONTINUOUS LEARNING

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

**Example:**
```markdown
# Learned Skill: Django Query Optimization Pattern

**Pattern Type:** project_specific  
**Created:** {{DATE}}  
**Trigger Words:** "slow query", "n+1 problem", "django performance"

## When to Use
Use when encountering slow Django queries with related objects.

## Pattern
Always use select_related() for foreign keys and prefetch_related() for many-to-many.

\```python
# ❌ N+1 query problem
users = User.objects.all()
for user in users:
    print(user.profile.bio)  # Query per user!

# ✅ Optimized with select_related
users = User.objects.select_related('profile').all()
for user in users:
    print(user.profile.bio)  # Single query!
\```

## Related
- Django ORM documentation
- Performance monitoring with django-debug-toolbar
```

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

## 📚 Skills Workflow

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

## ✅ Pre-Commit Validation Checklist

**Run this checklist BEFORE every commit. Copy-paste into terminal:**

### Quick Check (1 minute)
```bash
# 1. Validation Matrix commands
{{VALIDATION_CMD_1}}  # e.g., npm test
{{VALIDATION_CMD_2}}  # e.g., npm run lint

# 2. No debug code
grep -r "console.log\|debugger\|TODO:" src/ || echo "✓ No debug code"

# 3. No secrets
grep -r "password\|api_key\|secret" . --exclude-dir={node_modules,.git} || echo "✓ No secrets"
```

### Full Check (5 minutes)
```bash
# Run all validation commands from matrix
{{ALL_VALIDATION_COMMANDS}}

# Additional checks
git status                          # No untracked files
git diff                            # Review changes
grep "{{" {{TEMPLATE_FILES}}        # No unfilled placeholders
```

### Before Push
```bash
# Final validation
{{VALIDATION_CMD_1}}

# Check commits
git log origin/main..HEAD           # Review commits

# Push
git push
```

---

## 🔍 Troubleshooting Validation Failures

### Tests Failing
1. Read error message carefully
2. Check CODEBASE_ESSENTIALS.md for test patterns
3. Review "Common Gotchas" section
4. Run single failing test: `{{SINGLE_TEST_CMD}}`
5. Check if pattern violated (Critical Invariants)

### Linting Errors
1. Auto-fix if possible: `{{AUTO_FIX_CMD}}`
2. Review Core Patterns for style rules
3. Don't disable rules - fix the code
4. If rule is wrong, update ESSENTIALS first

### Build Errors
1. Check dependency versions (Technology Stack section)
2. Clear cache: `{{CLEAR_CACHE_CMD}}`
3. Rebuild from scratch: `{{CLEAN_BUILD_CMD}}`
4. Check environment variables

---

## 📝 Customization Instructions

**This is a template file. To customize:**

1. **{{SKILL_MAPPING}}** - Add your project's skill trigger words
   ```markdown
   | "refactor", "clean up" | code-refactoring | Test-driven refactoring |
   | "update deps" | dependency-updates | Safe dependency updates |
   | "write tests", "TDD", "test first" | tdd-workflow | Test-driven development |
   ```

2. **Validation Checklist Placeholders:**
   - `{{VALIDATION_CMD_1}}` → Your primary test command (e.g., `npm test`)
   - `{{VALIDATION_CMD_2}}` → Your lint command (e.g., `npm run lint`)
   - `{{ALL_VALIDATION_COMMANDS}}` → All commands from validation matrix in ESSENTIALS
   - `{{TEMPLATE_FILES}}` → Files to check for placeholders
   - `{{SINGLE_TEST_CMD}}` → How to run one test (e.g., `npm test -- file.test.js`)
   - `{{AUTO_FIX_CMD}}` → Auto-fix linting (e.g., `npm run lint:fix`)
   - `{{CLEAR_CACHE_CMD}}` → Clear build cache
   - `{{CLEAN_BUILD_CMD}}` → Clean rebuild command

3. **Add project-specific sections** as needed

4. **Remove placeholder text** and instructions

**Note:** Validation Matrix is in CODEBASE_ESSENTIALS.md - no need to duplicate it here.

---

*This file helps AI agents follow a consistent workflow: Read → Plan → Implement → Validate → Document → Confirm*

*Part of aiknowsys. See [README](README.md) and [SETUP_GUIDE.md](SETUP_GUIDE.md) for full documentation.*
