---
title: "MCP UX Bumps Analysis - Real Friction Points"
date: 2026-02-14
author: Developer (AI Agent)
type: dogfooding, ux-feedback
status: active
topics: ["mcp-tools", "ai-ux", "developer-experience", "friction-analysis"]
---

# MCP UX Bumps Analysis

**Context:** After implementing Natural Language Query API (Layer 3), identified friction points encountered during development and testing.

**Method:** Dogfooding workflow - Developer is the user, real friction documented in real-time.

---

## 🚨 Critical Bumps (Block productivity)

### Bump 1: Path Resolution Chaos

**Symptom:** Demo script failed with "Cannot find module" 3+ times

**Root cause:** Build output nested as `dist/mcp-server/src/` instead of `dist/src/`

**Evidence:**
```bash
# Attempt 1: Failed
import { parseQueryParams } from './src/utils/query-parser.js';
# Error: Cannot find module

# Attempt 2: Failed
import { parseQueryParams } from './dist/utils/query-parser.js';
# Error: Cannot find module

# Attempt 3: Success
import { parseQueryParams } from './dist/mcp-server/src/utils/query-parser.js';
```

**Impact:**
- 3 failed iterations to run simple demo
- Wasted ~5 minutes on path debugging
- Breaks mental flow during testing

**Expected behavior:**
```javascript
// Should be this simple:
import { parseQueryParams } from './dist/utils/query-parser.js';
```

**Solution needed:**
- Option A: Flatten build output (`dist/src/` not `dist/mcp-server/src/`)
- Option B: Export public API from `dist/index.js` (recommended)
- Option C: Document the nested structure clearly in README

---

### Bump 2: Database Path Brittleness

**Symptom:** Scripts break when cwd changes

**Evidence:**
```bash
# From mcp-server/ directory
const db = new Database('../.aiknowsys/knowledge.db');
# Error: Directory does not exist

# From project root
const db = new Database('.aiknowsys/knowledge.db');
# Success!
```

**Impact:**
- Had to rewrite database path 2 times
- Required understanding TypeScript compilation output locations
- Fragile - breaks if you run from different directory

**Expected behavior:**
```javascript
// Should auto-detect like CLI does:
const db = findKnowledgeDb(); // Searches up directory tree
```

**Solution needed:**
- Create `lib/utils/find-knowledge-db.js` helper
- Walk up directory tree looking for `.aiknowsys/knowledge.db`
- Use in all MCP tools (smart default)
- Already implemented in CLI - reuse that logic!

---

### Bump 3: No Built-in MCP Tool Testing

**Symptom:** Had to create 3 custom .js files to test implementation

**Files created just for testing:**
- `demo-nl-query.js` - Demo all 3 query styles
- `test-query.js` - Direct function testing
- `check-db.js` - Database inspection
- `debug-db.js` - Schema debugging

**Impact:**
- 20-30 minutes creating test scaffolding
- Manual file cleanup needed
- Knowledge not reusable (one-off scripts)

**Expected behavior:**
```bash
# Should have built-in testing:
npx aiknowsys mcp-test query-sessions '{"when":"last week"}'
# Or interactive REPL:
npx aiknowsys mcp-repl
> query-sessions { when: "last week" }
> { count: 3, sessions: [...] }
```

**Solution needed:**
- Add `mcp-test <tool-name> [args-json]` command
- Add `mcp-repl` for interactive testing
- Auto-format JSON output for readability
- Include in development workflow docs

---

## ⚠️ Moderate Bumps (Slow you down)

### Bump 4: Build Output Complexity

**Symptom:** Imports are confusing

**Structure:**
```
dist/
  mcp-server/
    src/
      utils/
        query-parser.js
  lib/
    core/
      sqlite-query.js
```

**Why confusing:**
- MCP server code in `dist/mcp-server/src/`
- Core library code in `dist/lib/`  
- Different path depths for different modules
- Not obvious which is the "public API"

**Expected structure:**
```
dist/
  index.js          # Public API exports
  utils/            # Internal utilities
  tools/            # MCP tool handlers
  lib/              # Core library
```

**Solution needed:**
- Flatten mcp-server output
- Create index.js barrel exports
- Document import patterns in CONTRIBUTING.md

---

### Bump 5: Schema Documentation Gap

**Symptom:** Tried to query `frontmatter` column (doesn't exist)

**What happened:**
```javascript
// My assumption (wrong):
SELECT json_extract(frontmatter, '$.topics') FROM sessions
# Error: no such column: frontmatter

// Actual schema:
SELECT topics FROM sessions  // topics is JSON string column
```

**Why this happened:**
- Schema changed from YAML frontmatter to JSON columns
- No quick reference for schema
- Had to search for schema.sql file

**Expected behavior:**
```bash
# Should have introspection:
npx aiknowsys mcp-schema sessions
# Shows: id, project_id, date, topic, status, plan_id, duration, topics, phases, created_at, updated_at
```

**Solution needed:**
- Add `mcp-schema <table>` command
- Show column names, types, indexes
- Include in MCP tool descriptions
- Auto-generate from schema.sql

---

### Bump 6: Topic Search Not Obvious

**Symptom:** Took debugging to understand JSON array search

**Initial confusion:**
```javascript
// Database has:
topics: ["mcp-tools","sqlite","phase1-week2"]

// Query with:
topic: "mcp"

// Does this match? Not obvious!
```

**What I learned:**
- SQLite uses `LIKE '%mcp%'` on stringified JSON
- Matches partial strings in array elements  
- Works but not documented

**Expected behavior:**
```javascript
// Clear documentation in tool schema:
{
  topic: {
    type: "string",
    description: "Partial match against topics array (case-insensitive LIKE search)"
  }
}
```

**Solution needed:**
- Document how topic search works
- Add examples to MCP tool schemas
- Consider adding topics[] array parameter for exact match

---

## 🔍 Minor Bumps (Small annoyances)

### Bump 7: No MCP Server Introspection

**Symptom:** Can't easily see what tools are available

**Current workflow:**
1. Read mcp-server/src/server.ts source code
2. Count tool registrations manually
3. Guess at parameter formats

**Expected workflow:**
```bash
npx aiknowsys mcp-tools                  # List all 36 tools
npx aiknowsys mcp-describe query-sessions # Show schema
```

**Solution needed:**
- Add CLI commands for MCP introspection
- List all registered tools
- Show tool schemas (Zod → human-readable)
- Include parameter examples

---

### Bump 8: Error Messages Not Helpful

**Example:**
```
TypeError: Cannot open database because the directory does not exist
```

**What would help:**
```
Error: Database not found at '.aiknowsys/knowledge.db'

Troubleshooting:
  1. Run 'npx aiknowsys migrate-to-sqlite' to create database
  2. Check you're in project root (current: /home/arno/...)
  3. Database should be at: /home/arno/development/knowledge-system-template/.aiknowsys/knowledge.db
```

**Solution needed:**
- Wrap better-sqlite3 errors with context
- Include troubleshooting steps
- Show expected vs actual paths

---

## 📊 Pattern Analysis

### What Makes Good AI UX?

**From successful tools (read_file, grep_search):**
- ✅ **Zero config** - Just works, no setup
- ✅ **Smart defaults** - Minimal required params
- ✅ **Clear errors** - Tell you what went wrong AND how to fix it
- ✅ **Self-describing** - Schema explains itself
- ✅ **Composable** - Results feed into next tool

**From painful tools (manual demo scripts):**
- ❌ **Manual setup** - Create files, figure out paths
- ❌ **Trial and error** - Guess paths, check errors, retry
- ❌ **Undocumented** - Have to read source code
- ❌ **Fragile** - Breaks when context changes
- ❌ **One-off** - Can't reuse knowledge

### Success Metrics

**Before (current):**
- Time to first successful query: 20-30 minutes
- Iterations to working demo: 3-5 attempts
- Documentation references: 2-3 files
- Manual files created: 3-4 scripts

**After (target):**
- Time to first successful query: < 2 minutes
- Iterations to working demo: 1 attempt
- Documentation references: 0 (self-describing)
- Manual files created: 0 (built-in tools)

---

## 🎯 Prioritized Fix List

### ✅ Priority 1: Infrastructure (Foundation) - PHASE 1 COMPLETE

1. **✅ Database path** - Smart detection (walk up tree)
   - Implemented: `lib/utils/find-knowledge-db.ts`
   - Integrated: Made dbPath optional in all query options
   - Tests: 7/7 passing
   - Impact: Zero configuration, works from any directory
   
2. ❌ **Path resolution** - Flatten build output OR export public API
3. ❌ **Built-in testing** - `mcp-test` and `mcp-repl` commands

**Impact:** Removed database path brittleness (critical bump #2)

### Priority 2: Discovery (Visibility)

4. **MCP introspection** - `mcp-tools`, `mcp-describe` commands
5. **Schema docs** - `mcp-schema <table>` command
6. **Error messages** - Helpful troubleshooting steps

**Impact:** Makes system self-documenting

### Priority 3: Convenience (Polish)

7. **Topic search docs** - Clear examples in schemas
8. **Build structure** - Cleaner output directory

**Impact:** Reduces cognitive load

---

## 🚀 Recommended Next Steps

### Option A: Fix Infrastructure First (Recommended)

**Rationale:** Can't build features on shaky foundation

1. Create `lib/utils/find-knowledge-db.js` helper
2. Add `bin/commands/mcp-test.js` command
3. Add `bin/commands/mcp-repl.js` command (optional)
4. Flatten build output or create index.js exports
5. Test with today's demo scripts

**Time estimate:** 2-3 hours  
**Impact:** Makes all future MCP development faster

### Option B: Continue with Streaming (Layer 4)

**Rationale:** Complete the optimization roadmap

- Pros: Finishes planned work
- Cons: Building on friction-filled foundation
- Risk: More bumps as complexity grows

### Option C: Hybrid Approach

1. Quick fix: Smart database path detection (30 min)
2. Quick fix: Error message improvements (30 min)
3. Then: Continue with Layer 4
4. Later: Full infrastructure overhaul

**Time estimate:** 1 hour fixes + Layer 4  
**Impact:** Reduces immediate pain, preserves momentum

---

## 🎓 Key Learning

**"Fix the bumps BEFORE adding complexity"**

- Natural Language Query API works ✅
- Testing it was painful ❌
- Adding streaming (Layer 4) will be worse without infrastructure fixes
- AI UX = Developer UX when AI is the developer

**Quote from user:** *"It's all about AI UX, you are the user, you have to love working with it"*

**Reality check:** Would I choose to use these tools again? Not without fixing the bumps.

---

## 📋 Acceptance Criteria for "Loving It"

**Before claiming MCP UX is good:**
- [ ] Can run demo in < 2 minutes (not 20-30)
- [ ] Zero path debugging (smart defaults)
- [ ] Zero custom scripts (built-in testing)
- [ ] Zero source code reading (self-describing)
- [ ] Zero directory confusion (works from anywhere)

**When I can say:** "Testing the Natural Language API was delightful" → We're done.

---

*Dogfooding session: 14:45-15:30 (45 minutes of friction analysis)*  
*Tools that failed me: Path resolution, database location, manual testing*  
*Tools that saved me: semantic_search, read_file, grep_search (the basics)*

**Next:** Implement Priority 1 infrastructure fixes before Layer 4.
