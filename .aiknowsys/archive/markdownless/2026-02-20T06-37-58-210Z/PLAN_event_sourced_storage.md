---
title: "Event-Sourced Storage - AI-Native Knowledge Format"
status: "MERGED"
priority: "high"
created: "2026-02-15"
author: "Planner"
merged: "2026-02-15"
merged_into: "PLAN_knowledge_bank_evolution.md"
topics: ["storage", "event-sourcing", "ai-optimization", "greenfield"]
depends_on: []
evolution_of: ["markdown-based storage", "index-first architecture"]
---

# PLAN: Event-Sourced Storage (AI-Native Knowledge Format)

**Status:** 🔀 MERGED  
**Merged into:** PLAN_knowledge_bank_evolution.md  
**Merged:** 2026-02-15  
**Reason:** Combined with cross-repo foundation for unified knowledge bank evolution.  
**Priority:** 🔴 HIGH  
**Created:** 2026-02-15  
**Estimated:** 3-4 weeks  
**Goal:** Replace markdown storage with event-sourced knowledge graph optimized for AI agents

---

## 🎯 Problem Statement

### Current Architecture (Markdown Storage)

**Existing plans say:**
- "Index = source of truth, markdown = view"
- "Mutation commands write to index FIRST"
- "Markdown regenerated FROM index"

**But they never defined: WHAT does the index contain?**

**Current reality (from PLAN_enhanced_hybrid_architecture.md):**
```typescript
// context-index.json
{
  "sessions": [
    {
      "date": "2026-02-15",
      "topic": "Token Optimization",
      "status": "complete",
      "file": "sessions/2026-02-15-session.md"  // ← Still points to markdown!
    }
  ]
}
```

**This is only metadata!** The actual data (50-100KB) is STILL in markdown files.

### The Fundamental Problem

**Markdown is for HUMANS, not storage:**
- 20-30% tokens wasted on formatting (`##`, `**`, `---`, tables)
- Narrative prose hard to query ("somewhere in that 80KB file...")
- Linear structure inefficient (agent wants 1 section, gets all 50KB)
- Multi-user hostile (merge conflicts in huge files)
- No semantic search (keyword matching only)

**Example: 1 day of work**
```markdown
# Session: 2026-02-15

## Goal
Implement dynamic toolsets...

## Phase 1: Setup (10:00-11:30)
Created ToolRegistry class...
[2000 words of narrative]

## Phase 2: Implementation (13:00-15:00)
Added search functionality...
[3000 words of narrative]

## Validation
All tests passing...
[500 words]

## Key Learnings
Pattern matching works better than...
[800 words]
```

**Total:** 80KB markdown, 160K tokens  
**Agent wants:** "What pattern did we learn?" → Must load ALL 160K tokens

---

## 🎯 Solution: Event-Sourced Knowledge Graph

### Core Principle

**Store atomic facts, not narrative documents.**

```typescript
// Instead of 80KB markdown session
// Store discrete events throughout the day:

Event #1 (10:15):
{
  id: 4521,
  type: "task_completed",
  timestamp: "2026-02-15T10:15:00Z",
  data: {
    task: "Create ToolRegistry class",
    outcome: "success",
    files_changed: ["mcp-server/src/dynamic-toolset/registry.ts"],
    tests_added: 5,
    duration_minutes: 30,
    tdd_cycle: true
  },
  tags: ["mcp-tools", "tdd"],
  embedding: [0.123, -0.456, ...],  // 384-dim semantic vector
  narrative: "Implemented ToolRegistry with TDD. All 5 tests passing."
}

Event #2 (11:00):
{
  id: 4522,
  type: "pattern_discovered",
  timestamp: "2026-02-15T11:00:00Z",
  data: {
    pattern: "progressive_disclosure",
    problem: "Tool schemas waste 29.4% context",
    solution: "Search → Describe → Execute",
    impact_percent: 90,
    source_url: "https://speakeasy.com/blog/..."
  },
  tags: ["pattern", "token-optimization"],
  embedding: [0.789, -0.234, ...],
  narrative: "Discovered progressive disclosure pattern from Speakeasy article."
}

Event #3 (14:30):
{
  id: 4523,
  type: "validation_passed",
  timestamp: "2026-02-15T14:30:00Z",
  data: {
    command: "npm test",
    passed: 24,
    failed: 0,
    coverage: 87.3,
    duration_seconds: 12.4
  },
  tags: ["validation", "tdd"],
  narrative: null  // Not needed for validation events
}
```

**Total:** ~600 tokens for 3 events (vs 160K for markdown)  
**Agent query:** "What pattern did we learn?" → Semantic search returns Event #2 only (80 tokens)  
**Savings:** 99.95%

---

## 📐 Schema Design

### Event Table (Core Storage)

```sql
CREATE TABLE knowledge_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  
  -- Event metadata
  timestamp TEXT NOT NULL,        -- ISO 8601: 2026-02-15T10:15:00Z
  event_type TEXT NOT NULL,       -- task_completed, pattern_discovered, etc.
  
  -- Structured data (the SOURCE OF TRUTH)
  data JSON NOT NULL,             -- Type-specific structured data
  tags JSON,                      -- ['mcp-tools', 'tdd']
  
  -- Semantic search
  embedding BLOB,                 -- 384-dim vector (all-MiniLM-L6-v2)
  
  -- Optional human-readable summary
  narrative TEXT,                 -- 1-2 sentences (optional)
  
  -- Relationships
  related_events JSON,            -- [4520, 4519] - event IDs
  session_date TEXT,              -- Backward compat: "2026-02-15"
  
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX idx_events_timestamp ON knowledge_events(timestamp);
CREATE INDEX idx_events_type ON knowledge_events(event_type);
CREATE INDEX idx_events_session_date ON knowledge_events(session_date);
```

### Event Types & Data Schemas

```typescript
// Type: task_completed
{
  event_type: "task_completed",
  data: {
    task: string;                 // "Implement ToolRegistry"
    outcome: "success" | "failed" | "partial";
    files_changed: string[];      // File paths
    tests_added?: number;
    tests_passing?: number;
    duration_minutes?: number;
    tdd_cycle?: boolean;
    blockers?: string[];
  }
}

// Type: pattern_discovered
{
  event_type: "pattern_discovered",
  data: {
    pattern: string;              // "progressive_disclosure"
    category: string;             // "token-optimization"
    problem: string;              // What problem it solves
    solution: string;             // How it solves it
    impact_percent?: number;      // 90 = 90% improvement
    source_url?: string;
    code_example?: string;
  }
}

// Type: decision_made
{
  event_type: "decision_made",
  data: {
    decision: string;             // "Use pattern matching for MVP"
    rationale: string;            // Why this decision
    alternatives: string[];       // What was considered
    trade_offs: Record<string, string>;
    reversible: boolean;
  }
}

// Type: validation_passed | validation_failed
{
  event_type: "validation_passed",
  data: {
    command: string;              // "npm test"
    passed: number;
    failed: number;
    coverage?: number;
    duration_seconds: number;
    error_summary?: string;       // If failed
  }
}

// Type: bug_encountered
{
  event_type: "bug_encountered",
  data: {
    symptom: string;              // What went wrong
    root_cause?: string;          // Why it happened
    solution?: string;            // How it was fixed
    files_affected: string[];
    time_to_resolve_minutes?: number;
  }
}

// Type: learning_captured
{
  event_type: "learning_captured",
  data: {
    insight: string;              // "Embeddings are overkill for <50 tools"
    context: string;              // When/why this matters
    applies_to: string[];         // ["mcp-tools", "search-optimization"]
    confidence: "low" | "medium" | "high";
  }
}
```

---

## 🔄 Write Patterns

### Current: Monolithic Session Files

```bash
# Problem: One huge file grows all day
09:00 - create-session → 2KB file
10:30 - append work → 15KB file
13:00 - append more → 35KB file
17:00 - end of day → 80KB file

# Result: Agent must load ALL 80KB to answer "what pattern did we learn?"
```

### Proposed: Incremental Event Logging

```typescript
// Throughout the day, log atomic events:

// 10:15 - Task done
await logEvent({
  type: "task_completed",
  data: { task: "ToolRegistry", outcome: "success" }
});

// 11:00 - Pattern discovered
await logEvent({
  type: "pattern_discovered",
  data: { pattern: "progressive_disclosure", impact_percent: 90 }
});

// 14:30 - Tests passed
await logEvent({
  type: "validation_passed",
  data: { command: "npm test", passed: 24, failed: 0 }
});

// Each event: ~50-200 tokens
// 20 events/day = 1K-4K tokens (vs 160K markdown)
```

---

## 🔍 Query Patterns (AI-Optimized)

### 1. Semantic Search

```typescript
// Agent: "How did we optimize tokens?"
await semanticSearch({
  query: "token optimization techniques",
  limit: 5
})

// Returns top 5 events by embedding similarity:
// Event #4522: pattern_discovered (progressive_disclosure)
// Event #4518: task_completed (metadata-only queries)
// Event #4530: learning_captured (embeddings overkill insight)

// Total tokens: 5 events × 80 tokens = 400 tokens
// vs loading 3 full sessions = 300K tokens
// Savings: 99.87%
```

### 2. Structured Queries

```typescript
// "Show me all patterns discovered this week"
await queryEvents({
  eventType: "pattern_discovered",
  dateAfter: "2026-02-08",
  limit: 10
})

// Returns structured JSON (easy to aggregate/analyze)
// Can GROUP BY category, COUNT patterns, etc.
```

### 3. Time-Series Analysis

```typescript
// "How has test coverage changed over time?"
await queryEvents({
  eventType: "validation_passed",
  dateAfter: "2026-02-01",
  orderBy: "timestamp ASC"
})

// Returns:
// [
//   { date: "2026-02-08", coverage: 82.1, tests: 145 },
//   { date: "2026-02-09", coverage: 84.5, tests: 152 },
//   { date: "2026-02-15", coverage: 87.3, tests: 164 }
// ]

// Easy to plot trends, no markdown parsing needed
```

### 4. Dependency Tracking

```typescript
// "What work was related to the SQLite migration?"
await queryEvents({
  tags: ["sqlite-migration"],
  includeRelated: true
})

// Returns events + their related_events graph
// Can trace: decision → tasks → validations → learnings
```

---

## 📝 Markdown Generation (On-Demand Views)

### Principle: Markdown is a VIEW, not storage

```typescript
// Human wants to review work:
const markdown = await generateSessionMarkdown({
  date: "2026-02-15",
  format: "narrative"  // or "timeline", "grouped-by-type"
});

// Writes to: .aiknowsys/sessions/2026-02-15-session.md
// This file is GENERATED, not source of truth
```

### Markdown Generator

```typescript
async function generateSessionMarkdown(opts: {
  date: string;
  format: "narrative" | "timeline" | "grouped";
}): Promise<string> {
  // 1. Query all events for this date
  const events = await queryEvents({
    sessionDate: opts.date,
    orderBy: "timestamp ASC"
  });
  
  // 2. Generate markdown based on format
  if (opts.format === "narrative") {
    return generateNarrativeMarkdown(events);
  } else if (opts.format === "timeline") {
    return generateTimelineMarkdown(events);
  } else {
    return generateGroupedMarkdown(events);
  }
}

function generateNarrativeMarkdown(events: Event[]): string {
  // Group events by logical phases
  const phases = groupByTime(events, { windowMinutes: 90 });
  
  let md = `# Session: ${events[0].session_date}\n\n`;
  
  for (const phase of phases) {
    md += `## Phase: ${phase.summary} (${phase.timeRange})\n\n`;
    
    for (const event of phase.events) {
      // Convert structured data to prose
      if (event.type === "task_completed") {
        md += `✅ Completed ${event.data.task}\n`;
        md += `- Files: ${event.data.files_changed.join(", ")}\n`;
        md += `- Tests: ${event.data.tests_passing} passing\n\n`;
      }
      
      if (event.narrative) {
        md += `${event.narrative}\n\n`;
      }
    }
  }
  
  return md;
}
```

### Multiple View Formats

```bash
# Generate different views of the same data:

# Narrative (traditional session format)
npx aiknowsys export-session --date 2026-02-15 --format narrative

# Timeline (chronological event log)
npx aiknowsys export-session --date 2026-02-15 --format timeline

# Grouped by type (all tasks, all patterns, all decisions)
npx aiknowsys export-session --date 2026-02-15 --format grouped

# Custom (AI generates based on query)
npx aiknowsys export-session --date 2026-02-15 --query "focus on token optimization work"
```

---

## 🔧 Embeddings Strategy

### Local Model: all-MiniLM-L6-v2

**Why this model:**
- 384 dimensions (small, fast)
- 80MB model size (reasonable for local)
- Multi-language support
- Good quality/size trade-off

**Storage overhead:**
```
384 dimensions × 4 bytes (float32) = 1.5KB per event
100 events/day × 1.5KB = 150KB embeddings/day
365 days × 150KB = ~55MB/year (negligible)
```

### Embedding Pipeline

```typescript
import { pipeline } from '@xenova/transformers';

// Load model once at startup
const embedder = await pipeline(
  'feature-extraction',
  'Xenova/all-MiniLM-L6-v2'
);

async function generateEmbedding(text: string): Promise<Float32Array> {
  const output = await embedder(text, {
    pooling: 'mean',
    normalize: true
  });
  
  return output.data;
}

// When logging event:
const eventText = `${event.type}: ${JSON.stringify(event.data)} ${event.narrative || ''}`;
const embedding = await generateEmbedding(eventText);

await db.run(
  'INSERT INTO knowledge_events (embedding, ...) VALUES (?, ...)',
  Buffer.from(embedding.buffer)
);
```

### Vector Search (sqlite-vss)

```typescript
// Semantic search:
const queryEmbedding = await generateEmbedding("token optimization");

const results = db.prepare(`
  SELECT 
    e.id,
    e.event_type,
    e.data,
    distance
  FROM knowledge_events e
  LEFT JOIN event_embeddings ve ON ve.rowid = e.id
  WHERE vss_search(ve.embedding, vss_search_params(?, 5))
  ORDER BY distance ASC
`).all(Buffer.from(queryEmbedding.buffer));
```

---

## 🛤️ Migration Path (3 Phases)

### Phase 1: Hybrid (Keep Markdown, Add Events) - 1 week

**Goal:** Coexistence, no breaking changes

```sql
-- Add events table alongside existing tables
CREATE TABLE knowledge_events (...);

-- Sessions table remains
CREATE TABLE sessions (
  content TEXT  -- Still has markdown
);
```

**Workflow:**
```typescript
// AI logs events during work
await logEvent({ type: "task_completed", data: { ... } });

// End of day: Generate markdown from events
const markdown = await generateSessionMarkdown({ date: "2026-02-15" });

// Both exist:
// - Events table (queryable, semantic search)
// - Markdown file (human review, git diff)
```

**Benefits:**
- ✅ Zero breaking changes
- ✅ Can test event logging in production
- ✅ Compare query efficiency (events vs markdown)
- ✅ Reversible (can abandon if not valuable)

---

### Phase 2: Events-First (Markdown as Export) - 1 week

**Goal:** Markdown becomes generated view

```typescript
// AI works entirely in events
await logEvent({ ... });
await logEvent({ ... });

// Markdown generated only when needed:
// 1. Human requests review
// 2. Git commit (generate for PR diff)
// 3. Scheduled (nightly markdown export)

npx aiknowsys export-session --date 2026-02-15
// → Generates .aiknowsys/sessions/2026-02-15-session.md
```

**Git workflow:**
```bash
# Pre-commit hook:
# 1. Export today's events to markdown
# 2. Stage the generated markdown
# 3. Commit both (events in DB, markdown in git)

git commit -m "Feature: Dynamic toolsets"
# Commits:
#  - .aiknowsys/knowledge.db (events)
#  - .aiknowsys/sessions/2026-02-15-session.md (generated view)
```

**Benefits:**
- ✅ AI queries are 100x faster (events only)
- ✅ Humans still get readable markdown
- ✅ Git diffs still work (markdown committed)
- ✅ Source of truth is events (markdown is derivative)

---

### Phase 3: Deprecate Markdown Storage (Events Only) - 1 week

**Goal:** Markdown generated on-demand only

```typescript
// No automatic markdown generation
// Humans request when needed:

npx aiknowsys export-session --date 2026-02-15
# → Generates markdown and opens in editor

# Or export range:
npx aiknowsys export-week --start 2026-02-08
# → Generates 7 markdown files

# Or custom view:
npx aiknowsys export-custom --query "show me token optimization work"
# → AI generates markdown focused on that topic
```

**Git workflow options:**

**Option A: Don't commit markdown**
```gitignore
# .gitignore
.aiknowsys/sessions/*.md  # Generated on-demand
```

**Option B: Commit generated markdown for PR reviews**
```bash
# Pre-commit hook: Export markdown for changed dates
git commit → hook generates markdown → adds to commit
```

**Option C: Hybrid (commit summaries, not full sessions)**
```typescript
// Export 1-page summary instead of 80KB session
npx aiknowsys export-summary --date 2026-02-15
# → Generates 2KB summary.md (key decisions, patterns, outcomes)
```

---

## 📊 Expected Impact

### Token Efficiency

| Scenario | Markdown | Events | Savings |
|----------|----------|--------|---------|
| 1 day of work | 80KB (160K tokens) | 20 events (2K tokens) | 98.75% |
| Query "what pattern?" | 160K (full session) | 1 event (80 tokens) | 99.95% |
| 7 days browsing | 560KB (1.1M tokens) | 140 events (14K tokens) | 98.73% |
| Semantic search | N/A (no embeddings) | 5 events (400 tokens) | ∞ |

### Multi-User Scaling

| Users | Sessions/Day | Markdown Size | Events Size | DB Size |
|-------|--------------|---------------|-------------|---------|
| 1 | 1 | 80KB | 20 events | 30KB |
| 10 | 10 | 800KB | 200 events | 300KB |
| 100 | 100 | 8MB | 2000 events | 3MB |
| 1 year (100 users) | 36,500 | 2.9GB | 730K events | 1.1GB |

**With markdown:** 2.9GB (git becomes slow, queries impossible)  
**With events:** 1.1GB (queryable, semantic search, fast)

---

## ⚠️ Risks & Mitigations

### Risk 1: Loss of Human Context
**Concern:** Structured events lose narrative flow  
**Mitigation:**
- Keep optional `narrative` field (1-2 sentences per event)
- Generate markdown with AI-written prose connecting events
- Support multiple markdown formats (narrative, timeline, grouped)

### Risk 2: Event Type Proliferation
**Concern:** Too many event types, hard to maintain  
**Mitigation:**
- Start with 6 core types (task, pattern, decision, validation, bug, learning)
- Extensible `data` JSON (no schema changes needed for new fields)
- Document event types in schema registry

### Risk 3: Embedding Generation Cost
**Concern:** OpenAI API costs or local model complexity  
**Mitigation:**
- Use local model (all-MiniLM-L6-v2, free)
- Lazy embedding (generate on first search, cache forever)
- Optional feature (can use events without embeddings)

### Risk 4: Migration Complexity
**Concern:** Converting existing markdown to events  
**Mitigation:**
- Phase 1 is additive (no migration needed)
- Phase 2 coexists (markdown stays as backup)
- Phase 3 is optional (can keep markdown forever if desired)
- Migration tool: Parse markdown → Generate events (best-effort)

### Risk 5: Query Complexity
**Concern:** SQL + JSON + vectors harder than grep  
**Mitigation:**
- Provide high-level query functions (semantic_search, query_by_type, etc.)
- MCP tools abstract complexity
- Markdown views for manual grepping (still an option)

---

## 🎯 Success Criteria

**Functional:**
- [ ] Can log all 6 core event types
- [ ] Semantic search returns relevant events (<200ms)
- [ ] Generate readable markdown from events (3 formats)
- [ ] Multi-user concurrent writes work (no conflicts)
- [ ] Backward compat: Can query events like old sessions

**Performance:**
- [ ] Event logging: <10ms per event
- [ ] Semantic search: <200ms for 100K events
- [ ] Markdown generation: <500ms for 1 day (20 events)
- [ ] Storage: <2MB per 1000 events (with embeddings)

**Quality:**
- [ ] 100% test coverage for event storage
- [ ] Generated markdown is human-readable
- [ ] Migration from markdown is lossy but acceptable
- [ ] Documentation complete (event types, query patterns)

---

## 📚 Related Plans

- ✅ **PLAN_context_query_system.md** - Established "index = truth, markdown = view"
- ✅ **PLAN_enhanced_hybrid_architecture.md** - Atomic writes, but still markdown storage
- 🎯 **PLAN_mcp_dynamic_toolsets.md** - Infrastructure (works with events)
- 🔜 **PLAN_conversational_mediator.md** - Natural language → event queries

---

## 🔮 Future Extensions

**Phase 4+: Advanced Features (Optional)**

1. **Cross-repo pattern discovery**
   - Aggregate events across all user projects
   - "What patterns have I learned about testing?"
   - Answer spans multiple repos

2. **AI-generated insights**
   - Periodic analysis: "Your velocity increased 30% this week"
   - Pattern recommendations: "You've solved this problem before"
   - Proactive learning: "3 projects encountered similar bug"

3. **Collaborative knowledge sharing**
   - Export anonymized events to team knowledge base
   - "How did others solve X?" → Query team event log
   - Pattern library built from collective experience

4. **Temporal queries**
   - "How did my decision-making change over time?"
   - "When did I first learn about X?"
   - "What was I working on 6 months ago?"

---

*Part of AIKnowSys evolution: Markdown → Index → Events → AI-Native Knowledge Graph*
