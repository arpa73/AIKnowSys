<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# AI Agent Instructions

## 🚨 MANDATORY SESSION START PROTOCOL

**This rule applies to EVERY session, EVERY request - no exceptions.**

### Before Making ANY Code Changes:

**Step 1: Load Context via MCP Tools**
```typescript
"Loading project context..."
// Get critical invariants (replaces reading ESSENTIALS)
const invariants = await mcp_aiknowsys_get_critical_invariants();
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

**Step 3½: Use Mutation Tools for Session/Plan Changes** (MANDATORY)

✅ **Default: MCP Tools** (always prefer when available)
```typescript
// Create/update sessions and plans
mcp_aiknowsys_create_session({ title: "...", topics: [...] })
mcp_aiknowsys_append_to_session({ section: "...", content: "..." })
mcp_aiknowsys_create_plan({ title: "...", topics: [...] })
mcp_aiknowsys_set_plan_status({ planId: "...", status: "ACTIVE" })
```

Benefits: 10-100x faster, YAML validated, atomic updates  
See full details: Section 5½ below

❌ **Avoid: Manual file editing** (use only when MCP unavailable)

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
- [ ] **Check MCP availability first** - If `mcp_aiknowsys_*` tools available, use them instead of file reading
- [ ] Read relevant skill if applicable (trigger word matching)
- [ ] **FOR NEW FEATURES:** Write test FIRST (RED), then implement (GREEN), then refactor (REFACTOR)
- [ ] **FOR BUG FIXES:** Write test reproducing bug, then fix
- [ ] Make changes + write/update tests
- [ ] **VALIDATE** (see validation matrix below)
- [ ] Update docs if patterns changed

**🎯 MCP Tools Available (Prefer These!):**

See **📦 MCP TOOLS REFERENCE** section below for complete list.

**Dynamic Toolset (v0.12.0 - Token Efficient):**
- `aiknowsys_search_tools()` - Find tools by natural language (200 tokens)
- `aiknowsys_describe_tools()` - Load schemas on-demand (400 tokens/tool)
- `aiknowsys_execute_tool()` - Execute with validation
- Total: ~900 tokens vs 29K (97% reduction for full workflow)

**Common operations:**
- Get context: `mcp_aiknowsys_get_critical_invariants()`, `get_recent_sessions()`, `get_active_plans()`
- Query data: `query_sessions_sqlite()`, `query_plans_sqlite()`, `search_context_sqlite()`
- Create/update: `create_session()`, `append_to_session()`, `create_plan()`, `set_plan_status()`

**Performance:** 10-100x faster than file reading, validated responses

**Validation Matrix (ALWAYS run after changes):**

| Changed | Commands | Required |
|---------|----------|----------|
| Any JS file | `node bin/cli.js --help` | ✅ MANDATORY |
| CLI commands | `node bin/cli.js <command> --help` | ✅ MANDATORY |
| Templates | `npx aiknowsys validate-deliverables` | ✅ MANDATORY |
| Templates | Verify no broken `{{VARIABLE}}` refs | ✅ MANDATORY |
| README | Links valid, examples accurate | ✅ MANDATORY |
| Package | `npm pack --dry-run` | ✅ Before publish |

**Vitest non-watch rule:** Use `npm test` (configured as `vitest run`) for one-shot validation. If invoking Vitest directly, always use `npx vitest run ...` (or `npx vitest --run ...`) to avoid hanging on “Waiting for file changes”.

**🚨 RULE: Never claim work is complete without running validation!**

**🚨 DELIVERABLES CHECK:** If you change templates/, you MUST:
- Run `npx aiknowsys validate-deliverables` before committing
- Verify templates match non-template equivalents
- Pre-commit hook will block broken templates automatically
- Use `--fix` flag to auto-fix simple pattern issues

---

## 📦 MCP TOOLS REFERENCE

**⚡ 15 MCP tools available for fast, validated operations (10-100x faster than file reading)**

### Context & Discovery Tools (Use at Session Start)

**`mcp_aiknowsys_get_critical_invariants()`**
- Returns: 8 mandatory rules (architecture, patterns, validation)
- Purpose: Load project rules without reading ESSENTIALS
- Speed: 50 tokens vs 2000 tokens (file reading)

**`mcp_aiknowsys_get_validation_matrix()`**
- Returns: Validation commands by file type changed
- Purpose: Know what to run after changes
- Speed: Direct data, no parsing

**`mcp_aiknowsys_get_active_plans()`**
- Returns: Current active plans with metadata
- Purpose: Session start - know what's in progress
- Speed: Index query vs file scanning

**`mcp_aiknowsys_get_recent_sessions({ days: 7 })`**
- Returns: Recent sessions with topics, status
- Purpose: Session continuity - build on previous work
- Speed: Date-filtered index vs list+read all files

**`mcp_aiknowsys_find_skill_for_task({ task: "refactoring" })`**
- Returns: Relevant skill workflow for task
- Purpose: Natural language → skill matching
- Speed: Keyword matching vs hoping trigger words match

### 🎯 Dynamic Toolset (Token-Efficient Discovery)

**⚡ NEW (v0.12.0): Token-efficient discovery pattern**

**Savings:** 93.75% upfront (29K → 1.8K tokens) | 97% per workflow (29K → 900 tokens)

Instead of loading all 36 tool schemas upfront (29K tokens), use dynamic discovery:

**Note:** Dynamic tools use `aiknowsys_*` prefix (not `mcp_aiknowsys_*`) following the Speakeasy pattern convention for meta-tooling.

**`aiknowsys_search_tools({ query, tags?, limit? })`**
- Returns: Top 5 matching tools with relevance scores
- Purpose: Natural language tool discovery
- Examples:
  - `{ query: "sessions" }` → Find session-related tools
  - `{ query: "category:sqlite" }` → Filter by category
  - `{ query: "create", tags: ["mutation"] }` → Combined filters
- Performance: ~10ms, returns ~200 tokens (vs 29K upfront)

**`aiknowsys_describe_tools({ tools: ["tool1", "tool2"] })`**
- Returns: Full JSON schemas for requested tools only
- Purpose: Lazy-load schemas on-demand
- Example: `{ tools: ["query_sessions_sqlite", "create_session"] }`
- Performance: ~50ms, ~400 tokens per tool schema

**`aiknowsys_execute_tool({ tool, arguments })`**
- Returns: Execution result or validation error
- Purpose: Execute discovered tools with validation
- Example: `{ tool: "query_sessions_sqlite", arguments: { mode: "preview" } }`
- Performance: Same as direct tool call + ~2ms validation overhead

**Workflow Example:**
```typescript
// 1. Search for tools (200 tokens)
const search = await aiknowsys_search_tools({ query: "sessions" });
// Returns: ["query_sessions_sqlite", "create_session", ...]

// 2. Describe one tool (400 tokens)
const describe = await aiknowsys_describe_tools({ 
  tools: ["query_sessions_sqlite"] 
});
// Returns: { inputSchema: {...}, description: "..." }

// 3. Execute with validated arguments (300 tokens response)
const result = await aiknowsys_execute_tool({
  tool: "query_sessions_sqlite",
  arguments: { mode: "preview", last: 7, unit: "days" }
});
// Total: ~900 tokens vs 29,000 tokens (97% reduction!)
```

**Categories Available:**
- `context` - Critical invariants, validation matrix, patterns
- `query` - Sessions, plans, search (file-based)
- `mutation` - Create/update sessions and plans
- `validation` - Deliverables, TDD, skills
- `sqlite` - High-performance database queries

**When to Use:**
- ✅ **First time using AIKnowSys** - Discover tools naturally
- ✅ **Uncertain which tool to use** - Search by intent, not name
- ✅ **Token-constrained context** - Only load schemas you need
- ❌ **You know the exact tool** - Direct call is faster (skip search/describe)
- ❌ **Frequently used tools** - Schemas cached in conversation history

**Backward Compatibility:**
All 36 tools remain available for direct calls (e.g., `mcp_aiknowsys_get_critical_invariants()`).
Dynamic toolset is optional for discovery, not required.

### Query Tools (SQLite - Fastest)

**`mcp_aiknowsys_get_db_stats_sqlite({ dbPath })`**
- Returns: Record counts, DB size, last updated
- Performance: ~9ms average
- Requires: `npx aiknowsys migrate-to-sqlite` first

**`mcp_aiknowsys_query_sessions_sqlite({ dateAfter, dateBefore, topic, dbPath })`**
- Returns: Sessions with filters (full content)
- Performance: ~3.6ms (100x faster than file scanning)
- ⚠️ Token warning: Returns full content (~22K tokens for 4 sessions)
- Note: Optimization plan exists for metadata-only mode

**`mcp_aiknowsys_query_plans_sqlite({ status, author, topic, dbPath })`**
- Returns: Plans with filters (full content)
- Performance: ~7ms average
- Use case: Find active plans, plans by developer

**`mcp_aiknowsys_query_learned_patterns_sqlite({ category, keywords, dbPath })`**
- Returns: Learned patterns with filters
- Performance: ~18ms average (~48K tokens for 33 patterns)
- Categories: error_resolution, workarounds, project_specific

**`mcp_aiknowsys_search_context_sqlite({ query, limit, dbPath })`**
- Returns: Full-text search across sessions/plans/patterns with snippets
- Performance: ~18ms average
- Already optimized: Returns snippets, not full content

### Mutation Tools (Session & Plan Management)

**Session Tools:**
```typescript
mcp_aiknowsys_create_session({ title, topics })
mcp_aiknowsys_append_to_session({ section, content })
mcp_aiknowsys_prepend_to_session({ section, content })
mcp_aiknowsys_insert_after_section({ pattern, section, content })
mcp_aiknowsys_insert_before_section({ pattern, section, content })
mcp_aiknowsys_update_session_metadata({ field, value })
```

**Plan Tools:**
```typescript
mcp_aiknowsys_create_plan({ title, topics })
mcp_aiknowsys_append_to_plan({ planId, content })
mcp_aiknowsys_prepend_to_plan({ planId, content })
mcp_aiknowsys_set_plan_status({ planId, status }) // ACTIVE|PAUSED|COMPLETE|CANCELLED
```

**Benefits:**
- Automatic YAML validation
- Auto-sync plan/session indexes
- Atomic updates (no partial writes)
- 10-100x faster than file editing

### When to Use What

```typescript
// ✅ Session start (MANDATORY)
get_critical_invariants()      // Load rules
get_active_plans()              // Know what's in progress
get_recent_sessions({ days: 7 }) // Build on previous work

// ✅ Tool discovery (when uncertain)
aiknowsys_search_tools({ query: "sessions" })        // Find relevant tools
aiknowsys_describe_tools({ tools: ["tool_name"] })   // Get schema
aiknowsys_execute_tool({ tool: "...", arguments })   // Execute with validation

// ✅ Finding information
search_context_sqlite({ query: "error handling" })  // Full-text search
query_sessions_sqlite({ topic: "mcp-tools" })        // Filter sessions
find_skill_for_task({ task: "refactoring" })         // Get workflow

// ✅ Creating/updating work
create_plan({ title: "Add feature X" })
append_to_session({ section: "## Progress", content: "..." })
set_plan_status({ planId: "PLAN_xyz", status: "COMPLETE" })

// ✅ Direct tool calls (when you know exactly what you need)
get_critical_invariants()      // Faster than search → describe → execute
query_sessions_sqlite({ ... }) // Skip discovery if tool name known

// ❌ Avoid
read_file("AGENTS.md")  // Use get_critical_invariants() + get_validation_matrix() instead
grep_search("pattern", ".aiknowsys/**")  // Use search_context_sqlite() instead
create_file("PLAN_xyz.md")  // Use create_plan() instead
```

### Setup Required

**SQLite tools (`*_sqlite`):**
1. Run `npx aiknowsys migrate-to-sqlite` once
2. Creates `.aiknowsys/knowledge.db`
3. Re-run after creating new sessions/plans manually

**Full setup:** See [mcp-server/SETUP.md](mcp-server/SETUP.md)

---

## 📋 SESSION WORKFLOW (Follow This Order!)

### 0️⃣ SESSION START: Check Context Continuity (FIRST!)

**🚨 MANDATORY: Use MCP tools for session start (10-100x faster than file reading)**

```typescript
// Step 1: Get critical rules (REQUIRED - DO NOT SKIP)
const invariants = await mcp_aiknowsys_get_critical_invariants();
console.log(`✅ Loaded ${invariants.length} critical invariants`);

// Step 2: Load active plans (REQUIRED - DO NOT SKIP)
const plans = await mcp_aiknowsys_get_active_plans();
if (plans.length > 0) {
  console.log(`✅ Active plan: ${plans[0].title}`);
}

// Step 3: Load recent sessions (REQUIRED - DO NOT SKIP)
const sessions = await mcp_aiknowsys_get_recent_sessions({ days: 7 });
if (sessions.length > 0) {
  console.log(`✅ Found ${sessions.length} recent sessions`);
}

// Step 4: Acknowledge context loaded
console.log("✅ Context loaded. Ready to proceed.");
```

**Why MCP tools instead of file reading:**
- 95% token reduction (500 tokens vs 10K+ tokens)
- Structured data (no parsing markdown)
- Validated responses
- Multiple queries in parallel possible

**If MCP tools unavailable (fallback only):**

```
1. Query active plan/session context via CLI JSON commands:
  - `npx aiknowsys query-plans --status ACTIVE --json`
  - `npx aiknowsys query-sessions --days 7 --json`
2. Use exported markdown only for human review (`aiknowsys export ...`) when needed.
3. Avoid direct markdown editing in `.aiknowsys/` during AI workflow.
```

### 1️⃣ START: Read Context (REQUIRED)

**ALWAYS load context at the start of every conversation:**
1. **MCP Tools** - Use `mcp_aiknowsys_get_critical_invariants()` for rules (MANDATORY if MCP available)
2. **@AGENTS.md** - This file for workflow reminders (if MCP not available)

**When you need history:**
- **@CODEBASE_CHANGELOG.md** - Milestone-focused timeline (releases, breaking changes)
- **@.aiknowsys/learned/** - Project-specific patterns discovered over time
- **Query commands:** Use `query-sessions`, `search-context` for historical work (faster than file reading)

### 2️⃣ PLAN: Check Skills Before Coding

**Read the relevant skill FIRST based on trigger words:**

| Trigger Words | Skill to Read | Why |
|---------------|---------------|-----|
| "add command", "new feature", "implement" | `feature-implementation` | Proper command structure |
| "refactor", "clean up", "simplify" | `refactoring-workflow` | Test-driven refactoring |
| "update deps", "upgrade packages" | `dependency-management` | Safe upgrade procedures |
| "update docs", "changelog" | `ai-friendly-documentation` | AI-optimized docs |
| "query plans", "find sessions", "search context" | `context-query` | CLI queries (READ operations) |
| "create plan", "create session", "update session", "document work" | `context-mutation` | Mutation commands (WRITE operations) |
| "query framework docs", "library documentation", "current API" | `3rd-party-framework-docs` | Up-to-date 3rd-party framework/library docs |
| "ESSENTIALS bloat", "compress essentials", "compress-essentials" | `essentials-compression` (learned) | Compression workflow |
| "create skill", "new skill" | `skill-creator` | Proper skill format |
| "write tests", "TDD", "test first" | `tdd-workflow` | Test-driven development |
| "test fail", "validation error", "build broken" | `validation-troubleshooting` | Debug validation failures |

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

**When NOT to update CODEBASE_CHANGELOG.md** (record in database events/sessions instead):
- ❌ Daily feature work (record via MCP/CLI context mutation tools)
- ❌ Bug fixes (unless revealing major design issue)
- ❌ Refactoring (unless changing fundamental patterns)
- ❌ Documentation updates (unless changing workflow)

**What to update**:
```bash
# For MILESTONES: Add entry to CODEBASE_CHANGELOG.md at the TOP
# For DAILY WORK: Record progress via MCP mutation tools (database-first)
# For PATTERNS: Update AGENTS.md and MCP invariant sources if rules changed
```

⚠️ **ALWAYS: For complex/multi-task work, persist progress in database-backed context (MCP mutation tools)**

**Progress recording pattern**:
```typescript
mcp_aiknowsys_append_to_session({
  section: "## Progress",
  content: "Implemented X, validated Y"
})
```

### 5️⃣½ SESSION/PLAN FILE MANAGEMENT: Use Mutation Tools (MANDATORY)

**⚠️ CRITICAL: Use MCP tools as the default for session/plan operations!**

**Default: MCP Tools** (Preferred - 10-100x faster, validated)
```typescript
// Create new session
mcp_aiknowsys_create_session({
  title: "Implement feature X",
  topics: ["feature", "implementation"]
});

// Update existing session - append to section
mcp_aiknowsys_append_to_session({
  section: "## Changes",
  content: "Fixed bug Y"
});

// Prepend critical update
mcp_aiknowsys_prepend_to_session({
  section: "## Critical Issue",
  content: "Security fix needed"
});

// Create/update plans
mcp_aiknowsys_create_plan({
  title: "Add Feature X",
  topics: ["feature-x", "api"]
});

// Set plan status
mcp_aiknowsys_set_plan_status({
  planId: "PLAN_xyz",
  status: "ACTIVE"
});

// Append progress to plan
mcp_aiknowsys_append_to_plan({
  planId: "PLAN_xyz",
  content: "Phase 1 complete: 19/19 tests passing"
});
```

**Fallback: CLI Commands** (if MCP unavailable)
```bash
# Create new session
npx aiknowsys create-session --title "Implement feature X"

# Update existing session (append, prepend, insert)
npx aiknowsys update-session --appendSection "## Changes" --content "Fixed bug Y"
npx aiknowsys update-session --prependSection "## Critical Issue" --content "Security fix needed"
npx aiknowsys update-session --insert-after "## Goal" --appendSection "## Progress" --content "Step 1 complete"

# Append content from file
npx aiknowsys update-session --appendFile notes.md --appendSection "## Implementation"

# Create/update plans
npx aiknowsys create-plan --title "Add Feature X" --topics "feature-x,api"
npx aiknowsys update-plan PLAN_xyz --set-status ACTIVE
npx aiknowsys update-plan PLAN_xyz --append "Phase 1 complete: 19/19 tests passing"

# Plan shortcuts (v0.12.0)
npx aiknowsys plan-activate PLAN_xyz     # Set status to ACTIVE
npx aiknowsys plan-complete PLAN_xyz     # Set status to COMPLETE
npx aiknowsys plan-pause PLAN_xyz        # Set status to PAUSED
npx aiknowsys plan-cancel PLAN_xyz       # Set status to CANCELLED
```

**Exception: Manual Editing**

Only manually edit session/plan files when:
- ✅ Commands don't support the required operation (e.g., complex restructuring)
- ✅ Fixing YAML frontmatter corruption (after backup)
- ✅ Emergency hotfix with command unavailable

**Advanced Insertion Options (v0.11.0+):**
- `--prependSection`: Add at beginning (critical updates, blockers)
- `--insert-after <pattern>`: Insert after specific section (surgical placement)
- `--insert-before <pattern>`: Insert before specific section (ordered content)
- `--appendSection`: Default append at end (standard workflow)

---

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

**Database-First Plan Workflow (Mandatory)**

### Plan Source of Truth

- **Primary:** `.aiknowsys/knowledge.db` (queried via MCP/CLI)
- **Operational access:** `mcp_aiknowsys_query_plans_sqlite()`, `mcp_aiknowsys_set_plan_status()`
- **Human-readable views:** generate on demand with `aiknowsys export plan ...`

### Creating a New Plan (@Planner)

1. Create the plan with MCP/CLI mutation tools
2. Set status to `ACTIVE` via mutation tools
3. Append progress as work advances

### Switching Plans

1. Set current plan to `PAUSED`
2. Set target plan to `ACTIVE`
3. Verify with `query-plans`/MCP query tools

### Completing a Plan

1. Run required validations
2. Set plan status to `COMPLETE`
3. Export markdown only if humans need review artifacts

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
1. Use MCP mutation tool `create_learned_pattern` to store pattern in SQLite and emit `PATTERN_DISCOVERED`
2. Include clear fields: `title`, `pattern`, `solution`, `category`, `keywords`
3. Document follow-up context in session/plan notes for traceability
4. Only use manual `.aiknowsys/learned/` file edits as fallback when MCP tools are unavailable

**See `.github/skills/skill-creator/SKILL.md` for detailed format and examples.**

**Pattern Types:**
- `error_resolution` - How specific errors were fixed
- `user_corrections` - Patterns from user feedback
- `workarounds` - Solutions to library quirks
- `debugging_techniques` - Effective debugging approaches
- `project_specific` - Project conventions and standards

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
- `refactoring-workflow` - Test-driven refactoring patterns
- `ai-friendly-documentation` - AI-optimized docs and changelog archiving
- `dependency-management` - Safe upgrade procedures (npm, pip, cargo, go mod)
- `feature-implementation` - Step-by-step feature planning and implementation
- `skill-creator` - How to create new skills
- `tdd-workflow` - Test-driven development (mandatory for features)
- `validation-troubleshooting` - Debug validation failures
- `3rd-party-framework-docs` - Query 3rd-party framework/library documentation (Context7 MCP)
- `skill-validation` - Validate skill format and content
- `context-query` - Query plans/sessions/context (READ operations)
- `context-mutation` - Create/modify sessions and plans (WRITE operations)

---

## 🎯 General Best Practices

1. **MCP tools first** - Always use `mcp_aiknowsys_*` tools when available (10-100x faster than file reading)
2. **Load context before coding** - Get critical invariants, active plans, recent sessions via MCP
3. **Update proactively** - Don't wait for user to ask
4. **Be concise** - Keep summaries short and factual
5. **Link files** - Include line numbers when referencing code
6. **Maintain structure** - Follow existing organization

---

## 🔧 Custom Agents Integration

**If custom agents are installed:**

This project uses Developer + Architect agents for automated code review.

**Workflow:**
1. User requests feature
2. Developer implements
3. Developer auto-hands off to Architect
4. Architect reviews against MCP critical invariants and project patterns
5. Architect writes review to `.aiknowsys/reviews/PENDING_<username>.md`
6. Developer reads `.aiknowsys/reviews/PENDING_<username>.md` and addresses issues
7. Developer updates session with brief status, deletes `.aiknowsys/reviews/PENDING_<username>.md`

**Review Workflow:**

**Architect writes review:**
```markdown
# .aiknowsys/reviews/PENDING_<username>.md (created by Architect)
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

**See:** `.github/agents/README.md` for details

---

*This file helps AI agents follow a consistent workflow: Read → Plan → Implement → Validate → Document → Confirm*

*Part of aiknowsys. See [README](README.md) and [SETUP_GUIDE.md](SETUP_GUIDE.md) for full documentation.*
