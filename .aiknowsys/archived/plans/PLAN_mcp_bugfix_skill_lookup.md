# Implementation Plan: Fix MCP get_skill_by_name Bug

**Status:** 🎯 PLANNING  
**Created:** 2026-02-09  
**Goal:** Fix broken `get_skill_by_name` MCP tool and validate all 15 tools work correctly

## Overview

During MCP server testing, discovered that `get_skill_by_name` tool fails with error:
```
unknown option '--type'
```

The tool incorrectly calls `search-context --type skills` which doesn't exist. Should read skill files directly like `find_skill_for_task` does.

## Requirements

- **Functional:** `get_skill_by_name` returns full skill content when given valid skill name
- **Error Handling:** Clear error message when skill not found
- **Consistency:** Use same file-reading approach as `find_skill_for_task`
- **Testing:** All 15 MCP tools validated before distribution
- **Non-functional:** No CLI dependency for skill lookup

## Architecture Changes

**File: mcp-server/src/tools/enhanced-query.ts**
- Replace CLI-based skill lookup with direct file reading
- Match pattern from `find_skill_for_task` in skills.ts
- Use proper path resolution from source file location

## Implementation Steps

### Phase 1: Bug Fix (30 minutes)

**Goal:** Fix `get_skill_by_name` to read files directly

1. **Update getSkillByName implementation** (File: `mcp-server/src/tools/enhanced-query.ts`)
   - **Action:** Replace CLI call with direct file reading
   - **Why:** CLI doesn't support skill filtering, file reading is faster
   - **Dependencies:** None
   - **Risk:** Low - copying working pattern from skills.ts
   - **Pattern to follow:**
     ```typescript
     const __dirname = path.dirname(fileURLToPath(import.meta.url));
     const skillPath = path.resolve(
       __dirname,
       '../../../.github/skills',
       skillName,
       'SKILL.md'
     );
     const content = await fs.readFile(skillPath, 'utf-8');
     ```

2. **Add error handling** (File: `mcp-server/src/tools/enhanced-query.ts`)
   - **Action:** Return structured error when skill not found
   - **Why:** Better UX than stack trace
   - **Dependencies:** Step 1
   - **Risk:** Low - standard try/catch pattern

3. **Rebuild MCP server** (Command)
   - **Action:** `cd mcp-server && npm run build`
   - **Why:** Compile TypeScript changes
   - **Dependencies:** Steps 1-2
   - **Risk:** Low - build passing before changes

### Phase 2: Comprehensive Testing (45 minutes)

**Goal:** Validate ALL 15 MCP tools work correctly

**Test Matrix:**

| Tool | Test Input | Expected Output | Status |
|------|------------|----------------|--------|
| get_critical_invariants | {} | 8 invariants | ✅ PASS |
| get_validation_matrix | {} | Validation commands | ⏳ TODO |
| get_active_plans | {} | Active plans list | ⏳ TODO |
| get_recent_sessions | {days: 7} | 7 sessions | ✅ PASS |
| find_skill_for_task | {task: "write tests"} | tdd-workflow | ⏳ TODO |
| create_session | {goal: "Test"} | Session created | ⏳ TODO |
| update_session | {section: "Test", content: "..."} | Session updated | ⏳ TODO |
| create_plan | {id: "test", goal: "Test"} | Plan created | ⏳ TODO |
| update_plan | {planId: "PLAN_test", operation: "set-status", status: "ACTIVE"} | Plan updated | ⏳ TODO |
| validate_deliverables | {} | Validation results | ⏳ TODO |
| check_tdd_compliance | {changedFiles: [...]} | Compliance check | ⏳ TODO |
| validate_skill | {skillPath: "..."} | Skill validation | ⏳ TODO |
| search_context | {query: "mcp"} | Search results | ⏳ TODO |
| find_pattern | {keywords: ["error"]} | Pattern results | ⏳ TODO |
| get_skill_by_name | {skillName: "tdd-workflow"} | Full skill content | ❌ FAIL (bug) |

4. **Test read-only tools** (Interactive)
   - **Action:** Call each query tool with sample inputs
   - **Why:** Ensure no regressions from type changes
   - **Dependencies:** Phase 1
   - **Risk:** Low - read-only operations

5. **Test mutation tools (CAREFUL!)** (Interactive)
   - **Action:** Call create/update tools with test data
   - **Why:** Validate mutations work without breaking real data
   - **Dependencies:** Phase 1
   - **Risk:** Medium - could create test files (use cleanup)
   - **Mitigation:** Test in isolated session, delete test artifacts

6. **Test validation tools** (Interactive)
   - **Action:** Call validation tools with current codebase
   - **Why:** Ensure validation logic works via MCP
   - **Dependencies:** Phase 1
   - **Risk:** Low - read-only validation

### Phase 3: Update Tests (45 minutes)

**Goal:** Add integration tests AND update unit tests

**Current Test Gap Identified:**
- ✅ Unit tests exist (89 tests) but mock CLI calls
- ❌ No integration tests actually calling MCP tools end-to-end
- **Result:** Mocked tests pass, real server breaks

7. **Update unit test for get_skill_by_name** (File: `mcp-server/test/tools/enhanced-query.test.ts`)
   - **Action:** Update existing mocked tests to match new file-reading implementation
   - **Why:** Current tests mock CLI call that we're removing
   - **Dependencies:** Phase 1
   - **Risk:** Low - update existing test structure
   - **Changes:**
     - Remove CLI mocking for `get_skill_by_name` tests
     - Mock `fs.readFile` instead
     - Test file path resolution
     - Test file not found errors

8. **Create integration test suite** (File: `mcp-server/test/integration/mcp-server.test.ts`)
   - **Action:** Create end-to-end tests that actually start MCP server and call tools
   - **Why:** Prevent mocked-tests-pass-but-real-server-fails scenarios
   - **Dependencies:** Phase 1, Step 7
   - **Risk:** Medium - requires MCP client simulation
   - **Coverage:**
     - All 15 tools called with real inputs
     - No mocks - actual MCP server instantiation
     - Validates tool responses match expected format
     - Tests error handling with invalid inputs
   - **TDD:** Write integration tests FIRST (they should FAIL before fix, PASS after)

9. **Run full test suite** (Command)
   - **Action:** `npm test` in mcp-server/
   - **Why:** Validate no regressions + integration tests pass
   - **Dependencies:** Steps 7-8
   - **Risk:** Low - should be 100+ tests now (89 unit + ~15 integration)

### Phase 4: Update Documentation (30 minutes)

**Goal:** Document all 15 tools AND tell agents to use them

9. **Update SETUP.md** (File: `mcp-server/SETUP.md`)
   - **Action:** Add "Testing All Tools" section with examples
   - **Why:** Users need to verify installation
   - **Dependencies:** Phase 2 (testing complete)
   - **Risk:** Low - documentation only

10. **Update CODEBASE_ESSENTIALS.md** (File: `CODEBASE_ESSENTIALS.md`)
    - **Action:** Add "MCP Tools Available" section to Context Query Commands
    - **Why:** AI agents need to know MCP tools exist and when to use them
    - **Content to add:**
      - Technology snapshot: Add MCP server entry
      - Section 9: Add "MCP Tools (Preferred when available)" subsection
      - List all 15 tools with one-line descriptions
      - Guidance: "Prefer MCP tools over CLI when both available (faster, typed)"
    - **Dependencies:** Phase 2 (all tools tested)
    - **Risk:** Low - documentation only

11. **Update AGENTS.md** (File: `AGENTS.md`)
    - **Action:** Add MCP tool usage guidance to workflow
    - **Why:** Agents need explicit instructions to prefer MCP over file reading
    - **Content to add:**
      - Under "SESSION START PROTOCOL": Check for MCP tools availability
      - Under "PLAN: Check Skills Before Coding": Mention `get_skill_by_name` MCP tool
      - Add "Prefer MCP Tools" guideline in best practices
    - **Dependencies:** Phase 2
    - **Risk:** Low - documentation only

12. **Update session file** (File: `.aiknowsys/sessions/2026-02-09-session.md`)
    - **Action:** Document bug, fix, testing results, documentation updates
    - **Why:** Capture learning for future reference
    - **Dependencies:** All phases
    - **Risk:** None

## Testing Strategy

**TDD Approach:** (for new test in Step 7)
- Write test that calls `get_skill_by_name` with "tdd-workflow" (should pass after fix)
- Write test for invalid skill name (should return error)
- Verify tests pass after implementation

**Manual Testing:**
- Call each tool via MCP interface
- Verify output matches expected format
- Check error handling for invalid inputs

**Automated Testing:**
- Run `npm test` to validate 89 existing tests + new test
- Verify build succeeds: `npm run build`

## Risks & Mitigations

**Risk 1: Mutation tools create unwanted test files**
- **Likelihood:** Medium
- **Impact:** Low (test files in .aiknowsys/)
- **Mitigation:** Test with unique prefixes like "test-mcp-", delete after validation

**Risk 2: Path resolution breaks in different environments**
- **Likelihood:** Low
- **Impact:** Medium (skill lookup fails)
- **Mitigation:** Use same pattern as `find_skill_for_task` (already working)

**Risk 3: Breaking changes to other tools during refactor**
- **Likelihood:** Low
- **Impact:** High
- **Mitigation:** Run full test suite after changes, test all 15 tools manually

## Success Criteria

- [ ] `get_skill_by_name` returns full skill content for valid names
- [ ] `get_skill_by_name` returns clear error for invalid names
- [ ] All 15 MCP tools tested and working
- [ ] Unit tests updated (no CLI mocking for file-reading tools)
- [ ] **Integration tests created (100+ tests total: 89 unit + 15+ integration)**
- [ ] **Integration tests actually start MCP server (no mocks)**
- [ ] Test suite passes (100+ tests)
- [ ] Build succeeds with zero errors
- [ ] SETUP.md has tool testing examples
- [ ] **CODEBASE_ESSENTIALS.md documents MCP tools availability**
- [ ] **AGENTS.md tells agents to prefer MCP tools over CLI/file reading**
- [ ] Session file documents findings
- [ ] Ready for distribution (Phase 3 of distribution plan)

## Notes for Developer

**Key Decision:** Use direct file reading instead of CLI
- **Rationale:** CLI `search-context` doesn't support skill filtering, file reading is faster and doesn't require spawning process
- **Pattern Source:** `find_skill_for_task` already does this successfully in skills.ts
- **Path:** `../../../.github/skills/${skillName}/SKILL.md` from enhanced-query.ts

**Testing Priority:** Focus on mutation tools carefully
- Create/update operations could modify real session/plan files
- Use test prefixes to identify artifacts
- Clean up after validation

**Before Distribution:** All 15 tools MUST pass manual testing
- This is pre-distribution validation
- Catches integration issues that unit tests might miss
- Builds confidence for registry submission

**Testing Gap Discovered:**
- **Unit tests (89):** Mock CLI calls via `mockExecFileAsync`
- **Result:** Tests pass even though real CLI fails with `--type skills`
- **Root cause:** No integration tests that actually call MCP server
- **Fix:** Add integration test suite (mcp-server/test/integration/)
  - Instantiate real MCP server (no mocks)
  - Call all 15 tools with real inputs
  - Validate responses match expected format
  - Test error handling
- **Lesson:** Mocked unit tests ≠ working code. Always need E2E validation.

**Documentation Updates Required:**

### CODEBASE_ESSENTIALS.md Changes

**Add to Section 1 (Technology Snapshot):**
```markdown
| MCP Server | @modelcontextprotocol/sdk v1.26.0 |
```

**Add to Section 9 (Context Query Commands):**
```markdown
### MCP Tools (Preferred When Available)

AIKnowSys provides an MCP server with 15 tools for AI agents. **Prefer MCP tools over CLI commands when both are available** (faster, typed, no process spawning).

**Context Query (2 tools):**
- `get_critical_invariants` - Returns 8 mandatory rules instantly
- `get_validation_matrix` - Returns validation commands with purpose

**Query (3 tools):**
- `get_active_plans` - O(1) index lookup for active plans
- `get_recent_sessions` - Returns sessions with metadata (default: 7 days)
- `find_skill_for_task` - AI describes task → gets relevant skill workflow

**Mutations (4 tools):**
- `create_session` - Create session with YAML frontmatter
- `update_session` - Update today's session (append/prepend/insert)
- `create_plan` - Create implementation plan
- `update_plan` - Update plan status or content

**Validation (3 tools):**
- `validate_deliverables` - Validate templates match sources
- `check_tdd_compliance` - Check changed files have tests
- `validate_skill` - Validate skill format

**Enhanced Query (3 tools):**
- `search_context` - Full-text search across all context
- `find_pattern` - Find learned patterns by keywords
- `get_skill_by_name` - Get specific skill by exact name

**When to use MCP vs CLI:**
- ✅ Use MCP when: Reading context, querying metadata, getting invariants
- ⚠️ Use CLI when: Creating files outside .aiknowsys/, complex workflows
- **See:** mcp-server/SETUP.md for installation and usage
```

### AGENTS.md Changes

**Add to "SESSION START PROTOCOL" (after Step 1):**
```markdown
**Step 1½: Check MCP Tools Availability** (if MCP configured)
```
If MCP server is configured, prefer MCP tools over file reading:
- Use `get_critical_invariants` instead of reading ESSENTIALS
- Use `get_recent_sessions` instead of list_dir + read_file
- Use `get_skill_by_name` instead of reading skill files
- Use `search_context` for historical work instead of grep_search

**Benefits:** 10-100x faster, typed responses, no file path resolution
```

**Add to "QUICK REFERENCE CHECKLIST":**
```markdown
**MCP Tools (if configured):**
- [ ] Use `get_critical_invariants` for invariants (faster than reading ESSENTIALS)
- [ ] Use `get_skill_by_name` for skills (faster than file reading)
- [ ] Use MCP mutations for sessions/plans (YAML validation included)
```

**Add to "General Best Practices":**
```markdown
6. **Prefer MCP tools** - Use MCP over CLI/file reading when available (10-100x faster)
```

## Timeline

- **Phase 1 (Fix):** 30 minutes
- **Phase 2 (Test All):** 45 minutes  
- **Phase 3 (Tests):** 45 minutes (increased from 30m - added integration tests)
- **Phase 4 (Docs):** 30 minutes
- **Total:** ~2 hours 30 minutes

## Next Steps After This Plan

1. Hand off to Developer agent
2. Developer implements fix (Phase 1)
3. Developer tests all 15 tools (Phase 2)
4. Developer adds tests (Phase 3)
5. Developer updates docs (Phase 4)
6. Architect reviews changes
7. Merge to main
8. **Continue with distribution plan** (PLAN_mcp_distribution.md Phase 2)
