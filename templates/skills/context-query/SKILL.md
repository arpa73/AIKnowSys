---
name: context-query
description: Query AIKnowSys knowledge system (READ operations only - plans, sessions, context search)
triggers:
  - "what's the current plan"
  - "find sessions where"
  - "show me plans from"
  - "search knowledge for"
  - "query plans"
  - "query sessions"
  - "recent sessions"
  - "search context"
  - "load essentials section"
  - "query essentials section"
  - "list sections"
  - "rebuild index"
maintainer: false
---

# Context Query Skill

## When to Use

Use this skill when you need to:
- Find current/active plans without reading CURRENT_PLAN.md
- Search session history by date or topic
- Query specific invariants and patterns via MCP
- Search across all knowledge (plans, sessions, learned patterns)
- **INSTEAD OF:** grep_search, semantic_search, reading multiple files sequentially


**Performance benefit:** O(1) index lookup vs O(n) file reads

---

## Why Use This vs Reading Files?

**v0.11.0 Evolution:** CODEBASE_CHANGELOG.md evolved from session archive (5,850 lines) to milestone-only format (~500 lines).

**Before v0.11.0:**
- ❌ Every session in CODEBASE_CHANGELOG.md
- ❌ 5,850+ lines (unmanageable)
- ❌ Hard to scan for important events

**After v0.11.0:**
- ✅ **Milestones** in CODEBASE_CHANGELOG.md (releases, arch changes)
- ✅ **Sessions** indexed in `.aiknowsys/context-index.json` (queryable)
- ✅ **CLI queries** replace file reading (`query-sessions`, `search-context`)
- ✅ **Old entries** archived to `docs/archived/` (searchable with grep)

**Use CLI queries for:**
- Finding "what happened on Feb 5?"
- "When did we implement X feature?"
- "Who worked on TypeScript migration?"

**CHANGELOG is now for:**
- Scanning major releases (v0.10.0, v0.11.0)
- Understanding breaking changes
- Tracking architectural evolution

---

## Commands Available

### Query Plans

```bash
# Find active plans
npx aiknowsys query-plans --status ACTIVE --json

# Find plans by author
npx aiknowsys query-plans --author arno --json

# Find plans by topic
npx aiknowsys query-plans --topic "TypeScript migration" --json

# List all plans
npx aiknowsys query-plans --json
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

**Filters:**
- `--status` - ACTIVE, PAUSED, COMPLETE, CANCELLED
- `--author` - Filter by developer username
- `--topic` - Search in plan topic/title (fuzzy match)
- `--json` - Structured JSON output (required for AI agents)

---

### Query Sessions

```bash
# Find sessions from last 7 days
npx aiknowsys query-sessions --days 7 --json

# Find sessions by topic
npx aiknowsys query-sessions --topic "TDD" --json

# Combine filters
npx aiknowsys query-sessions --days 30 --topic "TypeScript" --json

# List all sessions
npx aiknowsys query-sessions --json
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

**Filters:**
- `--days` - Number of days to look back (default: 30)
- `--topic` - Search in session topics (fuzzy match)
- `--plan` - Filter by associated plan
- `--json` - Structured JSON output (required for AI agents)

---

### Query Invariants and Patterns (MCP Retrieval)

Use MCP tools as the primary method for context retrieval:
- `mcp_aiknowsys_get_critical_invariants()`
- `mcp_aiknowsys_find_pattern({ keywords: [...] })`
- `mcp_aiknowsys_query_learned_patterns_sqlite({ about: "..." })`

**Why use this:** Accesses the single source of truth in `.aiknowsys/knowledge.db`.


---

### Search Everything

```bash
# Search across all context
npx aiknowsys search-context "validation strategy" --json

# Search specific scope
npx aiknowsys search-context "TDD" --scope sessions --json
npx aiknowsys search-context "refactor" --scope plans --json

# Limit results
npx aiknowsys search-context "TypeScript" --limit 10 --json
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
      "lineNumber": 45,
      "score": 0.95
    }
  ]
}
```

**Scopes:**
- `all` - Plans, sessions, learned patterns (default)
- `plans` - Only search plan files
- `sessions` - Only search session history
- `learned` - Only search learned patterns


**Ranking:**
- Exact phrase match: 1.0
- Multiple word match: 0.8
- Single word match: 0.5
- Partial word match: 0.3

---

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

---

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

---

### Example 3: Load Context Invariants

```
AI needs: "What are the project's critical rules?"

AI workflow:
1. Call: mcp_aiknowsys_get_critical_invariants()
2. Use content to inform planning and execution
```

**Old workflow:** Load entire ESSENTIALS.md (800+ lines)  
**New workflow:** Structured, instant invariant retrieval


---

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

---

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

Need context information?
  ├─ Critical Invariants → mcp_get_critical_invariants
  ├─ Project Patterns → mcp_find_pattern
  └─ Search database → search-context --scope all


Need to search everything?
  └─ search-context "query" --scope all
```

---

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

```bash
# No sessions found
⚠️  No sessions found matching: "TypeScript" (last 30 days)

💡 TIP: Try wider date range with --days 90
```

```bash
# ... removed legacy essentials troubleshooting ...
```

---

## Performance Guidelines

- **Use `--json` flag** for programmatic use (AI agents)
- **Queries complete in <100ms** for <10k items
- **MCP-first retrieval** replaces legacy markdown scanning
- **Index rebuilds automatically** on database changes or manual file edits


---

## Auto-Indexing (Transparent Background Process)

**Phase A.6 - Context Query Completion**

The context query system automatically detects when the index is stale and rebuilds it before returning results.

### What This Means for You

**You can still create/edit files manually:**
```bash
# Old workflow still works!
vim .aiknowsys/sessions/2026-02-07-session.md

# Query immediately works (auto-rebuilds if needed)
npx aiknowsys query-sessions --date "2026-02-07"
```

**What happens behind the scenes:**
```
1. You run: npx aiknowsys query-sessions
2. System checks: Is index older than newest file?
3. If yes: Auto-rebuild (takes ~200-500ms)
4. If no: Return results immediately
5. You get: Up-to-date results, always
```

### When Rebuild Happens

**Automatic (transparent):**
- When any .md file in `plans/`, `sessions/`, `learned/` is newer than index
- Before executing `query-plans`, `query-sessions`, or `search-context`
- Typically <500ms overhead (one-time cost until next file change)
- Silent by default (no log output)

**Proactive (git hooks - optional):**
- After `git commit` if context files changed
- After `git merge` (team data synced)
- Zero query latency (index prebuild)
- Install: `node scripts/install-context-hooks.js`

### Performance Characteristics

| Files | Rebuild Time | When |
|-------|--------------|------|
| <100 | <200ms | Most projects |
| <1000 | <500ms | Large projects |
| >1000 | <1s | Very large (still acceptable) |

**Optimization tips:**
- Install git hooks to avoid query latency
- Manual rebuild: `npx aiknowsys rebuild-index` (if hooks not installed)
- Lazy rebuild caches result until next file change

### Troubleshooting

**"Index seems out of date":**
```bash
# Force rebuild
npx aiknowsys rebuild-index

# Check index timestamp
ls -lah .aiknowsys/context-index.json
```

**"Auto-rebuild too slow":**
```bash
# Install git hooks for zero-latency queries
node scripts/install-context-hooks.js

# Verify hooks installed
ls -lah .git/hooks/ | grep post-
```

**"Want to disable auto-rebuild":**
```javascript
// .aiknowsys/.aiknowsys.config.json (Phase A.7 - future)
{
  "context": {
    "autoRebuild": {
      "enabled": false  // Requires manual rebuild
    }
  }
}
```

---

## Creating and Modifying Context Files

**For mutation operations (create/update sessions and plans), see:**  
→ **[context-mutation skill](./../context-mutation/SKILL.md)**

**Mutation commands available:**
- `create-session` - Create new session with YAML frontmatter
- `update-session` - Modify today's session metadata (topics, files, status)
- `create-plan` - Generate implementation plan with active pointer

**Why use mutation commands:**
- ✅ YAML frontmatter validation
- ✅ Atomic updates (file + index together)
- ✅ Easier than manual file editing
- ✅ Structured JSON output for AI agents

**This skill (context-query) focuses on READ operations only.**

---

## Success Criteria

After using this skill, you should:
- ✅ Query plans in <1 second (vs 10+ file reads)
- ✅ Load ESSENTIALS sections (100 lines vs 803 lines)
- ✅ Search 147 sessions in <1 second (vs 30+ seconds)
- ✅ Get structured JSON (no markdown parsing)
- ✅ Preserve personal pattern privacy (gitignored index)

---

## Implementation Notes

**For AI Developers:**
- Always use `--json` flag for structured output
- Parse JSON before presenting to user
- Combine queries for complex research tasks
- Fall back to file reads if query commands fail
- Use chunked retrieval for ESSENTIALS to save tokens

**For Human Developers:**
- Commands work without `--json` (human-readable tables)
- Personal patterns stay in `.aiknowsys/personal/<username>/`
- Team patterns in `.aiknowsys/learned/`
- Index auto-rebuilds after git pull (post-merge hook)
- Manual rebuild: `npx aiknowsys rebuild-index`

---

## Related Skills

- **context-mutation** - Create and modify sessions/plans (WRITE operations)
- **refactoring-workflow** - Test-driven refactoring patterns
- **ai-friendly-documentation** - AI-optimized docs and changelog archiving
- **dependency-management** - Safe upgrade procedures
- **feature-implementation** - Step-by-step feature planning

---

*Part of AIKnowSys v0.11.0. CLI query system for faster context retrieval (READ operations only).*
