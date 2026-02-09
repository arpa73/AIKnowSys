# MCP Tools CLI Flag Audit

**Date:** 2026-02-09  
**Purpose:** Document CLI flag mismatches between MCP tools and actual aiknowsys commands  
**Status:** Phase 1 Complete - Ready for fixes

---

## Summary

**Total MCP Tools:** 15  
**Working Correctly:** 5/15 (33%)  
**Need Fixes:** 7/15 (47%)  
**Direct Function Calls (No CLI):** 3/15 (20%)

---

## Tool Status Matrix

| Tool | MCP File | Status | Issue | Priority |
|------|----------|--------|-------|----------|
| `get_critical_invariants` | context.ts | ✅ WORKING | Direct function (no CLI) | - |
| `get_validation_matrix` | context.ts | ✅ WORKING | Direct function (no CLI) | - |
| `get_recent_sessions` | query.ts | ✅ WORKING | Direct function call to lib | - |
| `get_active_plans` | query.ts | ✅ WORKING | Direct function call to lib | - |
| `get_skill_by_name` | enhanced-query.ts | ✅ WORKING | Fixed in Phase 1 (file reading) | - |
| `search_context` | enhanced-query.ts | ✅ WORKING | Fixed in Phase 2 (--scope flag) | - |
| `create_session` | mutations.ts | ❌ BROKEN | Uses `--goal`, needs `--title` | HIGH |
| `update_session` | mutations.ts | ❌ BROKEN | Uses `--status`, not a CLI flag | MEDIUM |
| `create_plan` | mutations.ts | ❌ BROKEN | Uses `--goal` and `--id`, needs `--title` only | HIGH |
| `update_plan` | mutations.ts | ⚠️ PARTIAL | Correct flags but needs testing | MEDIUM |
| `validate_deliverables` | validation.ts | ✅ WORKING | Correct CLI flags | - |
| `check_tdd_compliance` | validation.ts | ⚠️ SPECIAL | Calls hook script (not CLI command) | LOW |
| `validate_skill` | validation.ts | ❌ BROKEN | Uses `--file` flag that doesn't exist | MEDIUM |
| `find_skill_for_task` | enhanced-query.ts | ⚠️ UNTESTED | Natural language query needs verification | LOW |
| `find_pattern` | enhanced-query.ts | ⚠️ UNTESTED | Pattern matching needs verification | LOW |

---

## Detailed Findings

### ✅ Working Tools (6/15)

#### 1. `get_critical_invariants` (context.ts)
- **Status:** WORKING ✅
- **Implementation:** Direct function (returns hardcoded invariant data)
- **No CLI dependency:** Returns structured JSON directly
- **Performance:** Instant (no subprocess)

#### 2. `get_validation_matrix` (context.ts)
- **Status:** WORKING ✅
- **Implementation:** Direct function (returns hardcoded validation matrix)
- **No CLI dependency:** Returns structured JSON directly
- **Performance:** Instant (no subprocess)

#### 3. `get_recent_sessions` (query.ts)
- **Status:** WORKING ✅
- **Implementation:** Direct function call to `lib/commands/query-sessions.js`
- **CLI Command:** `npx aiknowsys query-sessions --days <N>`
- **Flags Used:** `days`, `json`, `_silent`
- **Match:** ✅ All flags valid
- **Performance:** Fast (no subprocess, direct lib call)

#### 4. `get_active_plans` (query.ts)
- **Status:** WORKING ✅
- **Implementation:** Direct function call to `lib/commands/query-plans.js`
- **CLI Command:** `npx aiknowsys query-plans --status ACTIVE`
- **Flags Used:** `status`, `json`, `_silent`
- **Match:** ✅ All flags valid
- **Performance:** Fast (no subprocess, direct lib call)

#### 5. `get_skill_by_name` (enhanced-query.ts)
- **Status:** WORKING ✅ (Fixed in Phase 1)
- **Implementation:** Direct file reading from `.github/skills/<name>/SKILL.md`
- **Previous Bug:** Used `--type skills` flag (didn't exist)
- **Fix:** Switched to direct file reading
- **Performance:** Fast (single file read)

#### 6. `search_context` (enhanced-query.ts)
- **Status:** WORKING ✅ (Fixed in Phase 2)
- **Implementation:** CLI subprocess
- **CLI Command:** `npx aiknowsys search-context <query> --scope <type>`
- **Previous Bug:** Used `--type` flag instead of `--scope`
- **Fix:** Changed to `--scope` flag
- **Flags Used:** `query`, `scope`, `json`
- **Match:** ✅ All flags valid

---

### ❌ Broken Tools (3/15)

#### 7. `create_session` (mutations.ts) - HIGH PRIORITY
- **Status:** BROKEN ❌
- **MCP Schema:** `{ goal, topics?, status? }`
- **MCP Flags Used:** `--goal`, `--topics`, `--status`
- **Actual CLI:** `npx aiknowsys create-session [options]`
- **Actual Flags:** `--title`, `--topics`, `--plan` (NO `--goal` or `--status`)
- **Issue:** 
  - ❌ Uses `--goal` instead of `--title`
  - ❌ Uses `--status` which doesn't exist (sessions don't have status at creation)
- **Fix:** 
  ```typescript
  // Change from:
  '--goal', validated.goal
  '--status', validated.status
  
  // To:
  '--title', validated.title  
  // Remove --status (not a CLI flag)
  ```

#### 8. `create_plan` (mutations.ts) - HIGH PRIORITY
- **Status:** BROKEN ❌
- **MCP Schema:** `{ id, goal, type?, priority? }`
- **MCP Flags Used:** `--id`, `--goal`, `--type`, `--priority`
- **Actual CLI:** `npx aiknowsys create-plan [options]`
- **Actual Flags:** `--title`, `--author`, `--topics` (NO `--id` or `--goal`)
- **Issue:** 
  - ❌ Uses `--goal` instead of `--title`
  - ❌ Uses `--id` which doesn't exist (plan ID auto-generated from title)
  - ❌ `--type` and `--priority` don't exist in CLI
- **Fix:** 
  ```typescript
  // Change from:
  '--id', validated.id
  '--goal', validated.goal
  '--type', validated.type
  '--priority', validated.priority
  
  // To:
  '--title', validated.title
  // Remove --id, --type, --priority (not CLI flags)
  // Plan ID is auto-generated from title
  ```

#### 9. `validate_skill` (validation.ts) - MEDIUM PRIORITY
- **Status:** BROKEN ❌
- **MCP Schema:** `{ skillPath }`
- **MCP Flags Used:** `--type skills --file <path>`
- **Actual CLI:** `npx aiknowsys validate [options]`
- **Actual Flags:** `--type <type>`, `--library <id>`, `--format <format>`
- **Issue:** ❌ Uses `--file` flag that doesn't exist
- **Fix:** 
  ```typescript
  // Change from:
  '--type', 'skills', '--file', validated.skillPath
  
  // To:
  '--type', 'skills'
  // Note: validate command validates ALL skills, not individual files
  // May need to rethink this tool's purpose
  ```

---

### ⚠️ Partial/Untested Tools (6/15)

#### 10. `update_session` (mutations.ts) - MEDIUM PRIORITY
- **Status:** PARTIAL ⚠️
- **MCP Schema:** `{ date?, section, content, operation }`
- **MCP Flags Used:** `--date`, `--appendSection/--prependSection/etc`, `--content`
- **Actual CLI:** `npx aiknowsys update-session [options]`
- **Actual Flags:** `--date`, `--appendSection`, `--content`, `--prependSection`, etc.
- **Issue:** ❌ Uses `--date` but CLI uses session auto-detection (today's session)
- **Observation:** Most flags match! But `--date` usage is suspicious
- **Action:** Test to verify if `--date` flag actually works or if it's ignored

#### 11. `update_plan` (mutations.ts) - MEDIUM PRIORITY
- **Status:** PARTIAL ⚠️
- **MCP Schema:** Discriminated union (set-status | append | prepend)
- **MCP Flags Used:** `--set-status`, `--append`, `--append-file`
- **Actual CLI:** `npx aiknowsys update-plan [options] [planId]`
- **Actual Flags:** `--set-status <status>`, `--append <content>`, `--append-file <file>`
- **Match:** ✅ All flags appear correct
- **Action:** Test to verify it works end-to-end

#### 12. `check_tdd_compliance` (validation.ts) - SPECIAL CASE
- **Status:** SPECIAL ⚠️
- **Implementation:** Calls `.github/hooks/tdd-check.js` directly (NOT a CLI command)
- **Command:** `node .github/hooks/tdd-check.js <files...>`
- **Issue:** Bypasses CLI entirely, calls hook script
- **Concerns:**
  - Hook script may not exist in all environments
  - No error handling if hook doesn't exist
  - Assumes specific project structure
- **Action:** Verify hook exists, add graceful fallback if missing

#### 13-15. `find_skill_for_task`, `find_pattern`, `search_context` - UNTESTED
- **Status:** UNTESTED ⚠️
- **Implementation:** Natural language queries
- **Action:** Manual testing needed to verify functionality

---

## CLI Command Reference

### Mutation Commands

**create-session:**
```bash
Usage: aiknowsys create-session [options]

Options:
  -d, --dir <directory>  Target directory (default: ".")
  -t, --topics <topics>  Comma-separated topics (e.g., "TDD,validation")
  -p, --plan <plan>      Link to active plan (e.g., PLAN_xyz)
  --title <title>        Session title (default: "Work Session")
  --json                 Output JSON (for AI agents)
```

**create-plan:**
```bash
Usage: aiknowsys create-plan [options]

Options:
  -d, --dir <directory>  Target directory (default: ".")
  -t, --title <title>    Plan title (REQUIRED)
  -a, --author <author>  Plan author (auto-detected from git)
  --topics <topics>      Comma-separated topics
  --json                 Output JSON (for AI agents)
```

**update-session:**
```bash
Usage: aiknowsys update-session [options]

Options:
  -d, --dir <directory>      Target directory (default: ".")
  --add-topic <topic>        Add topic to session
  --add-file <file>          Add file to session
  --set-status <status>      Set status: in-progress, complete, abandoned
  --appendSection <title>    Append markdown section header (e.g., "## Notes")
  --content <text>           Section body content (requires --appendSection)
  --appendFile <path>        Append content from markdown file
  --prependSection <title>   Prepend section at beginning (after frontmatter)
  --insert-after <pattern>   Insert section after matching pattern
  --insert-before <pattern>  Insert section before matching pattern
  --done                     Shortcut for --set-status complete
  --wip                      Shortcut for --set-status in-progress
  --append <content>         Shortcut: Add "Update" section with content/file
  --json                     Output JSON (for AI agents)
```

**update-plan:**
```bash
Usage: aiknowsys update-plan [options] [planId]

Options:
  -d, --dir <directory>      Target directory (default: ".")
  -s, --set-status <status>  Set plan status (PLANNED|ACTIVE|PAUSED|COMPLETE|CANCELLED)
  --append <content>         Append progress note
  --append-file <file>       Append content from file
  -a, --author <author>      Plan author (auto-detected from git)
  --json                     Output JSON (for AI agents)
```

### Query Commands

**search-context:**
```bash
Usage: aiknowsys search-context [options] <query>

Options:
  -d, --dir <directory>  Target directory (default: ".")
  -s, --scope <scope>    Search scope: all, plans, sessions, learned (default: all)
  --json                 Output JSON (for AI agents)
```

**query-sessions:**
```bash
Usage: aiknowsys query-sessions [options]

Options:
  -d, --dir <directory>  Target directory (default: ".")
  --date <date>          Filter by exact date (YYYY-MM-DD)
  --date-after <date>    Filter by sessions after date (YYYY-MM-DD)
  --date-before <date>   Filter by sessions before date (YYYY-MM-DD)
  -t, --topic <topic>    Filter by topic (fuzzy match)
  -p, --plan <plan>      Filter by plan reference
  --days <number>        Filter by sessions from last N days (convenience)
  --json                 Output JSON (for AI agents)
```

**query-plans:**
```bash
Usage: aiknowsys query-plans [options]

Options:
  -d, --dir <directory>    Target directory (default: ".")
  -s, --status <status>    Filter by status: ACTIVE, PAUSED, PLANNED, COMPLETE, CANCELLED
  -a, --author <author>    Filter by author
  -t, --topic <topic>      Filter by topic (fuzzy match)
  --updated-after <date>   Filter by plans updated after date (YYYY-MM-DD)
  --updated-before <date>  Filter by plans updated before date (YYYY-MM-DD)
  --json                   Output JSON (for AI agents)
```

### Validation Commands

**validate-deliverables:**
```bash
Usage: aiknowsys validate-deliverables [options]

Validate all deliverable files (templates)

Options:
  --full      Run expensive checks (template execution + fresh init)
  --fix       Attempt to auto-fix simple pattern issues
  --metrics   Show validation metrics and history
```

**validate:**
```bash
Usage: aiknowsys validate [options]

Validate aiknowsys skills, CODEBASE_ESSENTIALS.md, and stack templates against
current library documentation

Options:
  -t, --type <type>          Type to validate: skills, essentials, stacks, or all (default: all)
  -l, --library <id>         Specific library ID to check
  -f, --format <format>      Output format (text|json|markdown) (default: "text")
  -p, --project-root <path>  Path to aiknowsys project
```

---

## Fixes Required

### High Priority (User-Facing Commands)

1. **create-session** (mutations.ts:56-58)
   - Change `--goal` → `--title`
   - Remove `--status` (not supported)
   - Update schema: `goal` → `title`, remove `status`

2. **create-plan** (mutations.ts:132-140)
   - Change `--goal` → `--title`
   - Remove `--id`, `--type`, `--priority` (not supported)
   - Update schema: `goal` → `title`, remove `id`, `type`, `priority`

### Medium Priority (Advanced Commands)

3. **validate-skill** (validation.ts:85-88)
   - Remove `--file` flag (doesn't exist)
   - Reconsider tool purpose (validates ALL skills, not individual)
   - Possibly rename to `validate_all_skills` for clarity

4. **update-session** (mutations.ts:82-84)
   - Verify `--date` flag actually works
   - May need removal (CLI defaults to today's session)

5. **update-plan** (mutations.ts:150-199)
   - Test end-to-end to verify all flags work
   - Validate discriminated union logic

### Low Priority (Edge Cases)

6. **check-tdd-compliance** (validation.ts:55-62)
   - Add existence check for `.github/hooks/tdd-check.js`
   - Graceful fallback if hook doesn't exist
   - Error message explaining where hook should be

---

## Testing Checklist

After fixes, verify each tool:

- [ ] **create-session** - Creates session with correct frontmatter
- [ ] **update-session** - Appends content correctly
- [ ] **create-plan** - Creates plan with auto-generated ID
- [ ] **update-plan** - Updates status and appends notes
- [ ] **validate-deliverables** - Runs validation, respects `--fix`
- [ ] **check-tdd-compliance** - Handles missing hook gracefully
- [ ] **validate-skill** - Validates all skills (clarify behavior)
- [ ] **search-context** - Returns matches with line numbers
- [ ] **get-recent-sessions** - Returns N sessions correctly
- [ ] **get-active-plans** - Returns active plans only
- [ ] **find-skill-for-task** - Natural language query works
- [ ] **find-pattern** - Pattern matching works

---

## Integration Test Plan

Phase 3 will add:

```typescript
// mcp-server/test/integration/tools.test.ts
describe('MCP Server Integration', () => {
  describe('Mutation Tools', () => {
    it('create-session should create session file', async () => {
      // Actually call MCP tool (no mocks)
      // Verify file created with correct YAML frontmatter
      // Cleanup temp file
    });
    
    it('create-plan should create plan with auto-generated ID', async () => {
      // Actually call MCP tool
      // Verify plan file created
      // Verify ID matches title slug format
      // Cleanup
    });
  });
  
  describe('Query Tools', () => {
    it('get-recent-sessions should return indexed data', async () => {
      // Call tool
      // Verify returns sessions from last N days
      // Check JSON structure
    });
  });
  
  describe('Validation Tools', () => {
    it('validate-deliverables should run without errors', async () => {
      // Call tool
      // Verify validation ran
      // Check for error handling
    });
  });
});
```

---

**Next Steps:**
1. Phase 2: Fix high-priority bugs using TDD
2. Phase 3: Add integration tests
3. Phase 4: Update documentation

**Estimated Time Remaining:** 2-3 hours (Phase 2-4)
