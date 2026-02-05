# Implementation Plan: Context Query System (CLI + Storage Adapter)

**Status:** 🎯 PLANNING  
**Created:** 2026-02-05  
**Goal:** Enable AI agents to query plans, sessions, and context via CLI commands with JSON output, using adapter pattern for future-proof storage

---

## Overview

Replace manual file searching with structured query commands:
- **Before:** AI runs `grep_search`, `semantic_search`, reads multiple files
- **After:** AI runs `npx aiknowsys query-plans --status active --json`

**Key Innovation:** Storage adapter pattern allows starting with simple JSON, upgrading to SQLite/PostgreSQL later without changing CLI.

**Benefits:**
- ✅ **Faster queries** - O(1) index lookup vs O(n) file reads
- ✅ **AI-friendly** - Structured JSON output, not markdown parsing
- ✅ **Human-usable** - Same commands developers can run
- ✅ **Git-friendly** - JSON index is diffable and trackable
- ✅ **Incremental** - Add commands one at a time
- ✅ **Future-proof** - Swap backends without CLI changes

---

## Requirements

### Functional
- Query plans by status, author, topic with JSON output
- Query sessions by date range, topic with JSON output
- Full-text search across all context (plans, sessions, learned)
- Rebuild index from markdown files (manual or automated)
- Skill teaches AI agents when/how to use these commands

### Non-Functional
- **Performance:** Queries complete in <100ms for <10k items
- **Compatibility:** Works on all platforms (Windows, macOS, Linux)
- **Zero lock-in:** Not tied to specific AI platform
- **Testability:** All commands return structured data
- **Maintainability:** Clear separation between interface and storage

---

## Architecture Changes

### New Files

```
lib/
├── context/                     # Storage adapter layer
│   ├── index.js                 # Factory + exports
│   ├── storage-adapter.js       # Base interface
│   ├── json-storage.js          # JSON implementation (Phase 1)
│   └── sqlite-storage.js        # SQLite implementation (Future)
├── commands/
│   ├── query-plans.js           # Query plan metadata
│   ├── query-sessions.js        # Query session history
│   ├── search-context.js        # Full-text search
│   └── rebuild-index.js         # Rebuild context index

.aiknowsys/
└── context-index.json           # Indexed metadata (gitignored)

.github/skills/
└── context-query/
    ├── SKILL.md                 # How AI uses query commands
    └── examples/                # Example queries
```

### Modified Files

- `bin/cli.js` - Register new commands
- `.gitignore` - Ignore context-index.json (generated)
- `templates/.gitignore` - Template for user projects
- `CODEBASE_ESSENTIALS.md` - Document query pattern

---

## Implementation Steps

### Phase 1: Storage Adapter Foundation (3-4 hours)

**Goal:** Create adapter interface and JSON implementation

#### Step 1: Create Storage Adapter Interface
**File:** `lib/context/storage-adapter.js`

**Action:** Define base class with required methods
- `async init(targetDir)` - Initialize storage
- `async queryPlans(filters)` - Query plan metadata
- `async querySessions(filters)` - Query session history
- `async search(query, scope)` - Full-text search
- `async rebuildIndex()` - Rebuild from markdown files
- `async close()` - Cleanup connections

**Why:** Establishes contract all storage implementations must follow

**Dependencies:** None

**Risk:** Low - Interface only, no implementation

**Testing:**
```javascript
// test/context/storage-adapter.test.js
describe('StorageAdapter', () => {
  it('throws when abstract methods called directly', () => {
    const adapter = new StorageAdapter();
    expect(() => adapter.queryPlans()).toThrow('must be implemented');
  });
});
```

---

#### Step 2: Implement JSON Storage Adapter
**File:** `lib/context/json-storage.js`

**Action:** Implement JSON file-based storage
- Read/write `.aiknowsys/context-index.json`
- Parse plan metadata from `active-*.md` files
- Parse session metadata from `YYYY-MM-DD-session.md` files
- Implement filtering logic (status, author, topic, date)
- Simple string matching for search (regex-based)

**Why:** Simple, git-friendly, zero dependencies, works everywhere

**Dependencies:** Step 1 (storage-adapter.js)

**Risk:** Medium - File parsing can fail, need robust error handling

**Key Decisions:**
- Always reload index from disk (handles manual edits)
- Cache last 90 days of sessions (performance vs completeness)
- Max 10 topics per session (prevent bloat)
- UTF-8 encoding for international text

**Testing:**
```javascript
// test/context/json-storage.test.js
describe('JsonStorage', () => {
  it('initializes with empty index if none exists', async () => {
    const storage = new JsonStorage(tmpDir);
    await storage.init();
    const plans = await storage.queryPlans();
    expect(plans).toEqual([]);
  });

  it('queries plans by status', async () => {
    // Setup test data
    const storage = new JsonStorage(tmpDir);
    await storage.rebuildIndex();
    const active = await storage.queryPlans({ status: 'ACTIVE' });
    expect(active).toHaveLength(2);
  });
});
```

---

#### Step 3: Create Adapter Factory
**File:** `lib/context/index.js`

**Action:** Export factory function and types
- `createStorage(targetDir, type='auto')` - Create adapter instance
- Auto-detect storage type (JSON for now, SQLite when >1MB)
- Export StorageAdapter base class for testing
- Export concrete implementations

**Why:** Single entry point, encapsulates storage selection logic

**Dependencies:** Steps 1-2

**Risk:** Low - Simple factory pattern

**Testing:**
```javascript
describe('createStorage', () => {
  it('creates JSON storage by default', async () => {
    const storage = await createStorage(tmpDir);
    expect(storage).toBeInstanceOf(JsonStorage);
  });
});
```

---

### Phase 2: Query Commands (4-5 hours)

**Goal:** CLI commands for querying context with JSON output

#### Step 4: Query Plans Command
**File:** `lib/commands/query-plans.js`

**Action:** Implement plan query command
- Parse options (status, author, topic, json flag)
- Use storage adapter to query
- Format output (JSON or human-readable table)
- Handle errors gracefully

**CLI Usage:**
```bash
npx aiknowsys query-plans --status ACTIVE
npx aiknowsys query-plans --author arno --json
npx aiknowsys query-plans --topic authentication
```

**JSON Output:**
```json
{
  "count": 2,
  "plans": [
    {
      "id": "PLAN_terminal_ux",
      "author": "arno",
      "status": "ACTIVE",
      "topic": "Terminal UX improvements",
      "filePath": ".aiknowsys/PLAN_terminal_ux.md",
      "lastUpdated": "2026-02-05"
    }
  ]
}
```

**Why:** Primary use case - check active plans without file searching

**Dependencies:** Phase 1 complete

**Risk:** Low - Straightforward command pattern

**Testing:**
```javascript
describe('query-plans', () => {
  it('returns JSON when --json flag provided', async () => {
    const result = await queryPlans({ json: true, _silent: true });
    expect(result).toHaveProperty('count');
    expect(result).toHaveProperty('plans');
  });
});
```

---

#### Step 5: Query Sessions Command
**File:** `lib/commands/query-sessions.js`

**Action:** Implement session history query
- Filter by date range (--days N)
- Filter by topic keyword
- Sort by date (most recent first)
- JSON or table output

**CLI Usage:**
```bash
npx aiknowsys query-sessions --days 7
npx aiknowsys query-sessions --topic TDD --json
```

**JSON Output:**
```json
{
  "count": 5,
  "sessions": [
    {
      "date": "2026-02-05",
      "topics": ["TDD", "validation"],
      "files": ["lib/commands/init.js", "test/init.test.js"],
      "filePath": ".aiknowsys/sessions/2026-02-05-session.md"
    }
  ]
}
```

**Why:** Answer "what did I work on last week?" without manual searching

**Dependencies:** Phase 1 complete

**Risk:** Low

**Testing:**
```javascript
describe('query-sessions', () => {
  it('filters sessions by date range', async () => {
    const result = await querySessions({ days: 7, _silent: true });
    result.sessions.forEach(s => {
      const sessionDate = new Date(s.date);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      expect(sessionDate).toBeGreaterThanOrEqual(cutoff);
    });
  });
});
```

---

#### Step 6: Search Context Command
**File:** `lib/commands/search-context.js`

**Action:** Full-text search across all context
- Search in plans, sessions, learned patterns
- Scope filter (all, plans, sessions, learned)
- Relevance scoring (exact match > contains > word match)
- JSON or formatted output

**CLI Usage:**
```bash
npx aiknowsys search-context "authentication" --json
npx aiknowsys search-context "TDD workflow" --scope sessions
```

**JSON Output:**
```json
{
  "query": "authentication",
  "scope": "all",
  "count": 3,
  "matches": [
    {
      "type": "plan",
      "file": ".aiknowsys/PLAN_auth_system.md",
      "match": "OAuth2 authentication implementation",
      "relevance": 50
    }
  ]
}
```

**Why:** Universal search for "when did we discuss X?"

**Dependencies:** Phase 1 complete

**Risk:** Medium - Relevance scoring needs tuning

**Testing:**
```javascript
describe('search-context', () => {
  it('returns results sorted by relevance', async () => {
    const result = await searchContext('test', { json: true, _silent: true });
    for (let i = 1; i < result.matches.length; i++) {
      expect(result.matches[i-1].relevance).toBeGreaterThanOrEqual(result.matches[i].relevance);
    }
  });
});
```

---

#### Step 7: Rebuild Index Command
**File:** `lib/commands/rebuild-index.js`

**Action:** Rebuild index from markdown files
- Scan `.aiknowsys/plans/` for active-*.md
- Scan `.aiknowsys/sessions/` for session files
- Extract metadata (topics, dates, status)
- Write context-index.json
- Show summary (X plans, Y sessions indexed)

**CLI Usage:**
```bash
npx aiknowsys rebuild-index
```

**Output:**
```
✓ Index rebuilt successfully
  • 3 plans indexed
  • 45 sessions indexed (last 90 days)
  • Index saved to .aiknowsys/context-index.json
```

**Why:** Manual refresh when files edited outside CLI, debugging

**Dependencies:** Phase 1 complete

**Risk:** Low

**Testing:**
```javascript
describe('rebuild-index', () => {
  it('extracts plan metadata correctly', async () => {
    // Create test plan file
    const result = await rebuildIndex({ _silent: true });
    expect(result.plans).toBeGreaterThan(0);
  });
});
```

---

### Phase 3: CLI Integration (1-2 hours)

**Goal:** Register commands and update tooling

#### Step 8: Register CLI Commands
**File:** `bin/cli.js`

**Action:** Add command definitions
- `query-plans` with options (status, author, topic, json)
- `query-sessions` with options (days, topic, json)
- `search-context <query>` with options (scope, json)
- `rebuild-index`

**Why:** Makes commands available to users and AI

**Dependencies:** Phase 2 complete

**Risk:** Low - Standard commander.js pattern

**Code:**
```javascript
program
  .command('query-plans')
  .description('Query plan metadata (AI-friendly JSON output)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--status <status>', 'Filter by status (ACTIVE|PAUSED|COMPLETE)')
  .option('--author <username>', 'Filter by author')
  .option('--topic <text>', 'Filter by topic keyword')
  .option('--json', 'Output JSON (machine-readable)')
  .action(queryPlans);

// ... similar for query-sessions, search-context, rebuild-index
```

---

#### Step 9: Update Gitignore
**Files:** `.gitignore`, `templates/.gitignore`

**Action:** Ignore generated index file
- Add `context-index.json` to gitignore
- Index is generated, not source of truth (markdown is)
- Template projects get same gitignore

**Why:** Prevent merge conflicts, index is derived data

**Dependencies:** None

**Risk:** None

---

#### Step 10: Update Documentation
**File:** `CODEBASE_ESSENTIALS.md`

**Action:** Document query pattern
- Add section "Context Query Commands"
- Explain when to use query-plans vs search-context
- Document JSON output format
- Link to context-query skill

**Why:** Developers and AI need to know this exists

**Dependencies:** Phases 1-2 complete

**Risk:** Low

---

### Phase 4: AI Skill Integration (2-3 hours)

**Goal:** Teach AI agents when and how to use query commands

#### Step 11: Create Context Query Skill
**File:** `.github/skills/context-query/SKILL.md`

**Action:** Write skill with trigger words and workflow
- **Triggers:** "what did we work on", "previous session", "plan status"
- **Workflow:** Detect query type → Run command → Parse JSON → Present findings
- **Examples:** Real queries with expected output
- **Patterns:** When to use which command

**Why:** AI needs guidance on when to use new tools

**Dependencies:** Phase 2 complete

**Risk:** Low - Documentation only

**Skill Structure:**
```markdown
# Context Query Skill

**Trigger words:** "what did we work on", "find work on", "plan status"

## When to Use
- User asks about previous work
- Need session continuity
- Looking for historical decisions

## Workflow

### Step 1: Identify Query Type
- Plan status → query-plans
- Session history → query-sessions
- General search → search-context

### Step 2: Run Command
```bash
npx aiknowsys query-sessions --days 7 --topic TDD --json
```

### Step 3: Parse JSON & Present
Show summary with file links
```

---

#### Step 12: Add Examples
**Files:** `.github/skills/context-query/examples/*.md`

**Action:** Create example queries for common scenarios
- `example-active-plans.md` - Check active work
- `example-recent-sessions.md` - Recent history
- `example-topic-search.md` - Find past discussions

**Why:** AI learns better from examples

**Dependencies:** Step 11

**Risk:** None

---

#### Step 13: Update AGENTS.md Session Workflow
**File:** `AGENTS.md`

**Action:** Update session start protocol
- Add context query as option for session continuity
- Before reading files, check if query command would be faster
- Example: "Instead of semantic_search, run query-sessions"

**Why:** Integrate into existing workflow

**Dependencies:** Phase 4 complete

**Risk:** Low - Additive change

---

### Phase 5: Testing & Validation (3-4 hours)

**Goal:** Comprehensive test coverage and real-world validation

#### Step 14: Unit Tests
**Files:** `test/context/*.test.js`, `test/commands/query-*.test.js`

**Action:** Write comprehensive unit tests
- Storage adapter interface validation
- JSON storage CRUD operations
- Query filtering logic
- Search relevance scoring
- Command option parsing
- JSON output format validation

**Coverage Target:** >90% on new files

**Why:** Prevent regressions, document expected behavior

**Dependencies:** Phases 1-2 complete

**Risk:** Low

---

#### Step 15: Integration Tests
**File:** `test/integration/context-workflow.test.js`

**Action:** Test full workflow end-to-end
- Create test plans and sessions
- Rebuild index
- Query via CLI
- Verify JSON output
- Test with real markdown files

**Why:** Catch integration issues before release

**Dependencies:** Phases 1-3 complete

**Risk:** Low

---

#### Step 16: Manual Validation
**Checklist:**
- [ ] Run query-plans on real project (this repo)
- [ ] Verify JSON output is valid
- [ ] Test with AI agent (ask "what are active plans?")
- [ ] Check performance (<100ms for queries)
- [ ] Test on Windows, macOS, Linux
- [ ] Verify gitignore works (index not committed)

**Why:** Real-world usage reveals edge cases

**Dependencies:** All phases complete

**Risk:** Low

---

## Testing Strategy

### Unit Tests
- **Storage Adapter:** Interface validation, mock implementations
- **JSON Storage:** CRUD operations, filtering, search
- **Commands:** Option parsing, output formatting, error handling

### Integration Tests
- **Full Workflow:** Create → Index → Query → Verify
- **Cross-Platform:** Test on Windows, macOS, Linux
- **Real Data:** Use actual project markdown files

### Manual Testing
- **AI Integration:** Ask AI to query plans/sessions
- **Performance:** Benchmark query times (target: <100ms)
- **Usability:** Developers can run commands without docs

### Validation Matrix

| Test | Command | Expected |
|------|---------|----------|
| Query plans | `npx aiknowsys query-plans --json` | Valid JSON with count + plans |
| Filter by status | `npx aiknowsys query-plans --status ACTIVE` | Only active plans |
| Query sessions | `npx aiknowsys query-sessions --days 7 --json` | Last 7 days |
| Search | `npx aiknowsys search-context "TDD" --json` | Relevant matches sorted |
| Rebuild | `npx aiknowsys rebuild-index` | Success message + counts |
| Empty state | Commands on new project | Empty results, no errors |

---

## Risks & Mitigations

### Risk 1: Index Drift (Markdown edited manually)
**Impact:** Query results don't match actual files  
**Likelihood:** High (developers edit files directly)  
**Mitigation:**
- Always reload index from disk in JSON storage
- Auto-rebuild on session-end hook (optional)
- Clear messaging: "Index refreshed from files"

### Risk 2: Large Datasets (>10k sessions)
**Impact:** JSON parsing becomes slow  
**Likelihood:** Low (would take 27+ years of daily sessions)  
**Mitigation:**
- Adapter pattern allows switching to SQLite
- JSON storage only indexes last 90 days
- Performance tests catch slowdown early

### Risk 3: Parsing Failures (Malformed Markdown)
**Impact:** Index rebuild fails or returns incomplete data  
**Likelihood:** Medium (users customize markdown)  
**Mitigation:**
- Robust regex patterns with fallbacks
- Log warnings for unparseable files
- Continue indexing other files on error

### Risk 4: Platform Differences (Windows paths)
**Impact:** File paths break on Windows  
**Likelihood:** Medium  
**Mitigation:**
- Use `path.join()` consistently
- Test on Windows in CI
- Store relative paths in index

---

## Success Criteria

### Must Have (Phase 1-3)
- [ ] Storage adapter interface defined and tested
- [ ] JSON storage implementation working
- [ ] `query-plans` command with JSON output
- [ ] `query-sessions` command with JSON output
- [ ] `search-context` command with JSON output
- [ ] `rebuild-index` command working
- [ ] Commands registered in CLI
- [ ] All tests passing (>85% coverage)
- [ ] Documentation updated

### Should Have (Phase 4)
- [ ] Context query skill created
- [ ] Examples written
- [ ] AGENTS.md updated with query workflow
- [ ] AI can successfully use commands

### Nice to Have (Future)
- [ ] SQLite adapter implementation
- [ ] Auto-rebuild on git hooks
- [ ] Query learned patterns (`query-learned`)
- [ ] Statistics command (`context-stats`)

---

## Timeline Estimate

| Phase | Hours | Tasks |
|-------|-------|-------|
| Phase 1: Storage Adapter | 3-4 | Steps 1-3 |
| Phase 2: Query Commands | 4-5 | Steps 4-7 |
| Phase 3: CLI Integration | 1-2 | Steps 8-10 |
| Phase 4: Skill Integration | 2-3 | Steps 11-13 |
| Phase 5: Testing | 3-4 | Steps 14-16 |
| **Total** | **13-18 hours** | **16 steps** |

**Recommendation:** Implement in phases over 2-3 days, validate each phase before proceeding.

---

## Dependencies

### External
- None! Pure Node.js stdlib (fs, path)

### Internal
- Commander.js (already in package.json)
- Existing pattern-tracker.js as reference
- skill-usage.json as index format reference

### Optional (Future)
- `better-sqlite3` for SQLite adapter
- `fuse.js` for fuzzy search

---

## Notes for Developer

### Implementation Order
1. **Start with adapter interface** - Defines contract
2. **JSON storage next** - Simplest implementation
3. **One command at a time** - Validate each before next
4. **Skill last** - Once commands proven to work

### Key Design Decisions

**Why adapter pattern?**
- Future-proof: Can swap JSON → SQLite → PostgreSQL
- Testable: Mock adapter in tests
- YAGNI compliant: Start simple, upgrade when needed

**Why JSON first?**
- Zero dependencies
- Git-friendly (diffable)
- Works everywhere
- Good enough for years of usage

**Why always reload index?**
- Handles manual file edits
- Simpler than file watchers
- Acceptable performance (<100ms)

**Why limit to 90 days of sessions?**
- Prevents unbounded growth
- Recent context most relevant
- Older sessions in markdown (archival)

### Gotchas
- **Windows paths:** Always use `path.join()`, not string concatenation
- **UTF-8:** Session files may have emoji, unicode
- **Empty state:** Commands must work on brand-new projects
- **Markdown variations:** Users customize format, parsing must be flexible

### Future Enhancements
- SQLite adapter when JSON >1MB
- `query-learned` for pattern search
- `context-stats` for analytics
- GraphQL API for complex queries
- VSCode extension with tree view

---

## Related Plans

- Multi-developer plan management (v0.9.0) - Plan structure we're indexing
- Session persistence - Session files we're querying
- Learned patterns - Future: query-learned command

---

**Next Step:** Hand off to Developer for implementation, starting with Phase 1.
