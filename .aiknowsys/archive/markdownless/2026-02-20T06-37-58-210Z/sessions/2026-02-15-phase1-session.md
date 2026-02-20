---
title: "Phase 1: Cross-Repository Foundation"
date: "2026-02-15"
topics: ["phase-1", "cross-repo", "global-database", "project-isolation", "knowledge-bank"]
status: "active"
plan: "knowledge_bank_evolution"
---

# Session: Phase 1 - Cross-Repository Foundation (Feb 15, 2026)

**Goal:** Create global `~/.aiknowsys/knowledge.db` accessible by all projects with proper project isolation

**Status:** 🎯 STARTING

---

## Plan Overview (from Knowledge Bank Evolution)

**Phase 1 Goals:**
- ✅ Global database at `~/.aiknowsys/knowledge.db`
- ✅ Projects isolated by project_id
- ✅ Cross-project query support
- ✅ Backward compatibility (local DBs still work)
- ✅ Migration tool for existing projects

**Timeline:** 1-2 weeks  
**Current Focus:** Day 1 - Understanding requirements and TDD setup

---

## Implementation Strategy

### 1.1 Database Schema Evolution

**What needs to change:**
- Add `project_id` column to sessions, plans, knowledge_events tables
- Create `projects` table for project registry
- Add foreign key constraints
- Add indexes for cross-project queries

**Migration approach:**
- Schema version tracking
- Incremental migrations (backward compatible)
- Test with multiple projects

### 1.2 Storage Adapter Refactoring

**Current architecture:**
- SqliteStorage uses local `.aiknowsys/knowledge.db`
- No concept of projects (single-project only)

**Phase 1 architecture:**
- Support both local AND global databases
- Auto-detect project from directory path
- Register projects on first use
- Filter queries by project_id automatically

### 1.3 Cross-Project Query Support

**New capabilities needed:**
- Query across ALL projects (`--all-projects` flag)
- Filter by specific project ID
- List available projects
- Project-scoped search

### 1.4 Testing Strategy (TDD)

**Test categories:**
- Cross-repo migration tests
- Project isolation tests
- Cross-project query tests
- Backward compatibility tests

---

## Work Plan (TDD Workflow)

### Phase 1.1: Schema Updates (RED → GREEN → REFACTOR)

**RED Phase: Write Failing Tests**
- [ ] Test: Global DB path resolves to `~/.aiknowsys/knowledge.db`
- [ ] Test: Projects table stores project metadata
- [ ] Test: Sessions/plans have project_id foreign key
- [ ] Test: Can query sessions for specific project
- [ ] Test: Can query sessions across all projects

**GREEN Phase: Implementation**
- [ ] Update lib/context/schema.sql with Phase 1 schema
- [ ] Add migration logic for existing databases
- [ ] Implement project detection and registration
- [ ] Update SqliteStorage to support global DB option

**REFACTOR Phase:**
- [ ] Extract project management to separate module
- [ ] Clean up storage adapter interface
- [ ] Add JSDoc documentation

### Phase 1.2: Cross-Project Queries (RED → GREEN → REFACTOR)

**RED Phase: Write Failing Tests**
- [ ] Test: search-context --all-projects queries all projects
- [ ] Test: query-sessions --project-id filters correctly
- [ ] Test: list-projects shows all registered projects
- [ ] Test: Each project's data stays isolated

**GREEN Phase: Implementation**
- [ ] Add --all-projects flag to search-context
- [ ] Add --project-id filter to query commands
- [ ] Create list-projects command
- [ ] Update MCP tools for cross-project support

**REFACTOR Phase:**
- [ ] Consolidate project filtering logic
- [ ] Add helpful error messages
- [ ] Performance optimization for cross-project queries

### Phase 1.3: Migration Tool (RED → GREEN → REFACTOR)

**RED Phase: Write Failing Tests**
- [ ] Test: Migrate local DB to global DB
- [ ] Test: Preserve all existing data
- [ ] Test: Handle conflicts (duplicate session IDs)
- [ ] Test: Dry-run mode works correctly

**GREEN Phase: Implementation**
- [ ] Create migrate-to-global command
- [ ] Implement data copying with conflict resolution
- [ ] Add progress reporting
- [ ] Add rollback support

**REFACTOR Phase:**
- [ ] Extract migration utilities
- [ ] Add comprehensive error handling
- [ ] Documentation and examples

---

## Current Progress

**Completed:**
- ✅ Read Phase 1 plan requirements
- ✅ Created session file for Phase 1 work
- ✅ Mapped out TDD workflow

**Next Steps:**
1. Read current schema.sql to understand structure
2. Design Phase 1 schema changes
3. Write first failing test (global DB path)
4. Implement global DB initialization
5. Continue RED-GREEN-REFACTOR cycle

---

## Notes

**Using MCP Tools:**
- ✅ Used `mcp_aiknowsys_get_active_plans()` to load plan
- ✅ Using `mcp_aiknowsys_create_session()` for session management
- 🎯 Will use MCP tools throughout implementation

**Key Decisions:**
- TBD: How to handle project ID generation (hash of path? UUID?)
- TBD: Global DB location configurable or fixed at `~/.aiknowsys/`?
- TBD: Migration strategy for plans (session_id → project_id mapping)

---

*Phase 1 implementation starting now!* 🚀

## Discovery

**Phase 1 Architecture Investigation Complete** ✅

**Key Findings:**

1. **Schema Design - 100% COMPLETE** ✅
   - lib/context/schema.sql: projects table, project_id foreign keys, indexes all exist
   - knowledge_events table also exists (Phase 2 ready!)

2. **Project Detection - 100% COMPLETE** ✅
   - lib/context/database-locator.ts (lines 40-76): DatabaseLocator class with 3-tier priority
   - Priority: AIKNOWSYS_DB_PATH > .aiknowsys.config > ~/.aiknowsys/knowledge.db (GLOBAL)
   - Auto-detection: git remote → owner-repo, fallback to directory name
   - Sanitization: lowercase, hyphens, proper escaping

3. **Migration Tools - USE DatabaseLocator** ✅
   - lib/migration/migration-coordinator.ts (lines 64-66): Uses locator.getProjectId()
   - Automatically registers projects during migration

**Gap Analysis:**

❌ **Commands Don't Use DatabaseLocator:**
   - bin/cli.js (line 170, 191, 237): All commands default to ./knowledge.db
   - Should use DatabaseLocator to get ~/.aiknowsys/knowledge.db by default
   - Need --all-projects flag for cross-project queries

**Impact:** Phase 1 is 95% done! Just need to wire up DatabaseLocator to commands + add cross-project flags.

**Next Steps:**
1. Write TDD tests for cross-project functionality (RED)
2. Refactor commands to use DatabaseLocator (GREEN)
3. Add --all-projects flag to query commands (GREEN)
4. Documentation (REFACTOR)

