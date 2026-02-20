---
id: "PLAN_markdown_less_architecture"
title: "JSON-Only AI Workflow (No Markdown for AI Agents)"
status: "COMPLETE"
author: "arno"
topics: 0
created: "2026-02-17"
updated: "2026-02-17"
started: "2026-02-17"
---

# Implementation Plan: JSON-Only AI Workflow (No Markdown for AI Agents)

**Status:** ✅ COMPLETE  
**Created:** 2026-02-17  
**Updated:** 2026-02-17 (Auto-linking for AI agents)  
**Goal:** AI agents work with JSON from database via MCP tools. No markdown files in `.aiknowsys/` during workflow. Auto-linking: sessions link to active plan automatically (no ID needed). Query results include related entities (one call gets everything). Constraints enforced by architecture. Humans export markdown on-demand.


## Progress

**2026-02-17:** ## Phase 1 Status - COMPLETE ✅

- ✅ **Schema Refinement:** Added `reviews`, `links`, `knowledge_events` tables.
- ✅ **Migration Tool:** Created `scripts/update-schema.ts`.
- ✅ **Storage Access Layer:** Added typed CRUD methods in `lib/context/sqlite-storage.ts`:
  - Reviews: `insertReview`, `queryReviews`, `updateReviewStatus`
  - Links: `insertLink`, `queryLinks`
  - Events: Full event sourcing support
- ✅ **Integration Coverage:** `test/context/sqlite-storage.test.ts` validates workflows.
- ✅ **Migration Workflow:** Added `npm run migrate:schema` and README documentation.

**2026-02-17:** ## Phase 2 Status - COMPLETE ✅

- ✅ **Constraint Engine:** Implemented `lib/core/constraints.ts` enforcing:
  - Plan completion blocked by Pending Reviews (Reviews table check).
  - Plan completion blocked by Missing Validation Event (Event Sourcing check).
  - Core file edits blocked if no Active Plan (Focus check).
- ✅ **Event Logging:** Created `lib/tools/log-work-event.ts` for structured `knowledge_events`.
- ✅ **Unit Tests:** Verified constraints logic in `test/unit/core/constraints.test.ts`.
- ✅ **Integration Tests:** Confirmed Foreign Key enforcement on `knowledge_events` table.

**2026-02-17:** ## Plan Simplified

- ✅ **Kept:** `user_state` table (required for auto-linking via `active_plan_id`).
- ❌ **Removed:** `set_focus()` tool (better to use targeted search queries).
- ✅ **Focus:** Core constraint enforcement + export commands for human review.

**2026-02-17:** ## Merged from PLAN_event_sourced_storage.md (Original Feb 15 Plan)

**✅ Already Incorporated:**
- ✅ Event sourcing architecture (knowledge_events table)
- ✅ Database as source of truth (markdown as derivative)
- ✅ Foreign key relationships
- ✅ Constraint engine
- ✅ Export-on-demand workflow

**🔲 Now Incorporated (from original):**
- 🔲 Schema enhancements: `narrative`, `embedding`, `related_events` columns
- 🔲 Multiple export formats (narrative, timeline, grouped, custom)
- 🔲 Token efficiency metrics (98%+ savings justification)
- 🔲 Git workflow strategies (3 options documented)
- 🔲 Event type naming convention consideration (snake_case vs SCREAMING_CASE)

**🔮 Future Enhancements (from original, not blocking):**
- 🔮 Semantic search with embeddings (@xenova/transformers + sqlite-vss)
- 🔮 Cross-repo pattern discovery
- 🔮 AI-generated insights ("velocity increased 30%")
- 🔮 Collaborative knowledge sharing (team event logs)
- 🔮 Temporal queries ("what was I working on 6 months ago?")

**2026-02-17:** ## Linking Analysis - What AI Agents Actually Want

**The Simplest Possible Experience:**

**Auto-linking (best case):**
```javascript
// Agent creates session - no plan specified
create_session({ title: "Implement auth" })
→ System checks: "Active plan exists? → Auto-link!"
→ Returns: { sessionId: "2026-02-17", linkedTo: { planId: "PLAN_xyz", title: "Auth Feature" } }
```

**Explicit linking (when needed):**
```javascript
// Agent wants specific plan (not the active one)
create_session({ title: "Hotfix", planId: "PLAN_bugfix" })
→ Returns: { sessionId, linkedTo: { planId: "PLAN_bugfix" } }
```

**Querying includes links (no extra calls):**
```javascript
// Agent queries session
get_session({ sessionId: "2026-02-17" })
→ Returns: {
  id: "2026-02-17",
  title: "Work",
  plan: { id: "PLAN_xyz", title: "Auth" },  // ← Included automatically
  events: [...],
  reviews: [...]  // ← Also included
}
```

**What EXISTS:**
- ✅ Database schema has FKs (sessions.plan_id → plans.id)
- ✅ Storage layer works (`insertSession`, `insertReview`, `insertLink`)
- ✅ `user_state` table exists (tracks active_plan_id)

**What's MISSING:**
- ❌ Auto-linking based on `user_state.active_plan_id`
- ❌ Query results don't include related entities (plan, reviews)
- ❌ No `create_review` or `create_link` MCP tools
- ❌ `createSessionCore` doesn't pass `plan` to DB in hybrid path

**Next:** Phase 3 - Make linking invisible/trivial for AI agents

**2026-02-18:** ### 2026-02-18 Continuation Checkpoint (MCP create_session hybrid wiring)
- Added RED test in `mcp-server/test/tools/mutations.test.ts` asserting `create_session` initializes and closes SQLite storage.
- Updated `mcp-server/src/tools/mutations.ts#createSession()` to initialize `SqliteStorage` via `findKnowledgeDb()`, pass storage to `createSessionCore`, and close in `finally`.
- Expanded test mocks to include hybrid storage methods (`insertProject`, `insertSession`, `insertEvent`, `getActivePlanId`) to support core hybrid path safely.
- Targeted validation passed:
  - `npx vitest run --config mcp-server/vitest.config.ts mcp-server/test/tools/mutations.test.ts`
  - `npx vitest run test/core/create-session.test.ts`
- Workspace-level validation note:
  - `npm run lint` passes with existing repository warnings.
  - `npm test` reports 3 existing unrelated failures in `test/core/update-plan.test.ts` (constraint enforcement expectations) and `test/integration/hybrid-storage.test.ts` (FK expectation mismatch).

**2026-02-18:** ### 2026-02-18 Architect Feedback Addressed (MCP mutation hardening)
- Refactored `mcp-server/src/tools/mutations.ts` to use shared `withStorage()` helper, removing duplicated storage lifecycle logic across `createSession`, `createReview`, and `createLink`.
- Fixed resource leak risk by enforcing guaranteed `storage?.close()` in `finally` via helper wrapper.
- Added regression tests in `mcp-server/test/tools/mutations.test.ts` for error paths:
  - `createReview` closes storage when `insertReview` throws.
  - `createLink` closes storage when `insertLink` throws.
- Validation:
  - `npx vitest run --config mcp-server/vitest.config.ts mcp-server/test/tools/mutations.test.ts` ✅ (18 passed, 8 skipped)
  - `get_errors` on changed files ✅ (no errors)

**2026-02-18:** ### 2026-02-18 Continuation: additional cleanup hardening
- Added `createSession` regression test in `mcp-server/test/tools/mutations.test.ts` to assert storage cleanup on failure path (`mockStorageInit` rejection).
- Removed obsolete subprocess scaffolding from `mcp-server/src/tools/mutations.ts` (`promisify`/`execFile` imports and `execFileAsync` dead code).
- Removed obsolete subprocess mocks from mutation tests (`child_process` and `util.promisify` test scaffolding).
- Validation:
  - `npx vitest run --config mcp-server/vitest.config.ts mcp-server/test/tools/mutations.test.ts` ✅ (19 passed, 8 skipped)

**2026-02-18:** ### 2026-02-18 Architect Suggestion Applied (error context hardening)
- Updated `mcp-server/src/tools/mutations.ts` `withStorage()` wrapper to rethrow with operation-specific context (`createSession/createReview/createLink storage operation`).
- Added regression assertions in `mcp-server/test/tools/mutations.test.ts` to verify contextual error messages on failure paths while maintaining storage cleanup guarantees.
- Validation: `npx vitest run --config mcp-server/vitest.config.ts mcp-server/test/tools/mutations.test.ts` ✅ (19 passed, 8 skipped).

**2026-02-18:** **2026-02-18:** ### 2026-02-18 Continuation: export command scaffolding + format support
- Added unified CLI command group in `bin/cli.js`: `aiknowsys export session|sessions|plan` while preserving existing `export-session`, `export-sessions`, `export-plan` commands for backward compatibility.
- Added session export format option in `lib/types/index.ts` and `lib/commands/export-session.ts` (`narrative`, `timeline`, `grouped`, `custom`) with lightweight `custom` scaffold output.
- Follow-up noted: implement distinct `custom` behavior (AI/query-focused output) rather than narrative wrapper in a later Phase 3 slice.
- Added RED→GREEN tests:
  - `test/export-group.test.ts` validates grouped export CLI help + `--format` option.
  - `test/commands/export-session-formats.test.ts` validates `timeline/grouped/custom` output and invalid format handling.
- Validation:
  - `npx vitest run test/export-group.test.ts test/commands/export-session-formats.test.ts` ✅ (6 passed)
  - `node bin/cli.js --help` ✅
  - `npm run lint` ✅ (existing repository warnings only).

**2026-02-18:** 
**2026-02-18:** ### 2026-02-18 Continuation: export plan format parity + CLI wiring
- Added plan export format support in `lib/commands/export-plan.ts` for `narrative`, `timeline`, `grouped`, and `custom` (custom remains scaffold output by design).
- Added format validation for `exportPlan()` with clear error message for invalid values.
- Added grouped helpers for plan markdown generation and kept narrative output as default when `format` is omitted.
- Updated CLI wiring in `bin/cli.js`:
  - `aiknowsys export plan <id> --format <type>`
  - `aiknowsys export-plan <id> --format <type>`
- Added RED→GREEN tests:
  - `test/commands/export-plan-formats.test.ts` validates `timeline/grouped/custom` output and invalid format rejection.
  - `test/export-group.test.ts` validates `export plan --help` exposes `--format`.
- Validation:
  - `npx vitest run test/export-group.test.ts test/commands/export-plan-formats.test.ts test/commands/export-session-formats.test.ts` ✅ (12 passed)
  - `node bin/cli.js export plan --help` ✅
  - `npm run lint` ✅ (existing repository warnings only).

**2026-02-18:**

**2026-02-18:** ### End-of-Day Update (2026-02-18, 22:41)

- Phase B/continuation work is in a stable validated state.
- Architect follow-up issues were implemented and verified.
- Test stabilization complete for previously failing suites (`hybrid-storage`, `update-plan`, `base-template`).
- Current full validation status:
  - `npm test`: ✅ 1530 passed, 4 skipped
  - `npm run lint`: ✅ 0 errors (warnings are pre-existing)
  - `npx aiknowsys validate-deliverables`: ✅ 5/5

**Next session priorities:**
1. Consolidate and group commits by concern.
2. Draft/submit PR with migration notes and validation evidence.
3. Continue next plan phase from this clean checkpoint.

**2026-02-19:** ### 2026-02-19: MCP plan pointer sync into DB (`user_state.active_plan_id`)

- Implemented DB pointer sync in MCP mutation tools:
  - `create_plan` now writes active plan pointer to SQLite user state.
  - `set_plan_status` now updates/clears pointer based on lifecycle status.
- Added regression tests for both paths in MCP test suite.
- Targeted MCP validation passed (46 passed, 8 skipped).
- Full `npm test` currently shows one unrelated date-sensitive failure in `test/context-learning.test.ts` (session count assertion).

**2026-02-19:** ### 2026-02-19 Strict Markdownless Continuation (Phase 5/15 follow-up)
- Updated `AGENTS.md` fallback and plan-management guidance to DB-first (`query-plans/query-sessions`, MCP mutation tools) and removed direct `.aiknowsys/sessions/*.md` / `active-*.md` workflow instructions.
- Updated `templates/AGENTS.template.md` with the same DB-first workflow to preserve deliverable consistency.
- Updated `SETUP_GUIDE.md` to remove `sync-plans` hook references from collaboration and troubleshooting sections.
- Removed `sync-plans` command from `bin/cli.js` command surface (import + command registration removed).
- Validation: `node bin/cli.js --help` ✅ and `npx aiknowsys validate-deliverables` ✅ (5/5).

**2026-02-19:** ### 2026-02-19 Continuation: file-command deprecation + sync-plans command archival
- Marked file mutation commands as human-CLI-oriented with explicit MCP-first warnings in `create-session`, `update-session`, `create-plan`, and `update-plan`.
- Removed `lib/commands/sync-plans.ts` wrapper and migrated all callsites to `syncPlansCore` (`update-plan`, `migrate-to-multidev`, `init/templates`, `mcp-server query tool`).
- Updated active hooks/docs to remove stale `npx aiknowsys sync-plans` guidance.
- Updated tests to target `syncPlansCore` (`test/sync-plans.test.ts`).
- Validation: `node bin/cli.js --help` ✅ and `npx vitest run test/sync-plans.test.ts` ✅ (9/9).

**2026-02-19:** Architect follow-up: corrected team-index guidance wording

**2026-02-19:** Architect follow-up: synced dist runtime guidance for CURRENT_PLAN generation

**2026-02-19:** 
### Follow-up Tech Debt (2026-02-20)
- `MigrationCoordinator.insertLearned()` now uses `getPlanById` lookups to avoid per-file full table scans.
- Remaining optimization opportunity: audit other migration paths still using broad `queryPlans({})` patterns and replace with direct ID queries where applicable.

**2026-02-19:** 
### Phase 6 Event Backfill Validation (2026-02-20)
- Ran real migration against project DB: `node bin/cli.js migrate-to-sqlite --dir . --db-path .aiknowsys/knowledge.db --verbose`
- Important runtime note: CLI executes `dist/*`, so source changes in `lib/*.ts` required `npm run build` before migration to activate new logic.
- Post-build migration/backfill result in `.aiknowsys/knowledge.db`:
  - `learned` plans: 43
  - `pattern_discovered` events: 43 ✅
- This satisfies the Phase 6 success criterion for learned-pattern event backfill (`42+` expected).

**2026-02-19:** 
### Workflow Alignment Update (2026-02-20)
- Updated `AGENTS.md` and `templates/AGENTS.template.md` continuous-learning guidance to prefer DB-first pattern storage via `create_learned_pattern` MCP mutation.
- Added explicit fallback note for manual file-based workflows when MCP is unavailable.
- Validation: `npx aiknowsys validate-deliverables` passed (`5/5`).

## Architect Handoff Note (Feb 18, 2026)

**Checkpoint 15 — Phase A ready to start.**

Reviewed by Senior Architect. All 4 phases scoped and documented in checkpoint 15.
Next developer action: implement Phase A (own files, no template risk).

**Files to update in Phase A:**
- `AGENTS.md` — replace "read/update CODEBASE_ESSENTIALS.md" with MCP calls
- `.github/agents/architect.agent.md` — replace "Read CODEBASE_ESSENTIALS.md before review" → `get_critical_invariants()`
- `.github/agents/planner.agent.md` — replace ESSENTIALS grep → MCP query
- `SETUP_GUIDE.md` — remove ESSENTIALS customisation sections, point to MCP setup

**Validation after Phase A:** `grep -r "CODEBASE_ESSENTIALS" AGENTS.md .github/agents/ SETUP_GUIDE.md` should return zero hits.
**Then proceed to Phase B** (templates — run `npx aiknowsys validate-deliverables` after).

## Overview

**The Core Insight: AI Agents Don't Need Markdown Files**

AI agents need structured data, not human-readable text. Markdown is a HUMAN format.

**What AI Agents ACTUALLY Want:**

```javascript
// Current (Painful):
create_session({ title: "Work", planId: "PLAN_xyz" })  // Need to know plan ID?
→ Returns: { filePath: ".aiknowsys/sessions/session.md" }
AI: read_file("session.md")  // Parse YAML, hope it's valid
AI: Want to know plan details? Search for PLAN_xyz.md, read, parse...

// Ideal (What this plan implements):
create_session({ title: "Work" })  // No plan ID needed!
→ System: "Active plan exists? → Auto-link!"
→ Returns: {
  sessionId: "2026-02-17",
  title: "Work",
  plan: { id: "PLAN_xyz", title: "Auth Feature" },  // ← Included!
  events: [],
  reviews: []
}
AI: Everything I need in one JSON response!
```

**The Core Insight: AI Agents Don't Need Markdown Files**

AI agents need structured data, not human-readable text. Markdown is a HUMAN format.

**Problems with Current Markdown Workflow:**
1. **Files exist** → AI agents see them → AI agents edit them → Corruption
2. **YAML parsing** → AI must parse frontmatter → Format variations → Errors
3. **Inconsistent responses** → AI reads different markdown structures → Unpredictable
4. **No enforcement** → Files can be in any state → No validation guarantees

**Solution: Remove Markdown from AI Workflow**

**For AI Agents:**
- ✅ **MCP tools return JSON** - Same structure every time (from database)
- ✅ **No files to edit** - Can't corrupt what doesn't exist
- ✅ **Architecture enforces constraints** - Database schema + foreign keys + validation
- ✅ **Predictable workflow** - `call_tool() → get_json() → use_data()`

**For Humans:**
- ✅ **Export on-demand** - `aiknowsys export session X` generates readable markdown
- ✅ **Git integration** - Export for commits/PRs when team needs to review
- ✅ **No sync issues** - Export is always current (generated from DB)

**Constraint by Design:**
> If `.aiknowsys/` has no markdown files during AI workflow, AI agents physically cannot edit them. Workflow enforcement through architecture, not documentation.

**Example: What AI Agents Actually Get**

*Current (Markdown-Based):*
```javascript
AI: read_file(".aiknowsys/session.md")
Response: "---\ntitle: My Session\nstatus: active\n---\n## Progress\nSome text..."
AI: Must parse YAML, hope format is correct, extract data
AI: replace_string_in_file to update → Risk of corruption
```

*New (JSON from Database):*
```javascript
AI: mcp_aiknowsys_query_sessions_sqlite({ sessionId: "123" })
Response: {
  "id": "123",
  "title": "My Session", 
  "status": "active",
  "events": [
    { "type": "VALIDATION_PASS", "timestamp": "2026-02-17T10:00:00Z" }
  ],
  "linked_plan": { "id": "PLAN_xyz", "title": "Feature Work" }
}
AI: Use JSON directly → No parsing, no risk, always valid
```

**Key Difference:**
- Markdown = Human format requiring parsing, prone to corruption
- JSON from DB = Machine format, validated, consistent structure every time

## Requirements
- **No Markdown in AI Workflow:** `.aiknowsys/` contains only SQLite DB during AI operations
- **MCP Tools Return JSON:** Structured data from database (not parsed markdown)
- **Architecture Enforces Constraints:** Can't edit files that don't exist
- **Database as Single Source:** All data lives in SQLite with proper schemas
- **Proper Entity Linking:** Foreign keys ensure plans ↔ sessions ↔ reviews ↔ events
- **Easy Retrieval:** SQL queries, not file scanning + YAML parsing
- **Token Efficiency:** 98%+ savings (600 tokens for 3 events vs 160K for markdown session)
- **Semantic Search:** Vector embeddings enable "find patterns about X" queries
- **Human Export On-Demand:** `aiknowsys export` generates markdown when humans need it
- **Multiple Export Formats:** Narrative, timeline, grouped, or AI-generated custom views
- **Remove sync-plans:** Not needed - no files to sync

## Architecture Changes

### 1. Schema Extensions (`lib/context/schema.sql`)
- **New Table: `reviews`** ✅ (Implemented)
  - Columns: `id` (UUID), `project_id`, `target_id` (plan/session ID), `author`, `status` (PENDING, ACTIVE, ADDRESSED), `content`, `created_at`, `updated_at`.
  - Purpose: Track review status; PENDING reviews block plan completion.
  - **Foreign Key:** `target_id` references `plans.id` or `sessions.id`
  
- **New Table: `links`** ✅ (Implemented)
  - Columns: `source_id`, `target_id`, `type`, `metadata` (JSON).
  - Purpose: Connect related entities (plan → session → review).
  - **Foreign Keys:** Enforce referential integrity
  - **Enables Queries:** "Find all sessions for plan X", "Find all reviews for session Y"
  
- **Enhanced Table: `knowledge_events`** ✅ (Partially Implemented, needs enhancement)
  - **Current Columns:** `id`, `session_id`, `type`, `data` (JSON), `timestamp`
  - **Missing Columns (from original plan):**
    - `narrative` TEXT - Optional 1-2 sentence human summary per event
    - `embedding` BLOB - 384-dim semantic vector (1.5KB per event)
    - `related_events` JSON - Event dependencies/graph links
  - **Event Type Convention:** Consider snake_case (task_completed) vs SCREAMING_CASE (VALIDATION_PASS)
  - Purpose: Event sourcing - structured audit trail replacing markdown blobs
  - **Foreign Key:** `session_id` references `sessions.id`
  - **Enables Queries:** "Show validation events", "Semantic search for patterns", "Event timeline analysis"

### 2. Core Logic (`lib/core/`)
- **New:** `constraints.ts` ✅ (Implemented) - Logic to validate actions against current state:
  - Cannot complete plan if active review exists
  - Cannot complete plan if no validation event recorded
  - Core file edits require active plan
- **New:** `events.ts` (TODO) - Helpers to log structured events

### 3. MCP Tool Updates (`mcp-server/src/tools/`)
- **Update:** `mutations.ts` (TODO) - Enforce constraint checks before mutations
- **New Tools:**
  - `log_work_event({ type, payload })` ✅ (Implemented) - Log structured work events
  - `check_constraints()` (TODO) - Returns what actions are allowed/blocked

### 4. Export Commands (Human Interface)
- **New CLI:** `aiknowsys export session <id>` (TODO) - Generates Markdown from Events/DB
  - **Formats:** `--format narrative` (traditional), `timeline` (chronological), `grouped` (by type), `custom` (AI-generated)
- **New CLI:** `aiknowsys export plan <id>` (TODO) - Generates plan Markdown

### 5. Semantic Search (Future Enhancement)
- **Embeddings:** @xenova/transformers with all-MiniLM-L6-v2 (384-dim, 80MB model)
- **Vector Search:** sqlite-vss for "find patterns about X" queries
- **Storage Overhead:** 1.5KB per event (negligible - 55MB/year for 100 events/day)

## Implementation Steps

### Phase 1: Database Foundation ✅ COMPLETE
**Goal:** Add tables for events, reviews, links with full CRUD operations.

1. ✅ **Schema Definition** - Added `reviews`, `links`, `knowledge_events` tables
2. ✅ **Migration Tool** - Created `scripts/update-schema.ts`
3. ✅ **Storage Layer** - Implemented typed CRUD in `lib/context/sqlite-storage.ts`
4. ✅ **Integration Tests** - Validated workflows in `test/context/sqlite-storage.test.ts`

### Phase 2: Constraint Engine ✅ COMPLETE
**Goal:** Enforce workflow rules programmatically.

3. ✅ **Constraint Logic** (`lib/core/constraints.ts`)
   - Block plan completion if pending reviews exist
   - Block plan completion if no validation event recorded
   - Core file edits require active plan
4. ✅ **Event Logging** (`lib/tools/log-work-event.ts`)
   - Log structured work events to `knowledge_events` table
5. ✅ **Unit Tests** - Validated constraints in `test/unit/core/constraints.test.ts`

### Phase 3: Auto-Linking & Export Commands (NEXT)
**Goal:** Make linking invisible/trivial for AI agents + generate Markdown for humans.

6. **Fix Session-Plan Linking** (File: `lib/core/create-session.ts`)
   - **Action:** Pass `plan` parameter to `insertSession()` in hybrid storage path (line 170)
   - **Why:** Explicit planId should be stored in DB
   - **TDD:** Test session with planId creates proper FK link

7. **Add Auto-Linking Logic** (File: `lib/core/create-session.ts`)
   - **Action:** If no `plan` provided, check `user_state.active_plan_id` and auto-link
   - **Flow:** `plan || (await getUserActivePlan(storage, projectId)) || null`
   - **TDD:** Test auto-linking when active plan exists
   - **AI Benefit:** Agent doesn't need to remember/specify plan ID!

8. **Enhance Query Results** (File: `lib/context/sqlite-storage.ts`)
   - **Action:** Update `getSession()` to JOIN plans table and include plan metadata
   - **Action:** Update `getSession()` to include reviews (LEFT JOIN reviews WHERE target_id = session.id)
   - **TDD:** Test query returns session with plan and reviews included
   - **AI Benefit:** One call gets everything, no follow-up queries needed!

9. **Create Review MCP Tool** (File: `mcp-server/src/tools/mutations.ts`)
   - **Action:** Add `create_review({ targetId, content, author? })` tool
   - **Easy:** `create_review({ targetId: "session-123", content: "LGTM" })`
   - **TDD:** Test review creation and automatic linking

10. **Create Link MCP Tool** (File: `mcp-server/src/tools/mutations.ts`)
    - **Action:** Add `create_link({ sourceId, targetId, type })` tool
    - **Types:** `depends_on`, `relates_to`, `blocks`, `implements`
    - **Easy:** `create_link({ sourceId: "PLAN_X", targetId: "PLAN_Y", type: "depends_on" })`
    - **TDD:** Test link creation and querying

11. ✅ **Export Session - Multiple Formats** (File: `lib/commands/export-session.ts`) — DONE 2026-02-18
    - All 4 formats implemented: `narrative`, `timeline`, `grouped`, `custom` (scaffold)
    - Tests: `test/commands/export-session-formats.test.ts` ✅
   
12. ✅ **Export Plan** (File: `lib/commands/export-plan.ts`) — DONE 2026-02-18
    - All 4 formats with parity to session export
    - Tests: `test/commands/export-plan-formats.test.ts` ✅

13. ✅ **CLI Integration** (File: `bin/cli.js`) — DONE 2026-02-18
    - `aiknowsys export session|plan <id> [--format <type>]` wired and validated

### Phase 6: Learned Patterns Pipeline (NEW — Articulus Prerequisite)
**Goal:** Wire every `learned/` pattern creation to the DB event store. Make the pattern corpus queryable, embeddable, and retrievable by the system — not just discoverable by humans browsing files.

**Why this blocks Articulus:** The mediator needs the pattern corpus in the DB to build its grammar over. 42 patterns exist as orphan files. Zero `PATTERN_DISCOVERED` events exist. The system is autopoietic in practice but blind to its own production.

18. **New MCP tool: `create_learned_pattern`** (File: `mcp-server/src/tools/mutations.ts`)
    - **Action:** Single tool that does both: writes `.aiknowsys/learned/<slug>.md` AND inserts `PATTERN_DISCOVERED` event into `knowledge_events`
    - **Required fields:** `pattern` (title/slug), `solution`, `category`, `trigger`, `reusable`
    - **Replaces:** The manual AGENTS.md instruction to write a file by hand
    - **Why:** Agent can't skip the event — tool is the only path. File becomes a DB projection, not the source.
    - **TDD:** Test that calling the tool produces both a file and a queryable `PATTERN_DISCOVERED` event with matching content
    - **Risk:** Low — additive, no existing code removed yet

19. **Migrate existing 42 learned files to DB events** (File: `lib/migration/event-migrator.ts` or new `learned-migrator.ts`)
    - **Action:** One-time migration: scan `.aiknowsys/learned/*.md`, parse frontmatter + body, insert `PATTERN_DISCOVERED` event per file, set `sessionId` from `origin`/`source` frontmatter if parseable
    - **Idempotent:** Skip if event already exists for that pattern slug
    - **Why:** Closes the gap retroactively — existing corpus enters the queryable store
    - **Provenance note:** Most files have partial metadata (`created`, `source`, `origin`). Use what's there; leave `sessionId` null where not determinable.
    - **TDD:** Test migration with a fixture `learned/` directory; verify event count matches file count

20. **Replace AGENTS.md `learned/` file-write instruction with MCP tool call** (File: `AGENTS.md`, `templates/AGENTS.template.md`)
    - **Action:** Replace:
      > "Create learned skill in `.aiknowsys/learned/`"
      with:
      > "Call `create_learned_pattern({ pattern, solution, category, trigger, reusable })` MCP tool"
    - **Effect:** File is still created (backward compat for humans browsing), but event is now mandatory
    - **TDD:** No code — validate with `npx aiknowsys validate-deliverables` after templates updated

21. **Verify corpus is queryable** (validation step)
    - Run: `npx aiknowsys query-events --type pattern_discovered --json`
    - Expected: 42+ events returned
    - Run: `npx aiknowsys search-context "refactoring"` → should surface `refactoring-best-practices` via event store, not file scan
    - **Definition of done:** Pattern retrieval goes through DB, not filesystem

### Phase 4: MCP Tool Integration (AFTER Phase 3)
**Goal:** Integrate constraints into AI workflow.

12. **Update Mutation Tools** (File: `mcp-server/src/tools/mutations.ts`)
    - **Action:** Call `checkConstraints()` before plan completion
    - **Output:** Clear error messages when blocked
    - **TDD:** Mock constraint failures, verify tool response

13. **Add Constraint Check Tool** (File: `mcp-server/src/tools/check-constraints.ts`)
    - **Action:** Expose `check_constraints()` to AI
    - **Output:** JSON of allowed/blocked actions with reasons
    - **TDD:** Verify correct constraint reporting

### Phase 5: Workflow Enforcement (FINAL)
**Goal:** Complete the transition - no markdown files in AI workflow.

14. **Update AGENTS.md** (File: `AGENTS.md`)
    - **Action:** Document new workflow paradigm with auto-linking
    - **Add:** "`.aiknowsys/` contains ONLY `knowledge.db` during AI workflow - no .md files"
    - **Add:** "MCP tools return JSON from database (not markdown parsing)"
    - **Add:** "Linking is automatic: `create_session({ title })` → auto-links to active plan"
    - **Add:** "Query results include related data: `get_session()` returns session + plan + reviews"
    - **Remove:** All instructions about editing session/plan markdown files
    - **Clarify:** "Export commands are for HUMANS to generate markdown when needed"
    - **Examples:**
      ```javascript
      // Auto-linking (easiest)
      create_session({ title: "Work" })
      → Auto-links to active plan, no plan ID needed!
      
      // Explicit linking (when needed)
      create_session({ title: "Hotfix", planId: "PLAN_bugfix" })
      
      // Query includes everything
      get_session({ sessionId: "2026-02-17" })
      → Returns: { id, title, plan: {...}, events: [...], reviews: [...] }
      ```

15. **Remove CODEBASE_ESSENTIALS.md entirely** (Files: multiple)
    - **Rationale:** File is redundant once MCP serves invariants/validation matrix live. 909 lines
      of docs that drift, duplicate AGENTS.md, and encourage `read_file` over `get_critical_invariants()`.
      The endgame is: AGENTS.md instructs agents to use MCP tools — no static file needed.
    - **Phase A — Update this project's own files** (no template risk):
      - `AGENTS.md`: Remove all "read/update CODEBASE_ESSENTIALS.md" instructions; replace with MCP calls
      - `.github/agents/architect.agent.md`: Replace "Read CODEBASE_ESSENTIALS.md before review" → `get_critical_invariants()`
      - `.github/agents/planner.agent.md`: Replace ESSENTIALS grep → MCP query
      - `SETUP_GUIDE.md`: Remove ESSENTIALS customisation sections; point to MCP setup instead
    - **Phase B — Update templates** (Invariant #4 applies — requires validate-deliverables):
      - `templates/AGENTS.template.md`: Replace all ESSENTIALS references with MCP instructions
      - `templates/CODEBASE_ESSENTIALS.template.md`: Delete (no longer a deliverable)
      - `templates/agents/planner.agent.template.md`: Replace ESSENTIALS grep → MCP query
      - `templates/agents/USAGE.txt`: Update purpose description
    - **Phase C — Update examples**:
      - `examples/filled-simple-api/AGENTS.md`: Replace ESSENTIALS references with MCP pattern
    - **Phase D — Delete the file**:
      - `git rm CODEBASE_ESSENTIALS.md`
      - `git rm CODEBASE_ESSENTIALS.md.backup` (if exists)
    - **TDD:** No new code — validate with `npx aiknowsys validate-deliverables` after Phase B
    - **Definition of done:** `grep -r "CODEBASE_ESSENTIALS" . --include="*.md" --include="*.ts" --include="*.js"` returns only historical entries in RELEASE_NOTES and CODEBASE_CHANGELOG

16. **Deprecate File Commands** (Files: `lib/commands/create-session.ts`, etc.)
    - **Action:** Mark file-based mutations as "human CLI only"
    - **Add:** Warnings that MCP tools should be used for programmatic access
    - **Keep:** For humans who want to manually create sessions via CLI

17. **Remove/Archive sync-plans** (File: `lib/commands/sync-plans.ts`)
    - **Action:** Remove from main commands (no files to sync)
    - **Alternative:** Migration tool to import old markdown → database (one-time)

## Testing Strategy
**TDD Approach:** Write tests BEFORE implementation for all new features.

**Test Coverage:**
- ✅ Unit tests: Constraint logic (mock DB)
- ✅ Integration tests: Storage CRUD operations (real SQLite)
- 🔲 Workflow tests: Full cycle (Plan → Session → Event → Export) via MCP tools
- 🔲 CLI tests: Export commands produce valid Markdown

## Token Efficiency Analysis (Original Plan Justification)

**Why Events Beat Markdown:**

| Scenario | Markdown | Events | Savings |
|----------|----------|--------|------|
| 1 day of work | 80KB (160K tokens) | 20 events (2K tokens) | **98.75%** |
| Query "what pattern?" | 160K (full session) | 1 event (80 tokens) | **99.95%** |
| 7 days browsing | 560KB (1.1M tokens) | 140 events (14K tokens) | **98.73%** |
| Semantic search | N/A (no embeddings) | 5 events (400 tokens) | **∞** |

**Multi-User Scaling:**

| Users | Sessions/Year | Markdown Size | Events Size | Savings |
|-------|---------------|---------------|-------------|--------|
| 1 | 365 | 29MB | 11MB | 62% |
| 10 | 3,650 | 292MB | 110MB | 62% |
| 100 | 36,500 | 2.9GB | 1.1GB | **62%** |

**With markdown:** 2.9GB (git becomes slow, queries impossible)  
**With events:** 1.1GB (queryable, semantic search, fast)

---

## Git Workflow Strategies

**Option A: No Markdown Commits** (Simplest)
```gitignore
# .gitignore
.aiknowsys/sessions/*.md  # Generated on-demand only
```
- ✅ Smallest repo size
- ❌ No PR diffs for human review

**Option B: Pre-Commit Hook Auto-Export** (Best of both)
```bash
# .git/hooks/pre-commit
# Export today's session to markdown, stage it, commit both
npx aiknowsys export session --today
git add .aiknowsys/sessions/$(date +%Y-%m-%d)-session.md
```
- ✅ PR diffs work (markdown in git)
- ✅ Source of truth is events (markdown derivative)
- ✅ Humans get readable diffs

**Option C: Commit Summaries Only** (Hybrid)
```bash
# Export 2KB summary instead of 80KB full session
npx aiknowsys export summary --today
```
- ✅ Compact git history
- ✅ Human overview available
- ❌ Full details require DB access

---

## Risks & Mitigations
- **Risk:** Developers lose immediate file access for review.
  - **Likelihood:** High
  - **Impact:** Medium
  - **Mitigation:** Prioritize Phase 3 (export commands) for easy access.

- **Risk:** Git diffs on SQLite are binary (not human-readable).
  - **Likelihood:** High
  - **Impact:** Medium (for team review)
  - **Mitigation:** Pre-commit hook to auto-export + commit Markdown alongside DB.

- **Risk:** Constraint logic becomes too strict, blocks legitimate workflows.
  - **Likelihood:** Low (can be tuned)
  - **Impact:** High (frustrating for AI agents)
  - **Mitigation:** Add `--force` flags for human override when needed.

- **Risk:** Loss of human context (structured events lose narrative flow).
  - **Likelihood:** Medium
  - **Impact:** Medium (humans prefer prose)
  - **Mitigation:** 
    - Keep optional `narrative` field (1-2 sentences per event)
    - Generate markdown with AI-written prose connecting events
    - Support multiple formats (narrative, timeline, grouped)

- **Risk:** Event type proliferation (too many types, hard to maintain).
  - **Likelihood:** Medium
  - **Impact:** Low (manageable)
  - **Mitigation:**
    - Start with 6 core types (task, pattern, decision, validation, bug, learning)
    - Extensible `data` JSON (no schema changes for new fields)
    - Document event types in schema registry

## Success Criteria
- ✅ Schema supports events, reviews, links with proper foreign keys
- ✅ Constraint engine blocks invalid state transitions
- ✅ Event logging captures AI work actions
- 🔲 **Linking is invisible/trivial for AI agents:**
  - 🔲 `create_session({ title })` → Auto-links to active plan (no ID needed!)
  - 🔲 `create_session({ title, planId })` → Explicit link override works
  - 🔲 `get_session({ sessionId })` → Returns session + plan + reviews (one call!)
  - 🔲 `create_review({ targetId, content })` → Simple review creation
  - 🔲 `create_link({ sourceId, targetId, type })` → Explicit relationships when needed
- 🔲 **No markdown files in `.aiknowsys/` during AI workflow** (only `knowledge.db`)
- 🔲 **MCP tools return JSON from database** (no markdown parsing)
- 🔲 **AI agents physically cannot edit markdown** (files don't exist)
- 🔲 Export commands generate clean Markdown from database for humans
- 🔲 MCP tools integrate constraint checks
- 🔲 AGENTS.md documents auto-linking workflow with examples
- 🔲 sync-plans removed (no files to sync)
- 🔲 Documentation shows: "Agent creates session → auto-linked → query returns everything"
- 🔲 **Schema enhancements applied:**
  - 🔲 `narrative` TEXT column added to knowledge_events
  - 🔲 `embedding` BLOB column added (for future semantic search)
  - 🔲 `related_events` JSON column added (event graph)
- 🔲 **Export formats implemented:**
  - 🔲 Narrative format (prose connecting events)
  - 🔲 Timeline format (chronological with timestamps)
  - 🔲 Grouped format (by event type)
  - 🔲 Custom format (AI-generated based on query)
- 🔲 **Git workflow chosen:** (Option A/B/C documented, team decides)
- 🔲 **Token metrics validated:** Measure actual savings in production use
- 🔲 **Learned Patterns Pipeline (Phase 6 — Articulus prerequisite):**
  - 🔲 `create_learned_pattern` MCP tool exists and fires `PATTERN_DISCOVERED` event
  - 🔲 Existing 42 learned files migrated to DB events (idempotent migration)
  - 🔲 AGENTS.md instructs agents to call tool, not write file directly
  - 🔲 `query-events --type pattern_discovered` returns 42+ events
  - 🔲 Pattern retrieval goes through DB, not filesystem
  - 🔲 **This is the prerequisite for Articulus Phase 2 (Mediator Spike)**

**2026-02-19:** ### 2026-02-19 Continuation: stale ESSENTIALS template path cleanup
- Fixed stale runtime/template references to deleted `templates/CODEBASE_ESSENTIALS.template.md`.
- Updated update flows to use `templates/CODEBASE_ESSENTIALS.minimal.template.md` in `lib/commands/update.ts` and dist counterparts.
- Updated `templates/hooks/doc-sync.cjs` mapping to the minimal template path.
- Added required `{{ESSENTIALS_FILE}}` placeholder to `templates/agents/planner.agent.template.md` to satisfy deliverable schema checks.
- Validation: `node bin/cli.js --help` ✅ and `npx aiknowsys validate-deliverables` ✅ (5/5).

**2026-02-19:** ### 2026-02-19 Architecture Insight: Learned Patterns Are Invisible to the DB

**Discovery from Articulus planning conversation:**

All 42 files in `.aiknowsys/learned/` were written autonomously by the AI agent (GitHub Copilot) following the AGENTS.md protocol — zero human involvement. Despite the system having a `PATTERN_DISCOVERED` event type, a full event factory, validators, and storage path, **not a single `PATTERN_DISCOVERED` event has ever been fired**. The learned corpus has no DB representation. No provenance. No embedding. Not queryable by the system at inference time.

This is the most important gap in the system before Articulus can do grammar-constrained retrieval. The knowledge exists. The articulation to it is missing.

**Adding Phase 6: Learned Patterns Pipeline (new — not previously scoped)**

This must complete before Articulus Phase 2 (Mediator Spike) can succeed. The mediator needs the pattern corpus in the DB to construct its grammar over.

Also noting: **Phase 3 steps 11/12** (export session/plan commands) are DONE per 2026-02-18 entries but not marked complete in Implementation Steps below — see correction in Phase 3 section.

**2026-02-20:** ### 2026-02-20 Continuation: Learned Pattern Event Pipeline (Phase 6 slice)
- Added MCP mutation tool `create_learned_pattern` to create learned pattern records in SQLite and emit `pattern_discovered` events atomically.
- Registered the new tool in direct MCP tool list and dynamic mutation metadata.
- Added MCP tests for success + failure paths (`mcp-server/test/tools/mutations.test.ts`) and server registration coverage (`mcp-server/test/server.test.ts`).
- Updated migration coordinator learned-pattern path to ensure learned IDs use `learned_` prefix and to emit idempotent `pattern_discovered` events for migrated files.
- Added migration tests verifying event creation + idempotency (`test/migration/migration-coordinator.test.ts`).
- Validation: `npx vitest run --config mcp-server/vitest.config.ts mcp-server/test/tools/mutations.test.ts mcp-server/test/server.test.ts` ✅ and `npx vitest run test/migration/migration-coordinator.test.ts` ✅.
