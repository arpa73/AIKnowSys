# AI Agent Instructions - Task API

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

**Step 3: Proceed with Implementation**

### Why This Protocol Exists:
- Prevents pattern violations
- Ensures validation happens before claiming work is complete
- Creates accountability trail for complex changes
- Catches architectural issues before they become bugs

---

## ⚡ QUICK REFERENCE CHECKLIST

**Before ANY change (even small fixes):**
- [ ] Load MCP critical invariants via `mcp_aiknowsys_get_critical_invariants()`
- [ ] Read relevant skill if applicable
- [ ] Make changes + write/update tests
- [ ] **VALIDATE** (see validation matrix below)
- [ ] Update docs if patterns changed

**Validation Matrix (ALWAYS run after changes):**

| Changed | Commands | Required |
|---------|----------|----------|
| Any JS file | `npm test` | ✅ MANDATORY |
| API routes | `npm run test:integration` | ✅ MANDATORY |
| Any code | `npm run lint` | ✅ MANDATORY |
| Database | `npm run db:test` | ✅ For schema changes |

**🚨 RULE: Never claim work is complete without running validation!**

---

## 📋 SESSION WORKFLOW (Follow This Order!)

### 1️⃣ START: Read Context (REQUIRED)

**ALWAYS load context at the start of every conversation:**
1. **MCP critical invariants** - `mcp_aiknowsys_get_critical_invariants()` (MANDATORY)
2. **@AGENTS.md** - This file for workflow reminders

**When you need history:**
- **@CODEBASE_CHANGELOG.md** - Session-by-session changes and validation notes

### 2️⃣ PLAN: Check Skills Before Coding

**Read the relevant skill FIRST based on trigger words:**

| Trigger Words | Skill to Read | Why |
|---------------|---------------|-----|
| "add endpoint", "new route", "implement feature" | `feature-implementation` | Proper API structure |
| "refactor", "clean up", "simplify" | `code-refactoring` | Test-driven refactoring |
| "update deps", "upgrade packages" | `dependency-updates` | Safe upgrade procedures |
| "update docs", "changelog" | `documentation-management` | AI-optimized docs |

**⚠️ DON'T start coding until you've read the relevant skill!**

### 3️⃣ IMPLEMENT: Write Code + Tests

Follow MCP critical invariants and the skill you read.

**For this project:**
- Write integration test FIRST (TDD approach)
- Implement route handler with try/catch
- Add Joi validation schema
- Test manually with curl/Postman

### 4️⃣ VALIDATE: Run Tests & Checks (MANDATORY - DO NOT SKIP!)

**⚠️ CRITICAL: Run validation EVERY TIME you make a change (even small fixes!)**

**Full validation:**
```bash
npm run lint && npm test && npm run test:integration
```

**Quick validation (small changes):**
```bash
npm run lint && npm test
```

**🚨 RULE: Never claim work is complete without running validation!**
**✅ Only say "done" after all relevant tests pass!**

### 5️⃣ DOCUMENT: Update Changelog (MANDATORY for significant changes)

**When to update** (automatic, don't ask):
- After adding new endpoints
- After bug fixes that reveal design issues
- When you discover missing/outdated patterns

**What to update**:
```bash
# Add session entry to CODEBASE_CHANGELOG.md at the TOP
# Update MCP-backed invariants/pattern docs if rules changed
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
- ✅ Lint: No errors
- ✅ Integration: X scenarios tested

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

## 🎯 General Best Practices

1. **Read first, code second** - Always load MCP critical invariants first
2. **Update proactively** - Don't wait for user to ask
3. **Be concise** - Keep summaries short and factual
4. **Link files** - Include line numbers when referencing code
5. **Maintain structure** - Follow existing organization

---

## 🔧 Project-Specific Patterns

### Task API Invariants (Never Violate):

1. **All database queries use `pool`**
   ```javascript
   import pool from '../db/pool.js';
   const result = await pool.query('SELECT ...');
   ```

2. **All route handlers have try/catch**
   ```javascript
   router.get('/tasks', async (req, res, next) => {
     try {
       // ...
     } catch (error) {
       next(error);  // Forward to error middleware
     }
   });
   ```

3. **All POST/PUT routes validate with Joi**
   ```javascript
   router.post('/tasks', 
     validate(taskSchema),
     async (req, res, next) => { /* ... */ }
   );
   ```

4. **Protected routes use `requireAuth` middleware**
   ```javascript
   router.get('/tasks', requireAuth, async (req, res) => { /* ... */ });
   ```

---

## 📝 Custom Skills for Task API

**Installed skills:**
- `code-refactoring` - Test-driven refactoring
- `dependency-updates` - Safe upgrade workflow
- `documentation-management` - Changelog archiving
- `feature-implementation` - Step-by-step feature guide

**When to use:**
- "refactor error handling" → reads `code-refactoring`
- "update express to latest" → reads `dependency-updates`
- "add task filtering" → reads `feature-implementation`

---

*This file helps AI agents follow a consistent workflow: Read → Plan → Implement → Validate → Document → Confirm*

*Part of the Task API knowledge system. See [README.md](README.md) and [CODEBASE_CHANGELOG.md](CODEBASE_CHANGELOG.md) for workflow context.*
