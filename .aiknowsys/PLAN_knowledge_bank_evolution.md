---
title: "Knowledge Bank Evolution - Cross-Repo AI-Native Storage"
status: "PLANNED"
priority: "high"
created: "2026-02-15"
author: "Planner"
topics: ["knowledge-bank", "cross-repo", "event-sourcing", "ai-optimization"]
depends_on: ["PLAN_mcp_dynamic_toolsets"]
merges: ["PLAN_mcp_only_architecture_migration", "PLAN_event_sourced_storage"]
evolution_of: ["PLAN_enhanced_hybrid_architecture"]
---

# PLAN: Knowledge Bank Evolution

**Status:** 📋 PLANNED  
**Priority:** 🔴 HIGH  
**Created:** 2026-02-15  
**Timeline:** 3-4 weeks (3 phases)  

**Goal:** Transform AIKnowSys into cross-repository conversational knowledge system with AI-native event-sourced storage.

**Merges:** This plan combines:
- **PLAN_mcp_only_architecture_migration**: Cross-repo foundation and infrastructure
- **PLAN_event_sourced_storage**: AI-optimized event-based storage format

---

## Executive Summary

**Vision:** Single `~/.aiknowsys/knowledge.db` storing knowledge across ALL projects, with AI-native event-sourced storage replacing markdown blobs.

**The Problem:**
1. **Per-project silos**: Each project has isolated `.aiknowsys/` directory
2. **Markdown inefficiency**: 80KB sessions = 160K tokens, narrative format (not AI-optimized)
3. **Cross-project context loss**: Can't reference learning from project A when working on project B
4. **Token waste**: Full markdown retrieval for simple queries

**The Solution:**
- **Phase 1: Cross-Repo Foundation** - Universal database at `~/.aiknowsys/knowledge.db`
- **Phase 2: Event-Sourced Storage** - Replace markdown TEXT with structured events
- **Phase 3: Markdown Exports** - On-demand human-readable exports (optional convenience)

**Token Impact:**
- Dynamic toolsets (Phase 0): 90% tool definition reduction
- Event storage (Phase 2): 98% query response reduction
- Combined: 95-98% total token efficiency improvement

---

## Three-Phase Roadmap

### Phase 0: Dynamic Toolsets (Enabling Work) ✅ Separate Plan
**Timeline:** 1-2 weeks  
**Status:** Covered by PLAN_mcp_dynamic_toolsets  
**Benefit:** Reduces tool overhead from 29K → 3K tokens (90% reduction)

**This is independent foundation work that enables knowledge bank.**

---

### Phase 1: Cross-Repository Foundation (Weeks 1-2)

**Goal:** Create `~/.aiknowsys/knowledge.db` accessible by all projects with project isolation.

#### 1.1 Database Schema Evolution

**Current schema (lib/context/schema.sql):**
```sql
CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,
  content TEXT,  -- ❌ Markdown blob
  ...
);
```

**Phase 1 schema:**
```sql
CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,  -- 🆕 Enable cross-repo queries
  content TEXT,              -- ⏳ Still markdown (for now)
  ...
);

CREATE TABLE projects (
  project_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_sessions_project ON sessions(project_id);
CREATE INDEX idx_plans_project ON plans(project_id);
```

**Migration strategy:**
- Existing per-project DBs stay as-is (backward compatibility)
- New universal DB at `~/.aiknowsys/knowledge.db`
- Projects opt-in via config: `aiknowsys: { globalDb: true }`

#### 1.2 Storage Adapter Refactoring

**Current:** `lib/context/sqlite-storage.ts` uses project-local DB  
**Phase 1:** Support both local and global DB

```typescript
// lib/context/sqlite-storage.ts
export class SqliteStorage implements StorageAdapter {
  private db: Database;
  private projectId: string;
  
  async init(targetDir: string, options?: { globalDb?: boolean }) {
    const dbPath = options?.globalDb 
      ? path.join(os.homedir(), '.aiknowsys', 'knowledge.db')
      : path.join(targetDir, '.aiknowsys', 'knowledge.db');
    
    this.db = new Database(dbPath);
    this.projectId = await this.getOrCreateProjectId(targetDir);
    // Run migrations...
  }
  
  async querySessions(filters) {
    // Auto-filter by current project unless cross-project query
    const projectFilter = filters.crossProject 
      ? {} 
      : { project_id: this.projectId };
    // ...
  }
}
```

#### 1.3 Cross-Project Query Support

**New MCP tools:**
```typescript
// Search across ALL projects
mcp_aiknowsys_search_all_projects({ query, limit })

// List available projects
mcp_aiknowsys_list_projects()

// Query specific project
mcp_aiknowsys_query_sessions({ projectId, ...filters })
```

**Use cases:**
- "How did I handle authentication in my FastAPI project?" (while in Node.js project)
- "Show all sessions mentioning 'Docker' across all projects"
- "What patterns did I learn about testing?"

#### 1.4 Testing Strategy (TDD)

**Test files to create:**
- `test/storage/cross-repo-migration.test.ts` - Migration from local → global
- `test/storage/project-isolation.test.ts` - Ensure project data stays isolated
- `test/storage/cross-project-queries.test.ts` - Search across projects

**RED-GREEN-REFACTOR:**
1. 🔴 Write test for global DB initialization → FAIL
2. 🟢 Implement global DB path logic → PASS
3. 🔵 Refactor storage adapter for clean abstraction

**Validation:**
```bash
npm test -- --grep "cross-repo"
node bin/cli.js search-context --all-projects --query "Docker"
```

**Success criteria (Phase 1):**
- [ ] Global DB at `~/.aiknowsys/knowledge.db` working
- [ ] Projects isolated by project_id
- [ ] Cross-project queries functional
- [ ] Backward compatibility maintained (local DBs still work)
- [ ] All tests passing (40+ tests total)

---

### Phase 2: Event-Sourced Storage (Weeks 2-3)

**Goal:** Replace markdown TEXT blobs with structured event-based storage for 98% token reduction.

#### 2.1 Event Schema Design

**The Problem with Markdown:**
- 80KB session file = 160K tokens (20-30% formatting overhead)
- Narrative format (not queryable by AI)
- All-or-nothing retrieval (can't fetch specific facts)

**The Event-Sourced Solution:**
```sql
CREATE TABLE knowledge_events (
  event_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  session_id TEXT,
  plan_id TEXT,
  timestamp TEXT NOT NULL,
  event_type TEXT NOT NULL,  -- task_completed, decision_made, pattern_discovered, etc.
  data JSON NOT NULL,         -- Structured event payload
  embedding BLOB,             -- 384-dim vector from all-MiniLM-L6-v2
  FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

CREATE VIRTUAL TABLE knowledge_events_fts USING fts5(
  event_id, event_type, data, content=knowledge_events
);

-- Vector similarity search (sqlite-vss extension)
CREATE VIRTUAL TABLE knowledge_events_vss USING vss0(
  embedding(384)
);
```

#### 2.2 Event Types and Schemas

**Core event types:**

1. **task_completed**
```json
{
  "type": "task_completed",
  "task": "Implement user authentication",
  "outcome": "success",
  "tests_passing": 42,
  "files_changed": ["lib/auth.ts", "test/auth.test.ts"],
  "validation": ["npm test", "npm run lint"]
}
```

2. **decision_made**
```json
{
  "type": "decision_made",
  "decision": "Use JWT for session management",
  "rationale": "Stateless auth enables horizontal scaling",
  "alternatives_considered": ["Session cookies", "OAuth only"],
  "trade_offs": {"pros": ["Scalable", "Portable"], "cons": ["Token size"]}
}
```

3. **pattern_discovered**
```json
{
  "type": "pattern_discovered",
  "pattern": "Always validate env vars at startup",
  "category": "error_prevention",
  "trigger": "Production crash from missing DB_URL",
  "solution": "joi schema validation in config.ts",
  "reusable": true
}
```

4. **validation_passed**
```json
{
  "type": "validation_passed",
  "command": "npm test",
  "result": "164/164 tests passing",
  "duration_ms": 3200,
  "coverage": {"lines": 95, "branches": 88}
}
```

5. **bug_encountered**
```json
{
  "type": "bug_encountered",
  "description": "Race condition in async init",
  "stack_trace": "...",
  "root_cause": "Missing await in promise chain",
  "fix": "Added await to database.init() call",
  "prevention": "ESLint rule: no-floating-promises"
}
```

6. **learning_captured**
```json
{
  "type": "learning_captured",
  "learning": "TypeScript strict mode catches 80% of bugs before runtime",
  "evidence": "3 bugs caught during compilation, 0 in production",
  "applicability": "All TypeScript projects",
  "confidence": "high"
}
```

#### 2.3 Embeddings Generation

**Model:** all-MiniLM-L6-v2 (384 dimensions, local generation)

```typescript
// lib/embeddings/generator.ts
import { pipeline } from '@xenova/transformers';

export class EmbeddingGenerator {
  private model: any;
  
  async init() {
    this.model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  
  async generateEmbedding(text: string): Promise<Float32Array> {
    const output = await this.model(text, { pooling: 'mean', normalize: true });
    return new Float32Array(output.data);
  }
  
  async embedEvent(event: KnowledgeEvent): Promise<Float32Array> {
    // Create search-optimized text representation
    const searchText = this.eventToSearchText(event);
    return this.generateEmbedding(searchText);
  }
  
  private eventToSearchText(event: KnowledgeEvent): string {
    // Extract most relevant fields for semantic search
    switch (event.event_type) {
      case 'task_completed':
        return `${event.data.task} - ${event.data.outcome}`;
      case 'decision_made':
        return `${event.data.decision}: ${event.data.rationale}`;
      case 'pattern_discovered':
        return `${event.data.pattern} - ${event.data.solution}`;
      // ...
    }
  }
}
```

**Dependencies:**
```json
{
  "@xenova/transformers": "^2.10.0",
  "sqlite-vss": "^0.1.2"
}
```

#### 2.4 Hybrid Storage Period

**During Phase 2, store BOTH:**
- Events in `knowledge_events` table (new)
- Full session markdown in `sessions.content` (existing)

**Write path:**
```typescript
async createSession({ title, topics }) {
  const sessionId = generateSessionId();
  
  // 1. Create events
  const events = [
    { type: 'session_started', data: { title, topics } },
    { type: 'goal_defined', data: { goal: title } }
  ];
  
  await this.storeEvents(sessionId, events);
  
  // 2. ALSO generate markdown from events (backward compatibility)
  const markdown = generateMarkdownFromEvents(events);
  await this.db.run(
    'INSERT INTO sessions (session_id, content, ...) VALUES (?, ?, ...)',
    [sessionId, markdown, ...]
  );
}
```

**Read path (intelligent fallback):**
```typescript
async querySessionContent(sessionId: string) {
  // Try events first (new format)
  const events = await this.queryEvents({ session_id: sessionId });
  if (events.length > 0) {
    return { format: 'events', data: events };
  }
  
  // Fallback to markdown (old format)
  const row = await this.db.get('SELECT content FROM sessions WHERE session_id = ?', sessionId);
  return { format: 'markdown', data: row.content };
}
```

#### 2.5 Migration Tool

**Command:**
```bash
npx aiknowsys migrate-to-events [--project <id>] [--all-projects]
```

**Process:**
1. Parse existing markdown sessions/plans
2. Extract facts into structured events
3. Generate embeddings
4. Store in knowledge_events table
5. Keep original markdown (don't delete)

**Example migration:**

**Before (markdown):**
```markdown
## Session: Add Authentication (Feb 15, 2026)

**Goal:** Implement JWT-based auth

**Changes:**
- lib/auth.ts: Added JWT generation
- test/auth.test.ts: 12 tests, all passing

**Decision:** Chose JWT over session cookies for scalability

**Validation:**
✅ Tests: 42 passed
```

**After (events):**
```json
[
  {
    "event_id": "evt_auth_001",
    "event_type": "session_started",
    "data": { "title": "Add Authentication", "goal": "Implement JWT-based auth" }
  },
  {
    "event_id": "evt_auth_002",
    "event_type": "task_completed",
    "data": {
      "task": "JWT generation implementation",
      "files_changed": ["lib/auth.ts", "test/auth.test.ts"],
      "tests_passing": 12
    }
  },
  {
    "event_id": "evt_auth_003",
    "event_type": "decision_made",
    "data": {
      "decision": "Use JWT for session management",
      "rationale": "Stateless auth enables horizontal scaling"
    }
  },
  {
    "event_id": "evt_auth_004",
    "event_type": "validation_passed",
    "data": { "command": "npm test", "result": "42/42 tests passing" }
  }
]
```

#### 2.6 Query Optimization with Events

**Token comparison:**

**Old (markdown):**
```
Query: "How did I handle authentication?"
Response: [Full 80KB session markdown] = 160K tokens
```

**New (events):**
```
Query: "How did I handle authentication?"
Semantic search finds 5 relevant events = 2K tokens (98% reduction!)

Events returned:
1. decision_made: JWT vs cookies
2. task_completed: JWT implementation
3. pattern_discovered: Token refresh strategy
4. bug_encountered: Token expiry edge case
5. learning_captured: Always validate tokens server-side
```

**Query types enabled:**
- **Semantic:** "Show all authentication decisions across projects"
- **Structured:** "Find all tasks completed in last 7 days"
- **Pattern-based:** "What error_resolution patterns exist for database issues?"
- **Cross-project:** "List all patterns discovered in FastAPI projects"

#### 2.7 Testing Strategy (TDD)

**Test files:**
- `test/storage/event-storage.test.ts` - CRUD operations for events
- `test/storage/event-embeddings.test.ts` - Embedding generation and search
- `test/storage/event-migration.test.ts` - Markdown → events conversion
- `test/storage/semantic-search.test.ts` - Vector similarity queries

**RED-GREEN-REFACTOR:**
1. 🔴 Write test for event storage → FAIL (table doesn't exist)
2. 🟢 Create knowledge_events table → PASS
3. 🔵 Refactor storage with clean interfaces
4. 🔴 Write test for embedding search → FAIL (no vss extension)
5. 🟢 Install sqlite-vss, implement search → PASS
6. 🔵 Optimize query performance

**Success criteria (Phase 2):**
- [ ] Events stored with embeddings
- [ ] Semantic search functional (vector similarity)
- [ ] Migration tool converts markdown → events
- [ ] Hybrid storage working (both events + markdown)
- [ ] Query response: 98% token reduction achieved
- [ ] All tests passing (60+ tests total)

---

### Phase 3: Markdown Exports (Weeks 3-4)

**Goal:** On-demand markdown export for human reading/sharing. Knowledge lives in database, not files.

**Architectural clarity:**
- ✅ **Git = Code** (project source code)
- ✅ **Database = Knowledge** (source of truth for sessions/plans/events)
- ✅ **Markdown = View** (generated on-demand for humans)

**No git integration:** AIKnowSys knowledge is NOT committed to git (database-first).

#### 3.1 On-Demand Export

**Command:**
```bash
# Export session as markdown for reading
npx aiknowsys export-session 2026-02-15 --format markdown

# Output to stdout (pipe to file or pager)
npx aiknowsys export-session 2026-02-15 | less

# Save for sharing
npx aiknowsys export-session 2026-02-15 > /tmp/session-summary.md
```

**Use cases:**
- 📖 Human wants to read session in nice format
- 📧 Share session summary via email/Slack
- 📋 Generate report for stakeholders
- 🔍 Quick review without querying database

#### 3.2 Markdown Generator

```typescript
// lib/markdown/event-renderer.ts
export class MarkdownRenderer {
  generateSessionMarkdown(events: KnowledgeEvent[]): string {
    const grouped = this.groupEventsBySection(events);
    
    let markdown = `# Session: ${this.getTitle(events)} (${this.getDate(events)})\n\n`;
    
    // Goals section
    const goals = grouped.filter(e => e.event_type === 'goal_defined');
    if (goals.length > 0) {
      markdown += `**Goal:** ${goals[0].data.goal}\n\n`;
    }
    
    // Changes section
    const tasks = grouped.filter(e => e.event_type === 'task_completed');
    if (tasks.length > 0) {
      markdown += '## Changes\n\n';
      for (const task of tasks) {
        for (const file of task.data.files_changed || []) {
          markdown += `- [${file}](${file}): ${task.data.task}\n`;
        }
      }
      markdown += '\n';
    }
    
    // Decisions section
    const decisions = grouped.filter(e => e.event_type === 'decision_made');
    if (decisions.length > 0) {
      markdown += '## Key Decisions\n\n';
      for (const decision of decisions) {
        markdown += `**${decision.data.decision}**\n`;
        markdown += `- Rationale: ${decision.data.rationale}\n\n`;
      }
    }
    
    // Validation section
    const validations = grouped.filter(e => e.event_type === 'validation_passed');
    if (validations.length > 0) {
      markdown += '## Validation\n\n';
      for (const val of validations) {
        markdown += `- ✅ ${val.data.command}: ${val.data.result}\n`;
      }
      markdown += '\n';
    }
    
    // Learnings section
    const learnings = grouped.filter(e => e.event_type === 'learning_captured');
    if (learnings.length > 0) {
      markdown += '## Key Learnings\n\n';
      for (const learning of learnings) {
        markdown += `- ${learning.data.learning}\n`;
      }
    }
    
    return markdown;
  }
}
```

#### 3.3 Optional: Bulk Export

**Export all sessions for archival/backup:**

```bash
# Export all sessions to directory
npx aiknowsys export-sessions --all --output /tmp/sessions/

# Export specific date range
npx aiknowsys export-sessions \
  --from 2026-01-01 \
  --to 2026-12-31 \
  --output ./archive/2026/

# Export as single document
npx aiknowsys export-sessions --all --format combined > knowledge-dump.md
```

**Use cases:**
- 📦 Backup/archival (human-readable backup alongside DB dumps)
- 📊 Annual review (export year's knowledge for reflection)
- 🔄 Migration (export from old system, import to new)

**Note:** Exports are **generated artifacts**, not source of truth (database is).

#### 3.4 Export Format

**Generated markdown structure:**

```markdown
<!-- EXPORTED from AIKnowSys database on 2026-02-15 12:00 -->
<!-- This is a READ-ONLY export for human convenience -->
<!-- To modify: Use `npx aiknowsys update-session` commands -->
<!-- Source of truth: ~/.aiknowsys/knowledge.db -->

# Session: Add Authentication (Feb 15, 2026)

**Goal:** Implement JWT-based authentication

## Tasks Completed
- [lib/auth.ts](lib/auth.ts): JWT generation
- [test/auth.test.ts](test/auth.test.ts): 12 tests passing

## Key Decisions
**Use JWT for session management**
- Rationale: Stateless auth enables horizontal scaling
- Alternatives: Session cookies, OAuth only

## Validation
- ✅ Tests: 42/42 passing
- ✅ Type check: No errors

## Learnings
- Always validate tokens server-side
- Token refresh strategy prevents expiry UX issues
```

**Properties:**
- ✅ Human-readable (formatted for reading, not editing)
- ✅ Warning header (clarifies this is export, not source)
- ✅ File links work (if viewing in same repo)
- ❌ No git tracking (this file is ephemeral)

#### 3.5 Testing Strategy

**Test files:**
- `test/markdown/event-rendering.test.ts` - Event → markdown conversion
- `test/markdown/export-commands.test.ts` - export-session, export-sessions commands
- `test/markdown/format-validation.test.ts` - Output formatting

**Success criteria (Phase 3):**
- [ ] Markdown exports generated from events (human-readable)
- [ ] export-session command working (single session)
- [ ] export-sessions command working (bulk export)
- [ ] Warning header included (clarifies read-only nature)
- [ ] File links functional (relative paths work)
- [ ] All tests passing (80+ tests total)

---

## Architecture Comparison

### Before (Current):
```
┌─────────────────┐
│  Project A      │
│  .aiknowsys/    │ ← Isolated, markdown blobs
│  knowledge.db   │
└─────────────────┘

┌─────────────────┐
│  Project B      │
│  .aiknowsys/    │ ← Isolated, markdown blobs
│  knowledge.db   │
└─────────────────┘

No cross-project learning!
160K tokens per session query!
```

### After (Knowledge Bank):
```
┌─────────────────────────────────────┐
│  ~/.aiknowsys/knowledge.db          │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  knowledge_events            │  │
│  │  - Structured JSON events    │  │
│  │  - 384-dim embeddings        │  │
│  │  - Semantic search (vss)     │  │
│  │  - 98% token reduction       │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────┬──────┬──────┬──────┐    │
│  │ Proj │ Proj │ Proj │ Proj │    │
│  │  A   │  B   │  C   │  D   │    │
│  └──────┴──────┴──────┴──────┘    │
└─────────────────────────────────────┘
         ▲
         │ Queries: "Show auth patterns across all FastAPI projects"
         │ Result: 5 events, 2K tokens (not 160K!)
```

---

## Migration Path for Users

**Opt-in migration:**

```bash
# Check compatibility
npx aiknowsys check-migration

# Migrate current project to global DB
npx aiknowsys migrate-to-global

# Convert markdown → events
npx aiknowsys migrate-to-events

# Test cross-project queries
npx aiknowsys search-context --all-projects --query "authentication"
```

**Backward compatibility:**
- Old local DBs continue working
- Projects migrate one-by-one
- No breaking changes to existing workflows

---

## Success Metrics

**Token Efficiency:**
- ✅ Tool definitions: 90% reduction (via dynamic toolsets)
- ✅ Query responses: 98% reduction (via event storage)
- ✅ Combined system: 95-98% total token reduction

**Cross-Project Value:**
- ✅ Query across 10+ projects in single request
- ✅ Reuse patterns from any past project
- ✅ Build institutional knowledge graph

**Developer Experience:**
- ✅ Database-first workflow (knowledge lives in DB, not files)
- ✅ On-demand exports (generate markdown when humans need it)
- ✅ Backward compatible (local DBs work)
- ✅ Powerful semantic search ("show me all auth decisions")

---

## Risks & Mitigations

**Risk 1: Embedding generation performance**
- **Impact:** Slow session creation (embedding each event)
- **Mitigation:** Async background processing, cache embeddings, batch generation

**Risk 2: Markdown generation fidelity**
- **Impact:** Generated docs don't capture all nuance
- **Mitigation:** Iterate on templates, allow custom renderers, keep events rich

**Risk 3: Migration complexity**
- **Impact:** Users stuck on old format
- **Mitigation:** Gradual rollout, keep backward compatibility, migration tool

**Risk 4: Database corruption**
- **Impact:** Lose all knowledge across projects
- **Mitigation:** Auto-backup, export to JSON, markdown serves as backup

---

## Testing Strategy (Full Plan)

**Test Coverage Target:** 90%+ across all modules

### Unit Tests (RED-GREEN-REFACTOR)
- Storage adapters (cross-repo + event storage)
- Embedding generation
- Markdown rendering
- Migration tools

### Integration Tests
- End-to-end session creation (events → DB → markdown)
- Cross-project queries
- Semantic search accuracy

### Performance Tests
- Query response time (<100ms for event queries)
- Embedding generation (<50ms per event)
- Migration speed (1000 sessions in <30s)

### Validation Commands (run after each phase)

**Phase 1:**
```bash
npm test -- --grep "cross-repo"
node bin/cli.js ls-projects
node bin/cli.js search-context --all-projects --query "test"
```

**Phase 2:**
```bash
npm test -- --grep "event-storage|embeddings"
node bin/cli.js query-events --type decision_made --limit 5
node bin/cli.js semantic-search "authentication patterns"
```

**Phase 3:**
```bash
npm test -- --grep "markdown-export"
npx aiknowsys export-session $(date +%Y-%m-%d) | head -50
npx aiknowsys export-sessions --from 2026-02-01 --to 2026-02-15 --output /tmp/test/
```

---

## Implementation Order

1. **PLAN_mcp_dynamic_toolsets** (1-2 weeks) - Prerequisite, independent work
2. **Phase 1: Cross-repo foundation** (1-2 weeks) - Infrastructure
3. **Phase 2: Event storage** (1-2 weeks) - Core transformation
4. **Phase 3: Markdown exports** (1 week) - On-demand human-readable exports

**Total timeline:** 4-5 weeks (assuming sequential execution)

**Can parallelize:** Dynamic toolsets + Phase 1 (different subsystems)

---

## Next Actions

**Immediate (This Week):**
1. ✅ Mark superseded plans (PLAN_enhanced_hybrid_architecture)
2. ✅ Mark merged plans (PLAN_mcp_only_architecture_migration, PLAN_event_sourced_storage)
3. ✅ Create this unified plan
4. 🎯 Start PLAN_mcp_dynamic_toolsets (enabling work, independent)

**Phase 1 Kickoff (Next Week):**
1. Update schema.sql with project_id and projects table
2. Refactor sqlite-storage.ts for global DB support
3. Write RED tests for cross-repo queries
4. Implement GREEN solutions
5. REFACTOR for clean architecture

**Phase 2 Kickoff (Week 3):**
1. Design knowledge_events schema
2. Install embedding dependencies (@xenova/transformers, sqlite-vss)
3. Write RED tests for event storage
4. Implement event CRUD operations
5. Build migration tool (markdown → events)

**Phase 3 Kickoff (Week 4):**
1. Create markdown renderer from events
2. Implement export-session command (single session)
3. Implement export-sessions command (bulk export)
4. Test export quality (formatting, links)
5. Document export use cases

---

*Part of AIKnowSys strategic evolution. Combines cross-repository foundation with AI-native event-sourced storage for ultimate knowledge management system.*
