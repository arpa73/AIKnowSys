# Implementation Plan: Context Query System (CLI + Storage Adapter)

**Status:** ✅ COMPLETE  
**Created:** 2026-02-05  
**Completed:** 2026-02-07  
**Goal:** Enable AI agents to query plans, sessions, and context via CLI commands with JSON output, using adapter pattern for future-proof storage

## 🎉 Implementation Complete

**All 3 phases completed successfully:**
- ✅ Phase 1: Storage Adapter Foundation (adapter pattern + JSON implementation)
- ✅ Phase 2: Query Commands (4 commands: query-plans, query-sessions, search-context, rebuild-index)
- ✅ Phase 3: CLI Integration & Documentation (CODEBASE_ESSENTIALS.md Section 4b + context-query skill)

**Architect Review:** ✅ APPROVED WITH HIGHEST COMMENDATION
- Zero blocking issues
- Perfect TypeScript compliance
- Exceptional TDD discipline (91 tests, 100% pass rate)
- Production-ready documentation
- Sets new gold standard for the project

**Test Status:** 737/737 passing (100%)
- 91 context tests (16 query-plans, 17 query-sessions, 17 search-context, 14 rebuild-index, 25 json-storage, 8 factory, 7 adapter)
- Test-to-code ratio: 1.7:1

**Commits:**
- ce19b57: feat(context): Implement storage adapter factory
- 2b28e56: feat(context): Implement query-plans and query-sessions commands
- 4624b95: feat: implement search-context and rebuild-index
- 92192a6: docs(context): Document context query commands
- dffe8f7: docs(context): Add optional enhancements from architect review
- 69b60be: refactor(context): Complete type safety improvements

---

## ⚠️ BLOCKERS & Dependencies

### BLOCKER: TypeScript Phase 8 Must Complete First

**Current state:**
- Phase 8 Batch 7 committed (43 .js files deleted)
- **114 test failures** (test import paths broken)
- 4 final .js files remain (parse-essentials, skill-mapping, context7/index, plugins/loader)

**Why this blocks context query system:**
- Context query adds 10+ new command files
- Mixing .js and .ts creates maintenance burden
- TypeScript migration incomplete = unstable foundation

**Required before starting this plan:**
- [ ] Fix 114 test failures (restore test suite to baseline)
- [ ] Migrate final 4 .js files to TypeScript
- [ ] Achieve "Zero JavaScript in lib/" milestone
- [ ] Validate: All tests passing, build clean, CLI functional

**Timeline impact:** +2-4 hours (finish TypeScript first)

**Decision:** Wait for TypeScript Phase 8 completion, then implement context query in TypeScript from day 1.

---

## Overview

Replace manual file searching with structured query commands:
- **Before:** AI runs `grep_search`, `semantic_search`, reads multiple files
- **After:** AI runs `npx aiknowsys query-plans --status active --json`

**Key Innovations:**
1. **Storage adapter pattern** - Start with JSON, upgrade to SQLite/PostgreSQL later without changing CLI
2. **Dual-index architecture** - Team index (committed) + Personal index (local) = zero merge conflicts

**Benefits:**
- ✅ **Faster queries** - O(1) index lookup vs O(n) file reads
- ✅ **AI-friendly** - Structured JSON output, not markdown parsing
- ✅ **Human-usable** - Same commands developers can run
- ✅ **Git-friendly** - Team index committed, personal index private
- ✅ **Zero conflicts** - Matches existing plans/ vs personal/ pattern
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

### Collaboration Model: Dual Index

**Team Index** (`context-index.json`)
- Sources: Committed team data (plans/, sessions/, learned/)
- Git: **Committed** (like CURRENT_PLAN.md)
- Syncs: Auto via git pull (post-merge hook rebuilds)
- Purpose: Shared context across team

**Personal Index** (`context-index.personal.json`)
- Sources: Gitignored personal data (personal/ patterns)
- Git: **Gitignored** (private to each developer)
- Syncs: Local only (manual rebuild or lazy load)
- Purpose: Private patterns, draft work

**Query Merging**
- CLI commands load both indexes automatically
- Merge transparently (personal takes precedence on conflicts)
- AI agents see unified JSON result
- Zero context strain (merge logic in CLI, not AI)

**Benefits:**
- ✅ No merge conflicts (personal is local-only)
- ✅ Team data auto-syncs via git
- ✅ Personal patterns stay private
- ✅ Same pattern as existing plans/ (team) vs personal/ (local)
- ✅ AI interface stays simple (unified JSON)

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
├── context-index.json           # Team index (COMMITTED)
└── context-index.personal.json  # Personal index (GITIGNORED)

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

---

### Phase 0: Skill-First Design (1 hour) ⚠️ CRITICAL - DO THIS FIRST

**Goal:** Design API through skill documentation (specification-driven development)

**Why This Matters:**
- Skill = API contract (defines command signatures, JSON formats, error messages)
- Writing skill FIRST catches design issues before coding
- Serves as implementation checklist (can't skip a step in skill)
- AI agents learn the system by reading the skill
- **Violates feature-implementation pattern if skipped**

---

#### Step 0: Create Context Query Skill
**File:** `.github/skills/context-query/SKILL.md`

**Action:** Write complete skill documentation BEFORE implementing any commands

**Skill Structure:**
```markdown
---
name: context-query
description: Query AIKnowSys knowledge system using CLI commands instead of file searching
triggers:
  - "what's the current plan"
  - "find sessions about"
  - "show me plans from"
  - "search knowledge for"
  - "query plans"
  - "recent sessions"
maintainer: false
---

# Context Query Skill

## When to Use

Use this skill when you need to:
- Find current/active plans without reading CURRENT_PLAN.md
- Search session history by date or topic
- Query specific sections from CODEBASE_ESSENTIALS.md (chunked retrieval)
- Search across all knowledge (plans, sessions, learned patterns)
- **INSTEAD OF:** grep_search, semantic_search, reading multiple files sequentially

**Performance benefit:** O(1) index lookup vs O(n) file reads

## Commands Available

### Query Plans
```bash
# Find active plans
npx aiknowsys query-plans --status ACTIVE --json

# Find plans by author
npx aiknowsys query-plans --author arno --json

# Find plans by topic
npx aiknowsys query-plans --topic "TypeScript migration" --json
```

**JSON Output:**
```json
{
  "count": 2,
  "plans": [
    {
      "id": "PLAN_context_query_system",
      "author": "arno",
      "status": "ACTIVE",
      "topic": "Context query system",
      "filePath": ".aiknowsys/PLAN_context_query_system.md",
      "lastUpdated": "2026-02-05"
    }
  ]
}
```

### Query Sessions
```bash
# Find sessions from last 7 days
npx aiknowsys query-sessions --days 7 --json

# Find sessions by topic
npx aiknowsys query-sessions --topic "TDD" --json

# Combine filters
npx aiknowsys query-sessions --days 30 --topic "TypeScript" --json
```

**JSON Output:**
```json
{
  "count": 3,
  "sessions": [
    {
      "date": "2026-02-05",
      "topics": ["TypeScript", "Migration", "Testing"],
      "plan": "PLAN_typescript_migration",
      "files": ["lib/commands/init.ts", "test/init.test.ts"],
      "filePath": ".aiknowsys/sessions/2026-02-05-session.md"
    }
  ]
}
```

### Query ESSENTIALS (Chunked Retrieval)
```bash
# Get specific section (saves 85% tokens)
npx aiknowsys query-essentials "TypeScript Patterns" --json

# List all sections
npx aiknowsys list-sections --json
```

**JSON Output:**
```json
{
  "section": "TypeScript Patterns",
  "content": "### Build System\n\n**Commands:**\n...",
  "lineRange": { "start": 270, "end": 360 },
  "relatedSections": ["Testing Philosophy", "TDD Workflow"],
  "file": "CODEBASE_ESSENTIALS.md"
}
```

**Why use this:** ESSENTIALS.md is 803 lines. Loading one section = 100 lines (8x savings).

### Search Everything
```bash
# Search across all context
npx aiknowsys search-context "validation strategy" --json

# Search specific scope
npx aiknowsys search-context "TDD" --scope sessions --json
npx aiknowsys search-context "refactor" --scope plans --json
```

**JSON Output:**
```json
{
  "query": "validation",
  "count": 5,
  "results": [
    {
      "file": ".aiknowsys/sessions/2026-02-04-session.md",
      "type": "session",
      "snippet": "...added validation for deliverables...",
      "score": 0.95
    }
  ]
}
```

## Workflow Examples

### Example 1: Find Current Work
```
User: "What's the current plan?"

AI workflow:
1. Run: npx aiknowsys query-plans --status ACTIVE --json
2. Parse JSON response
3. Present: "Currently working on: [plan.topic]"
4. Optionally: Load full plan file if details needed
```

**Old workflow:** Read CURRENT_PLAN.md (200 lines), parse markdown manually  
**New workflow:** 1 command, <1 second, structured JSON

### Example 2: Research Past Sessions
```
User: "What did we work on regarding TypeScript last month?"

AI workflow:
1. Run: npx aiknowsys query-sessions --days 30 --topic "TypeScript" --json
2. Parse JSON response
3. Present summary with file links
4. Optionally: Read specific session files for details
```

**Old workflow:** grep_search 147 session files sequentially (30+ seconds)  
**New workflow:** 1 command, <1 second, filtered results

### Example 3: Load Specific ESSENTIALS Section
```
AI needs: "How do we handle TypeScript imports?"

AI workflow:
1. Run: npx aiknowsys query-essentials "TypeScript Patterns" --json
2. Extract content from JSON (100 lines)
3. Use content to answer question
```

**Old workflow:** Load entire ESSENTIALS.md (803 lines), search manually  
**New workflow:** Load only needed section (100 lines, 8x token savings)

### Example 4: Search Knowledge Base
```
User: "How have we handled migration issues before?"

AI workflow:
1. Run: npx aiknowsys search-context "migration issues" --json
2. Review top matches
3. Read relevant session files
4. Summarize past solutions
```

**Old workflow:** semantic_search (slow, no ranking)  
**New workflow:** Indexed search with relevance scoring

## Decision Tree: When to Use Which Command

```
Need plan information?
  ├─ Active plans → query-plans --status ACTIVE
  ├─ Specific author → query-plans --author X
  └─ Topic search → query-plans --topic "X"

Need session history?
  ├─ Recent work → query-sessions --days 7
  ├─ Topic research → query-sessions --topic "X"
  └─ Specific date → query-sessions --days 1 (if today)

Need ESSENTIALS info?
  ├─ Know section name → query-essentials "Section Name"
  ├─ Don't know section → list-sections, then query-essentials
  └─ Fuzzy search → query-essentials "typescript" (fuzzy match)

Need to search everything?
  └─ search-context "query" --scope all
```

## Error Handling

Commands provide helpful errors:

```bash
# Plan not found
❌ Plan not found: PLAN_nonexistent

Available plans:
  • PLAN_context_query_system (ACTIVE)
  • PLAN_typescript_migration (COMPLETE)

💡 TIP: Run 'aiknowsys query-plans' to see all plans
```

```bash
# Invalid status
❌ Invalid status: UNKNOWN

Valid statuses: ACTIVE, PAUSED, COMPLETE, CANCELLED

💡 Example: aiknowsys query-plans --status ACTIVE
```

## Performance Guidelines

- Use `--json` flag for programmatic use (AI agents)
- Queries run in <100ms for <10k items
- Chunked retrieval (query-essentials) saves 85% tokens
- Index rebuilds automatically on git pull (team data)

## Success Criteria

After using this skill, you should:
- ✅ Query plans in <1 second (vs 10+ file reads)
- ✅ Load ESSENTIALS sections (100 lines vs 803 lines)
- ✅ Search 147 sessions in <1 second (vs 30+ seconds)
- ✅ Get structured JSON (no markdown parsing)
```

**Testing:** During implementation, use this skill to guide command design

**Success criteria:**
- [ ] Skill written with all command examples
- [ ] All JSON output formats documented
- [ ] Workflow examples cover common use cases
- [ ] Decision tree helps AI choose right command
- [ ] Error message patterns documented
- [ ] Skill becomes test specification (implement to match)

**Why this is CRITICAL:**
- If we skip this, we'll design commands during coding (wrong order)
- API will be inconsistent (no unified vision)
- AI won't know when to use which command (no guidance)
- We'll miss edge cases that skill examples would reveal

**Dependencies:** None (pure documentation)

**Risk:** Low (documentation only, but HIGH impact if skipped)

---

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

**Action:** Implement JSON file-based storage with dual-index support
- Read/write `.aiknowsys/context-index.json` (team data)
- Read/write `.aiknowsys/context-index.personal.json` (personal data)
- Parse plan metadata from `active-*.md` files
- Parse session metadata from `YYYY-MM-DD-session.md` files
- Implement index merging (personal takes precedence)
- Implement filtering logic (status, author, topic, date)
- Simple string matching for search (regex-based)

**Team Index Sources:**
- `plans/active-*.md` - All team plan pointers
- `PLAN_*.md` - Shared implementation plans
- `sessions/*.md` - Committed session history
- `learned/*.md` - Team-shared patterns

**Personal Index Sources:**
- `personal/*.md` - Private patterns only

**Why:** Simple, git-friendly, zero dependencies, works everywhere, matches existing plans/ vs personal/ pattern

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

#### Step 3.5: Migration Command (Dogfooding Critical)
**File:** `lib/commands/migrate-to-indexed.js`

**Action:** Create migration command for existing markdown files

**Why:** AIKnowSys has 147 session files in various formats. Need safe migration path.

**CLI Usage:**
```bash
# Dry run (analyze existing files)
npx aiknowsys migrate-to-indexed --dry-run

# Show what would be created:
# ✓ 12 plans detected (PLAN_*.md)
# ✓ 147 sessions detected (sessions/*.md)
# ⚠ 3 sessions have non-standard format (manual review needed)
# Would create:
#   - context-index.json (team data)
#   - Migration log: .aiknowsys/migration-log.json

# Execute migration
npx aiknowsys migrate-to-indexed --execute
```

**Implementation:**

**Step 1: Scan existing files**
```javascript
const files = {
  plans: glob('.aiknowsys/PLAN_*.md'),
  sessions: glob('.aiknowsys/sessions/*.md'),
  learned: glob('.aiknowsys/learned/*.md')
};
```

**Step 2: Parse each file (flexible parser)**
```javascript
function parseSessionFile(content) {
  // Try YAML frontmatter first
  const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (yamlMatch) {
    return yaml.parse(yamlMatch[1]);
  }
  
  // Fall back to header parsing
  const headerMatch = content.match(/^# Session: (.+?) \((.+?)\)/);
  if (headerMatch) {
    return {
      title: headerMatch[1],
      date: parseDate(headerMatch[2]),
      topics: extractTopics(content),
      files: extractFiles(content)
    };
  }
  
  // Log unparseable files for manual review
  return { error: 'Unparseable format', file: filename };
}
```

**Step 3: Build index**
```javascript
const index = {
  version: '1.0.0',
  migrated: new Date().toISOString(),
  plans: parsedPlans.map(p => ({
    id: p.id,
    status: p.status,
    author: p.author || 'unknown',
    created: p.created,
    file: p.file
  })),
  sessions: parsedSessions.map(s => ({
    date: s.date,
    topics: s.topics,
    plan: s.plan,
    files: s.files,
    file: s.file
  }))
};
```

**Step 4: Write index + migration log**
```javascript
// Save index
saveIndex(index);

// Save migration log (audit trail)
const log = {
  date: new Date().toISOString(),
  filesProcessed: files.length,
  filesSucceeded: succeeded.length,
  filesFailed: failed.length,
  failures: failed.map(f => ({ file: f.file, reason: f.error }))
};
fs.writeFileSync('.aiknowsys/migration-log.json', JSON.stringify(log, null, 2));
```

**Error Handling:**
```javascript
if (failed.length > 0) {
  console.log('⚠️  Some files could not be migrated:');
  failed.forEach(f => console.log(`  - ${f.file}: ${f.error}`));
  console.log('\n💡 TIP: Review these files manually and run migration again');
  
  if (!options.force) {
    throw new Error('Migration incomplete. Use --force to proceed anyway.');
  }
}
```

**Testing:**
```javascript
describe('migrate-to-indexed', () => {
  it('parses YAML frontmatter sessions', async () => {
    const content = `---\ndate: 2026-02-05\ntopics: [TDD]\n---\n# Session`;
    const result = parseSessionFile(content);
    expect(result.date).toBe('2026-02-05');
    expect(result.topics).toEqual(['TDD']);
  });
  
  it('parses header-only sessions (fallback)', async () => {
    const content = `# Session: My Work (Feb 5, 2026)`;
    const result = parseSessionFile(content);
    expect(result.title).toBe('My Work');
    expect(result.date).toMatch(/2026-02-05/);
  });
  
  it('logs unparseable files', async () => {
    const content = `Random content without structure`;
    const result = parseSessionFile(content, 'bad-session.md');
    expect(result.error).toBe('Unparseable format');
  });
  
  it('creates migration log', async () => {
    await migrateToIndexed({ execute: true });
    const log = JSON.parse(readFileSync('.aiknowsys/migration-log.json', 'utf-8'));
    expect(log.filesProcessed).toBeGreaterThan(0);
    expect(log.date).toBeDefined();
  });
  
  // Edge cases (critical for dogfooding)
  it('handles corrupt YAML gracefully', async () => {
    const content = `---\ndate: 2026-02-05\ntopics: [TDD\n---\n# Unclosed array`;
    const result = parseSessionFile(content, 'corrupt.md');
    expect(result.error).toContain('YAML parse error');
  });
  
  it('skips binary files', async () => {
    // Binary file detection
    const binaryContent = Buffer.from([0x00, 0xFF, 0xFE]);
    const result = parseSessionFile(binaryContent, 'binary.md');
    expect(result.error).toBe('Binary file detected');
  });
  
  it('handles very large files', async () => {
    const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
    const result = parseSessionFile(largeContent, 'huge.md');
    expect(result.error).toBe('File too large (max 10MB)');
  });
  
  it('handles mixed format (YAML + multiple sessions)', async () => {
    const content = `---\ndate: 2026-02-05\n---\n## Session 1\n## Session 2`;
    const result = parseSessionFile(content);
    // Should extract YAML and ignore multiple sessions (log warning)
    expect(result.date).toBe('2026-02-05');
  });
  
  it('handles ambiguous date formats', async () => {
    const content = `# Session: My Work (2/5/26)`;
    const result = parseSessionFile(content);
    // Should log warning about ambiguous format, pick ISO (2026-02-05)
    expect(result.date).toMatch(/2026-02-05/);
    expect(result.warnings).toContain('Ambiguous date format');
  });
});
```

**Implementation additions for edge cases:**
```javascript
// Add to parseSessionFile function:

// Binary file detection
if (Buffer.isBuffer(content) && content.includes(0x00)) {
  return { error: 'Binary file detected', file: filename };
}

// File size check (before parsing)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
if (content.length > MAX_FILE_SIZE) {
  return { error: 'File too large (max 10MB)', file: filename };
}

// YAML error handling
try {
  if (yamlMatch) {
    return yaml.parse(yamlMatch[1]);
  }
} catch (err) {
  return { error: `YAML parse error: ${err.message}`, file: filename };
}

// Date parsing with warnings
function parseDate(dateStr) {
  const warnings = [];
  
  // Ambiguous format detection
  if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(dateStr)) {
    warnings.push('Ambiguous date format (MM/DD/YY) - assumed YYYY-MM-DD');
  }
  
  // Parse and normalize to ISO
  const date = new Date(dateStr);
  if (isNaN(date)) {
    return { error: 'Invalid date', warnings };
  }
  
  return { 
    date: date.toISOString().split('T')[0],
    warnings
  };
}
```

**Dependencies:** Phase 1 complete (storage adapter)

**Risk:** Medium - Parsing variety of formats is complex

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

**Implementation:**
```javascript
import { createLogger } from '../logger.js';
import { loadStorage } from '../context/index.js';
import type { CommandOptions } from '../types/index.js';

export async function queryPlans(options: CommandOptions = {}) {
  const log = createLogger(options._silent);
  const storage = loadStorage();
  
  try {
    const plans = await storage.queryPlans({
      status: options.status,
      author: options.author,
      topic: options.topic
    });
    
    if (options.json) {
      return { count: plans.length, plans };
    }
    
    // Human-readable table
    log.info(`Found ${plans.length} plans:`);
    plans.forEach(p => {
      log.info(`  • ${p.id} (${p.status}) - ${p.topic}`);
    });
    
    return plans;
  } catch (err) {
    log.error(`Failed to query plans: ${err.message}`);
    throw err;
  }
}
```

**Silent mode support:** `_silent: true` option disables console output (testability)

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

**Action:** Rebuild index from markdown files (team, personal, or both)
- Scan `.aiknowsys/plans/` for active-*.md (team)
- Scan `.aiknowsys/sessions/` for session files (team)
- Scan `.aiknowsys/personal/` for patterns (personal)
- Extract metadata (topics, dates, status)
- Write appropriate index file(s)
- Show summary (X plans, Y sessions indexed)

**CLI Usage:**
```bash
# Rebuild team index only (default - shared data)
npx aiknowsys rebuild-index

# Rebuild personal index only (local patterns)
npx aiknowsys rebuild-index --personal

# Rebuild both indexes (comprehensive refresh)
npx aiknowsys rebuild-index --all
```

**Output:**
```
✓ Team index rebuilt successfully
  • 3 plans indexed
  • 45 sessions indexed (last 90 days)
  • Index saved to .aiknowsys/context-index.json

✓ Personal index rebuilt successfully
  • 12 patterns indexed
  • Index saved to .aiknowsys/context-index.personal.json
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

#### Step 9: Update Gitignore & Git Attributes
**Files:** `.gitignore`, `templates/.gitignore`, `.gitattributes`

**Action:** Configure git tracking for dual-index architecture

**Gitignore changes:**
```diff
# AIKnowSys - Personal data only
.aiknowsys/personal/
.aiknowsys/performance-history.json
+.aiknowsys/context-index.personal.json  # Personal index (local only)

# Team index is COMMITTED (like CURRENT_PLAN.md)
# .aiknowsys/context-index.json  ← NOT IGNORED (tracked)
```

**Add .gitattributes for smart merging:**
```
# Auto-rebuild team index on merge conflict
.aiknowsys/context-index.json merge=ours
```

**Add post-merge git hook:**
```bash
#!/bin/bash
# Rebuild team index after pull (resolve conflicts)
if [ -f ".aiknowsys/CURRENT_PLAN.md" ]; then
  npx aiknowsys rebuild-index --silent
  echo "✓ Team index updated"
fi
```

**Why:**
- Team index committed = auto-sync between developers
- Personal index gitignored = privacy preserved
- Git hook = auto-resolution of conflicts
- Matches existing CURRENT_PLAN.md pattern

**Dependencies:** None

**Risk:** None

---

#### Step 9.5: Error Message Design
**Action:** Implement helpful error messages (design guide)

**Why:** Good errors save debugging time for humans AND AI

**Error Message Patterns:**

**Pattern 1: Not Found → Suggest Alternatives**
```javascript
// ❌ Bad
throw new Error('Plan not found');

// ✅ Good
function planNotFoundError(planId) {
  const available = queryPlans({ json: true });
  const suggestions = available.slice(0, 3).map(p => `  • ${p.id} (${p.status})`);
  
  return new Error(
    `❌ Plan not found: ${planId}\n\n` +
    `Available plans:\n${suggestions.join('\n')}\n\n` +
    `💡 TIP: Run 'aiknowsys query-plans' to see all plans`
  );
}
```

**Pattern 2: Invalid Input → Show Valid Options**
```javascript
// ❌ Bad
throw new Error('Invalid status');

// ✅ Good
const VALID_STATUSES = ['ACTIVE', 'PAUSED', 'COMPLETE', 'CANCELLED'];

function invalidStatusError(status) {
  return new Error(
    `❌ Invalid status: ${status}\n\n` +
    `Valid statuses: ${VALID_STATUSES.join(', ')}\n\n` +
    `💡 Example: aiknowsys mark-plan-status PLAN_xyz COMPLETE`
  );
}
```

**Pattern 3: Sync Issues → Recovery Command**
```javascript
function syncError(details) {
  return new Error(
    `❌ Index out of sync with markdown\n\n` +
    `Details: ${details}\n\n` +
    `🔧 Fix: npx aiknowsys rebuild-index --source markdown\n` +
    `   (This will rebuild index from markdown files)`
  );
}
```

**Implementation:**
- Create `lib/errors.js` with error factories
- Use throughout commands
- Add tests for error messages

**Testing:**
```javascript
it('shows helpful error when plan not found', () => {
  try {
    markPlanStatus('PLAN_nonexistent', 'COMPLETE');
  } catch (err) {
    expect(err.message).toContain('Available plans:');
    expect(err.message).toContain('💡 TIP:');
  }
});
```

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

### Phase A.5: ESSENTIALS Decomposition (2-3 hours) ⚠️ CRITICAL - PREVENTS AI OVERCONFIDENCE

**Goal:** Transform ESSENTIALS from monolithic 803-line file into skill index, preventing "I thought I knew" failures

**Real-World Failure Case:**
> User: "Why didn't you use the skill I wrote for you?"  
> Agent: "It was presented to me but it's optional, so I ignored it because I thought I knew it already."  
> Agent: (Made mistake) "If I would have used it, I wouldn't have made this mistake."

**Problem Being Solved:**
- **Agent overconfidence:** "I think I know TDD" → skips skill → violates TDD anyway
- **Optional guidance:** Skills presented but ignored → mistakes happen
- **ESSENTIALS bloat:** 803 lines → agent skims → misses critical details
- **High cognitive load:** Agent loads everything, applies nothing

**Architecture Change:**
```
BEFORE: ESSENTIALS.md (803 lines, all loaded)
├─ Critical Invariants (7 rules)
├─ TDD workflow (detailed)
├─ Refactoring patterns (detailed)
├─ Dependency management (detailed)
└─ ... (all workflows embedded)

AFTER: ESSENTIALS.md (200 lines, index only)
├─ Critical Invariants (7 rules - ALWAYS LOADED, NOT OPTIONAL)
└─ Skill Index (links to .github/skills/)
    ├─ tdd-workflow → Load on trigger: "write tests", "TDD"
    ├─ refactoring-workflow → Load on trigger: "refactor", "clean up"
    ├─ context-query → Load on trigger: "find plan", "query sessions"
    └─ ... (all workflows in separate skills)
```

**Benefits:**
1. **Prevents overconfidence:** Critical rules ALWAYS loaded (not optional)
2. **Reduces tokens:** 60-80% savings (200 lines index + 100 lines skill vs 803 lines total)
3. **Enforces workflows:** Trigger words → auto-load skill → agent can't "forget"
4. **Environment independence:** Skills become process-focused, not tool-specific
5. **Modular knowledge:** Skills in `.github/skills/` (portable across projects)

---

#### Step 16.5: Decompose ESSENTIALS into Index + Skills
**Files:** `CODEBASE_ESSENTIALS.md`, `.github/skills/*/SKILL.md`

**Action:** Restructure ESSENTIALS as skill index

**New ESSENTIALS Structure (~200 lines):**
```markdown
# Codebase Essentials

## Critical Invariants (ALWAYS LOADED - NOT OPTIONAL)

These rules are MANDATORY. AI agents cannot skip them.

1. **Validation is Mandatory**
   - Never claim work complete without running validation
   - See: [validation-troubleshooting](../.github/skills/validation-troubleshooting/SKILL.md)

2. **TDD for Features** (RED-GREEN-REFACTOR - NOT OPTIONAL)
   - Write failing test FIRST
   - Implement minimal code (GREEN)
   - Refactor while keeping tests green (REFACTOR)
   - Full workflow: [tdd-workflow](../.github/skills/tdd-workflow/SKILL.md)

3. **Validation Matrix** (Check BEFORE claiming done)
   - Tests passing: `npm test`
   - Type check: `npm run type-check`
   - Build clean: `npm run build`
   - CLI functional: `node bin/cli.js --help`

... (7 invariants total)

---

## Skill Index (ON-DEMAND LOADING)

**How to use (for AI agents):**
When you detect trigger words in user request, call `query-essentials "<skill-name>"` to load the full workflow.
**Do not skip this step.** Skills contain patterns you may not be aware of.

### Development Workflows

#### Testing & Validation
- **[tdd-workflow](.github/skills/tdd-workflow/SKILL.md)**
  - **Triggers:** "write tests", "TDD", "test first", "failing test"
  - **Summary:** RED-GREEN-REFACTOR cycle, test structure patterns
  
- **[validation-troubleshooting](.github/skills/validation-troubleshooting/SKILL.md)**
  - **Triggers:** "test fail", "validation error", "build broken"
  - **Summary:** Debug validation failures, common issues

#### Code Quality
- **[refactoring-workflow](.github/skills/refactoring-workflow/SKILL.md)**
  - **Triggers:** "refactor", "clean up", "simplify", "extract"
  - **Summary:** Test-driven refactoring, safe code restructuring

### Architecture & Patterns
- **[feature-implementation](.github/skills/feature-implementation/SKILL.md)**
  - **Triggers:** "new feature", "implement", "add capability"
  - **Summary:** Planning, OpenSpec integration, implementation steps

### Context & Knowledge
- **[context-query](.github/skills/context-query/SKILL.md)**
  - **Triggers:** "find plan", "query sessions", "search context"
  - **Summary:** Query CLI commands instead of file searching

### Dependency Management
- **[dependency-management](.github/skills/dependency-management/SKILL.md)**
  - **Triggers:** "update deps", "upgrade packages", "security fix"
  - **Summary:** Safe upgrade procedures (npm, pip, cargo, go mod)

---

## Project Basics (50 lines)

**Package Manager:** npm  
**Test Command:** `npm test`  
**Build Command:** `npm run build`  
**CLI Entry:** `node bin/cli.js`

... (minimal setup info)
```

**Modified Skills (Make Environment-Independent):**

All skills updated to use process-focused instructions instead of tool-specific commands:

```markdown
## Example: Context Query Skill (Environment-Independent)

### Query Plans Workflow

**Goal:** Find plans by status/author/topic

**Process:**
1. Determine filter criteria (status, author, topic)
2. **If terminal access:** Run `npx aiknowsys query-plans --status=active`
3. **If web environment:** Ask user to run command, paste output
4. **Parse JSON output:** Array of plan objects
5. **Present results:** Show relevant plans to user

**Output format:** JSON array, parse programmatically

**Compatibility:**
- ✅ GitHub Copilot (VSCode) - has terminal access
- ✅ Claude Code - if terminal access available
- ✅ Cursor AI - has terminal access
- ⚠️ Web-based agents - ask user to run command
```

**Integration with query-essentials:**

Update `query-essentials` command to auto-load skills:

```javascript
// lib/commands/query-essentials.js - UPDATE
async function queryEssentials(section) {
  // Check if section is a skill reference
  const skillMatch = section.match(/\[([^\]]+)\]/);
  if (skillMatch) {
    const skillName = skillMatch[1];
    const skillPath = `.github/skills/${skillName}/SKILL.md`;
    
    if (fs.existsSync(skillPath)) {
      return {
        type: 'skill',
        name: skillName,
        path: skillPath,
        content: fs.readFileSync(skillPath, 'utf-8')
      };
    }
  }
  
  // Otherwise load ESSENTIALS section
  // ... (existing logic)
}
```

**Why This Works:**
- ESSENTIALS becomes index (200 lines loaded always)
- Critical invariants ALWAYS loaded (can't skip)
- Skills auto-load on trigger words (via `query-essentials`)
- Agent sees "write tests" → loads TDD skill → follows workflow
- Agent can't say "I thought I knew" (skill already loaded)
- 60-80% token reduction (200 + 100 vs 803)

**Testing:**
- [ ] ESSENTIALS reduced from 803 → ~200 lines
- [ ] All skills still accessible via `query-essentials`
- [ ] Agent auto-loads skills on trigger detection
- [ ] Critical invariants always present (not optional)
- [ ] Token usage reduced 60-80%
- [ ] Agent follows workflows (can't skip)

**Dependencies:** Phase A complete (query-essentials command exists)

**Risk:** Low (restructuring existing content, not creating new)

---

### Phase 6: Mutation Commands (3-4 hours)

**Goal:** Enable AI agents to perform structured operations instead of text editing

#### Step 17: Plan Mutation Commands
**Files:** `lib/commands/mark-plan-status.js`, `lib/commands/create-plan.js`, `lib/commands/archive-plan.js`

**Action:** Implement plan management commands

**mark-plan-status:**
```bash
npx aiknowsys mark-plan-status PLAN_xyz COMPLETE --json
```

**Implementation:**
- Load index
- Validate plan exists
- Validate status (ACTIVE|PAUSED|COMPLETE|CANCELLED)
- Update plan in index
- Regenerate plan markdown (with new status emoji/text)
- Rebuild CURRENT_PLAN.md (via sync-plans)
- Return JSON confirmation

**create-plan:**
```bash
npx aiknowsys create-plan "Auth System" --author arno --json
```

**Implementation:**
- Generate plan ID (PLAN_auth_system)
- Create plan entry in index
- Generate plan markdown from template
- Create/update active-{author}.md pointer
- Rebuild team index
- Return plan ID and file path

**Why:** AI calls one command instead of editing 3 files manually

**Dependencies:** Phase 1-2 complete

**Risk:** Low - Similar to rebuild-index logic

**Testing:**
```javascript
describe('mark-plan-status', () => {
  it('validates plan exists', async () => {
    await expect(
      markPlanStatus('PLAN_nonexistent', 'COMPLETE')
    ).rejects.toThrow('Plan not found');
  });

  it('validates status enum', async () => {
    await expect(
      markPlanStatus('PLAN_xyz', 'INVALID')
    ).rejects.toThrow('Invalid status');
  });

  it('updates index and regenerates markdown', async () => {
    await markPlanStatus('PLAN_xyz', 'COMPLETE');
    const index = loadIndex();
    expect(index.plans.find(p => p.id === 'PLAN_xyz').status).toBe('COMPLETE');
    
    const markdown = readFileSync('.aiknowsys/PLAN_xyz.md', 'utf-8');
    expect(markdown).toContain('Status: ✅ COMPLETE');
  });
});
```

---

#### Step 18: Session Mutation Commands
**Files:** `lib/commands/create-session.js`, `lib/commands/update-session.js`

**Action:** Implement session management commands

**create-session:**
```bash
npx aiknowsys create-session --topics "TDD,validation" --plan PLAN_xyz --json
```

**Implementation:**
- Generate session file name (YYYY-MM-DD-session.md)
- Check if session already exists (append vs create)
- Create markdown from template with YAML frontmatter:
  ```yaml
  ---
  date: 2026-02-05
  topics: [TDD, validation]
  plan: PLAN_xyz
  files: []
  ---
  ```
- Add session to index
- Return file path for AI to edit content

**update-session:**
```bash
npx aiknowsys update-session --add-topic "TypeScript" --add-file "lib/init.js"
```

**Implementation:**
- Find today's session file
- Update YAML frontmatter
- Update index entry
- Return confirmation

**Why:** Session files guaranteed correct structure, index always in sync

**Dependencies:** Phase 1-2 complete

**Risk:** Low

**Testing:**
```javascript
describe('create-session', () => {
  it('creates session with YAML frontmatter', async () => {
    const result = await createSession({
      topics: ['TDD', 'validation'],
      plan: 'PLAN_xyz'
    });
    
    const content = readFileSync(result.filePath, 'utf-8');
    expect(content).toMatch(/^---\ndate: \d{4}-\d{2}-\d{2}/);
    expect(content).toContain('topics: [TDD, validation]');
  });

  it('appends to existing session', async () => {
    // Create first session
    await createSession({ topics: ['TDD'] });
    
    // Create second (should append)
    const result = await createSession({ topics: ['validation'] });
    
    const content = readFileSync(result.filePath, 'utf-8');
    const sessions = content.split('## Session:');
    expect(sessions.length).toBe(3); // Header + 2 sessions
  });
});
```

---

#### Step 19: Essentials Chunking Commands
**Files:** `lib/commands/query-essentials.js`, `lib/commands/list-sections.js`

**Action:** Implement chunked ESSENTIALS retrieval

**query-essentials:**
```bash
npx aiknowsys query-essentials "Extending AIKnowSys" --json
```

**Implementation:**
- Parse ESSENTIALS.md for section headers (## Level 2)
- Build section index (header → line range)
- Find matching section (fuzzy match on name)
- Extract section content
- Return JSON with:
  - Section title
  - Content (just that section)
  - Line range (for editing)
  - Related sections (mentioned in text)

**JSON Output:**
```json
{
  "section": "Extending AIKnowSys",
  "content": "...",
  "lineRange": { "start": 666, "end": 715 },
  "relatedSections": ["Commands", "Skills", "Testing"],
  "file": "CODEBASE_ESSENTIALS.md"
}
```

**list-sections:**
```bash
npx aiknowsys list-sections --json
```

**Returns:** Array of section names with line ranges

**Why:** AI loads 100 lines instead of 800, 8x context savings

**Dependencies:** None (reads markdown directly)

**Risk:** Low - Simple parsing

**Testing:**
```javascript
describe('query-essentials', () => {
  it('extracts specific section', async () => {
    const result = await queryEssentials('TypeScript Patterns');
    expect(result.section).toBe('TypeScript Patterns');
    expect(result.content).toContain('Build System');
    expect(result.content).not.toContain('Testing Philosophy'); // Different section
  });

  it('handles fuzzy section names', async () => {
    const result = await queryEssentials('typescript'); // lowercase
    expect(result.section).toBe('TypeScript Patterns');
  });

  it('suggests related sections', async () => {
    const result = await queryEssentials('Testing Philosophy');
    expect(result.relatedSections).toContain('TDD Compliance Check');
  });
});
```

---

#### Step 20: Markdown Regeneration
**File:** `lib/commands/regenerate-markdown.js`

**Action:** Regenerate markdown files from index (view layer)

**CLI Usage:**
```bash
# Regenerate all markdown from index
npx aiknowsys regenerate-markdown --all

# Regenerate specific plan
npx aiknowsys regenerate-markdown --plan PLAN_xyz

# Regenerate CURRENT_PLAN.md
npx aiknowsys regenerate-markdown --current-plan
```

**Implementation:**
- Load index (source of truth)
- For each plan/session, generate markdown from template
- Preserve user-added content (session narratives)
- Update YAML frontmatter from index
- Write files

**Why:** Index = data, markdown = view. Views can be regenerated.

**Dependencies:** Phase 6 (needs templates for generation)

**Risk:** Medium - Must preserve user content

**Testing:**
```javascript
describe('regenerate-markdown', () => {
  it('preserves session narrative content', async () => {
    // Create session with custom content
    const original = `## Session: My Work\n\nI did X, Y, Z...`;
    
    // Regenerate from index
    await regenerateMarkdown({ plan: 'PLAN_xyz' });
    
    // Custom content preserved
    const content = readFileSync('.aiknowsys/sessions/2026-02-05-session.md', 'utf-8');
    expect(content).toContain('I did X, Y, Z');
  });
});
```

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
**Likelihood:** Medium (mitigated by git hooks)  
**Mitigation:**
- Team index: Auto-rebuild on post-merge hook (after git pull)
- Personal index: Lazy reload (check mtime, rebuild if stale)
- Manual rebuild available: `npx aiknowsys rebuild-index --all`
- Git attributes: Auto-resolution on merge conflicts

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

### Risk 4: Team Index Merge Conflicts
**Impact:** Two developers rebuild index, both commit, merge conflict  
**Likelihood:** Low (only if both change plans simultaneously)  
**Mitigation:**
- Git attributes: `merge=ours` strategy
- Post-merge hook: Auto-rebuild on conflict
- Index is derived data (can always regenerate)
- Clear docs: "On conflict, just rebuild"

### Risk 5: Platform Differences (Windows paths)
**Impact:** File paths break on Windows  
**Likelihood:** Medium  
**Mitigation:**
- Use `path.join()` consistently
- Test on Windows in CI
- Store relative paths in index

---

## Success Criteria

### Must Have (Phase 0)
- [ ] Context query skill written with examples
- [ ] All command signatures documented
- [ ] Workflow examples cover common use cases
- [ ] Skill serves as implementation specification

### Must Have (Phase 1-3)
- [ ] Storage adapter interface defined and tested
- [ ] JSON storage implementation working (dual-index)
- [ ] **Migration command working (migrate-to-indexed)**
- [ ] **AIKnowSys dogfooding: 147 sessions migrated successfully**
- [ ] `query-plans` command with JSON output
- [ ] `query-sessions` command with JSON output
- [ ] `search-context` command with JSON output
- [ ] `query-essentials` command (chunked retrieval)
- [ ] `rebuild-index` command working (team + personal)
- [ ] Commands registered in CLI
- [ ] **Error messages are helpful (suggest fixes, show alternatives)**
- [ ] All tests passing (>85% coverage)
- [ ] Documentation updated

### Should Have (Phase 4)
- [ ] Context query skill created
- [ ] Examples written
- [ ] AGENTS.md updated with query workflow
- [ ] AI can successfully use commands

### Must Have (Phase A.5 - ESSENTIALS Decomposition)
- [ ] **ESSENTIALS reduced from 803 → ~200 lines**
- [ ] **Critical invariants ALWAYS loaded (not optional)**
- [ ] **Skill index with clear trigger words**
- [ ] **All existing skills referenced in index**
- [ ] **query-essentials auto-loads skills on trigger detection**
- [ ] **Skills made environment-independent (process-focused)**
- [ ] **60-80% token reduction achieved**
- [ ] **Agent cannot say "I thought I knew" (skills auto-load)**
- [ ] **Validation: Agent follows workflows, doesn't skip**

### Must Have (Phase 6 - Mutation Commands)
- [ ] `mark-plan-status` command working
- [ ] `create-plan` command working
- [ ] `create-session` command with YAML frontmatter
- [ ] `update-session` command working
- [ ] `regenerate-markdown` command working
- [ ] All mutation commands validated (schema enforcement)
- [ ] Index-first workflow proven (index → markdown)
- [ ] AI can perform structured operations without text editing

### Nice to Have (Future)
- [ ] SQLite adapter implementation
- [ ] Auto-rebuild on git hooks
- [ ] Query learned patterns (`query-learned`)
- [ ] Statistics command (`context-stats`)
- [ ] `close-session` command with auto-summary
- [ ] `archive-plan` command

---

## Timeline Estimate

## Phase A: Read-Only Query System (PRIORITY - Ship This First)

| Phase | Hours | Tasks | Milestone |
|-------|-------|-------|----------|
| **Phase 0: Skill-First Design** | **1** | **Step 0** | **API spec complete** |
| Phase 1: Storage Adapter | 3-4 | Steps 1-3.5 | Migration working |
| Phase 2: Query Commands | 4-5 | Steps 4-7 | **Milestone 1: Queries faster than grep** |
| Phase 3: CLI Integration | 1-2 | Steps 8-10.5 | All commands registered |
| Phase 4: Skill Integration | 2-3 | Steps 11-13 | AI can use system |
| Phase 5: Testing | 3-4 | Steps 14-16 | **Milestone 2: Real data tested** |
| **Phase A Total** | **14-19 hours** | **17 steps** | **2 decision points** |

**Decision Point After Phase A:**
- ✅ **Are queries faster than file searching?** (Milestone 1)
- ✅ **Did migration handle 147 sessions correctly?** (Milestone 2)
- ✅ **Is AI agent adoption smooth?** (Skill Integration)

**IF YES:** Proceed to Phase A.5 (ESSENTIALS decomposition)  
**IF NO:** Pivot or cancel (write lessons learned, avoid waste)

---

## Phase A.5: ESSENTIALS Decomposition (CRITICAL - Prevents AI Overconfidence)

| Phase | Hours | Tasks | Milestone |
|-------|-------|-------|----------|
| **Phase A.5: ESSENTIALS Index** | **2-3** | **Step 16.5** | **Milestone 3: Agent can't skip skills** |

**Why This Phase Matters:**
- **Real failure mode:** Agent said "I thought I knew it already" → made preventable mistake
- **Prevents overconfidence:** Critical rules ALWAYS loaded (not optional)
- **Enforces workflows:** Trigger words → auto-load skill → agent follows it
- **Token savings:** 60-80% reduction (200 + 100 vs 803 lines)

**Decision Point After Phase A.5:**
- ✅ **Does agent auto-load skills on triggers?** (Workflow Enforcement)
- ✅ **Are critical invariants always visible?** (Prevents "I thought I knew")
- ✅ **60%+ token reduction achieved?** (Performance)

**IF YES:** Proceed to Phase B (mutation commands)  
**IF NO:** Keep monolithic ESSENTIALS, but query system still valuable

---

## Phase B: Mutation Commands (FUTURE - Depends on Phase A + A.5 Success)

⚠️ **DO NOT START until Phase A and A.5 are complete, tested, and proven valuable.**

| Phase | Hours | Tasks | Milestone |
|-------|-------|-------|----------|
| Phase 6: Mutation Commands | 3-4 | Steps 17-20 | **Milestone 4: Full system** |
| **Phase B Total** | **3-4 hours** | **4 steps** | **1 decision point** |

**Blockers:**
- Phase A must be complete and proven (queries work, migration successful)
- Phase A.5 must prevent "I thought I knew" failures (agent enforcement proven)
- Phase B requires Phase A infrastructure (index, storage adapter, rebuild logic)

**Risk:** If Phase A doesn't deliver value, Phase B is wasted effort. Split allows early pivot.

---

## Combined Timeline (If All Phases Succeed)

| Total Effort | 19-26 hours |
|--------------|-------------|
| Phase A | 14-19 hours |
| Phase A.5 | 2-3 hours |
| Phase B | 3-4 hours |
| Decision Points | 4 milestones |

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
2. **JSON storage next** - Simplest implementation (dual-index)
3. **Query commands first** - Prove read-only operations work
4. **Mutation commands second** - Prove write operations work
5. **Skill last** - Once commands proven to work

### Index-First Philosophy

**Critical paradigm:** Index is source of truth, markdown is view layer

**Old model (current):**
```
Markdown files = source of truth
AI = reads/writes markdown directly
Index = optional speed optimization
```

**New model (this plan):**
```
Index (JSON) = canonical data (source of truth)
Markdown files = generated views (for humans)
AI = calls CLI commands (structured API)
Skills = teach AI which command for what
```

**Implementation implications:**
- Mutation commands write to index FIRST
- Markdown regenerated FROM index
- Validation happens at CLI boundary (not AI)
- Index drift = regenerate markdown (view is derived)

**Benefits:**
- ✅ Schema validation (can't create malformed plans)
- ✅ Atomic updates (JSON write is safe)
- ✅ Auto-sync (dependent files updated automatically)
- ✅ Audit trail (index tracks all changes)
- ✅ AI becomes CLI user, not text editor
- ✅ **No more placeholder hunting** - Markdown generated from data, not filled in

### How This Changes Project Setup

**Old workflow (current):**
```bash
npx aiknowsys init        # Copies templates with {{PLACEHOLDERS}}
# AI reads CODEBASE_ESSENTIALS.md
# AI manually replaces {{PROJECT_NAME}}, {{TECH_STACK}}, etc.
# Validation hunts for unfilled {{PLACEHOLDERS}}
```

**New workflow (with index-first):**
```bash
npx aiknowsys init        # Creates empty index + schema
npx aiknowsys setup       # Interactive or AI-driven data collection

# AI provides data via commands (no text editing):
aiknowsys set-project-info --name "MyApp" --stack "Next.js,PostgreSQL"
aiknowsys add-tech-pattern --name "TypeScript" --version "5.x"
aiknowsys add-testing-pattern --framework "Vitest" --coverage-min 80

# Markdown auto-generated from index (no placeholders needed!)
aiknowsys regenerate-markdown --all
```

**Validation changes:**
```javascript
// ❌ Old: Hunt for unfilled placeholders in text
const violations = findUnfilledPlaceholders(markdownContent);

// ✅ New: Validate schema in index
const errors = validateProjectSchema(indexData);
if (!errors.length) {
  generateMarkdown(indexData);  // Always correct!
}
```

**Benefits:**
- No more "did I miss a {{PLACEHOLDER}}?" anxiety
- AI can't create malformed ESSENTIALS (schema enforces structure)
- Setup becomes data entry, not text editing
- Validation = schema check (fast, reliable)
- Markdown always matches template structure (regenerated on demand)

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

**Why dual-index (team + personal)?**
- Matches existing plans/ (committed) vs personal/ (gitignored)
- Zero merge conflicts (personal is local-only)
- Team data auto-syncs via git
- Privacy preserved for work-in-progress
- AI sees unified view (merge happens in CLI)

**Why commit team index?**
- Same pattern as CURRENT_PLAN.md (generated but committed)
- Instant sync between developers (no manual rebuild after pull)
- Git hooks auto-resolve conflicts (just regenerate)
- Source of truth remains markdown files

**Why limit to 90 days of sessions?**
- Prevents unbounded growth
- Recent context most relevant
- Older sessions in markdown (archival)

### Gotchas
- **Windows paths:** Always use `path.join()`, not string concatenation
- **UTF-8:** Session files may have emoji, unicode
- **Empty state:** Commands must work on brand-new projects
- **Markdown variations:** Users customize format, parsing must be flexible

### Migration Strategy: Current Users → Index-First

**Phased rollout to avoid breaking changes:**

**Phase A (this plan): Index-first for CONTEXT ONLY**
- Plans, sessions, learned patterns → indexed
- CODEBASE_ESSENTIALS.md → still template-based (unchanged)
- init command → unchanged (still copies templates)
- **Backward compatible** (existing projects work)

**Phase B (future plan): Extend to project setup**
- ESSENTIALS.md, AGENTS.md → schema-driven
- init command → rewritten (interactive setup wizard)
- Requires OpenSpec proposal (breaking change)
- Separate plan, separate timeline

**Decision:** Phase A doesn't break existing users. Phase B needs separate proposal and planning.

---

### Future: Schema-Driven Project Setup (Separate Plan Required)

**Vision:** Extend index-first philosophy to entire init process

**Requires:**
- OpenSpec proposal (breaking change to init command)
- ESSENTIALS schema design (JSON structure for all sections)
- Template migration (convert .template.md to data models)
- Backward compatibility strategy (detect old vs new format)

**Estimated effort:** 15-20 hours (larger than this plan)

**Decision:** Context query system (this plan) is Phase A. Schema-driven setup is Phase B (future).

---

### Future Enhancements
- SQLite adapter when JSON >1MB
- `query-learned` for pattern search
- `context-stats` for analytics
- GraphQL API for complex queries
- VSCode extension with tree view
- **Multi-language support** - Index stores i18n data, generates localized markdown

---

## Related Plans

- Multi-developer plan management (v0.9.0) - Plan structure we're indexing
- Session persistence - Session files we're querying
- Learned patterns - Future: query-learned command

---

**Next Step:** Hand off to Developer for implementation, starting with Phase 1.
