# Ideas & Feedback Backlog

**Purpose:** Capture future enhancements, experimental ideas, and community feedback without cluttering active plans.

**Status Key:**
- 🌱 **Seedling** - Raw idea, needs refinement
- 🔬 **Research** - Investigating feasibility
- 📋 **Ready** - Refined enough to become a plan
- ✅ **Implemented** - Moved to active work
- ❌ **Rejected** - Decided not to pursue

---

## High Priority (Should Consider Soon)

### 1. Enterprise VectorDB Adapter 🔬
**Category:** Enterprise Integration  
**Effort:** 8-12 hours (Phase C)  
**Value:** Very High (enables enterprise adoption)  
**Business Value:** 🚀 **CTO Pitch Material**

**Idea:**
The storage adapter pattern isn't just JSON → SQLite. It's an **enterprise integration gateway**.

**Use Cases:**
1. **RAG Integration** - Existing corporate VectorDB (Pinecone, Weaviate, Qdrant, Milvus)
   - Semantic search instead of exact match
   - "Find sessions related to authentication bugs" (without keyword matching)
   - Cross-project knowledge discovery

2. **Enterprise Data Governance** - Corporate PostgreSQL/MongoDB/Oracle
   - Centralized knowledge base across teams
   - Audit trails, access control, compliance
   - Single source of truth for all AI agent interactions

3. **Hybrid Architecture** - Best of both worlds
   - VectorDB for semantic search
   - JSON/SQLite for local caching (offline mode)
   - Sync on network reconnect

**Implementation Path:**
```typescript
// lib/context/vectordb-storage.js
class VectorDBAdapter extends StorageAdapter {
  async queryPlans(filters) {
    // Semantic search: "Find plans about performance optimization"
    const embedding = await this.embed(filters.semanticQuery);
    const results = await this.vectorDB.search(embedding, {
      filter: { type: 'plan', author: filters.author },
      limit: 10
    });
    return results.map(hit => hit.metadata);
  }
}
```

**CTO Pitch Angle:**
- **"AI agents generate massive amounts of knowledge. We need to capture it, not lose it."**
- **Pain:** 147 session files (400k+ lines) → nobody reads them → knowledge lost
- **Solution:** Index-first architecture → knowledge becomes queryable, actionable
- **Enterprise Ready:** Adapter pattern supports VectorDB → integrates with existing RAG infrastructure
- **ROI:** Reduce repeated work (AI finds previous solutions), improve onboarding (new devs query past decisions)
- **Competitive Edge:** "Our AI agents learn from themselves" (most companies just archive chat logs)

**Technical Wins for Enterprise:**
- ✅ Security: No data leaves corporate network (on-prem VectorDB)
- ✅ Scale: VectorDB handles millions of knowledge items (JSON won't)
- ✅ Compliance: Audit trails, retention policies (built into enterprise DB)
- ✅ Collaboration: Cross-team knowledge discovery (not siloed in individual repos)
- ✅ Investment Protection: Leverages existing RAG infrastructure (doesn't compete with it)

**Phasing:**
- **Phase A (14-19h):** Prove JSON adapter works (local, git-based)
- **Phase B (3-4h):** Add mutations (prove index-first philosophy)
- **Phase C (8-12h):** VectorDB adapter (prove enterprise integration)

**Decision Trigger:** If Phase B succeeds + CTO approval → Build Phase C

**Concerns:**
- VectorDB setup complexity (need devops support)
- Embedding costs (if using OpenAI/Anthropic APIs)
- Network dependency (need offline fallback)

**Next Step:** 
1. Complete Phase A/B (prove concept with JSON)
2. Create Phase C proposal with VectorDB adapter design
3. Demo to CTO: "Here's how it works locally, here's how it scales enterprise-wide"

**Status:** 🔬 Research - Needs Phase A/B validation first

---

### 2. ESSENTIALS as Skill Index (Phase A.5) 📋
**Category:** Knowledge Architecture  
**Effort:** 2-3 hours  
**Value:** Very High (solves AI agent overconfidence)  
**Impact:** 60-80% token reduction, prevents "I thought I knew" mistakes

**Real-World Failure Case:**
> User: "Why didn't you use the skill I wrote for you?"  
> Agent: "It was presented to me but it's optional, so I ignored it because I thought I knew it already."  
> Agent: (Made mistake) "If I would have used it, I wouldn't have made this mistake."

**The Problem:**
- **Agent overconfidence:** "I think I know TDD, skip the skill" → violates TDD anyway
- **Optional guidance:** Skills presented but not enforced → agent ignores them
- **ESSENTIALS bloat:** 803 lines → agent loads everything every session, most irrelevant
- **Cognitive load:** Agent sees 803 lines, skims it, misses critical details

**The Solution: Index-Based ESSENTIALS**

**Structure:**
```markdown
# CODEBASE_ESSENTIALS.md (~200 lines)

## Critical Invariants (ALWAYS LOADED - NOT OPTIONAL)
1. Validation is mandatory
2. TDD for features (RED-GREEN-REFACTOR)
3. ... (7 invariants total)

## Skill Index (ON-DEMAND LOADING)
- [tdd-workflow] - Triggers: "write tests", "TDD"
- [refactoring-workflow] - Triggers: "refactor", "clean up"
- [context-query] - Triggers: "find plan", "query sessions"
```

**Agent Workflow:**
1. **Session start:** Read ESSENTIALS index (200 lines, not 803)
2. **Critical invariants:** ALWAYS loaded (not optional, prevents "I thought I knew")
3. **Detect trigger:** Agent sees "write tests" in user request
4. **Load skill:** Call `query-essentials "TDD Workflow"` → loads only that skill (100 lines)
5. **Apply skill:** Follows workflow (can't skip it, already loaded)

**Why This Fixes "I Thought I Knew" Problem:**

| Scenario | Current (803-line ESSENTIALS) | Index-Based (200 + on-demand) |
|----------|------------------------------|-------------------------------|
| **Agent confidence** | "I read 803 lines, I know everything" | "I read invariants, I know the rules" |
| **Skill loading** | Optional (agent decides to skip) | Automatic (trigger words → load skill) |
| **When agent skips** | "I think I know TDD" → violates TDD | Skill already loaded → follows it |
| **Cognitive load** | High (803 lines, agent skims) | Low (200 lines index, focused reading) |

**Benefits:**
1. **Prevents overconfidence:** Critical rules ALWAYS loaded (not optional)
2. **Reduces tokens:** 60-80% savings (load only relevant skills)
3. **Enforces workflows:** Trigger words → auto-load skill → agent can't "forget"
4. **Environment independence:** Skills become process-focused, not tool-specific
5. **Modular knowledge:** Skills in `.github/skills/` (portable across projects)

**Implementation:**

**Phase A.5 (2-3 hours):**
1. Decompose ESSENTIALS into index (~200 lines) + skill references
2. Move detailed workflows to `.github/skills/` (already exist, just reorganize)
3. Update `query-essentials` command to load skills instead of sections
4. Add auto-load on trigger words (agent detects "refactor" → loads refactoring-workflow)

**Example: ESSENTIALS Index**
```markdown
## Critical Invariants

1. **Validation is Mandatory** (NOT OPTIONAL)
   - Never claim work complete without validation
   - Validation matrix: [validation-troubleshooting](../.github/skills/validation-troubleshooting/SKILL.md)

2. **TDD for Features** (RED-GREEN-REFACTOR - NOT OPTIONAL)
   - Write failing test FIRST
   - Full workflow: [tdd-workflow](../.github/skills/tdd-workflow/SKILL.md)

## Skill Index

### When to Load Skills
Agent: If you detect trigger words, call `query-essentials "<skill-name>"` to load the full workflow.
**Do not skip this.** Skills contain patterns you may not be aware of.

- **[tdd-workflow]** - Triggers: "write tests", "TDD", "test first"
- **[refactoring-workflow]** - Triggers: "refactor", "clean up", "extract"
- **[context-query]** - Triggers: "find plan", "query sessions"
```

**Environment Independence:**
Skills become process-focused (works across VSCode/Claude/Cursor/web):

```markdown
## Query Plans Workflow

**Goal:** Find plans by status/author/topic

**Process:**
1. Determine filter criteria (status, author, topic)
2. **If terminal access:** Run `npx aiknowsys query-plans --status=active`
3. **If web environment:** Ask user to run command, paste output
4. **Parse JSON output:** Array of plan objects
5. **Present results:** Show relevant plans to user

**Output format:** JSON array, parse programmatically
```

**Meta-Beauty:**
ESSENTIALS uses its own query system (self-referential):
- `query-essentials "TDD"` → loads TDD skill
- `query-essentials "Refactoring"` → loads refactoring skill
- System demonstrates its own architecture

**Phasing:**
- ✅ **Phase A:** Build context query system (proves `query-essentials` works)
- ✅ **Phase A.5:** Decompose ESSENTIALS into index (2-3 hours)
- ✅ **Phase B:** Mutation commands (if Phase A succeeds)

**Decision Trigger:** After Phase A validation, if queries work well → implement Phase A.5

**Success Criteria:**
- [ ] ESSENTIALS reduced from 803 → ~200 lines
- [ ] Agent can load skills on-demand with `query-essentials`
- [ ] Critical invariants ALWAYS loaded (not optional)
- [ ] Agent follows workflows (can't skip with "I thought I knew")
- [ ] 60-80% token savings on session startup

**Status:** 📋 Ready - Clear problem, clear solution, fits in existing plan

---

### 4. Auto-Context for Session Creation 🌱
**Category:** DX Improvement  
**Effort:** 2-3 hours  
**Value:** Medium

**Idea:**
```bash
npx aiknowsys create-session --auto-detect
# Detects:
# - Git branch name → topic
# - Recent commits → related files
# - Uncommitted changes → files being worked on
# - Active plan (from branch or last session)
```

**Why:** Reduce manual data entry, increase session accuracy

**Concerns:** Git-dependent (what about non-git projects?)

**Next Step:** Prototype git integration, measure time saved

---

### 5. Query Performance Benchmarks 🔬
**Category:** Quality Assurance  
**Effort:** 1-2 hours  
**Value:** High (proves ROI)

**Idea:** Add success criteria with measurable performance targets
- query-plans: <50ms for 100 plans
- search-context: <200ms for 10MB of data
- rebuild-index: <2s for 147 sessions

**Implementation:** Add benchmark tests that fail if too slow

**Decision Trigger:** If benchmarks fail → migrate to SQLite

**Next Step:** Add to Phase 5 testing

---

### 7. Incremental Proof of Value ✅ **IMPLEMENTED**
**Category:** Risk Management  
**Effort:** Planning overhead  
**Value:** Very High

**Idea:** Break 17-hour plan into 3 milestones with decision points
- Milestone 1 (4 hours): Prove queries faster than grep
- Milestone 2 (8 hours): Prove migration handles real data
- Milestone 3 (17 hours): Full system working

**Status:** Added to PLAN_context_query_system.md (Phase 0-6 timeline)

---

### 12. Index Backup Strategy 🌱
**Category:** Data Safety  
**Effort:** 2 hours  
**Value:** High (prevents data loss)

**Idea:** Auto-backup index before mutations
```javascript
async function markPlanStatus(id, status) {
  await backupIndex(); // .aiknowsys/.backup/context-index.json.{timestamp}
  // ... mutation logic
  cleanupBackups({ keep: 10 }); // Keep last 10 backups
}
```

**Why:** Index corruption = data loss. Backups enable rollback.

**Implementation:**
- Add `lib/utils/backup.js`
- Call before every mutation
- Keep last 10 backups (configurable)
- Add `restore-backup` command

**Next Step:** Add to Phase 6 (mutation commands)

---

## Medium Priority (Future Enhancements)

### 3. Conflict Resolution Strategy 📋
**Category:** Collaboration  
**Effort:** 3-4 hours  
**Value:** Medium

**Problem:** Human edits markdown manually, index is now stale. Which is truth?

**Solution:** Add `--source` flag to rebuild-index
```bash
# Index as truth (regenerate markdown)
npx aiknowsys rebuild-index --source index

# Markdown as truth (rebuild index from files)
npx aiknowsys rebuild-index --source markdown

# Detect conflicts and ask
npx aiknowsys rebuild-index --interactive
```

**Why:** Enables hybrid workflow (humans edit markdown, AI uses index)

**Concerns:** Adds complexity. Is this YAGNI?

**Next Step:** Wait for real conflict in dogfooding, then decide

---

### 8. Export Formats Beyond JSON 🌱
**Category:** Interoperability  
**Effort:** 2 hours  
**Value:** Low

**Idea:**
```bash
aiknowsys query-plans --format markdown  # For issues/docs
aiknowsys query-plans --format csv       # For spreadsheets
aiknowsys query-plans --format html      # For reports
```

**Why:** Different consumers need different formats

**Concerns:** Adds maintenance burden. Start with JSON only?

**Next Step:** Wait for user request, then add specific format

---

### 9. Schema Versioning 🔬
**Category:** Maintenance  
**Effort:** 3-4 hours  
**Value:** Medium (future-proofing)

**Problem:** Index structure will evolve. How to migrate data?

**Solution:** Add version field + migration system
```json
{
  "version": "1.0.0",
  "plans": [...],
  "sessions": [...]
}
```

**Implementation:**
```javascript
const index = loadIndex();
if (semver.lt(index.version, CURRENT_VERSION)) {
  runMigrations(index, CURRENT_VERSION);
  saveIndex(index);
}
```

**Why:** Breaking changes won't break existing projects

**Next Step:** Add to Phase 1 (initial index structure)

---

### 13. Progressive Enhancement of Essentials Chunking 🌱
**Category:** Context Optimization  
**Effort:** 2-3 hours  
**Value:** Medium

**Idea:** query-essentials returns related sections automatically
```json
{
  "section": "TypeScript Patterns",
  "content": "...",
  "relatedSections": [
    { "title": "Testing Philosophy", "relevance": 0.85 }
  ],
  "internalLinks": [
    { "text": "TDD workflow", "section": "Testing Philosophy" }
  ]
}
```

**Why:** AI often needs adjacent context. Auto-suggest prevents second query.

**Implementation:**
- Parse markdown links in section
- Calculate relevance score (mentions, links)
- Return top 3 related sections with snippets

**Next Step:** Wait for Phase 6 complete, measure if needed

---

## Low Priority (Experimental)

### 6. Dry-Run Mode for Mutations 🌱
**Category:** Safety  
**Effort:** 1 hour per command  
**Value:** Medium

**Idea:**
```bash
npx aiknowsys mark-plan-status PLAN_xyz COMPLETE --dry-run
# Shows what would change without executing
```

**Why:** Prevents accidental data loss

**Concerns:** Adds code complexity. Is this needed or YAGNI?

**Next Step:** Implement for one command, see if it's valuable

---

### 10. SQLite Adapter (Future) 🔬
**Category:** Performance  
**Effort:** 8-10 hours  
**Value:** Unknown (depends on scale)

**Decision Trigger:** JSON index >1MB or queries >200ms

**Implementation:** Follows storage adapter interface (drop-in replacement)

**Status:** Deferred until needed. Start with JSON.

---

### 11. GraphQL API 🌱
**Category:** Advanced Querying  
**Effort:** 10+ hours  
**Value:** Low (overkill?)

**Idea:** Complex queries with relationships
```graphql
query {
  plans(status: ACTIVE) {
    id
    sessions {
      date
      topics
    }
  }
}
```

**Concerns:** Massive scope creep. CLI + JSON is enough.

**Status:** **Likely reject** - Keep it simple!

---

## Rejected Ideas ❌

### Use MCP Instead of CLI
**Reason:** External dependency, vendor lock-in, AI-platform specific

**Decision:** CLI is universal, works for humans AND AI

**Date:** 2026-02-05

---

### SQLite from Day 1
**Reason:** Premature optimization, binary dependency, harder to debug

**Decision:** Start JSON, upgrade if needed

**Date:** 2026-02-05

---

## How to Use This Document

### Adding New Ideas
1. Create section with category emoji (🌱 🔬 📋 ✅ ❌)
2. Describe: Problem, Solution, Why, Concerns
3. Estimate effort (hours) and value (Low/Medium/High)
4. Add "Next Step" (what's needed to move forward)

### Moving to Active Work
When idea becomes 📋 **Ready**:
1. Create PLAN_*.md in .aiknowsys/
2. Update idea status to ✅ **Implemented**
3. Keep idea here for historical record

### Rejecting Ideas
When deciding not to pursue:
1. Move to "Rejected Ideas" section
2. Document reason and date
3. Prevents re-discussing later

---

**Related:**
- [PLAN_context_query_system.md](PLAN_context_query_system.md) - Active work
- [ROADMAP.md](../ROADMAP.md) - Official product roadmap
- [CODEBASE_CHANGELOG.md](../CODEBASE_CHANGELOG.md) - What shipped

---

*Feedback from AI Agent (@Planner) session on Feb 5, 2026*
*Part of AIKnowSys knowledge management system*
