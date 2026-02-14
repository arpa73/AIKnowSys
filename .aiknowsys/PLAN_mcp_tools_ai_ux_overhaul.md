---
title: "MCP Tools AI UX Overhaul - Make Tools Perfect for AI Agents"
status: ACTIVE
priority: high
created: 2026-02-13
author: Planner
topics: ["mcp-tools", "ai-ux", "ddd", "api-design", "sqlite", "optimization"]
---

# PLAN: MCP Tools AI UX Overhaul

**Status:** 🎯 ACTIVE  
**Priority:** 🔴 HIGH (Foundation for AI-first knowledge system)  
**Created:** 2026-02-13  
**Goal:** Redesign all 36 MCP tools to be perfect for AI agent UX

---

## 🎯 Vision Statement

**"Markdown files are going away. Make the tools perfect."**

**Guiding Principles:**
1. **SQLite-first** - File-based tools are legacy, phase them out
2. **Token-efficient** - Default to metadata, opt-in for content
3. **Conversational** - Support natural queries ("Show me Day 10")
4. **Smart defaults** - Don't make agents repeat dbPath every time
5. **Section-aware** - Markdown sections are natural semantic boundaries
6. **Clear responses** - Tell agents what they got, not just dump data
7. **Composable** - Tools work together, not in isolation

---

## 📊 Current State Analysis

**Total tools: 36**

### Breakdown by Category:
- **Context/Discovery:** 5 tools (get_critical_invariants, get_validation_matrix, get_active_plans, get_recent_sessions, find_skill_for_task)
- **File-Based Query:** 7 tools (query_plans, query_sessions, get_plans_by_status, get_all_plans, get_session_by_date, rebuild_index, sync_plans)
- **SQLite Query:** 5 tools (query_sessions_sqlite, query_plans_sqlite, query_learned_patterns_sqlite, search_context_sqlite, get_db_stats_sqlite)
- **Session Mutations:** 5 tools (create_session, append_to_session, prepend_to_session, insert_after_section, insert_before_section)
- **Plan Mutations:** 4 tools (create_plan, set_plan_status, append_to_plan, prepend_to_plan)
- **Metadata Mutations:** 2 tools (update_session_metadata, update_plan_metadata)
- **Archive:** 2 tools (archive_sessions, archive_plans)
- **Validation:** 3 tools (validate_deliverables, check_tdd_compliance, validate_skill)
- **Enhanced Query:** 3 tools (search_context, find_pattern, get_skill_by_name)

### 🚨 Critical Issues Discovered

**Issue 1: Tool Redundancy**
- File-based query tools (7) overlap with SQLite query tools (5)
- Why have both `query_sessions` AND `query_sessions_sqlite`?
- SQLite is 10-100x faster - file-based tools should be deprecated

**Issue 2: Token Waste (MASSIVE)**
- **ALL query tools return full content by default**
- query_sessions_sqlite returns 90KB (22K tokens) when agent needs 500 bytes
- query_plans_sqlite returns 32KB (8K tokens) for 2 plans
- query_learned_patterns_sqlite returns 191KB (48K tokens) for 33 patterns
- **Total waste: 78K tokens (39% context) just for browsing!**

**Issue 3: No Section-Based Querying**
- Session files are 50KB+ with multiple days/sections
- Agent asks "Show me Day 10 testing" → Gets entire week (90% waste)
- No tools support `section` parameter for targeted retrieval
- Forces agents to fetch full content and parse manually

**Issue 4: dbPath Required Every Time**
- Every SQLite tool requires `dbPath: ".aiknowsys/knowledge.db"`
- Agent has to repeat this on EVERY call
- Should have smart default or auto-detection

**Issue 5: Mutation Tools Broken (All 10!)**
- CLI options are camelCase (`--appendSection`) but Commander.js expects dash-case (`--append-section`)
- ALL mutation tools fail with "unknown option" error
- Tracked in PLAN_mcp_mutation_bug_fix.md (HIGH priority)

**Issue 6: Confusing Response Format**
- Tools return raw JSON dumps without metadata
- Agent doesn't know if they got metadata vs full content
- No indication of token cost or data size
- Missing pagination hints for large results

**Issue 7: No Batch Operations**
- Want to update multiple sessions? Call tool 10 times
- Want to query all active plans across 3 statuses? 3 calls
- No support for bulk queries or mutations

**Issue 8: Missing Natural Language**
- Tools use rigid filters (dateAfter, dateBefore, topic)
- Can't say "Show me sessions from last week about MCP"
- No semantic search by description or intent
- Keywords-only matching

---

## 💡 Solution Design: AI-First API

### Phase 1: Core Improvements (Foundation)

**1.1: Add Token-Efficient Parameters to ALL Query Tools**

Apply the section-based querying pattern (from PLAN_mcp_query_token_optimization.md) to ALL tools:

```typescript
// Every query tool gets these parameters:
interface QueryOptions {
  // Token efficiency
  includeContent?: boolean;    // Default: false (metadata only)
  section?: string;            // Extract specific markdown section
  
  // Smart defaults
  dbPath?: string;             // Default: ".aiknowsys/knowledge.db" (auto-detect)
  
  // Clear responses
  includeMetrics?: boolean;    // Include token cost, size, timing (default: true)
}
```

**1.2: Deprecate File-Based Query Tools**

Mark as deprecated, redirect to SQLite versions:

```typescript
// OLD (DEPRECATED):
this.server.registerTool('query_sessions', { 
  description: '⚠️ DEPRECATED: Use query_sessions_sqlite instead (10-100x faster)'
})

// NEW (CANONICAL):
this.server.registerTool('query_sessions_sqlite', {
  description: 'Query sessions from SQLite (default). Three modes: metadata (95% savings), section-based (90% savings), full content.'
})
```

**Deprecation path:**
- Phase 1: Mark as deprecated, keep working  
- Phase 2: Add warnings to responses  
- Phase 3: Remove deprecated tools (v1.0.0)

**1.3: Add Response Metadata to ALL Tools**

Wrap all responses with metadata:

```typescript
interface ToolResponse {
  // Response metadata
  mode: 'metadata' | 'section' | 'full-content';
  tokenEstimate: number;
  recordCount: number;
  sizeBytes: number;
  
  // Actual data
  data: any;
  
  // Pagination (if applicable)
  hasMore?: boolean;
  nextOffset?: number;
}
```

**Example:**
```json
{
  "mode": "section",
  "tokenEstimate": 1200,
  "recordCount": 1,
  "sizeBytes": 5120,
  "data": {
    "sessions": [{
      "id": "2026-02-13-session",
      "date": "2026-02-13",
      "content": "## Day 10 Testing...(section only)"
    }]
  }
}
```

**1.4: Smart dbPath Default**

Auto-detect database location:

```typescript
function getDefaultDbPath(): string {
  // Try common locations
  const candidates = [
    '.aiknowsys/knowledge.db',
    '../.aiknowsys/knowledge.db',
    '../../.aiknowsys/knowledge.db'
  ];
  
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  
  throw new Error('Database not found. Run `npx aiknowsys migrate-to-sqlite` first.');
}
```

**1.5: Fix Mutation Tools CLI Bug**

Implement PLAN_mcp_mutation_bug_fix.md:
- Change all CLI options to dash-case
- Update MCP tool calls to match
- Test all 10 mutation tools

---

### Phase 2: Advanced Features (AI UX)

**2.1: Semantic Search with Natural Language**

Add NL query parsing:

```typescript
// OLD (rigid filters):
query_sessions_sqlite({ dateAfter: "2026-02-06", topic: "mcp-tools" })

// NEW (natural language):
query_sessions_natural({
  query: "Show me sessions from last week about MCP testing"
})
// Parses to: { dateAfter: "2026-02-06", keywords: ["mcp", "testing"] }
```

**2.2: Batch Operations**

Add batch mutation tools:

```typescript
// Batch session updates
batch_update_sessions({
  sessions: [
    { date: "2026-02-13", section: "## Status", content: "Complete" },
    { date: "2026-02-12", section: "## Status", content: "Complete" }
  ]
})

// Batch plan status
batch_set_plan_status({
  planIds: ["PLAN_mcp_tools", "PLAN_optimization"],
  status: "COMPLETE"
})
```

**2.3: Conversational Section Shortcuts**

Add section-aware shortcuts:

```typescript
// Instead of:
query_sessions_sqlite({ 
  dateAfter: "2026-02-13", 
  section: "## Day 10" 
})

// Allow:
get_session_section({
  date: "2026-02-13",
  section: "Day 10"  // No ## required
})
```

**2.4: Aggregate Queries**

Add summary/analysis tools:

```typescript
// Get high-level summary
get_project_summary({
  period: "last-week"
})
// Returns: X sessions, Y plans, Z patterns, topics breakdown

// Get topic trends
get_topic_timeline({
  topic: "mcp-tools",
  days: 30
})
// Returns: Daily activity on topic
```

**2.5: Pagination for Large Results**

Add pagination to prevent token overflow:

```typescript
query_sessions_sqlite({
  dateAfter: "2026-01-01",
  limit: 10,       // Max 10 results
  offset: 0,       // Start at first result
  includeContent: false
})

// Response includes pagination metadata:
{
  "hasMore": true,
  "nextOffset": 10,
  "totalCount": 50
}
```

---

### Phase 3: Cleanup & Consolidation

**3.1: Remove Redundant Tools**

**Consolidate file-based tools into SQLite:**

| Old Tool | New Tool | Reason |
|----------|----------|--------|
| query_sessions | query_sessions_sqlite | SQLite 10-100x faster |
| query_plans | query_plans_sqlite | SQLite 10-100x faster |
| get_plans_by_status | query_plans_sqlite({ status }) | Same functionality |
| get_all_plans | query_plans_sqlite({}) | No filters = all plans |
| get_session_by_date | query_sessions_sqlite({ date }) | Same functionality |
| search_context | search_context_sqlite | SQLite FTS5 faster |

**Keep:**
- rebuild_index (still needed for migration)
- sync_plans (multi-developer workflow)

**Result:** 36 tools → ~25 tools (30% reduction)

**3.2: Rename Tools for Clarity**

**Remove "sqlite" suffix (it's the default now):**

```typescript
// OLD:
query_sessions_sqlite()
query_plans_sqlite()
search_context_sqlite()

// NEW:
query_sessions()     // SQLite is default
query_plans()        // SQLite is default
search_context()     // SQLite is default, FTS5 enabled
```

**3.3: Group Tools by Use Case**

**Discovery:**
- `get_critical_invariants()`
- `get_validation_matrix()`
- `get_active_plans()`
- `get_recent_sessions()`
- `find_skill_for_task()`

**Query (Read):**
- `query_sessions()` - With metadata/section/full modes
- `query_plans()` - With metadata/section/full modes
- `query_patterns()` - Renamed from query_learned_patterns_sqlite
- `search_all()` - Renamed from search_context_sqlite
- `get_db_stats()`

**Mutation (Write):**
- `create_session()`
- `update_session()` - Unified (append/prepend/insert operations as params)
- `create_plan()`
- `update_plan()` - Unified (status/append/prepend operations as params)

**Maintenance:**
- `archive_sessions()`
- `archive_plans()`
- `validate_deliverables()`
- `rebuild_index()`
- `sync_plans()`

**Result:** 36 tools → 19 tools (47% reduction!)

---

## 📋 Implementation Plan

### Phase 1: Foundation (3-4 hours)

**Step 1.1: Fix Mutation Tools Bug (1h)**
- Implement PLAN_mcp_mutation_bug_fix.md
- Test all 10 mutation tools
- Update documentation

**Step 1.2: Add Token Optimization to Query Tools (2h)**
- Implement PLAN_mcp_query_token_optimization.md
- Add includeContent + section parameters to all 5 SQLite query tools
- Update schemas and handlers
- Test metadata/section/full modes

**Step 1.3: Add Response Metadata (1h)**
- Wrap all responses with token estimates, size, mode
- Update all query tool handlers
- Test metadata visibility

---

### Phase 2: Advanced Features (4-5 hours)

**Step 2.1: Smart dbPath Default (1h)**
- Implement auto-detection logic
- Make dbPath optional in all SQLite tools
- Update schemas

**Step 2.2: Batch Operations (2h)**
- Create batch_update_sessions
- Create batch_set_plan_status
- Test batch efficiency

**Step 2.3: Natural Language Queries (2h)**
- Add query_sessions_natural
- Implement NL parsing (datewords: "last week", "yesterday", "this month")
- Test conversational patterns

---

### Phase 3: Cleanup (2-3 hours)

**Step 3.1: Deprecate File-Based Tools (1h)**
- Mark 6 tools as deprecated
- Add warnings to responses
- Update documentation

**Step 3.2: Rename Tools (1h)**
- Remove "sqlite" suffix
- Update all tool registrations
- Update AGENTS.md MCP tools list

**Step 3.3: Test Suite (1h)**
- Test all 36 tools (before cleanup)
- Test final 19 tools (after cleanup)
- Validate deprecation warnings

---

## ⏱️ Timeline

| Phase | Time | Status |
|-------|------|--------|
| Phase 1: Foundation | 3-4h | 📋 PLANNED |
| Phase 2: Advanced Features | 4-5h | 📋 PLANNED |
| Phase 3: Cleanup | 2-3h | 📋 PLANNED |
| **Total** | **9-12h** | **📋 PLANNED** |

**Blocking dependencies:**
- PLAN_mcp_mutation_bug_fix.md must complete first (blocks mutations)
- PLAN_mcp_query_token_optimization.md provides pattern for all query tools

**Parallel work possible:**
- Token optimization + batch operations can happen concurrently
- Deprecation can happen in parallel with feature work

---

## 🎯 Success Criteria

**Token Efficiency:**
- [ ] All query tools default to metadata-only (95-99% savings)
- [ ] Section-based querying available on ALL query tools
- [ ] Response metadata includes token estimates
- [ ] Browsing entire knowledge base uses <500 tokens (vs 78K today)

**AI UX:**
- [ ] No repeated dbPath required (smart defaults)
- [ ] Natural language queries work ("last week about MCP")
- [ ] Batch operations supported (update 10 sessions in 1 call)
- [ ] Clear response metadata (agent knows what they got)

**Cleanup:**
- [ ] 36 tools → 19 tools (47% reduction)
- [ ] File-based tools deprecated with warnings
- [ ] All tools follow consistent naming (no "sqlite" suffix)
- [ ] Documentation updated (AGENTS.md, ESSENTIALS.md)

**Technical:**
- [ ] All 10 mutation tools working (bug fixed)
- [ ] All query tools tested with 3 modes (metadata/section/full)
- [ ] No regressions in existing functionality
- [ ] Performance maintained (<25ms for queries)

---

## 🔄 Related Work

**Completed:**
- ✅ Day 10 MCP testing (discovered token efficiency issue)
- ✅ PLAN_mcp_query_token_optimization.md (provides pattern)
- ✅ PLAN_mcp_mutation_bug_fix.md (blocks mutation tools)
- ✅ AGENTS.md MCP-first rewrite (discoverability solved)

**Parallel work:**
- ⏸️ PLAN_template_sync_mcp_tools.md (can proceed independently)
- ⏸️ Phase 1 wrap-up (wait for this overhaul to complete)

---

## 📝 Notes for Developer

**Why this matters:**
- AI agents are the PRIMARY users of MCP tools
- Current tools designed for humans → massive token waste
- SQLite is the future, file-based tools are legacy
- "Markdown files are going away" = API redesign opportunity

**Design philosophy:**
- **Metadata-first** - Browse without bloat
- **Section-aware** - Match conversational patterns
- **Smart defaults** - Don't make agents work hard
- **Clear responses** - Tell agents what they got
- **Composable** - Tools work together

**AI UX principles applied:**
1. Agent asks "What sessions from last week?" → Get metadata (500 tokens)
2. Agent asks "Show me Day 10 section" → Get section (1.2K tokens)
3. Agent asks "I need full session" → Get all (12K tokens)

**Total tokens:** 13.7K (vs 78K today = 82% savings!)

**Breaking changes:**
- Deprecating 6 file-based tools (gradual migration)
- Renaming tools (remove "sqlite" suffix)
- Response format changes (wrapped with metadata)

**Mitigation:**
- Deprecation warnings guide agents to new tools
- Old tools keep working during migration period
- New response format is additive (data field contains old format)

**TDD approach:**
1. Write tests for token optimization (metadata/section/full modes)
2. Tests fail (features not implemented)
3. Implement token optimization
4. Tests pass
5. Measure token savings (validate 95-99% improvement)

---

*Part of Phase 1 MCP tools finalization. Redesigns all 36 tools for AI-first UX.*
