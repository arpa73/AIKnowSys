---
title: "Phase 3: Markdown Export Commands"
date: "2026-02-15"
topics: ["phase-3", "markdown-export", "cli-commands", "knowledge-bank"]
status: "completed"
---

# Session: Phase 3 - Markdown Export Commands (Feb 15, 2026)

**Goal:** Implement on-demand markdown export commands for human-readable session/plan exports from event-sourced storage

**Status:** ✅ COMPLETE (19:40) - Both Part 1 & Part 2 finished

## Architect Review: Phase 3 Implementation (20:03) ✅
**Status:** ADDRESSED (20:15)  
**Issues found:** 3 (CLI output handling, logger pattern, console.log usage)  
**Outcome:** All fixed, 30/30 tests passing, CLI output working correctly

**What was fixed:**
1. Added CLI output handling in bin/cli.js for both export commands
   - Captures result object
   - Prints markdown to stdout (export-session) or statistics (export-sessions)
   - Shows success messages with ✓/✗ icons and colors
   - Displays event counts in verbose mode
   - Exits with code 1 on errors
2. Replaced console.log with logger pattern in export-sessions.ts
   - Imported createLogger
   - Added _silent parameter support
   - Used log.info() and log.error() for consistent formatting
3. Validated all changes with full test suite (30/30 passing)

---

## Summary

**Phase 3 Part 1 - export-session (Single Export):**
- ✅ export-session command: Single session export (by ID or date)
- ✅ Test suite: 14/14 tests passing (100% coverage)
- ✅ Public API methods: getSessionById(), querySessionsByDate()
- ✅ Architect reviewed & approved

**Phase 3 Part 2 - export-sessions (Bulk Export):**
- ✅ export-sessions command: Bulk export with filters
- ✅ Test suite: 16/16 tests passing (100% coverage)
- ✅ Public API methods: querySessionsWithFilters()
- ✅ Features: Date range, project filtering, dry-run mode
- ✅ Proactive refactoring (fixed encapsulation before review)

**TDD Workflow (Both Parts):**
- 🔴 RED: Wrote 30 failing tests first (14 + 16)
- 🟢 GREEN: Implemented both commands - all tests green
- 🔵 REFACTOR: Fixed encapsulation violations proactively

**Key Implementation:**
- Reused MarkdownGenerator from Phase 2.1 (DRY principle)
- All database access uses proper public APIs (no type casting)
- Chronological event sorting (ASC) for proper goal/learning rendering
- Graceful error handling with helpful messages
- Progress reporting and dry-run mode for bulk operations

---

## Validation

**Phase 3 Part 1 (export-session):**
✅ **Tests:** 14/14 passing (export-session.test.ts)
✅ **Build:** Clean TypeScript compilation
✅ **Coverage:** All code paths tested
✅ **TDD:** RED → GREEN → REFACTOR workflow completed

**Test breakdown:**
- ✅ 2 tests: Export to stdout/file
- ✅ 5 tests: Error handling (not found, invalid paths, missing params)
- ✅ 3 tests: Date-based lookup
- ✅ 2 tests: Markdown quality (7 event types, file links)
- ✅ 2 tests: Verbose mode, edge cases

**Phase 3 Part 2 (export-sessions):**
✅ **Tests:** 16/16 passing (export-sessions.test.ts)
✅ **Build:** Clean TypeScript compilation
✅ **Coverage:** All code paths tested
✅ **TDD:** RED → GREEN → REFACTOR workflow completed

**Test breakdown:**
- ✅ 3 tests: Bulk export to directory
- ✅ 3 tests: Date range filtering (from/to)
- ✅ 1 test: Project filtering
- ✅ 2 tests: Dry-run mode
- ✅ 4 tests: Error handling (DB errors, empty results, failures, permissions)
- ✅ 1 test: Combined filters
- ✅ 2 tests: Markdown quality (structure, file links)

---

## Architect Review: Phase 3 export-session (19:45) ✅

**Status:** ADDRESSED (19:20)  
**Issues found:** 1 (encapsulation violation - direct database access)  
**Rating:** APPROVED WITH REQUIRED REFACTORING  

**Issue:** Direct private property access via `(storage as any).db`

**Resolution:**
- ✅ Added `querySessionsByDate()` method to SqliteStorage (properly encapsulated)
- ✅ Refactored export-session.ts to use `getSessionById()` and `querySessionsByDate()`
- ✅ Removed duplicate SessionRow interface, imported from sqlite-storage.ts
- ✅ All 14/14 tests still passing after refactoring
- ✅ Clean TypeScript compilation (no errors)

**Outcome:** Encapsulation violation fixed, code now follows proper API patterns

---

## Files Changed (Phase 3 Part 1)

**New files:**
- [lib/commands/export-session.ts](lib/commands/export-session.ts) (188 lines) - Single session export
- [test/commands/export-session.test.ts](test/commands/export-session.test.ts) (633 lines) - Comprehensive tests

**Modified files:**
- [lib/context/sqlite-storage.ts](lib/context/sqlite-storage.ts) - Added querySessionsByDate()
- [lib/types/index.ts](lib/types/index.ts) - Added ExportSessionOptions/Result

**Status:** ✅ COMMITTED (commit 2d603a7)

---

## Files Changed (Phase 3 Part 2)

**New files:**
- [lib/commands/export-sessions.ts](lib/commands/export-sessions.ts) (193 lines) - Bulk export command
- [test/commands/export-sessions.test.ts](test/commands/export-sessions.test.ts) (533 lines) - Comprehensive tests

**Modified files:**
- [lib/context/sqlite-storage.ts](lib/context/sqlite-storage.ts) - Added querySessionsWithFilters()
- [lib/types/index.ts](lib/types/index.ts) - Added error field to ExportSessionsResult

**Status:** ✅ READY FOR COMMIT - All tests passing, encapsulation proper

---

## Context

**Previous Work:**
- ✅ Phase 2 complete: Event-sourced storage + migration command
- ✅ MarkdownGenerator exists: Converts events → markdown
- ✅ All tests passing: 8/8 migrate-to-events tests

**Phase 3 Goals (from Knowledge Bank Evolution plan):**
1. **export-session** command: Single session export (by ID or date)
2. **export-sessions** command: Bulk export with date ranges
3. Test export quality (formatting, file links, readability)
4. Document use cases (review, sharing, archival)

**Architecture:**
- Reuse existing MarkdownGenerator (lib/events/markdown-generator.ts)
- Query events from database → generate markdown → output to file or stdout
- Support multiple output formats (stdout, file, directory)

---

## Plan (TDD Workflow)

### Phase 1: export-session Command (Single Export)

**RED Phase: Write Failing Tests**
- [ ] Test: Export session by ID to stdout
- [ ] Test: Export session by ID to file
- [ ] Test: Export session by date (YYYY-MM-DD)
- [ ] Test: Handle session not found error
- [ ] Test: Handle no events found (empty session)
- [ ] Test: Generated markdown matches template format

**GREEN Phase: Implementation**
- [ ] Create lib/commands/export-session.ts
- [ ] Query events by sessionId from database
- [ ] Use MarkdownGenerator to render markdown
- [ ] Output to stdout or file (based on --output flag)
- [ ] Register command in bin/cli.js

**REFACTOR Phase:**
- [ ] Extract common export logic
- [ ] Add JSDoc documentation
- [ ] Error handling improvements

### Phase 2: export-sessions Command (Bulk Export)

**RED Phase: Write Failing Tests**
- [ ] Test: Export all sessions in date range
- [ ] Test: Export to directory (one file per session)
- [ ] Test: Filter by project_id
- [ ] Test: Handle empty results
- [ ] Test: Parallel export performance

**GREEN Phase: Implementation**
- [ ] Create lib/commands/export-sessions.ts
- [ ] Query multiple sessions with filters
- [ ] Batch markdown generation
- [ ] Directory creation and file writing
- [ ] Progress reporting (ora spinners)

**REFACTOR Phase:**
- [ ] DRY: Share code with export-session
- [ ] Performance: Async/parallel generation
- [ ] UX: Better progress reporting

### Phase 3: Quality & Documentation

- [ ] Test export quality: Links, formatting, readability
- [ ] Document use cases in README
- [ ] Add examples to --help text
- [ ] Update CODEBASE_CHANGELOG.md

---

## Implementation Strategy

### export-session Command Design

**CLI Usage:**
```bash
# Export to stdout
npx aiknowsys export-session sess-2026-02-15-001

# Export by date
npx aiknowsys export-session --date 2026-02-15

# Export to file
npx aiknowsys export-session sess-2026-02-15-001 --output /tmp/session.md

# Verbose mode
npx aiknowsys export-session --date 2026-02-15 --verbose
```

**Options:**
- `sessionId` (positional): Session ID to export
- `--date`: Export session by date (alternative to sessionId)
- `--output <path>`: Output file path (default: stdout)
- `--db-path <path>`: Database path (default: ./knowledge.db)
- `--verbose`: Show detailed progress

### export-sessions Command Design

**CLI Usage:**
```bash
# Export all sessions to directory
npx aiknowsys export-sessions --output-dir /tmp/sessions/

# Export date range
npx aiknowsys export-sessions --from 2026-02-01 --to 2026-02-15 --output-dir /tmp/

# Filter by project
npx aiknowsys export-sessions --project my-project --output-dir /tmp/

# Dry run
npx aiknowsys export-sessions --from 2026-02-01 --dry-run --verbose
```

**Options:**
- `--output-dir <path>`: Output directory (REQUIRED)
- `--from <date>`: Start date (YYYY-MM-DD)
- `--to <date>`: End date (YYYY-MM-DD)
- `--project <id>`: Filter by project_id
- `--db-path <path>`: Database path
- `--dry-run`: Preview without writing files
- `--verbose`: Show detailed progress

---

## Architecture Notes

### Reusing MarkdownGenerator

**Current capabilities:**
- ✅ `generateSessionMarkdown(events, title)`: Generates formatted markdown
- ✅ Supports 7 event types: session_started, goal_defined, task_completed, file_changed, validation_passed, learning_captured, decision_made
- ✅ Template matching: Goal, Changes, Validation, Learning sections

**Integration:**
```typescript
import { MarkdownGenerator } from '../events/markdown-generator.js';
import { SqliteStorage } from '../context/sqlite-storage.js';

const storage = new SqliteStorage();
await storage.init(dbPath);

const events = await storage.queryEvents({ sessionId });
const generator = new MarkdownGenerator();
const markdown = generator.generateSessionMarkdown(events);
```

### Error Handling

**Graceful failures (Critical Invariant #3):**
- Session not found → Helpful error: "Session {id} not found. Use query-sessions to list available sessions."
- No events → Warning: "Session {id} has no events. Generate empty markdown?"
- Database error → "Failed to connect to database at {path}. Check --db-path option."

---

## Validation Commands

```bash
# After implementation
npm test -- test/commands/export-session.test.ts
npm test -- test/commands/export-sessions.test.ts
npm run build
node bin/cli.js export-session --help
node bin/cli.js export-sessions --help

# Integration test (requires real DB)
npx aiknowsys migrate-to-events --session sess-test --verbose
npx aiknowsys export-session sess-test
npx aiknowsys export-sessions --from 2026-02-15 --to 2026-02-15 --output-dir /tmp/test-export/
```

---

## Next Steps

1. ✅ Create this session file
2. 🎯 Start RED phase: Write tests for export-session
3. Implement GREEN phase
4. Move to export-sessions command
5. Quality check and documentation

---

*Session started: 17:15*
*Current phase: 🔄 PLANNING - Ready to start TDD*
