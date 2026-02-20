---
title: "AI UX Future Vision - Advanced Intelligence Features"
status: "PLANNED"
priority: "low"
created: "2026-02-14"
author: "Planner"
topics: ["ai-ux", "semantic-search", "time-travel", "advanced-features", "research"]
depends_on: ["PLAN_ai_ux_quick_wins", "PLAN_ai_ux_smart_tools"]
---

# PLAN: AI UX Future Vision

**Status:** 📋 PLANNED  
**Priority:** 🔵 LOW (Research required, long-term features)  
**Created:** 2026-02-14  
**Estimated:** 3-4 weeks + research  
**Goal:** Advanced AI features requiring significant R&D

---

## 🔮 Two Advanced Features

1. **Semantic Search with Embeddings** - Concept-based discovery beyond keywords
2. **Time-Travel Queries** - Access historical state of knowledge base

---

## 💡 Feature 1: Semantic Search with Embeddings

### Vision

**Current limitation:** Keyword search misses conceptual matches

```typescript
// Current: Keyword-based
search_context({ query: "error handling" })
→ Finds only documents with exact words "error" and "handling"
→ Misses: "exception management", "failure recovery", "graceful degradation"

// Future: Semantic search
semantic_search({ 
  concept: "error handling",
  threshold: 0.75  // Similarity threshold
})
→ Finds conceptually similar content:
  - "exception management" (0.92 similarity)
  - "failure recovery patterns" (0.87)
  - "graceful degradation" (0.81)
  - "defensive programming" (0.78)
→ Ranked by relevance, not just keyword count
```

**Use cases:**
- Find solutions without knowing exact terminology
- Discover related patterns agent didn't know existed
- Cross-language concept mapping (agent asks in one way, docs use another)

### Implementation Research

**Option A: Local Embeddings (Faster, Privacy)**
- **Model:** sentence-transformers/all-MiniLM-L6-v2 (384 dimensions)
- **Pros:** No API calls, no cost, complete privacy
- **Cons:** Lower quality than GPT-4 embeddings
- **Performance:** ~100ms for query + search
- **Storage:** ~1.5KB per document chunk

**Option B: OpenAI Embeddings (Better Quality)**
- **Model:** text-embedding-3-small (1536 dimensions)
- **Pros:** Better semantic understanding
- **Cons:** API cost (~$0.02 per 1M tokens), requires network
- **Performance:** ~200ms including API call
- **Storage:** ~6KB per document chunk

**Recommended:** Start with Option A (local), upgrade to Option B if quality insufficient

### Architecture Sketch

```typescript
// lib/utils/embeddings.ts
import { Pipeline } from '@xenova/transformers';

export class EmbeddingEngine {
  private model: Pipeline;
  private vectorStore: VectorDatabase;
  
  async initialize() {
    // Load local model
    this.model = await Pipeline.load('feature-extraction', 
      'Xenova/all-MiniLM-L6-v2');
    
    // Connect to vector store (SQLite with vector extension)
    this.vectorStore = await VectorDatabase.connect('.aiknowsys/embeddings.db');
  }
  
  /**
   * Generate embedding for text
   */
  async embed(text: string): Promise<number[]> {
    const output = await this.model(text, {
      pooling: 'mean',
      normalize: true
    });
    return Array.from(output.data);
  }
  
  /**
   * Index all documents
   */
  async indexDocuments(documents: Document[]) {
    for (const doc of documents) {
      // Chunk document (512 tokens per chunk)
      const chunks = this.chunkDocument(doc);
      
      // Generate embeddings
      for (const chunk of chunks) {
        const embedding = await this.embed(chunk.text);
        await this.vectorStore.insert({
          id: `${doc.id}_chunk_${chunk.index}`,
          document_id: doc.id,
          text: chunk.text,
          embedding,
          metadata: {
            section: chunk.section,
            created: doc.created,
            topics: doc.topics
          }
        });
      }
    }
  }
  
  /**
   * Search by semantic similarity
   */
  async search(query: string, threshold: number = 0.75): Promise<SearchResult[]> {
    const queryEmbedding = await this.embed(query);
    
    // Cosine similarity search in vector DB
    const results = await this.vectorStore.similaritySearch(queryEmbedding, {
      threshold,
      limit: 20
    });
    
    // Group by document, rank by best chunk
    return this.groupAndRank(results);
  }
}

// Vector database (SQLite with sqlite-vss extension)
export class VectorDatabase {
  private db: Database;
  
  async similaritySearch(queryVector: number[], options: {
    threshold: number;
    limit: number;
  }): Promise<VectorMatch[]> {
    // Use sqlite-vss for cosine similarity
    const results = await this.db.prepare(`
      SELECT 
        id,
        document_id,
        text,
        metadata,
        vss_distance_cos(embedding, ?) as distance,
        (1 - vss_distance_cos(embedding, ?)) as similarity
      FROM embeddings
      WHERE similarity >= ?
      ORDER BY similarity DESC
      LIMIT ?
    `).all(queryVector, queryVector, options.threshold, options.limit);
    
    return results;
  }
}
```

### Tool Implementation

```typescript
// mcp-server/src/tools/semantic-search.ts
export async function semanticSearch(args: {
  concept: string;
  threshold?: number;
  limit?: number;
}) {
  const engine = await EmbeddingEngine.getInstance();
  
  const results = await engine.search(args.concept, args.threshold || 0.75);
  
  return {
    success: true,
    query: args.concept,
    results: results.map(r => ({
      document: r.document_id,
      section: r.metadata.section,
      similarity: r.similarity.toFixed(2),
      snippet: truncate(r.text, 200),
      context: r.metadata
    })),
    meta: {
      hint: "💡 Adjust threshold for more/fewer results (0.6 = broad, 0.9 = strict)"
    }
  };
}
```

### Dependencies & Research

**Packages needed:**
- `@xenova/transformers` (15MB) - Local transformer models
- `sqlite-vss` - SQLite vector similarity search extension
- OR `@supabase/supabase-js` if using hosted vector DB

**Research questions:**
1. What's optimal chunk size for code + docs? (Test 256, 512, 1024 tokens)
2. Local vs hosted embeddings quality comparison
3. Re-indexing strategy (incremental vs full rebuild)
4. Performance with 1000+ documents

**Estimated time:** 2 weeks implementation + 1 week tuning

---

## 💡 Feature 2: Time-Travel Queries

### Vision

**Access historical state of knowledge base:**

```typescript
time_travel({
  date: "2026-02-01",
  query: "What plans were active?"
})

// Returns knowledge state from Feb 1:
{
  "snapshot_date": "2026-02-01",
  "active_plans": [
    "PLAN_natural_language_query_api" // Was active then
  ],
  "sessions_that_week": [
    "2026-01-29-session.md",
    "2026-01-31-session.md"
  ],
  "recent_changes": [
    "Created natural language API plan",
    "Completed token optimization"
  ],
  "meta": {
    "hint": "💡 Use 'compare_timepoints' to see what changed between dates"
  }
}

// Compare two timepoints
compare_timepoints({
  from: "2026-02-01",
  to: "2026-02-14"
})

// Returns diff:
{
  "period": "2 weeks",
  "new_plans": 4,
  "completed_plans": 1,
  "sessions_created": 8,
  "topics_emerged": ["ai-ux", "code-execution", "mcp-tools"],
  "major_milestones": [
    "Token optimization complete (95% reduction)",
    "Code execution architecture designed",
    "AI UX roadmap created"
  ]
}
```

**Use cases:**
- "What were we working on last month?" (context for new agent)
- "When did we decide to use caching?" (decision tracking)
- "Compare our plans then vs now" (progress measurement)

### Implementation Approach

**Option A: Git-Based Time Travel (Simpler)**
- Use Git history to access file states at any commit
- Pros: Already have version history, no additional storage
- Cons: Requires Git, limited to committed changes, slower queries

**Option B: Snapshot-Based (Better UX)**
- Store daily snapshots of knowledge base state
- Pros: Fast queries, works without Git, can capture uncommitted work
- Cons: Storage overhead (~100KB per day), requires snapshot job

**Recommended:** Option A initially (leverage Git), Option B if performance insufficient

### Architecture Sketch

```typescript
// lib/utils/time-machine.ts
import { simpleGit } from 'simple-git';

export class TimeMachine {
  private git = simpleGit();
  
  /**
   * Get knowledge base state at specific date
   */
  async getStateAt(date: Date): Promise<KnowledgeSnapshot> {
    // Find nearest commit before date
    const commit = await this.findCommitAt(date);
    
    if (!commit) {
      throw new Error(`No commits found before ${date}`);
    }
    
    // Read files at that commit
    const planFiles = await this.git.show([`${commit}:.aiknowsys/PLAN_*.md`]);
    const sessionFiles = await this.git.show([`${commit}:.aiknowsys/sessions/*.md`]);
    
    // Parse into structured data
    const plans = this.parsePlans(planFiles);
    const sessions = this.parseSessions(sessionFiles);
    
    return {
      commit,
      date,
      plans,
      sessions,
      stats: {
        active_plans: plans.filter(p => p.status === 'ACTIVE').length,
        total_sessions: sessions.length,
        topics: this.extractTopics(plans, sessions)
      }
    };
  }
  
  /**
   * Compare two timepoints
   */
  async compare(from: Date, to: Date): Promise<TimeDiff> {
    const [fromState, toState] = await Promise.all([
      this.getStateAt(from),
      this.getStateAt(to)
    ]);
    
    return {
      period: formatPeriod(from, to),
      plans: {
        created: diffArrays(fromState.plans, toState.plans, 'new'),
        completed: toState.plans.filter(p => 
          p.status === 'COMPLETE' && 
          !fromState.plans.find(fp => fp.id === p.id && fp.status === 'COMPLETE')
        ),
        abandoned: fromState.plans.filter(p => 
          p.status === 'ACTIVE' && 
          toState.plans.find(tp => tp.id === p.id && tp.status === 'CANCELLED')
        )
      },
      sessions: {
        count: toState.sessions.length - fromState.sessions.length,
        new_topics: diffArrays(fromState.stats.topics, toState.stats.topics)
      },
      major_milestones: this.extractMilestones(fromState, toState)
    };
  }
  
  private async findCommitAt(date: Date): Promise<string | null> {
    const log = await this.git.log({
      until: date.toISOString(),
      maxCount: 1
    });
    
    return log.latest?.hash || null;
  }
  
  private extractMilestones(from: KnowledgeSnapshot, to: KnowledgeSnapshot): string[] {
    const milestones = [];
    
    // Check for completed major plans
    const completedPlans = to.plans.filter(p => 
      p.status === 'COMPLETE' && 
      p.priority === 'high' &&
      (!from.plans.find(fp => fp.id === p.id) || from.plans.find(fp => fp.id === p.id)?.status !== 'COMPLETE')
    );
    
    milestones.push(...completedPlans.map(p => `${p.title} complete`));
    
    // Check for new capabilities (patterns added)
    // Check for architectural decisions
    // etc.
    
    return milestones;
  }
}
```

### Tool Implementation

```typescript
// mcp-server/src/tools/time-travel.ts
export async function timeTravel(args: {
  date: string;
  query?: string;
}) {
  const machine = new TimeMachine();
  const targetDate = new Date(args.date);
  
  const snapshot = await machine.getStateAt(targetDate);
  
  // If query provided, filter results
  if (args.query) {
    const filtered = filterSnapshot(snapshot, args.query);
    return { success: true, snapshot: filtered };
  }
  
  return {
    success: true,
    snapshot_date: args.date,
    active_plans: snapshot.plans.filter(p => p.status === 'ACTIVE'),
    sessions_that_week: getSessionsAround(snapshot.sessions, targetDate, 7),
    stats: snapshot.stats
  };
}

export async function compareTimepoints(args: {
  from: string;
  to: string;
}) {
  const machine = new TimeMachine();
  const diff = await machine.compare(new Date(args.from), new Date(args.to));
  
  return {
    success: true,
    ...diff
  };
}
```

### Dependencies & Research

**Packages needed:**
- `simple-git` (already in use?) - Git operations
- OR custom snapshot system (cron job + storage)

**Research questions:**
1. Git vs snapshot performance comparison
2. Snapshot storage strategy (daily? on-change? weekly?)
3. Query language for historical questions
4. UI for browsing historical state (future extension)

**Estimated time:** 2 weeks implementation + 1 week testing

---

## 📋 Implementation Order

**Phase 1: Semantic Search (3 weeks)**
1. Research embeddings approach (local vs API) - 3 days
2. Implement embedding engine - 4 days
3. Index existing documents - 2 days
4. Build semantic search tool - 3 days
5. Quality tuning (chunk size, threshold optimization) - 1 week

**Phase 2: Time Travel (2-3 weeks)**
1. Research Git vs snapshot approach - 2 days
2. Implement TimeMachine for Git-based queries - 4 days
3. Build time_travel and compare_timepoints tools - 3 days
4. Add milestone detection logic - 3 days
5. Testing with real history - 1 week

---

## 🎯 Success Criteria

- [ ] **Semantic search works** - Finds conceptually similar content (>75% relevance)
- [ ] **Time travel accurate** - Historical state matches Git history
- [ ] **Comparisons meaningful** - Diffs highlight important changes
- [ ] **Performance acceptable** - Semantic search <500ms, time travel <2s
- [ ] **Tests pass** - All integration tests passing

---

## 📊 Expected Benefits

**Semantic Search:**
- Find solutions without knowing exact terms
- Discover hidden connections in knowledge base
- Better agent learning (concept-based, not keyword-based)

**Time Travel:**
- Restore context from any past date
- Track decision evolution over time
- Measure progress quantitatively
- Onboard new agents with historical perspective

---

## 🔬 Research Dependencies

**Before implementation:**
1. Benchmark local embeddings quality (test with 50 queries)
2. Measure Git performance on large repos (stress test)
3. Prototype chunk strategies (compare quality)
4. User testing with semantic queries (gather real use cases)

**Decision points:**
- **Embeddings:** Local sufficient? Or need OpenAI quality?
- **Time travel:** Git adequate? Or build snapshot system?
- **Storage:** SQLite vectors OK? Or need specialized vector DB?

---

*Advanced features requiring research - build after validating quick wins and smart tools.*
