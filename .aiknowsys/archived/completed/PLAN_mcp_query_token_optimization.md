---
id: "mcp_query_token_optimization"
title: "MCP Query Tools - Token Optimization"
status: "ACTIVE"
author: "arno-paffen"
priority: "high"
type: "performance"
topics: 0
created: "2026-02-13"
started: "2026-02-13"
---

# Implementation Plan: MCP Query Token Optimization

**Status:** 📋 PLANNED  
**Created:** 2026-02-13  
**Priority:** HIGH (AI agent UX issue)

---

## 🎯 Problem Statement

**Current behavior is token-inefficient for AI agents:**

```typescript
// Agent asks: "Show me the MCP testing results from Feb 13 session"
query_sessions_sqlite({ dateAfter: "2026-02-06" })

// Returns: 90KB full session content (4 sessions)
// Token cost: ~22,000 tokens (11% of Claude's 200K context!)
// What agent needed: Just the "## Day 10 Testing" section (~5KB)
// Waste: ~20,000 tokens (90%+ wasted even within single session!)
```

**Real-world impact:**
- Agent can only query 4-5 times before context fills
- Prevents conversational section-by-section exploration
- Forces "fetch everything or nothing" approach
- Degrades conversation quality (irrelevant sections pollute context)

**Example scenario:**
```
Agent conversation:
1. "What sessions from last week?" → 22K tokens (needs: 500 tokens metadata)
2. "Show me Day 10 testing section" → 22K tokens (needs: 1.2K tokens for section)
3. "Any patterns about error handling?" → 48K tokens (needs: 2K tokens for category)

Total: 92K tokens consumed (46% context!)
Needed: 3.7K tokens (1.8% context)
Waste: 95.8% of tokens on content not asked for
```

**AI UX Problem:**
Session files are 50KB+ with multiple days/sections. When agent asks "Show me Day 10", returning entire week's work is token-wasteful and conversationally awkward.

---

## 📊 Current State Analysis

### Tool Performance (Day 10 Testing)

| Tool | Records | Size | Tokens | Content Needed? |
|------|---------|------|--------|-----------------|
| query_sessions_sqlite | 4 | 90KB | ~22K | Rarely (browse first) |
| query_plans_sqlite | 2 | 32KB | ~8K | Rarely (browse first) |
| query_learned_patterns_sqlite | 33 | 191KB | ~48K | Rarely (browse first) |
| search_context_sqlite | 4 | ~8KB | ~2K | ✅ Already optimized |

**Observation:** `search_context_sqlite` already uses snippet pattern (2KB vs 191KB potential)

---

## 🎯 Goal

**Enable efficient browsing and filtering without content bloat.**

**Success Criteria:**
- 95%+ token reduction for metadata-only queries
- Agent can browse 100+ items in same space as 5 full items
- Backward compatible (default behavior reasonable)
- Consistent pattern across all query tools

---

## 💡 Solution Design

### Pattern: Metadata-First with Opt-In Content

**Inspired by `search_context_sqlite` success:**

```typescript
// Phase 1: Browse (lightweight)
const sessions = await query_sessions_sqlite({
  dateAfter: "2026-02-06"
  // includeContent defaults to false
})
// Returns: [{ id, date, title, topics, status, author }]
// Size: ~2KB, Tokens: ~500 (97.7% reduction!)

// Phase 2: Fetch details (if needed)
const fullSession = await query_sessions_sqlite({
  dateAfter: "2026-02-06",
  includeContent: true  // Explicit opt-in
})
// Returns: Full content
// Size: 90KB, Tokens: ~22K (same as before)
```

**Benefits:**
- **Token efficient:** Default behavior saves 95%+ tokens
- **Flexible:** Full content available when needed
- **Agent-friendly:** Natural two-phase workflow (browse → fetch)
- **Backward compatible:** Existing queries still work (just faster)

---

## 📋 Implementation Plan

### Phase 1: Core Function Updates (TDD) - 2 hours

**Goal:** Add `includeContent` parameter AND `section` parameter to core query functions

**Two retrieval patterns:**
1. **Metadata-First** (`includeContent: false`) - Browse without content bloat
2. **Section-Based** (`section: "Day 10"`) - Fetch specific markdown sections

**Files:**
- `lib/core/sqlite-query.ts` (3 functions)
- `lib/context/sqlite-storage.ts` (extend if needed)
- `test/lib/core/sqlite-query.test.ts` (add tests)

**Step 1.1: Extend Type Definitions (20 min)**

```typescript
// lib/types/index.ts
export interface QuerySessionsOptions {
  dateAfter?: string;
  dateBefore?: string;
  topic?: string;
  status?: string;
  includeContent?: boolean;  // NEW: Default false (metadata only)
  section?: string;          // NEW: Extract specific markdown section
  dbPath: string;
}

export interface QueryPlansOptions {
  status?: PlanStatus;
  author?: string;
  topic?: string;
  priority?: 'high' | 'medium' | 'low';
  includeContent?: boolean;  // NEW: Default false (metadata only)
  section?: string;          // NEW: Extract specific markdown section
  dbPath: string;
}

export interface QueryLearnedPatternsOptions {
  category?: string;
  keywords?: string;
  includeContent?: boolean;  // NEW: Default false (metadata only)
  section?: string;          // NEW: Extract specific markdown section
  dbPath: string;
}
```

**Behavior:**
- `includeContent: false` (default) → Metadata only
- `includeContent: true` → Full content
- `section: "Day 10"` → Extract section matching "## Day 10" (implies includeContent: true for that section only)

**Step 1.2: Update SqliteStorage (45 min)**

Add metadata-only queries AND section extraction:

```typescript
// lib/context/sqlite-storage.ts

// Lightweight session row (no content)
export interface SessionMetadata {
  id: string;
  date: string;
  title: string;
  goal: string;
  status: string;
  topics: string[];
  created_at: string;
  updated_at: string;
}

querySessionsMetadata(filters: SessionFilters): SessionMetadata[] {
  // SELECT id, date, title, goal, status, topics, created_at, updated_at
  // (exclude content column)
}

queryPlansMetadata(filters: PlanFilters): PlanMetadata[] {
  // SELECT id, title, status, author, priority, type, created, updated
  // (exclude content column)
}

queryLearnedPatternsMetadata(filters: PlanFilters): PatternMetadata[] {
  // SELECT id, category, title, keywords, created_at
  // (exclude content column)
}

// NEW: Extract markdown section
extractSection(content: string, sectionPattern: string): string | null {
  // Find ## SectionName or ## Day 10, etc.
  // Extract from that heading to next same-level heading
  // Return section content or null if not found
  const lines = content.split('\n');
  const sectionRegex = new RegExp(`^##\\s+.*${sectionPattern}`, 'i');
  
  let startIdx = -1;
  let endIdx = lines.length;
  
  for (let i = 0; i < lines.length; i++) {
    if (sectionRegex.test(lines[i])) {
      startIdx = i;
    } else if (startIdx >= 0 && /^##\s+/.test(lines[i])) {
      endIdx = i;
      break;
    }
  }
  
  if (startIdx === -1) return null;
  return lines.slice(startIdx, endIdx).join('\n');
}
```

**Section extraction logic:**
- Searches for markdown section matching pattern (case-insensitive)
- Returns from `## SectionName` to next `##` same-level heading
- Returns null if section not found
- Works with patterns like "Day 10", "MCP", "Progress", etc.

**Step 1.3: Update Core Functions (40 min)**

```typescript
// lib/core/sqlite-query.ts

export async function querySessionsSqlite(
  options: QuerySessionsOptions
): Promise<{ count: number; sessions: SessionRow[] | SessionMetadata[] }> {
  const storage = new SqliteStorage(dbPath);
  
  const { includeContent = false, section, ...filters } = options;
  
  // Case 1: Section-based query (overrides includeContent)
  if (section) {
    const fullSessions = storage.queryFullSessions(filters);
    const sectioned = fullSessions.map(s => ({
      ...s,
      content: storage.extractSection(s.content, section) || `[Section "${section}" not found]`
    }));
    return { count: sectioned.length, sessions: sectioned };
  }
  
  // Case 2: Metadata only (default)
  if (!includeContent) {
    const sessions = storage.querySessionsMetadata(filters);
    return { count: sessions.length, sessions };
  }
  
  // Case 3: Full content
  const sessions = storage.queryFullSessions(filters);
  return { count: sessions.length, sessions };
}
```

**Three retrieval modes:**
1. `{ section: "Day 10" }` → Extract specific section from matching records
2. `{ includeContent: false }` → Metadata only (default, 95% savings)
3. `{ includeContent: true }` → Full content (existing behavior)

**Step 1.4: Write Tests (20 min)**

```typescript
// test/lib/core/sqlite-query.test.ts

describe('querySessionsSqlite retrieval modes', () => {
  it('should return metadata only by default', async () => {
    const result = await querySessionsSqlite({ dbPath });
    expect(result.sessions[0]).not.toHaveProperty('content');
    expect(result.sessions[0]).toHaveProperty('title');
    expect(result.sessions[0]).toHaveProperty('date');
  });
  
  it('should include full content when requested', async () => {
    const result = await querySessionsSqlite({ 
      dbPath, 
      includeContent: true 
    });
    expect(result.sessions[0]).toHaveProperty('content');
    expect(result.sessions[0].content.length).toBeGreaterThan(1000);
  });
  
  it('should extract specific section when provided', async () => {
    const result = await querySessionsSqlite({ 
      dbPath,
      dateAfter: "2026-02-13",
      section: "Day 10"
    });
    expect(result.sessions[0]).toHaveProperty('content');
    expect(result.sessions[0].content).toContain('## Day 10');
    expect(result.sessions[0].content).not.toContain('## Day 9');  // Not adjacent section
  });
  
  it('should handle missing section gracefully', async () => {
    const result = await querySessionsSqlite({ 
      dbPath,
      section: "Nonexistent Section"
    });
    expect(result.sessions[0].content).toContain('[Section "Nonexistent Section" not found]');
  });
});
```

**Test coverage:**
- [ ] Metadata-only mode (default)
- [ ] Full content mode (explicit opt-in)
- [ ] Section extraction (specific section)
- [ ] Missing section handling
- [ ] Token size validation (metadata < 1KB, section < 5KB, full > 10KB)

**Validation:**
- [ ] Tests pass for metadata-only mode
- [ ] Tests pass for full content mode
- [ ] Tests pass for section extraction mode
- [ ] Section extraction handles missing sections gracefully
- [ ] Token reduction measured (metadata vs section vs full)
- [ ] Backward compatibility maintained (existing queries still work)

**Expected token reductions:**
- Metadata-only: 95-99% reduction (22K → 500 tokens)
- Section-based: 90% reduction (22K → 1.2K tokens)
- Full content: No change (22K tokens, explicit opt-in)

---

### Phase 2: MCP Tool Updates - 1 hour

**Goal:** Expose `includeContent` and `section` parameters in MCP tools

**Files:**
- `mcp-server/src/tools/sqlite-query.ts`
- `mcp-server/test/tools/sqlite-query.test.ts`

**Step 2.1: Update Tool Schemas (25 min)**

```typescript
// mcp-server/src/tools/sqlite-query.ts

export const querySessionsSqliteTool = {
  name: 'query_sessions_sqlite',
  description: `Query sessions from SQLite database. 
    
Three retrieval modes:
- Default (metadata only): Fast browsing, 95% token savings
- Section-based (section="Day 10"): Extract specific markdown section, 90% savings
- Full content (includeContent=true): Complete session content`,
  inputSchema: {
    type: 'object',
    properties: {
      dateAfter: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      dateBefore: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      topic: { type: 'string' },
      status: { type: 'string' },
      includeContent: { 
        type: 'boolean', 
        default: false,
        description: 'Include full content (default: false for token efficiency)'
      },
      section: {
        type: 'string',
        description: 'Extract specific markdown section (e.g., "Day 10", "MCP Testing"). Overrides includeContent.'
      },
      dbPath: { type: 'string', default: '.aiknowsys/knowledge.db' }
    }
  },
  handler: async (params) => {
    const result = await querySessionsSqlite(params);
    
    // Add metadata to help agents understand what they got
    const meta = params.section 
      ? `Section-based query: "${params.section}"`
      : params.includeContent 
      ? 'Full content'
      : 'Metadata only';
    
    return { 
      content: [{ 
        type: 'text', 
        text: `${meta}\n\n${JSON.stringify(result, null, 2)}` 
      }] 
    };
  }
};
```

**Key improvements:**
- Clear description of 3 retrieval modes
- Section parameter documented with examples
- Response includes metadata about retrieval mode
- Helps agents understand token efficiency choices

**Step 2.2: Update Tests (25 min)**

```typescript
// mcp-server/test/tools/sqlite-query.test.ts

it('should return metadata by default for sessions', async () => {
  const result = await querySessionsSqliteTool.handler({ dbPath });
  const response = result.content[0].text;
  expect(response).toContain('Metadata only');
  const data = JSON.parse(response.split('\n\n')[1]);
  expect(data.sessions[0]).not.toHaveProperty('content');
});

it('should include content when requested for sessions', async () => {
  const result = await querySessionsSqliteTool.handler({ 
    dbPath, 
    includeContent: true 
  });
  const response = result.content[0].text;
  expect(response).toContain('Full content');
  const data = JSON.parse(response.split('\n\n')[1]);
  expect(data.sessions[0]).toHaveProperty('content');
});

it('should extract section when specified for sessions', async () => {
  const result = await querySessionsSqliteTool.handler({ 
    dbPath,
    dateAfter: "2026-02-13",
    section: "Day 10"
  });
  const response = result.content[0].text;
  expect(response).toContain('Section-based query: "Day 10"');
  const data = JSON.parse(response.split('\n\n')[1]);
  expect(data.sessions[0].content).toContain('## Day 10');
});
```

**Test coverage:**
- [ ] Metadata-only returns no content field
- [ ] Full content returns complete content
- [ ] Section extraction returns only requested section
- [ ] Response metadata indicates retrieval mode
- [ ] All three modes for plans and patterns too

**Step 2.3: Update Server Registration (10 min)**

Tool descriptions updated to highlight token efficiency.

**Step 2.4: Integration Test (10 min)**

Test with actual MCP client:
```typescript
// Mode 1: Metadata only (should return ~2KB)
query_sessions_sqlite({ dateAfter: "2026-02-06" })

// Mode 2: Section-based (should return ~5-10KB)
query_sessions_sqlite({ 
  dateAfter: "2026-02-13",
  section: "Day 10" 
})

// Mode 3: Full content (should return ~90KB)
query_sessions_sqlite({ 
  dateAfter: "2026-02-06", 
  includeContent: true 
})
```

**Verify:**
- [ ] Metadata response is <2KB
- [ ] Section response is 5-10KB (one section only)
- [ ] Full content response is ~90KB (all 4 sessions)
- [ ] Agent understands retrieval mode from response

---

### Phase 3: Documentation Updates - 30 min

**Goal:** Update all docs to reflect new pattern

**Files:**
- `CODEBASE_ESSENTIALS.md` (Section 9)
- `docs/mcp-sqlite-usage-examples.md`
- `mcp-server/SETUP.md`

**Step 3.1: Update CODEBASE_ESSENTIALS.md (15 min)**

```markdown
## Section 9: MCP Tools

### Query Pattern: Metadata-First + Section-Based (Token Efficient)

**All query tools support three retrieval modes:**

1. **Metadata-only** (default) - Browse without content bloat (~500 tokens)
2. **Section-based** - Extract specific markdown sections (~1-5K tokens)
3. **Full content** - Complete content when needed (~20K tokens)

**Three-phase AI UX workflow:**
1. Browse with metadata (find relevant items)
2. Fetch specific sections (get targeted context)
3. Fetch full content (only for comprehensive analysis)

**Example:**
```typescript
// Phase 1: What sessions exist? (500 tokens)
query_sessions_sqlite({ dateAfter: "2026-02-01" })

// Phase 2: Show me Day 10 testing section (1.2K tokens)
query_sessions_sqlite({ 
  dateAfter: "2026-02-13",
  section: "Day 10"
})

// Phase 3: I need the full session (12K tokens)
query_sessions_sqlite({
  dateAfter: "2026-02-13",
  includeContent: true
})
```

**Token savings:** 95-99% for browsing, 90% for section queries
```

**Step 3.2: Update Usage Examples (10 min)**

Add examples showing three-phase workflow:

```typescript
// Example: Conversational AI workflow
// Phase 1: Browse (500 tokens)
const sessions = await query_sessions_sqlite({ 
  dateAfter: "2026-02-01" 
});
console.log(sessions.sessions.map(s => s.title));

// Phase 2: Extract specific section (1.2K tokens)
const day10Section = await query_sessions_sqlite({
  dateAfter: "2026-02-13",
  section: "Day 10"  // Just this section
});
console.log(day10Section.sessions[0].content);  // Only "## Day 10..." section

// Phase 3: Fetch full content (only if needed - 12K tokens)
const fullSession = await query_sessions_sqlite({ 
  dateAfter: "2026-02-13",
  includeContent: true 
});
console.log(fullSession.sessions[0].content);  // Entire session file
```

**AI UX Pattern:**
```
Agent: "What sessions from last week?"
  → query_sessions_sqlite({ dateAfter: "..." }) // Metadata: 500 tokens
  
User: "Show me the Day 10 testing section"
  → query_sessions_sqlite({ section: "Day 10" }) // Section: 1.2K tokens
  
User: "I need to analyze the full session"
  → query_sessions_sqlite({ includeContent: true }) // Full: 12K tokens
```
const fullSession = await query_sessions_sqlite({ 
  dateAfter: "2026-02-13",
  includeContent: true 
});
```

**Step 3.3: Update Token Comparison Table (5 min)**

```markdown
| Operation | Full Content | Section-Based | Metadata-Only | Savings |
|-----------|--------------|---------------|---------------|---------|
| Query 4 sessions | 90KB / 22K tokens | 20KB / 5K tokens | 2KB / 500 tokens | 97.7% (metadata) |
| Single session section | 50KB / 12K tokens | 5KB / 1.2K tokens | 500B / 125 tokens | 90% (section) |
| Query 2 plans | 32KB / 8K tokens | 8KB / 2K tokens | 1KB / 250 tokens | 96.9% (metadata) |
| Query 33 patterns | 191KB / 48K tokens | N/A | 5KB / 1.2K tokens | 97.5% (metadata) |

**AI Conversation Example:**
- Browse all sessions: 500 tokens (metadata)
- Fetch "Day 10" section: 1.2K tokens (section)
- Full session if needed: 12K tokens (full content)
- **Total: 13.7K tokens** (vs 22K without section support)
```

---

### Phase 4: Validation & Testing - 30 min

**Goal:** Verify token savings and UX improvement for all three modes

**Step 4.1: Unit Test Coverage (Automated)**
- [ ] All 3 core functions tested (metadata + section + full content modes)
- [ ] All 3 MCP tools tested (all modes)
- [ ] Edge cases covered (empty results, missing sections, large datasets)
- [ ] Section extraction handles markdown structure correctly

**Step 4.2: Token Measurement (Manual)**

Test queries and measure actual tokens:

```bash
# Mode 1: Metadata
query_sessions_sqlite({ dateAfter: "2026-02-06" })
# Measure: ~2KB, ~500 tokens

# Mode 2: Section-based
query_sessions_sqlite({ dateAfter: "2026-02-13", section: "Day 10" })
# Measure: ~5KB, ~1.2K tokens

# Mode 3: Full content
query_sessions_sqlite({ dateAfter: "2026-02-06", includeContent: true })
# Measure: ~90KB, ~22K tokens
```

**Expected results:**
- Metadata: ~2KB, ~500 tokens (97.7% savings)
- Section: ~5KB, ~1.2K tokens (90% savings vs full session)
- Full content: ~90KB, ~22K tokens (baseline)

**Step 4.3: Real Conversation Test (Manual)**

Test with actual AI agent (conversational workflow):
- "List all sessions from February" → Metadata (500 tokens)
- "Show me the Day 10 testing section" → Section (1.2K tokens)
- "I need the full Feb 13 session for analysis" → Full content (12K tokens)
- **Total: 13.7K tokens** vs 22K without section support (37% savings)

**Verify:**
- [ ] Agent can browse efficiently (metadata mode)
- [ ] Agent can drill into specific sections (section mode)
- [ ] Agent can still get full content when needed (explicit opt-in)
- [ ] Conversational flow feels natural ("Show me X section" works)
- [ ] Missing section handling is graceful (clear error message)
- Agent should explicitly request `includeContent: true`

**Step 4.4: Performance Regression Test**

Ensure metadata queries are faster:
```bash
# Should be <10ms (no content parsing)
Benchmark: querySessionsMetadata()

# Should be <25ms (original baseline)
Benchmark: querySessionsFull()
```

---

## 🎯 Success Criteria

**Must Have:**
- [ ] All 3 query tools support `includeContent` parameter
- [ ] Default behavior returns metadata only
- [ ] 95%+ token reduction for metadata queries
- [ ] All tests passing (unit + integration)
- [ ] Documentation updated

**Should Have:**
- [ ] Token savings measured and documented
- [ ] Performance regression test confirms no slowdown
- [ ] Real conversation test validates UX improvement

**Nice to Have:**
- [ ] Add pagination support (`limit`, `offset`)
- [ ] Add summary counts (without fetching all records)

---

## 📊 Expected Impact

**Token Efficiency:**
- Browse 100 items: 12.5K tokens (metadata) vs 500K tokens (content)
- **40x improvement** in browsing capacity

**Agent Workflow:**
```
Before: 
- Query sessions → 22K tokens
- Query plans → 8K tokens  
- Query patterns → 48K tokens
- Total: 78K tokens (39% context consumed for browsing)

After:
- Query sessions → 500 tokens
- Query plans → 250 tokens
- Query patterns → 1.2K tokens
- Total: 2K tokens (1% context consumed)

Savings: 76K tokens (38% context freed for actual work)
```

---

## ⚠️ Risks & Mitigations

**Risk 1: Breaking Changes**
- **Likelihood:** Low (adding optional parameter)
- **Impact:** Medium (existing integrations)
- **Mitigation:** Default behavior is backward compatible

**Risk 2: Agent Confusion**
- **Likelihood:** Medium (won't know when to use `includeContent`)
- **Impact:** Low (can always fetch content)
- **Mitigation:** Clear tool descriptions, examples in docs

**Risk 3: Two-Query Overhead**
- **Likelihood:** High (browse + fetch = 2 queries)
- **Impact:** Low (total still faster than 1 big query)
- **Mitigation:** Document when to use each mode

---

## 🔄 Future Enhancements

**Phase 5 (Optional):**
1. Add `limit` and `offset` for pagination
2. Add `count` operation (no records returned, just count)
3. Add `summary` mode (aggregation without details)
4. Consider caching metadata queries
5. ~Section-based querying~ → **Promoted to Phase 1!** (AI UX critical)

**Note:** Section-based querying was originally planned for Phase 5 but promoted to Phase 1 core feature after realizing it matches conversational AI patterns ("Show me Day 10 section" → returns just that section, 90% token savings vs full session).

---

## 📝 Notes for Developer

**TDD Workflow:**
1. Write tests for metadata mode (RED)
2. Implement metadata queries (GREEN)
3. Write tests for section extraction (RED)
4. Implement section extraction logic (GREEN)
5. Refactor for DRY (REFACTOR)
6. Write tests for full content mode (RED)
7. Implementation already exists, ensure tests pass (GREEN)
8. Integration test with MCP client (all 3 modes)

**Before starting:**
- Review `search_context_sqlite` implementation (already uses snippet pattern)
- Check Day 10 test results for baseline measurements
- Consider SQL performance (SELECT without content column is faster)
- Understand markdown section extraction (## headers as boundaries)

**Key decisions:**
- Default to `includeContent: false` (token-efficient UX) ✅
- Add `section` parameter for conversational AI UX ✅
- Section extraction uses regex to find `## Section` boundaries
- Missing sections return clear error message (not null)

**AI UX Rationale:**
Session files contain multiple days (## Day 9, ## Day 10, etc.). When agent asks "Show me Day 10 testing", returning entire week's work (50KB) wastes 90% of tokens. Section-based querying extracts just the requested section (5KB), matching conversational patterns and enabling efficient multi-turn exploration.

---

## ⏱️ Timeline

| Phase | Time | Status |
|-------|------|--------|
| Phase 1: Core functions (metadata + section) | 2h | 📋 PLANNED |
| Phase 2: MCP tools (3 retrieval modes) | 1h | 📋 PLANNED |
| Phase 3: Documentation | 30m | 📋 PLANNED |
| Phase 4: Validation (3 modes) | 30m | 📋 PLANNED |
| **Total** | **4h** | **📋 PLANNED** |

**Blocking dependencies:** None  
**Ready to start:** Yes (Day 10 testing complete)

**Key features:**
- ✅ Metadata-first browsing (95-99% token savings)
- ✅ Section-based querying (90% savings vs full session, matches AI UX)
- ✅ Full content retrieval (explicit opt-in)

---

*Part of Phase 1 Week 3 optimization work. Addresses token efficiency for AI agent UX.*
