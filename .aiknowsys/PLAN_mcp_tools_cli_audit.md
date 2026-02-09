# Implementation Plan: MCP Tools CLI Flag Audit

**Created:** 2026-02-09  
**Status:** PLANNED  
**Priority:** MEDIUM  
**Type:** bugfix  
**Estimated Time:** 3-4 hours  

---

## Goal

Systematically audit and fix all 15 MCP tools to ensure CLI flags match actual aiknowsys CLI commands.

## Context

During MCP server Phase 2 testing (PLAN_mcp_bugfix_skill_lookup.md), discovered that 10/15 MCP tools have CLI flag mismatches or parameter issues:

**Working Tools (5/15):**
- ✅ `get_critical_invariants`
- ✅ `get_validation_matrix`
- ✅ `get_recent_sessions`
- ✅ `get_skill_by_name` (fixed in Phase 1)
- ⚠️ `search_context` (fixed but still disabled)

**Broken/Disabled Tools (10/15):**
- ❌ `create_session` - Uses `--goal` instead of `--title`
- ❌ `check_tdd_compliance` - Wrong parameter structure
- ❌ `validate_skill` - Wrong parameters
- 🚫 `validate_deliverables`, `get_active_plans`, `find_skill_for_task`, `find_pattern` - Disabled
- Unknown: `update_session`, `create_plan`, `update_plan`

## Root Cause

MCP tools were implemented without verifying against actual CLI command flags. Need systematic audit of all 15 tools.

---

## Plan Phases

### Phase 1: Audit All CLI Commands (45 min)

**For each aiknowsys CLI command:**

1. Run `npx aiknowsys <command> --help`
2. Document actual flags in audit spreadsheet
3. Compare with MCP tool implementation
4. Note discrepancies

**Tools to audit:**
- Query: search-context, query-plans, query-sessions, rebuild-index
- Mutations: create-session, update-session, create-plan, update-plan
- Validation: validate-deliverables, validate-skill
- Skills: (none - direct file reading)

**Deliverable:** `mcp-server/docs/CLI_AUDIT.md` with flag comparison table

### Phase 2: Fix CLI Flag Bugs (TDD - 1.5 hours)

**For each broken tool:**

1. **RED:** Update unit test to assert correct CLI flags
2. **GREEN:** Fix tool implementation
3. **REFACTOR:** Clean up if needed
4. Run full test suite (89+ tests)

**Priority order:**
1. `search_context` (already fixed, needs re-enablement test)
2. `create_session` (--goal → --title)
3. `get_active_plans` (investigate why disabled)
4. `find_skill_for_task` (investigate why disabled)
5. `find_pattern` (investigate why disabled)
6. `validate_deliverables` (investigate why disabled)
7. `check_tdd_compliance` (parameter structure)
8. `validate_skill` (parameter structure)
9. `update_session`, `create_plan`, `update_plan` (test each)

**Validation:** All 89+ tests passing after each fix

### Phase 3: Add Integration Tests (1 hour)

**Problem:** Unit tests mock responses, hiding real CLI failures

**Solution:** Add integration tests that actually call MCP server

**Test structure:**
```typescript
// mcp-server/test/integration/
describe('MCP Server Integration', () => {
  it('should call real CLI commands without mocking', async () => {
    // Start MCP server
    // Call tool
    // Verify real subprocess execution
    // Check actual output
  });
});
```

**Tests to add:**
- Integration test for each working tool (5)
- Integration test for fixed tools (10)
- Edge cases (missing files, invalid params)

**Deliverable:** `mcp-server/test/integration/tools.test.ts`

### Phase 4: Update Tool Status Documentation (15 min)

**Files to update:**
- [x] `mcp-server/SETUP.md` - Update "Working Tools" section (DONE in original plan)
- [ ] `CODEBASE_ESSENTIALS.md` - Update MCP tools list with status
- [ ] `.aiknowsys/sessions/2026-02-09-session.md` - Final status report

---

## Success Criteria

- [ ] All 15 MCP tools working correctly
- [ ] All CLI flags match actual aiknowsys commands
- [ ] Unit tests validate correct CLI flag usage
- [ ] Integration tests verify real CLI execution
- [ ] 100+ tests passing (89 existing + ~15 new integration)
- [ ] Documentation reflects current tool status

---

## Risks

**Risk 1:** Some tools may be intentionally disabled (not bugs)
- **Mitigation:** Check git history for why tools were disabled
- **Fallback:** Document as "not implemented" vs "broken"

**Risk 2:** Integration tests may be slow (subprocess overhead)
- **Mitigation:** Run integration tests separately (`npm run test:integration`)
- **Fallback:** Mark as optional pre-commit check

**Risk 3:** Fixing tools may reveal deeper architectural issues
- **Mitigation:** Document issues, create separate plan if scope creeps
- **Escalation:** Request @SeniorArchitect review if architectural changes needed

---

## Notes

- Original plan (PLAN_mcp_bugfix_skill_lookup.md) fixed 1 tool, added unit tests
- This plan addresses remaining 10 tools systematically
- Phase 4 (documentation) from original plan was completed
- User chose Option B: Prioritize adoption (Phase 4 docs) over fixing all bugs now
- This follow-up plan can be executed later when needed

---

## Related Work

- **PLAN_mcp_bugfix_skill_lookup.md** - Original MCP bug fix (completed Phase 1 + Phase 4)
- **Session 2026-02-09** - Testing session that discovered these bugs
- **mcp-server/test/** - Existing unit tests (89 passing)

