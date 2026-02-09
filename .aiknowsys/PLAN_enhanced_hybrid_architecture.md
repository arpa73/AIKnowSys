# Implementation Plan: Enhanced Hybrid Architecture (Index-First Writes)

**Status:** 🎯 PLANNING  
**Created:** 2026-02-09  
**Goal:** Mutation commands write BOTH index + markdown to ensure MCP speed + human readability + git workflow

---

## Overview

Transform aiknowsys from "markdown-first with lazy index rebuild" to "index-first writes with immediate markdown generation" while preserving the best of both worlds:

- ✅ **AI agents get 10-100x speed** (MCP tools query index, no staleness wait)
- ✅ **Humans get readable files** (git diff, emergency editing, portable)
- ✅ **Single source of truth** (markdown is canonical, index is always-fresh cache)
- ✅ **Graceful degradation** (index corrupts? Rebuild from markdown)
- ✅ **Git workflow preserved** (diffs are human-readable, PRs work)
- ✅ **Backward compatible** (existing workflows unchanged)

---

## Requirements

**Functional:**
- Mutation commands (create/update session/plan) write index immediately
- Markdown files generated atomically with index writes
- Index and markdown stay in sync automatically
- MCP tools read from index (no staleness checks needed)
- `rebuild-index` can reconstruct from markdown (disaster recovery)
- Pre-commit hook validates sync state

**Non-Functional:**
- Write latency: <50ms overhead for markdown generation
- No breaking changes to CLI interface
- Tests cover both index and markdown outputs
- Documentation explains architecture clearly

**Success Criteria:**
- [ ] All mutation commands write index + markdown in single operation
- [ ] MCP tools return instantly (no auto-rebuild delay)
- [ ] Git diffs show markdown changes (human readable)
- [ ] `rebuild-index` successfully recovers from markdown
- [ ] Pre-commit hook prevents desync
- [ ] All 100+ tests pass
- [ ] Documentation updated

---

## Architecture Changes

### Current Flow (Markdown-First with Lazy Rebuild)

```
User: npx aiknowsys create-session --goal "X"
  ↓
Command: Write .aiknowsys/sessions/YYYY-MM-DD.md
  ↓
Index: (stale, not updated)
  ↓
MCP Query: mcp_aiknowsys_get_recent_sessions()
  ↓
Auto-indexer: Detects staleness (compare file mtime vs index mtime)
  ↓
Auto-indexer: Rebuilds entire index (scan all files)  [SLOW: 100-500ms]
  ↓
MCP Tool: Returns results from fresh index
```

**Bottleneck:** Every query after mutation triggers full index rebuild (100-500ms).

---

### Proposed Flow (Index-First Writes with Immediate Generation)

```
User: npx aiknowsys create-session --goal "X"
  ↓
Command: 1. Update index in-memory
         2. Write index to disk (context-index.json)
         3. Generate markdown (.aiknowsys/sessions/YYYY-MM-DD.md)
  ↓
Both files committed atomically
  ↓
MCP Query: mcp_aiknowsys_get_recent_sessions()
  ↓
MCP Tool: Reads index directly (no staleness check needed)  [FAST: 1-5ms]
  ↓
Returns results instantly
```

**Benefit:** MCP queries are 10-100x faster (no rebuild overhead).

---

## Implementation Steps

### Phase 1: Enhance JsonStorage with Markdown Generation (3 hours)

**Goal:** Add methods to write BOTH index + markdown atomically

**1.1 Add Markdown Generator Methods** (File: `lib/context/json-storage.ts`)
- **Action:** Create `generatePlanMarkdown(plan: PlanMetadata): string`
- **Why:** Convert plan metadata to markdown format
- **Dependencies:** None
- **Risk:** LOW - pure conversion logic
- **TDD:** Write tests in `test/context/json-storage.test.ts` first

**1.2 Add Markdown Generator for Sessions** (File: `lib/context/json-storage.ts`)
- **Action:** Create `generateSessionMarkdown(session: SessionMetadata): string`
- **Why:** Convert session metadata to markdown format
- **Dependencies:** 1.1 (same pattern)
- **Risk:** LOW - pure conversion logic
- **TDD:** Write tests first

**1.3 Add Index Write Methods** (File: `lib/context/json-storage.ts`)
- **Action:** Create public methods:
  - `async addPlan(plan: PlanMetadata): Promise<void>`
  - `async updatePlan(planId: string, updates: Partial<PlanMetadata>): Promise<void>`
  - `async addSession(session: SessionMetadata): Promise<void>`
  - `async updateSession(date: string, updates: Partial<SessionMetadata>): Promise<void>`
- **Why:** Provide structured API for mutation commands
- **Dependencies:** 1.1, 1.2
- **Risk:** MEDIUM - must ensure atomic writes (index + markdown together)
- **TDD:** Write tests first

**1.4 Implement Atomic Writes** (File: `lib/context/json-storage.ts`)
- **Action:** Each write method does:
  ```typescript
  async addSession(session: SessionMetadata): Promise<void> {
    // 1. Update in-memory index
    this.index.sessions.push(session);
    
    // 2. Write index to disk
    await this.saveIndex();
    
    // 3. Generate and write markdown
    const markdown = this.generateSessionMarkdown(session);
    const sessionPath = path.join(this.targetDir, '.aiknowsys', session.file);
    await fs.mkdir(path.dirname(sessionPath), { recursive: true });
    await fs.writeFile(sessionPath, markdown, 'utf-8');
  }
  ```
- **Why:** Both index and markdown updated together (no desync window)
- **Dependencies:** 1.3
- **Risk:** LOW - filesystem writes are synchronous enough
- **TDD:** Test both index and markdown outputs

**1.5 Error Handling & Rollback** (File: `lib/context/json-storage.ts`)
- **Action:** Wrap writes in try-catch, rollback index update if markdown write fails
- **Why:** Prevent partial writes (index updated but markdown fails)
- **Dependencies:** 1.4
- **Risk:** MEDIUM - need careful error handling
- **TDD:** Write tests for failure scenarios

---

### Phase 2: Update Mutation Commands (2 hours)

**Goal:** Refactor commands to use JsonStorage write methods

**2.1 Update create-session Command** (File: `lib/commands/create-session.ts`)
- **Action:** Replace direct markdown write with:
  ```typescript
  const storage = new JsonStorage();
  await storage.init(resolvedTargetDir);
  await storage.addSession({
    date,
    topic: title,
    file: `sessions/${filename}`,
    created: new Date(date),
    updated: new Date(),
    topics,
    plan
  });
  ```
- **Why:** Leverage atomic index+markdown writes
- **Dependencies:** Phase 1 complete
- **Risk:** LOW - straightforward refactor
- **TDD:** Update existing tests to verify both outputs

**2.2 Update update-session Command** (File: `lib/commands/update-session.ts`)
- **Action:** Replace YAML manipulation with:
  ```typescript
  await storage.updateSession(date, {
    topics: newTopics,
    plan: newPlan,
    updated: new Date()
  });
  ```
- **Why:** Consistent pattern with create-session
- **Dependencies:** 2.1
- **Risk:** LOW
- **TDD:** Update tests

**2.3 Update create-plan Command** (File: `lib/commands/create-plan.ts`)
- **Action:** Use `storage.addPlan(metadata)`
- **Why:** Same atomic pattern
- **Dependencies:** 2.1
- **Risk:** LOW
- **TDD:** Update tests

**2.4 Update update-plan Command** (File: `lib/commands/update-plan.ts`)
- **Action:** Use `storage.updatePlan(planId, updates)`
- **Why:** Consistent API
- **Dependencies:** 2.3
- **Risk:** LOW
- **TDD:** Update tests

---

### Phase 3: Remove Auto-Indexer Staleness Checks (30 min)

**Goal:** MCP tools no longer need to check staleness (index is always fresh)

**3.1 Update JsonStorage Query Methods** (File: `lib/context/json-storage.ts`)
- **Action:** Remove auto-indexer check from:
  - `queryPlans()`
  - `querySessions()`
  - `search()`
- **Before:**
  ```typescript
  async queryPlans(filters?: PlanFilters) {
    // Auto-rebuild if index is stale
    if (this.autoIndexer) {
      await this.autoIndexer.ensureFreshIndex(this, { verbose: false });
    }
    // ... query logic
  }
  ```
- **After:**
  ```typescript
  async queryPlans(filters?: PlanFilters) {
    // Index is always fresh (mutation commands update it)
    // ... query logic
  }
  ```
- **Why:** Eliminates 100-500ms rebuild overhead on every query
- **Dependencies:** Phase 2 complete (all mutations go through storage)
- **Risk:** LOW - simplification
- **TDD:** Tests should run faster (no rebuild delay)

**3.2 Keep Auto-Indexer for Manual Edits** (File: `lib/context/auto-index.ts`)
- **Action:** Add note in documentation:
  - Auto-indexer still needed for disaster recovery
  - If user manually edits markdown, run `rebuild-index`
  - Pre-commit hook calls auto-indexer to validate sync
- **Why:** Preserves emergency editing workflow
- **Dependencies:** 3.1
- **Risk:** LOW - documentation only

---

### Phase 4: Add Pre-Commit Validation (1 hour)

**Goal:** Prevent committing desynchronized state

**4.1 Create Validation Command** (File: `lib/commands/validate-index-sync.ts`)
- **Action:** Create new command:
  ```typescript
  export async function validateIndexSync(targetDir: string): Promise<boolean> {
    // 1. Load current index from disk
    const currentIndex = await loadIndex(targetDir);
    
    // 2. Rebuild index from markdown (in-memory only)
    const rebuiltIndex = await rebuildIndexInMemory(targetDir);
    
    // 3. Deep compare
    const inSync = deepEqual(currentIndex, rebuiltIndex);
    
    if (!inSync) {
      console.error('❌ Index out of sync with markdown!');
      console.error('Run: npx aiknowsys rebuild-index');
      return false;
    }
    
    console.log('✅ Index in sync with markdown');
    return true;
  }
  ```
- **Why:** Catches manual markdown edits without index update
- **Dependencies:** None
- **Risk:** LOW - read-only validation
- **TDD:** Write tests with intentionally desync'd data

**4.2 Add Pre-Commit Hook** (File: `.github/hooks/pre-commit.sh`)
- **Action:**
  ```bash
  #!/bin/bash
  # Validate index sync before commit
  
  if git diff --cached --name-only | grep -q '.aiknowsys/.*\.md'; then
    echo "🔍 Validating index sync..."
    npx aiknowsys validate-index-sync
    
    if [ $? -ne 0 ]; then
      echo "❌ Commit blocked: Index out of sync"
      echo "Run: npx aiknowsys rebuild-index"
      exit 1
    fi
  fi
  ```
- **Why:** Automatic validation on every commit touching markdown
- **Dependencies:** 4.1
- **Risk:** LOW - existing hook infrastructure
- **TDD:** Manual test with intentional desync

**4.3 Update Hook Installation** (File: `scripts/install-hooks.sh`)
- **Action:** Add pre-commit hook to installation script
- **Why:** Ensure users get validation automatically
- **Dependencies:** 4.2
- **Risk:** LOW
- **TDD:** Test hook installation

---

### Phase 5: Documentation & Migration (1 hour)

**Goal:** Clear documentation of new architecture

**5.1 Update CODEBASE_ESSENTIALS.md** (File: `CODEBASE_ESSENTIALS.md`)
- **Action:** Update Section 4 (Architecture):
  ```markdown
  ## 4. Storage Architecture (Enhanced Hybrid)
  
  **Write Path:** (Mutation commands)
  - Commands write to index first (context-index.json)
  - Markdown auto-generated atomically
  - Both committed together (no desync window)
  
  **Read Path:** (AI agents)
  - MCP tools read from index (1-5ms, no staleness checks)
  - Humans read markdown (git diff, emergency edits)
  
  **Emergency Recovery:**
  - Markdown is canonical source of truth
  - Index corrupted? Run: `npx aiknowsys rebuild-index`
  - Index is always rebuildable from markdown
  ```
- **Why:** Explains new architecture clearly
- **Dependencies:** Phases 1-4 complete
- **Risk:** LOW - documentation only

**5.2 Update AGENTS.md Workflow** (File: `AGENTS.md`)
- **Action:** Update session management section:
  ```markdown
  ### Session/Plan Management (ALWAYS use mutation commands)
  
  **Create new session:**
  ```bash
  npx aiknowsys create-session --goal "X"
  # Writes BOTH index + markdown atomically
  ```
  
  **Update session:**
  ```bash
  npx aiknowsys update-session --appendSection "## Changes" --content "..."
  # Updates BOTH index + markdown
  ```
  
  **Emergency manual editing:**
  1. Edit .aiknowsys/sessions/YYYY-MM-DD.md
  2. Run: `npx aiknowsys rebuild-index`
  3. Pre-commit hook validates sync
  ```
- **Why:** Clear workflow for AI agents
- **Dependencies:** 5.1
- **Risk:** LOW

**5.3 Create Architecture Decision Record** (File: `docs/adr/003-enhanced-hybrid-storage.md`)
- **Action:** Document decision:
  - Why enhanced hybrid (not pure index-first)
  - Trade-offs analyzed
  - Implementation approach
  - Migration path
- **Why:** Historical record of architectural decision
- **Dependencies:** 5.2
- **Risk:** LOW

**5.4 Update Migration Guide** (File: `docs/migration-guide.md`)
- **Action:** Add section:
  ```markdown
  ## v0.11.0: Enhanced Hybrid Storage
  
  **What changed:**
  - Mutation commands now write index + markdown atomically
  - MCP tools are 10-100x faster (no auto-rebuild delay)
  - Pre-commit hook validates sync
  
  **Action required:**
  - None (backward compatible)
  - Recommended: Install hooks (`npm run install-hooks`)
  
  **Breaking changes:**
  - None (CLI interface unchanged)
  ```
- **Why:** Clear upgrade path for users
- **Dependencies:** 5.3
- **Risk:** LOW

---

## Testing Strategy

**TDD Approach (Phases 1-2):**
- Write tests FIRST for new storage methods
- Verify both index and markdown outputs
- Test atomic writes (rollback on failure)
- Test error scenarios (disk full, permissions)

**Integration Tests (Phase 3):**
- Create session via command
- Query via MCP tool
- Verify instant response (no rebuild delay)
- Measure latency: <10ms expected

**Validation Tests (Phase 4):**
- Intentionally desync index and markdown
- Run validation command
- Verify detection and error reporting
- Test pre-commit hook blocking

**Performance Tests:**
- Benchmark mutation command overhead (<50ms)
- Benchmark MCP query latency (<10ms)
- Compare before/after (expect 10-100x improvement)

**Test Coverage:**
- Target >90% on new storage methods
- All mutation commands have updated tests
- Pre-commit hook tested manually

---

## Risks & Mitigations

**Risk 1: Markdown Generation Overhead**
- **Likelihood:** MEDIUM
- **Impact:** LOW
- **Issue:** Generating markdown on every write adds latency
- **Mitigation:** 
  - Keep templates simple (fast generation)
  - Benchmark and optimize if >50ms
  - Async writes if needed (not blocking)

**Risk 2: Index/Markdown Desync**
- **Likelihood:** LOW (with atomic writes)
- **Impact:** MEDIUM
- **Issue:** If write fails mid-operation, index vs markdown diverge
- **Mitigation:**
  - Rollback in-memory index if markdown write fails
  - Pre-commit hook catches any desync
  - `rebuild-index` is escape hatch

**Risk 3: Backward Compatibility**
- **Likelihood:** LOW
- **Impact:** HIGH
- **Issue:** Existing user workflows break
- **Mitigation:**
  - CLI interface unchanged
  - Markdown format unchanged
  - Users see no difference (just faster queries)
  - Migration requires no action

**Risk 4: Test Suite Fragility**
- **Likelihood:** MEDIUM
- **Impact:** MEDIUM
- **Issue:** Many tests need updating (both index + markdown checks)
- **Mitigation:**
  - Update tests incrementally (one command at a time)
  - Keep old tests passing until refactor complete
  - Integration tests catch regressions

---

## Success Criteria

**Functional:**
- [x] All mutation commands write index + markdown atomically
- [x] MCP tools return instantly (no staleness checks)
- [x] Git diffs show markdown changes (human readable)
- [x] `rebuild-index` successfully recovers from markdown
- [x] Pre-commit hook prevents desync

**Technical:**
- [x] All 100+ existing tests pass
- [x] New tests for storage write methods
- [x] Integration tests for MCP query latency
- [x] Performance: MCP queries <10ms, mutation writes <50ms overhead

**Documentation:**
- [x] CODEBASE_ESSENTIALS.md updated
- [x] AGENTS.md workflow updated
- [x] Architecture Decision Record created
- [x] Migration guide updated

---

## Timeline Estimate

| Phase | Description | Estimated Time |
|-------|-------------|----------------|
| 1 | Enhance JsonStorage with markdown generation | 3 hours |
| 2 | Update mutation commands | 2 hours |
| 3 | Remove auto-indexer staleness checks | 30 min |
| 4 | Add pre-commit validation | 1 hour |
| 5 | Documentation & migration | 1 hour |
| **Total** | **End-to-End Implementation** | **7.5 hours** |

**Note:** Estimate assumes TDD workflow (tests first, then implementation).

---

## Notes for Developer

**Key Architectural Insight:**
- Markdown is still the source of truth (disaster recovery)
- Index is "always-fresh cache" (not "source of truth")
- This preserves git workflow while gaining MCP speed

**Implementation Order:**
- Phase 1 is critical (establishes write pattern)
- Phases 2-3 are refactoring (low risk)
- Phase 4 is insurance (catches manual edits)
- Phase 5 is communication (explain what changed)

**Testing Strategy:**
- TDD MANDATORY for Phase 1 (new code paths)
- Integration tests validate performance claims
- Pre-commit hook is last safety net

**Rollback Plan:**
- Git revert is simple (markdown format unchanged)
- Users unaffected (CLI interface unchanged)
- Worst case: `rebuild-index` from markdown

---

**Ready for implementation. Estimated 7.5 hours (distributed over 1-2 days if following strict TDD).**
