---
title: "MCP Infrastructure Fixes - Make It Delightful"
status: ACTIVE
priority: high
created: 2026-02-14
author: Developer
topics: ["mcp-tools", "ai-ux", "developer-experience", "infrastructure"]
---

# PLAN: MCP Infrastructure Fixes

**Status:** 🎯 ACTIVE  
**Priority:** 🔴 HIGH (Foundation for all MCP work)  
**Created:** 2026-02-14  
**Goal:** Fix critical UX bumps to make MCP development delightful

**Motivation:** *"You guys have to be happy to make me happy!"* - User feedback after dogfooding analysis

---

## 🎯 Success Criteria

**Before (painful):**
- ❌ 20-30 minutes to test one feature
- ❌ 3+ failed import attempts
- ❌ 4 manual scripts created
- ❌ Database path breaks on cwd change
- ❌ Have to read source code to understand schema

**After (delightful):**
- ✅ < 2 minutes to test one feature
- ✅ Imports work first try
- ✅ Zero manual scripts needed
- ✅ Database found automatically
- ✅ Self-describing tools

---

## 🚀 Implementation Plan

### Phase 1: Smart Database Path (30 min) 🔴 CRITICAL

**Problem:** Database path breaks when cwd changes

**Files to create:**
- `lib/utils/find-knowledge-db.js` - Walk up tree looking for `.aiknowsys/knowledge.db`
- `test/utils/find-knowledge-db.test.js` - TDD tests

**Solution:**
```javascript
// lib/utils/find-knowledge-db.js
export function findKnowledgeDb(startDir = process.cwd()) {
  // Walk up directory tree
  // Look for .aiknowsys/knowledge.db
  // Return absolute path or throw helpful error
}
```

**Integration points:**
- Use in all MCP SQLite tools (smart default for dbPath)
- Use in demo scripts
- Use in CLI commands

**Tests (TDD):**
```javascript
describe('findKnowledgeDb', () => {
  it('finds db in current directory')
  it('finds db in parent directory')
  it('finds db in grandparent directory')
  it('throws helpful error when not found')
  it('returns absolute path')
})
```

**Validation:**
- ✅ Demo scripts work from any directory
- ✅ No more manual path debugging
- ✅ Clear error when database missing

---

### Phase 2: Built-in MCP Testing (45 min) 🔴 CRITICAL

**Problem:** No way to test MCP tools without manual scripts

**Files to create:**
- `bin/commands/mcp-test.js` - Test individual MCP tools
- `test/commands/mcp-test.test.js` - Command tests

**Solution:**
```bash
# Test a tool with JSON args
npx aiknowsys mcp-test query-sessions '{"when":"last week"}'

# Pretty-printed output:
✅ query_sessions_sqlite
   Args: { when: "last week", dbPath: ".aiknowsys/knowledge.db" }
   
   Result:
   {
     count: 3,
     sessions: [
       { date: "2026-02-13", topics: ["mcp-tools", "sqlite"] },
       ...
     ]
   }
```

**Features:**
- Auto-JSON.parse arguments
- Pretty-print results
- Show parsed parameters
- Measure execution time
- Color-coded success/error

**Tests (TDD):**
```javascript
describe('mcp-test command', () => {
  it('parses JSON arguments')
  it('calls MCP tool function')
  it('pretty-prints results')
  it('shows execution time')
  it('handles errors gracefully')
})
```

**Validation:**
- ✅ Can test Natural Language API in < 1 minute
- ✅ No manual scripts needed
- ✅ Clear output format

---

### Phase 3: Better Error Messages (30 min) 🟡 IMPORTANT

**Problem:** Errors don't tell you how to fix them

**Files to modify:**
- `lib/context/sqlite-storage.ts` - Wrap database errors
- `mcp-server/src/tools/sqlite-query.ts` - Add context to errors

**Solution:**
```javascript
// Before:
throw new Error('Cannot open database because the directory does not exist');

// After:
throw new Error(
  `Database not found: ${dbPath}\n\n` +
  `Troubleshooting:\n` +
  `  1. Run 'npx aiknowsys migrate-to-sqlite' to create database\n` +
  `  2. Check you're in project root (current: ${process.cwd()})\n` +
  `  3. Expected database at: ${expectedPath}`
);
```

**Improvements:**
- Show expected vs actual paths
- Include troubleshooting steps
- Suggest next action
- Show current directory context

**Validation:**
- ✅ Error messages are actionable
- ✅ No more guessing what went wrong
- ✅ Clear path to resolution

---

### Phase 4: Path Resolution (45 min) 🟡 IMPORTANT

**Problem:** Build output is `dist/mcp-server/src/` (too nested)

**Option A: Flatten output (recommended)**

**Files to modify:**
- `mcp-server/tsconfig.json` - Change outDir
- `mcp-server/package.json` - Update postbuild script

**Solution:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "outDir": "./dist",  // Was: ./dist/mcp-server
    "rootDir": "./src"   // Explicitly set root
  }
}
```

**Result:**
```
dist/
  src/
    utils/
      query-parser.js
    tools/
      sqlite-query.js
```

**Imports become:**
```javascript
import { parseQueryParams } from './dist/src/utils/query-parser.js';
```

**Option B: Index exports (alternative)**

Create `mcp-server/src/index.ts`:
```typescript
export { parseQueryParams } from './utils/query-parser.js';
export { querySessionsSqlite } from './tools/sqlite-query.js';
```

**Validation:**
- ✅ Demo scripts import correctly first try
- ✅ Path structure intuitive
- ✅ Build output clean

---

### Phase 5: Documentation & Cleanup (15 min) 🟢 POLISH

**Files to update:**
- `mcp-server/README.md` - Add testing section
- `CODEBASE_ESSENTIALS.md` - Update MCP patterns
- Delete manual demo scripts (no longer needed)

**Add to README:**
```markdown
## Testing MCP Tools

Test individual tools:
```bash
npx aiknowsys mcp-test query-sessions '{"when":"last week"}'
```

**Files to delete:**
- `mcp-server/demo-nl-query.js` → Use mcp-test instead
- `mcp-server/test-query.js` → Use mcp-test instead
- `mcp-server/check-db.js` → Use mcp-test get-db-stats instead
- `mcp-server/debug-db.js` → Use mcp-schema instead

**Validation:**
- ✅ Documentation up to date
- ✅ No cruft in repo
- ✅ Clear testing workflow documented

---

## 📊 Timeline

**Total time estimate:** 2.5 hours

| Phase | Time | Priority |
|-------|------|----------|
| 1. Smart DB path | 30 min | 🔴 Critical |
| 2. mcp-test command | 45 min | 🔴 Critical |
| 3. Better errors | 30 min | 🟡 Important |
| 4. Path resolution | 45 min | 🟡 Important |
| 5. Docs & cleanup | 15 min | 🟢 Polish |

**Order:** Can parallelize Phase 1+2, then 3+4 together, finish with 5

---

## 🎓 Success Validation

**Run this test:**
```bash
# From ANY directory in the project:
npx aiknowsys mcp-test query-sessions '{"when":"last week"}'

# Should:
✅ Find database automatically
✅ Parse natural language
✅ Show results in < 2 seconds
✅ Pretty-print output
✅ Zero manual setup
```

**Before claiming success:**
- [ ] Can test MCP tools from any directory
- [ ] Database found automatically (no path config)
- [ ] Imports work first try (no path debugging)
- [ ] Errors tell you how to fix them
- [ ] Zero manual scripts needed
- [ ] Documentation updated
- [ ] All tests passing

---

## 🚀 Post-Implementation

**After these fixes:**
- Layer 4 (streaming) will be easier to implement
- Future MCP tools will be easier to test
- Contributors won't hit the same bumps
- AI agents will love working with the system

**Learned pattern created:**
- `.aiknowsys/learned/mcp-ux-bumps-dogfooding-feb2026.md`

**Foundation for:**
- Layer 4: Streaming results
- Phase 2: Section-based querying
- Phase 3: Batch operations
- Future: MCP-REPL (interactive mode)

---

## 💡 Key Principle

**"Fix the foundation before building higher"**

- Natural Language API works ✅
- Testing it was painful ❌
- Make it delightful FIRST
- Then add more features

**User wisdom:** *"You guys have to be happy to make me happy!"*

---

*Created after dogfooding session revealed 8 friction points*  
*Prioritized for maximum impact with minimum time*  
*TDD workflow: Write tests first for each phase*
