# AIKnowSys Plans - Dependency Analysis & Roadmap

**Generated:** 2026-02-15  
**Purpose:** Understand plan relationships, overlaps, and implementation order

---

## 📊 Executive Summary

**Total Plans:** 50+ (including test plans)  
**Active Strategic Plans:** 12  
**Completed:** 2  
**Planned:** 10  

**⚠️ KEY FINDING: PLAN_event_sourced_storage and PLAN_mcp_only_architecture_migration OVERLAP SIGNIFICANTLY**

Both address the same core problem: "What format should we use to store knowledge?"
- **mcp_only_architecture_migration**: SQLite with markdown-like structure
- **event_sourced_storage**: SQLite with event-based structure

**Recommendation:** Merge into single unified plan (see below)

---

## 📋 Plan Inventory (By Creation Date)

### ✅ COMPLETE Plans

| Plan | Status | Created | Description |
|------|--------|---------|-------------|
| **PLAN_context_query_system** | ✅ COMPLETE | 2026-02-05 | CLI query commands + storage adapter pattern |

### 🎯 ACTIVE/PLANNED Plans (Chronological)

| # | Plan | Status | Created | Priority | Deps |
|---|------|--------|---------|----------|------|
| 1 | PLAN_enhanced_hybrid_architecture | PLANNING | 2026-02-09 | - | None |
| 2 | PLAN_mcp_only_architecture_migration | PLANNING | 2026-02-11 | - | None |
| 3 | PLAN_ai_ux_quick_wins | PLANNED | 2026-02-14 | HIGH | metadata optimization |
| 4 | PLAN_ai_ux_smart_tools | PLANNED | 2026-02-14 | HIGH | quick wins, NLQ |
| 5 | PLAN_conversational_mediator | PLANNED | 2026-02-14 | MEDIUM | quick wins, smart tools |
| 6 | **PLAN_mcp_dynamic_toolsets** | **PLANNED** | **2026-02-15** | **HIGH** | None |
| 7 | **PLAN_event_sourced_storage** | **PLANNED** | **2026-02-15** | **HIGH** | None |

---

## 🔗 Dependency Graph

```
STORAGE LAYER (Foundation):
└─ PLAN_context_query_system ✅ COMPLETE
   └─ PLAN_enhanced_hybrid_architecture (index-first writes)
      ├─ PLAN_mcp_only_architecture_migration (cross-repo SQLite)
      │  └─ ⚠️ OVERLAP: PLAN_event_sourced_storage (event-based SQLite)
      └─ [Both need resolution - see Conflict Analysis below]

AI UX LAYER (User Experience):
└─ PLAN_mcp_query_token_optimization ✅ IMPLEMENTED
   └─ PLAN_ai_ux_quick_wins (conversational errors, previews)
      └─ PLAN_ai_ux_smart_tools (smart query, cross-refs)
         └─ PLAN_conversational_mediator (unified NL interface)

INFRASTRUCTURE LAYER (Performance):
└─ PLAN_mcp_dynamic_toolsets (Speakeasy 3-tool pattern)
   └─ Works with ANY storage layer (independent)
```

---

## ⚠️ CONFLICT ANALYSIS: Storage Format Plans

### The Problem

**Three plans address the same question: "How should we store knowledge?"**

| Plan | Approach | Storage Format | Markdown Role |
|------|----------|----------------|---------------|
| enhanced_hybrid_architecture | Index + markdown sync | JSON index (metadata) | Source of truth |
| mcp_only_architecture_migration | Cross-repo database | SQLite (structured records) | Generated view |
| **event_sourced_storage** | Event-based knowledge graph | SQLite (events) | Generated on-demand |

### Key Differences

**PLAN_enhanced_hybrid_architecture:**
```json
// Index has metadata pointing to markdown
{
  "sessions": [{
    "date": "2026-02-15",
    "file": "sessions/2026-02-15.md"  // Points to file
  }]
}
```
- ✅ Preserves current workflow
- ❌ Markdown still contains the data

**PLAN_mcp_only_architecture_migration:**
```sql
CREATE TABLE sessions (
  content TEXT  -- Full markdown stored in DB
);
```
- ✅ Cross-repo knowledge
- ✅ Conversational plan refinement
- ✅ Markdown stored as TEXT blob
- ❌ Still markdown format (wasteful for AI)

**PLAN_event_sourced_storage:**
```sql
CREATE TABLE knowledge_events (
  event_type TEXT,    -- task_completed, pattern_discovered
  data JSON,          -- Structured facts
  embedding BLOB,     -- Semantic search
  narrative TEXT      -- Optional prose
);
```
- ✅ Cross-repo knowledge
- ✅ AI-optimized (98% token savings)
- ✅ Semantic search built-in
- ✅ Markdown generated on-demand
- ✅ Event-based (atomic facts)

### Overlap Assessment

**mcp_only vs event_sourced:**
- **Same goal:** Replace markdown files with database storage
- **Same scope:** Cross-repo knowledge bank
- **Same infrastructure:** SQLite at `~/.aiknowsys/knowledge.db`
- **Different data model:** Markdown records vs Event records

**Key insight:** event_sourced is the **logical evolution** of mcp_only

---

## 🎯 RECOMMENDED: Unified Storage Plan

### Merge Into: PLAN_knowledge_bank_evolution

**Phase 1: Cross-Repo Foundation (from mcp_only)**
- Setup `~/.aiknowsys/knowledge.db`
- Project registration
- Cross-repo queries
- Agent coordination (reviews)

**Phase 2: Event-Sourced Storage (from event_sourced)**
- Replace markdown blobs with event records
- Add embeddings for semantic search
- Implement event types (task, pattern, decision, etc.)

**Phase 3: Markdown Generation (from both)**
- Generate markdown on-demand from events
- Support multiple formats (narrative, timeline, grouped)
- Git workflow (export for commits)

**Benefits of merging:**
- ✅ Avoid duplicate implementation
- ✅ Single migration path
- ✅ Both goals achieved (cross-repo + AI-optimized)
- ✅ Clear evolution: Files → Index → SQLite → Events

---

## 📅 RECOMMENDED IMPLEMENTATION ORDER

### Immediate (Next 2 weeks)

**1. PLAN_mcp_dynamic_toolsets** ⭐ HIGH PRIORITY
- **Why first:** Infrastructure optimization, independent of storage
- **Impact:** 90% tool definition token reduction
- **Risk:** Low (no storage changes)
- **Estimated:** 1-2 weeks

### Near-term (Weeks 3-6)

**2. PLAN_knowledge_bank_evolution** (Merged plan) ⭐ HIGH PRIORITY
- **Phase 1:** Cross-repo foundation (2 weeks)
- **Phase 2:** Event-sourced storage (2 weeks)
- **Phase 3:** Markdown generation (1 week)
- **Why after dynamic toolsets:** Builds on proven infrastructure
- **Impact:** 98% query token reduction + cross-repo knowledge

### Mid-term (Weeks 7-10)

**3. PLAN_ai_ux_quick_wins** 🟡 MEDIUM PRIORITY
- **Depends on:** Dynamic toolsets, knowledge bank
- **Why:** Better to implement after storage is settled
- **Impact:** Conversational errors, previews, hints
- **Estimated:** 3-5 days

**4. PLAN_ai_ux_smart_tools** 🟡 MEDIUM PRIORITY
- **Depends on:** Quick wins
- **Why:** Needs stable storage layer underneath
- **Impact:** Smart queries, cross-references
- **Estimated:** 1-2 weeks

### Long-term (Weeks 11+)

**5. PLAN_conversational_mediator** 🟢 LOWER PRIORITY
- **Depends on:** Quick wins, smart tools
- **Why:** Evolution, not critical path
- **Impact:** Natural language interface
- **Estimated:** 2-3 weeks

---

## 📦 Plans to Archive/Merge

### ✅ Archive (Superseded)

| Plan | Reason | Superseded By |
|------|--------|---------------|
| PLAN_enhanced_hybrid_architecture | Halfway solution | knowledge_bank_evolution |
| PLAN_mcp_only_architecture_migration | Merge with event_sourced | knowledge_bank_evolution |
| PLAN_event_sourced_storage | Merge with mcp_only | knowledge_bank_evolution |

### ✅ Keep As-Is (Independent)

| Plan | Status | Why Keep |
|------|--------|----------|
| PLAN_context_query_system | COMPLETE | Foundation, already implemented |
| PLAN_mcp_dynamic_toolsets | PLANNED | Infrastructure, independent |
| PLAN_ai_ux_quick_wins | PLANNED | UX layer, independent |
| PLAN_ai_ux_smart_tools | PLANNED | UX layer, builds on quick wins |
| PLAN_conversational_mediator | PLANNED | Evolution, optional |

---

## 🔄 Migration Path

### Current State
```
.aiknowsys/
├── sessions/*.md        (50-100KB each)
├── PLAN_*.md           (varied sizes)
├── learned/*.md        (patterns)
└── context-index.json  (metadata only)
```

### After Dynamic Toolsets (Week 2)
```
MCP Server:
├── 3 tools (search, describe, execute)
└── Tool registry (36 tools internal)

.aiknowsys/ (unchanged)
```

### After Knowledge Bank Phase 1 (Week 4)
```
~/.aiknowsys/
└── knowledge.db
    ├── projects (all repos)
    ├── sessions (markdown blobs)
    └── plans (markdown blobs)

.aiknowsys/ (kept for git viewing)
```

### After Knowledge Bank Phase 2 (Week 6)
```
~/.aiknowsys/
└── knowledge.db
    ├── projects
    ├── knowledge_events (atomic facts)
    │   ├── task_completed
    │   ├── pattern_discovered
    │   └── decision_made
    └── event_embeddings (semantic search)

.aiknowsys/ (generated on-demand)
```

---

## 🎯 Action Items

### For Planning Team

1. **Review this analysis** - Confirm overlap assessment
2. **Decide on merge** - Approve unified knowledge_bank_evolution plan
3. **Update roadmap** - Adjust timeline based on dependencies

### For Implementation

1. **Week 1-2:** Implement PLAN_mcp_dynamic_toolsets
2. **Week 3:** Create PLAN_knowledge_bank_evolution (merged plan)
3. **Week 4-6:** Implement knowledge bank (cross-repo + events)
4. **Week 7+:** AI UX improvements

### For Documentation

1. Archive superseded plans to `.aiknowsys/archived/plans/`
2. Update ROADMAP.md with unified timeline
3. Create migration guide for users

---

## 💡 Key Insights

### Why Event-Sourced Storage Wins

**Traditional approach (mcp_only):**
- Store 80KB markdown in database
- Query entire session to extract one fact
- No semantic search (keyword only)
- Still has formatting waste

**Event-sourced approach:**
- Store 20 discrete events (2K total tokens)
- Query specific event type (200 tokens)
- Semantic search via embeddings
- Zero formatting waste

**The difference:** 98% token savings

### Why Cross-Repo Matters

**Current (per-repo):**
```
Project A learns "JWT auth pattern"
→ Developer copies markdown to Project B
→ AI reads duplicate context
→ Inefficient, manual
```

**Knowledge bank:**
```
Project A logs "pattern_discovered" event
→ Cross-repo query finds it
→ Project B applies pattern
→ Automatic, efficient
```

---

## 📈 Expected Impact (After Full Implementation)

| Metric | Before | After Dynamic Toolsets | After Knowledge Bank | Total Improvement |
|--------|--------|----------------------|---------------------|-------------------|
| Tool definitions | 29K tokens | 3K tokens | 3K tokens | **90% reduction** |
| Query responses | 78K tokens | 78K tokens | 2K tokens | **97% reduction** |
| Cross-repo reuse | Manual copying | Manual copying | Automatic | **∞ improvement** |
| Semantic search | None | None | Built-in | **New capability** |

**Combined savings:** ~95-98% token reduction for typical AI workflows

---

*This analysis should guide the next planning session to resolve overlaps and set clear implementation priorities.*
