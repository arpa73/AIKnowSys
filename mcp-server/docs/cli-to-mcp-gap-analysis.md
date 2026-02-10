# CLI to MCP Gap Analysis

**Generated:** 2026-02-10  
**Status:** Phase 1 Step 1.1 complete

## Summary

- **Total CLI Commands:** 55+
- **Current MCP Tools:** 20
- **Coverage:** ~36% (20/55)
- **Missing Critical Tools:** 15+

## Current MCP Tools (20)

### Context Query (5)
1. ✅ `get_critical_invariants` - Returns 8 critical invariants
2. ✅ `get_validation_matrix` - Returns validation commands
3. ✅ `get_active_plans` - Returns ACTIVE status plans only
4. ✅ `get_recent_sessions` - Returns sessions from last N days
5. ✅ `find_skill_for_task` - Natural language skill matching

### Mutations (9)
6. ✅ `create_session` - Create new session with YAML
7. ✅ `append_to_session` - Append to session section
8. ✅ `prepend_to_session` - Prepend to session section
9. ✅ `insert_after_section` - Insert after pattern
10. ✅ `insert_before_section` - Insert before pattern
11. ✅ `create_plan` - Create new plan
12. ✅ `set_plan_status` - Set plan status
13. ✅ `append_to_plan` - Append to plan
14. ✅ `prepend_to_plan` - Prepend to plan

### Validation (3)
15. ✅ `validate_deliverables` - Validate templates
16. ✅ `check_tdd_compliance` - Check test files exist
17. ✅ `validate_skill` - Validate skill format

### Enhanced Query (3)
18. ✅ `search_context` - Full-text search
19. ✅ `find_pattern` - Find learned patterns
20. ✅ `get_skill_by_name` - Get specific skill

## Missing CLI Commands (35+)

### HIGH PRIORITY - Query Tools (7)

1. ❌ **`query_plans`** - Filter plans by status/author/topic/dates
   - Current: `get_active_plans` only returns ACTIVE
   - Needed: All statuses (PLANNED, PAUSED, COMPLETE, CANCELLED)
   - Parameters: status, author, topic, date range, JSON output

2. ❌ **`query_sessions`** - Filter sessions by date/topic/plan
   - Current: `get_recent_sessions` returns last N days
   - Needed: Specific date, date range, topic, plan reference
   - Parameters: date, date range, topic, plan, JSON output

3. ❌ **`get_plans_by_status(status)`** - Query plans by specific status
   - Simpler than full query_plans
   - Returns: Array of plans matching status

4. ❌ **`get_all_plans()`** - Get ALL plans with metadata
   - No filters, complete inventory
   - Returns: All plans (id, title, status, dates)

5. ❌ **`get_session_by_date(date)`** - Get specific session
   - Current: Only recent sessions
   - Needed: Access any session by YYYY-MM-DD

6. ❌ **`rebuild_index`** - Rebuild context index
   - Required after manual file edits
   - Updates .aiknowsys/context-index.json

7. ❌ **`sync_plans`** - Sync developer plan pointers to team index
   - Updates CURRENT_PLAN.md from active-*.md files
   - Critical for multi-developer workflow

### MEDIUM PRIORITY - Mutation Tools (5)

8. ❌ **`update_session_metadata`** - Modify session YAML
   - Add topic, add file reference, set status
   - Current: Only content operations (append/prepend/insert)

9. ❌ **`update_plan_metadata`** - Modify plan YAML
   - Update author, add topics, change priority, change type
   - Current: Only status + content append

10. ❌ **`archive_sessions(days)`** - Archive old sessions
    - Move sessions older than N days to archive/
    - Keeps recent sessions clean

11. ❌ **`archive_plans(status, days)`** - Archive completed/cancelled plans
    - Move plans to archive/ by status
    - Cleanup workspace

12. ❌ **`set_session_status(date, status)`** - Shortcut for metadata update
    - Values: active, paused, complete, abandoned
    - Simpler than full metadata update

### LOW PRIORITY - Setup/Config Tools (8)

13. ❌ **`init`** - Initialize knowledge system with AI-assisted setup
14. ❌ **`scan`** - Scan codebase and generate draft ESSENTIALS
15. ❌ **`check`** - Validate knowledge system setup
16. ❌ **`sync`** - Sync AGENTS.md with ESSENTIALS.md
17. ❌ **`audit`** - Find pattern violations
18. ❌ **`install_agents`** - Install Developer + Architect agents
19. ❌ **`install_skills`** - Install universal skills
20. ❌ **`update`** - Update agents/skills to latest version

### LOW PRIORITY - Maintenance Tools (7)

21. ❌ **`compress_essentials`** - Reduce ESSENTIALS bloat
22. ❌ **`clean`** - Archive old files and remove temp
23. ❌ **`quality_check`** - Run code quality checks
24. ❌ **`ci_check`** - Validate CI/CD readiness
25. ❌ **`deps_health`** - Check dependency health
26. ❌ **`validate_deliverables`** ✅ Already has MCP tool
27. ❌ **`plugins`** - List installed plugins

### OPTIONAL - Advanced Tools (8)

28. ❌ **`learn --list`** - List detected patterns
29. ❌ **`learn --extract`** - Extract pattern to skill
30. ❌ **`learn --auto`** - Auto-create skills
31. ❌ **`share_pattern`** - Share personal pattern with team
32. ❌ **`list_patterns`** - List all learned patterns
33. ❌ **`migrate`** - Full migration workflow
34. ❌ **`migrate_to_multidev`** - Multi-dev migration
35. ❌ **`migrate_essentials`** - ESSENTIALS migration

### SKIP - Config Management (5)
These are human-oriented commands, not needed for AI workflow:
- ❌ `enable <feature>` - Feature toggle (manual config)
- ❌ `disable <feature>` - Feature toggle
- ❌ `uninstall` - Remove AIKnowSys (manual operation)
- ❌ Shortcut commands (done, wip, log, plan-activate, etc.) - Use full commands

## Implementation Priority

### Phase 1.2 - Missing Query Tools (NEXT)
Implement these 7 tools first (highest value, low risk):

1. **`query_plans`** - 1-2 hours
   - File: mcp-server/src/tools/query.ts
   - Wraps: bin/cli.js query-plans
   - Schema: status, author, topic, date filters

2. **`query_sessions`** - 1-2 hours
   - File: mcp-server/src/tools/query.ts
   - Wraps: bin/cli.js query-sessions
   - Schema: date, topic, plan filters

3. **`get_plans_by_status`** - 30 min
   - Simpler wrapper of query_plans

4. **`get_all_plans`** - 30 min
   - Wrapper of query_plans with no filters

5. **`get_session_by_date`** - 30 min
   - Wrapper of query_sessions with date filter

6. **`rebuild_index`** - 1 hour
   - File: mcp-server/src/tools/query.ts
   - Wraps: bin/cli.js rebuild-index

7. **`sync_plans`** - 1 hour
   - File: mcp-server/src/tools/mutations.ts
   - Wraps: bin/cli.js sync-plans

**Total time:** ~7-9 hours

### Phase 1.3 - Missing Mutation Tools (AFTER Phase 1.2)
Implement these 5 tools:

1. **`update_session_metadata`** - 2 hours
2. **`update_plan_metadata`** - 2 hours
3. **`archive_sessions`** - 1 hour
4. **`archive_plans`** - 1 hour
5. **`set_session_status`** - 30 min

**Total time:** ~6-7 hours

### Phase 1.4 - Enhanced Indexing (OPTIONAL)
Enhance search_context to index YAML frontmatter:
- Parse frontmatter during indexing
- Enable status-based queries
- Time: 2-3 hours

## Success Criteria

- [ ] All HIGH PRIORITY tools implemented (7 tools)
- [ ] All MEDIUM PRIORITY tools implemented (5 tools)
- [ ] Tool count: 20 → 32 (60% increase)
- [ ] Test coverage: 100% (TDD for all new tools)
- [ ] Documentation: Each tool has description
- [ ] Validation: All tools tested in real scenarios

## Notes

**User directive:** *"Add all the possible cli commands to the MCP"*

This gap analysis identifies 35+ missing commands. We'll prioritize:
1. Query tools (enable AI to find information)
2. Mutation tools (enable AI to modify state)
3. Skip setup/config (human-oriented, not AI workflow)

**Philosophy:** Focus on tools AI agents use frequently in coding workflows, not one-time setup commands.

---

*Part of PLAN_mcp_only_architecture.md Phase 1 - Complete MCP Tool Coverage*
