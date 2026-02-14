# Implementation Plan: Cross-Repo Knowledge Bank Architecture

**Status:** 🎯 PLANNING  
**Created:** 2026-02-11 22:00  
**Updated:** 2026-02-11 22:15 (Vision refinement)  
**Author:** arno-paffen  
**Goal:** Transform AIKnowSys into cross-repository conversational knowledge system

---

## Vision: The Paradigm Shift

**FROM: Per-Repo File-Based Knowledge**
```
Repository A            Repository B
├── .aiknowsys/        ├── .aiknowsys/
│   ├── sessions/      │   ├── sessions/
│   ├── PLAN_*.md      │   ├── PLAN_*.md
│   └── learned/       │   └── learned/
└── AGENTS.md          └── AGENTS.md

❌ Knowledge locked per-repo
❌ Manual file editing
❌ No cross-project learning
❌ N copies of common patterns
```

**TO: Central Knowledge Bank + Conversational Workflow**
```
                ~/.aiknowsys/knowledge.db
                (Central Knowledge Bank)
                
   Conversational Workflow Example

**Old Way (File-Based):**
```
Human: Edits PLAN_auth.md manually
AI:    (Next session) Reads file to understand plan
Human: Edits file again
AI:    Re-reads file
→ Friction: File edits, stale reads, no conversation memory
```

**New Way (Conversational, Database-Backed):**
```
Human: "I want to add JWT auth to my API"
AI:    "Let me refine this with you. Requirements:
        - Token expiry: 24h or 7d?
        - Refresh tokens needed?
        - Password hashing: bcrypt?"
        
Human: "24h, yes refresh, use argon2 not bcrypt"
AI:    "Plan created: 8 steps, TDD approach.
        Stored in knowledge bank with repo link."
        
Human: "Show me step 3"
AI:    [Queries database, renders]
        "Step 3: Install argon2 package..."
        
Human: "Change step 3 - use scrypt instead"
AI:    [Updates database]
        "Done. Step 3 now uses scrypt. Want full plan?"
        
Human: "Export for team review"
AI:    [Renders from database → writes PLAN_auth.md]
        "Exported to docs/PLAN_auth.md"
```

**Key: Plan lives in database, evolves through dialogue, files are snapshots.**

---

## Requirements

### Functional Requirements

**Core Capabilities:**
1. **Cross-Repo Knowledge Access**
   - AI queries patterns learned in ANY project
   - "Show me auth implementations across all my repos"
   - Shared skill library (one TDD workflow, N projects)

2. **Conversational Plan Refinement**
   - Human refines plan through dialogue (no file editing)
   - AI tracks conversation history in database
   - Natural language updates: "Change step 3 to use X"
Design

### Database Location & Scope

**Primary Database:** `~/.aiknowsys/knowledge.db` (User-level)
- All repositories for one user
- Personal sessions, plans, patterns
- User-specific preferences

**Team Database (Optional):** `~/.aiknowsys/team-knowledge.db`
- Shared plans, patterns (read-write)
- Team conventions, standards
- Collaborative learning

**Repository Config:** `.aiknowsys.config` (per-repo)
```json
{
  "repoId": "my-api-v2",
  "repoName": "My API Project",
  "databasePath": "~/.aiknowsys/knowledge.db",
  "teamDatabasePath": "~/.aiknowsys/team-knowledge.db",
  "autoExport": {
    "enabled": true,
    "location": "docs/plans/",
    "triggers": ["plan-complete", "milestone"]
  }
}
```30+):**

#### Conversational Planning (8 tools)
1. `create_plan_conversation(goal, projectId?)` - Start plan dialogue
2. `refine_plan_step(planId, stepNum, changes)` - Update specific step via conversation
3. `add_plan_step(planId, position, content)` - Insert new step
4. `remove_plan_step(planId, stepNum)` - Remove step
5. `get_plan_conversation_log(planId)` - Show refinement history
6. `render_plan(planId, format='markdown')` - Generate plan document
7. `export_plan(planId, destination)` - Write to file (git-tracked)
8. `set_plan_status_conversational(planId, status, reason)` - Track why status changed

#### Agent Coordination (7 tools) 🆕
9. `request_review(topic, context, reviewType='code|architecture|security')` - Developer requests review
10. `get_pending_reviews(agentType?)` - Architect/Security/etc. checks for work
11. `claim_review(reviewId, agentId)` - Agent takes ownership
12. `complete_review(reviewId, findings, recommendations)` - Submit review results
13. `get_my_reviews(status?)` - Developer checks review status
14. `resolve_review(reviewId, outcome, notes)` - Mark review addressed
15. `get_review_history(contextId)` - Audit trail for plans/sessions

#### Cross-Repo Knowledge (7 tools)
16. `query_patterns_across_repos(tags?, category?)` - Search all projects
17. `get_pattern_usage_stats(patternId)` - How often/where used
18. `apply_pattern_to_project(patternId, projectId)` - Link pattern to new project
19. `compare_tech_stacks(projectId1, projectId2)` - Find similarities
20. `find_similar_plans(description)` - Semantic search across all plans
21. `get_project_timeline(projectId)` - Sessions + plans chronologically
22. `link_plan_to_projects(planId, projectIds[])` - Multi-repo plan

#### Human Query Interface (6 tools)
23. `search_knowledge_bank(query, scope?)` - Full-text search (FTS5)
24. `get_active_work_summary()` - Dashboard view (active plans, recent sessions)
25. `get_learning_history(days?, category?)` - Patterns discovered over time
26. `get_db_stats()` - Size, counts, health metrics
27. `export_knowledge_bank(format, filter?)` - Backup entire database
28. `validate_database_integrity()` - Check schema, constraints

#### Repository Management (4 tools)
29. `register_project(name, path, techStack)` - Add new repo to knowledge bank
30. `get_project_context(projectId)` - Tech stack, active plans, recent sessions
31. `update_project_config(projectId, config)` - Modify .aiknowsys.config
32. `list_all_projects()` - User's repository inventory

#### Admin/Maintenance (5 tools)
33. `rebuild_fts_index()` - Rebuild full-text search
34. `cleanup_ephemeral_data(olderThan?)` - Remove old reviews, abandoned sessions
35. `migrate_from_files(repoPath)` - Import legacy .aiknowsys/ structure
36. `backup_database(destination)` - Export to compressed archive
37. `restore_database(source, mode='merge|replace')` - Import backup

**Total:** 37 new tools + 20 existing = **57 MCP tools**
  project_id TEXT,
  title TEXT,
  goal TEXT,
  status TEXT, -- active, paused, complete, abandoned
  topics JSON,
  content TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_sessions_project ON sessions(project_id);

-- Plans (shareable across projects, conversational)
CREATE TABLE plans (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT, -- ACTIVE, PAUSED, COMPLETE, CANCELLED
  author TEXT,
  priority TEXT,
  type TEXT,
  goal TEXT,
  content TEXT, -- Full plan markdown
  conversation_log JSON, -- Track refinement dialogue
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
CREATE INDEX idx_plans_status ON plans(status);
CREATE INDEX idx_plans_author ON plans(author);

-- Plan-Project links (many-to-many)
CREATE TABLE plan_projects (
  plan_id TEXT,
  project_id TEXT,
  PRIMARY KEY (plan_id, project_id),
  FOREIGN KEY (plan_id) REFERENCES plans(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Patterns (learned, cross-repo reusable)
CREATE TABLE patterns (
  id INTEGER PRIMARY KEY,
  category TEXT,
  title TEXT NOT NULL,
  content TEXT,
  tags JSON,
  source_project_id TEXT,
  applied_count INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  FOREIGN KEY (source_project_id) REFERENCES projects(id)
);
CREATE INDEX idx_patterns_category ON patterns(category);
CREATE INDEX idx_patterns_tags ON patterns(tags); -- JSON index

-- Skills (versioned workflows)
CREATE TABLE skills (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  version TEXT,
  description TEXT,
  content TEXT,
  trigger_words JSON,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
CREATE INDEX idx_skills_name ON skills(name);

-- Agent Reviews (for Developer ↔ Architect workflow) 🆕
CREATE TABLE agent_reviews (
  id INTEGER PRIMARY KEY,
  review_type TEXT NOT NULL, -- 'code', 'architecture', 'security'
  topic TEXT NOT NULL,
  requested_by TEXT, -- developer username
  assigned_to TEXT, -- architect agent name
  status TEXT NOT NULL, -- 'PENDING', 'IN_PROGRESS', 'COMPLETE', 'RESOLVED'
  context_type TEXT, -- 'plan', 'session', 'commit'
  context_id TEXT, -- plan_id, session_id, or commit_hash
  request_data JSON, -- changes, files, description
  findings JSON, -- review results, issues found
  recommendations TEXT,
  outcome TEXT, -- how developer resolved issues
  created_at TIMESTAMP,
  claimed_at TIMESTAMP,
  completed_at TIMESTAMP,
  resolved_at TIMESTAMP,
  FOREIGN KEY (context_id) REFERENCES plans(id) -- flexible FK
);
CREATE INDEX idx_reviews_status ON agent_reviews(status);
CREATE INDEX idx_reviews_assigned ON agent_reviews(assigned_to, status);
CREATE INDEX idx_reviews_requester ON agent_reviews(requested_by, status);

-- Full-text search (SQLite FTS5)
CREATE VIRTUAL TABLE plans_fts USING fts5(
  plan_id, title, content, content=plans
);
CREATE VIRTUAL TABLE patterns_fts USING fts5(
  pattern_id, title, content, content=patterns
);
```

### Agent Coordination Workflow 🆕

**Problem Solved:** Custom agents (Developer, Architect, Security, etc.) need to coordinate work without manual file editing.

**Database-Backed Coordination Flow:**

```
Developer Agent completes feature implementation
├─ MCP: request_review({
│    topic: "JWT authentication implementation",
│    reviewType: "architecture",
│    context: { planId: "PLAN_auth", filesChanged: [...] },
│    requestedBy: "developer-agent"
│  })
├─ Database: Creates agent_reviews record (status: PENDING)
└─ Returns: reviewId: 123

Architect Agent (running in parallel or triggered)
├─ MCP: get_pending_reviews({ agentType: "architect" })
│   → Returns: [{ id: 123, topic: "JWT auth", ... }]
├─ MCP: claim_review({ reviewId: 123, agentId: "architect-agent" })
│   → Database: status → IN_PROGRESS, claimed_at → now
├─ Performs review (reads code, checks patterns)
├─ MCP: complete_review({
│    reviewId: 123,
│    findings: {
│      issues: [
│        "Token expiry should be configurable",
│        "Refresh token storage not secure"
│      ],
│      recommendations: "Use environment variable for expiry, store refresh tokens in httpOnly cookie"
│    }
│  })
└─ Database: status → COMPLETE, completed_at → now

Developer Agent (checks for completed reviews)
├─ MCP: get_my_reviews({ status: "COMPLETE" })
│   → Returns: [{ id: 123, findings: {...}, recommendations: "..." }]
├─ Addresses issues (makes code changes)
├─ MCP: resolve_review({
│    reviewId: 123,
│    outcome: "Fixed: Added TOKEN_EXPIRY env var, moved refresh tokens to httpOnly cookies",
│    notes: "Tests updated, 23/23 passing"
│  })
└─ Database: status → RESOLVED, resolved_at → now
```

**Benefits over file-based coordination:**

| File-Based (Old) | Database-Backed (New) |
|------------------|-----------------------|
| Manual PENDING_REVIEW.md creation | MCP: `request_review()` |
| Architect polls filesystem | MCP: `get_pending_reviews()` |
| Overwrite file with review | MCP: `complete_review()` (versioned) |
| Developer reads file | MCP: `get_my_reviews()` (structured) |
| Delete file manually | MCP: `resolve_review()` (auditable) |
| No history | Full audit trail in database |
| Race conditions on file edits | ACID transactions |

**Multiplayer Support:**

```
Multiple developers, multiple reviewers (same database):

Developer A → request_review(topic: "API refactor")
Developer B → request_review(topic: "UI redesign")
├─ Both reviews in queue (status: PENDING)

Architect 1 → claim_review(reviewId: 1) → CLAIMED
Architect 2 → claim_review(reviewId: 2) → CLAIMED
├─ No conflicts, database handles concurrency

Security Agent → get_pending_reviews({ reviewType: "security" })
├─ Sees only security-tagged reviews
└─ Can claim and review in parallel
```

**Custom Agent Types Supported:**

- **code** - Code review (syntax, best practices, tests)
- **architecture** - System design review (patterns, scalability)
- **security** - Security review (vulnerabilities, auth, input validation)
- **performance** - Performance analysis (bottlenecks, caching)
- **accessibility** - A11y compliance review
- **documentation** - Docs completeness, clarity

**Integration with Existing Workflow:**

```typescript
// Developer agent ends implementation
await mcp.update_session({
  section: "## Implementation",
  content: "JWT auth complete, requesting architecture review..."
});

const reviewId = await mcp.request_review({
  topic: "JWT Authentication",
  reviewType: "architecture",
  context: { planId: currentPlan, commit: "abc123" }
});

// Later: Architect review complete
const reviews = await mcp.get_my_reviews({ status: "COMPLETE" });
if (reviews.length > 0) {
  await mcp.update_session({
    section: "## Architect Review",
    content: `Issues found: ${reviews[0].findings.issues.length}\n${reviews[0].recommendations}`
  });
}
```

### Non-Functional Requirements
1. **Performance:** Query latency <10ms (indexed database)
2. **Reliability:** Database ACID-compliant, auto-backup
3. **Scalability:** 100+ projects, 10K+ sessions, no slowdown
4. **Migration:** Zero data loss from file-based repos
5. **Offline:** Read-only access to last export if DB unavailable

✅ Knowledge shared across projects
✅ Conversational plan refinement
✅ Cross-repo pattern learning
✅ Multi-user, multi-AI access
✅ Queryable (SQL, CLI, Web UI)
```

**Core Philosophy:**
- **Code lives in Git** (version-controlled source)
- **Knowledge lives in Database** (cross-repo, conversational)
- **Plans are conversations**, not documents
- **Files are exports**, not source of truth
- **Humans query database**, not read files

---

## The Real Problem: AI Context Overload (AI UX!)

**AIKnowSys = AI Knowledge System** - Optimizing for AI agent effectiveness, not just human convenience.

### Current Pain Point: Markdown Bloat Kills AI Performance

**What happens now:**
```
AI Agent starts session
├─ Read CODEBASE_ESSENTIALS.md    → 2000+ tokens
├─ Read AGENTS.md                  → 1500+ tokens  
├─ Read .aiknowsys/sessions/*.md   → 500+ tokens each
├─ Read .github/skills/*.md        → 400+ tokens each
└─ Total: 5000-10000 tokens just to bootstrap

Result:
❌ AI gets confused (context overload)
❌ Forgets protocol (too much to remember)
❌ Can't fit actual work in remaining context
❌ Slower responses (processing wall-of-text)
```

**Evidence from real usage:**
> "My coworkers generate markdown summaries to copy between projects so AI can understand patterns from Project A while working on Project B."

This is **silly workaround** proving the pain is real:
- Manual copying between projects
- AI reads duplicate context
- Breaks knowledge continuity
- Inefficient token usage

### Database + MCP Solution: 10-50x Token Reduction

**What will happen:**
```
AI Agent starts session
├─ MCP: get_critical_invariants()      → 50 tokens
├─ MCP: get_active_plans()             → 100 tokens
├─ MCP: get_recent_sessions({days:7})  → 200 tokens
└─ Total: 350 tokens for same information

Result:
✅ AI stays focused (minimal context)
✅ Remembers protocol (fewer distractions)
✅ Room to think about actual work
✅ Faster responses (structured data)
```

**Cross-repo knowledge query:**
```
AI in Project B: "Show JWT auth patterns from any project"
→ MCP: query_patterns_across_repos({tags: ['jwt', 'auth']})
→ Returns: Structured pattern data (200 tokens)
→ AI applies pattern directly

OLD WAY:
- Open Project A
- Ask AI to summarize (reads 5000 tokens of Project A context)
- Copy markdown manually
- Switch to Project B
- Paste markdown (AI reads it again)
→ Two context switches, manual work, 10000+ tokens wasted
```

### The Real Value Proposition

**For AI Agents:**
- 🎯 **Protocol adherence** - Small context = remembers workflow
- ⚡ **Token efficiency** - 10-50x reduction in bootstrap overhead
- 🧠 **Focus** - Gets exactly what's needed, nothing more
- 🔗 **Cross-repo awareness** - No manual markdown copying

**For Humans:**
- 💬 **Better AI responses** - Agents work correctly, don't get confused
- 🚀 **Faster development** - Less time waiting for AI to process context
- 🔄 **Knowledge reuse** - Patterns discovered once, available everywhere
- 👥 **Team alignment** - Shared knowledge bank, consistent conventions

**For Organizations (Architecture Enforcement):**
- 🏛️ **Governance as code** - Architecture rules enforced from day 1
- ✅ **Automatic compliance** - AI respects org invariants in every suggestion
- 🎓 **Onboarding acceleration** - New devs guided by AI that knows the rules
- 📊 **Consistent quality** - Same patterns across all projects

### Architecture Enforcement: The Hidden Killer Feature

**Traditional development workflow:**
```
Developer starts feature
├─ (Maybe reads architecture docs)
├─ Codes without checking rules
├─ Code review: "We don't do that here!"
├─ Refactor to match architecture
└─ Time wasted, frustration high
```

**AI-enforced architecture (Database-backed):**
```
AI Agent starts work
├─ MCP: get_critical_invariants({projectId})
│   → Loads project-specific rules
├─ MCP: get_org_invariants({orgId})  
│   → Loads organization-wide policies
│
Human: "Add user authentication endpoint"
├─ AI: Checks loaded invariants
│   ✓ "Use repository pattern" (project rule)
│   ✓ "No secrets in code" (org rule)
│   ✓ "TDD required" (org rule)
├─ Implements correctly from line 1
└─ No surprises in code review
```

**Organization-level invariants (team database):**
```sql
CREATE TABLE org_invariants (
  org_id TEXT,
  name TEXT,
  rule TEXT,
  applies_to TEXT,  -- "backend", "frontend", "all"
  severity TEXT,    -- "error", "warning", "info"
  explanation TEXT
);

-- Examples for Acme Corp:
INSERT INTO org_invariants VALUES
  ('acme-corp', 'Security', 
   'No secrets in code - use environment variables',
   'all', 'error',
   'See docs/security-guidelines.md for secret management'),
   
  ('acme-corp', 'Testing',
   'TDD required for new features - write tests first',
   'all', 'error',
   'Follow RED-GREEN-REFACTOR cycle'),
   
  ('acme-corp', 'Architecture',
   'Microservices communicate via events only',
   'backend', 'error',
   'No direct HTTP calls between services'),
   
  ('acme-corp', 'Code Style',
   'Prefer functional patterns over classes',
   'all', 'warning',
   'Use pure functions when possible');
```

**AI behavior across ALL organization projects:**
```
Project A (new microservice):
├─ AI loads org_invariants + project_invariants
├─ Every code suggestion respects both
├─ Human: "Call UserService directly"
├─ AI: "That violates 'Microservices communicate via events only'.
│       Let me implement with event publishing instead."
└─ Developer learns architecture through AI guidance

Project B (frontend rewrite):
├─ AI loads same org_invariants
├─ Enforces same security/testing rules
├─ But different project_invariants (React vs Vue patterns)
└─ Consistency across all projects, flexibility per-project
```

**Benefits over traditional governance:**

| Traditional | AI-Enforced (Database) |
|-------------|------------------------|
| Architecture docs (PDFs/wiki) | Structured invariants in database |
| Developers forget to check | AI loads rules automatically |
| Linters (easily bypassed) | AI respects rules in suggestions |
| Code review catches violations | Violations prevented upfront |
| Inconsistent enforcement | Every project, every time |
| Onboarding: "Read 100-page guide" | Onboarding: AI teaches by doing |

**Real-world scenario:**

```
New developer joins Acme Corp, assigned to Project C

Traditional:
├─ Read architecture guidelines (boring, overwhelming)
├─ Forget half the rules
├─ Code review feedback: "We don't do it that way"
├─ Frustration, slow onboarding
└─ Takes weeks to internalize patterns

AI-Enforced:
├─ AI: "I've loaded Acme Corp's architecture rules."
├─ Developer: "Add payment processing"
├─ AI: "Our architecture requires event-driven communication.
│       I'll implement with PaymentRequestedEvent."
├─ Developer: (sees example, learns by doing)
└─ Learns patterns naturally through AI guidance
```

**This is governance that actually works** - not documentation that gets ignored, but rules enforced in the workflow itself.

**This is AI UX Engineering** - Making AI agents effective by respecting context limits.

---

## Requirements

### Functional Requirements
1. **Context Query:** AI can get patterns, invariants, validation matrix without reading files
2. **Session Management:** AI can create/update sessions through MCP
3. **Plan Management:** AI can create/update plans through MCP
4. **Skills Discovery:** AI can find and retrieve skills through MCP
5. **Human Visibility:** Humans can view/edit context through AI interface
6. **Version Control:** Context changes are tracked (not lost)
7. **Backup/Recovery:** Context can be exported/imported
8. **Offline Fallback:** System works when MCP unavailable

### Non-Functional Requirements
1. **Performance:** Query latency <10ms (vs 100-1000ms for file reading)
2. **Reliability:** MCP server uptime >99.9%
3. **Transparency:** Humans understand what changed and why
4. **Migration:** Existing projects migrate without data loss

---

## Architecture Analysis

### Data Classification

| Data Type | Current | Proposed | Storage | Why |
|-----------|---------|----------|---------|-----|
| **Bootstrap** | AGENTS.md | AGENTS.md | File | Required before MCP loads |
| **Invariants** | ESSENTIALS.md | MCP (hardcoded) | Memory | Already migrated ✅ |
| **Validation** | ESSENTIALS.md | MCP (hardcoded) | Memory | Already migrated ✅ |
| **Tech Stack** | ESSENTIALS.md | MCP tool | SQLite/JSON | Changes rarely |
| **Patterns** | ESSENTIALS.md | MCP tool | SQLite/JSON | Changes occasionally |
| **Sessions** | .aiknowsys/sessions/*.md | MCP + SQLite | SQLite | Query/mutate via MCP |
| **Plans** | .aiknowsys/PLAN_*.md | MCP + SQLite | SQLite | Query/mutate via MCP |
| **Skills** | .github/skills/*/SKILL.md | MCP + Files | Hybrid | Git versionable |
| **Learned** | .aiknowsys/learned/*.md | MCP + SQLite | SQLite | Project-specific |
| **Changelog** | CODEBASE_CHANGELOG.md | Archive only | File | Historical reference |
| **Reviews** | .aiknowsys/reviews/*.md | MCP + ephemeral | Memory | Delete after addressed |

**Key Decision:** Use **SQLite** for structured data (sessions, plans, patterns) to enable:
- Fast queries (indexed)
- ACID transactions
- Schema validation
- SQL export for migration
- Version control via exports (JSON snapshots in git)

### MCP Tool Expansion Plan

**New MCP Tools Required (25+):**

#### Knowledge Management (5 tools)
1. `get_tech_stack()` - Technology snapshot
2. `get_patterns()` - Common patterns reference
3. `get_gotchas()` - Common gotchas/solutions
4. `add_learned_pattern(category, title, content)` - Add project-specific pattern
5. `query_learned_patterns(category?, keyword?)` - Search learned patterns

#### Enhanced Session/Plan Tools (8 tools)
6. `get_session_by_date(date)` - Get specific session (already planned)
7. `query_sessions(filter)` - Advanced filtering (already planned)
8. `query_plans(filter)` - Advanced filtering (already planned)
9. `get_plan_by_id(planId)` - Get full plan details
10. `create_review(topic, issues)` - Create architect review
11. `get_pending_reviews()` - Check for pending reviews
12. `resolve_review(reviewId, outcome)` - Mark review addressed
13. `export_context(format)` - Export to JSON/MD for git

#### Human Interface (7 tools)
14. `view_sessions(days)` - Format sessions for human reading
15. `view_plans(status)` - Format plans for human reading
16. `view_patterns()` - Format patterns for human reading
17. `edit_session(date, section, content)` - Human-initiated edit via AI
18. `edit_plan(planId, section, content)` - Human-initiated edit via AI
19. `add_pattern(type, content)` - Human-initiated pattern via AI
20. `search_all(query)` - Full-text search across all context

#### Admin/Maintenance (5 tools)
21. `rebuild_index()` - Rebuild SQLite indices
22. `backup_context(path)` - Export full context to file
23. `restore_context(path)` - Import context from backup
24. `validate_schema()` - Check data integrity
25. `get_context_stats()` - Size, counts, health metrics

**Total:** 25 new tools + 20 existing = **45 MCP tools**

---

## Implementation Phases

### Phase 0: Risk Analysis & Decision Point (2 hours)

**Goal:** Determine if MCP-only is actually better than hybrid

**Activities:**

1. **Evaluate Trade-offs** (30 min)
   - ✅ **PRO:** 10-100x faster queries
   - ✅ **PRO:** Token efficiency (50 vs 2000 tokens)
   - ✅ **PRO:** Structured data (no parsing)
   - ✅ **PRO:** Single source of truth
   - ❌ **CON:** Human loses direct file visibility
   - ❌ **CON:** Version control harder (SQLite vs plaintext)
   - ❌ **CON:** Backup/recovery more complex
   - ❌ **CON:** Dependency on MCP (single point of failure)
   - ❌ **CON:** Transparency reduced (black box vs readable files)

2. **Test Assumptions** (1 hour)
   - Does AI actually prefer MCP over files? (Review tool usage stats)
   - Can humans comfortably work through AI interface?
   - Is SQLite + git export acceptable for version control?
   - What happens when MCP server is down?

3. **Decision Matrix** (30 min)

| Criteria | File-Based | Hybrid (Current) | MCP-Only | Winner |
|----------|------------|------------------|----------|--------|
| **AI Query Speed** | 100-1000ms | 1-10ms (MCP) | <1ms | MCP-Only |
| **Token Efficiency** | 2000+ tokens | 50 tokens | 50 tokens | MCP-Only |
| **Human Visibility** | ✅ Direct | ✅ Direct | ❌ Indirect (via AI) | File/Hybrid |
| **Version Control** | ✅ Git-native | ✅ Git-native | ⚠️ Exports only | File/Hybrid |
| **Reliability** | ✅ No deps | ⚠️ MCP optional | ❌ MCP required | File-Based |
| **Transparency** | ✅ Readable files | ✅ Readable files | ❌ Black box | File/Hybrid |
| **Maintenance** | ❌ Dual sources | ⚠️ Dual sources | ✅ Single source | MCP-Only |

**Breaking Point Question:**
> "If MCP server breaks, can humans still work effectively?"

**Answer determines strategy:**
- **YES** → Hybrid (MCP + fallback files)
- **NO** → Need better offline fallback

---

### Phase 1: Proof of Concept (1 week)

**Goal:** Build SQLite-backed MCP tools, test with real workflow

**Step 1.1: Setup SQLite Schema** (4 hours)
- **Action:** Create `mcp-server/src/storage/schema.sql`
- **Tables:**
  - `sessions` (date, title, goal, status, topics, content, created_at)
  - `plans` (id, title, status, author, priority, type, content, created_at)
  - `patterns` (id, category, title, content, tags, created_at)
  - `reviews` (id, topic, status, issues, created_at, resolved_at)
- **Indices:** date, status, topics (JSON array), tags
- **Migrations:** Track schema versions

**Step 1.2: Build Storage Layer** (6 hours)
- **Action:** Create `mcp-server/src/storage/db.ts`
- **Functions:**
  - `initDatabase(dbPath)` - Initialize SQLite
  - `querySessionsByDateRange(start, end)` - Date filtering
  - `queryPlansByStatus(status)` - Status filtering
  - `addLearnedPattern(data)` - Insert pattern
  - `searchContext(query)` - Full-text search (SQLite FTS5)
- **Tests:** 100% coverage on storage layer

**Step 1.3: Build 5 Core MCP Tools** (8 hours)
- **Tools:**
  1. `mcp_aiknowsys_get_tech_stack()`
  2. `mcp_aiknowsys_get_patterns()`
  3. `mcp_aiknowsys_add_learned_pattern()`
  4. `mcp_aiknowsys_export_context(format)`
  5. `mcp_aiknowsys_restore_context(path)`
- **Why these 5:** Cover read, write, backup, restore
- **Tests:** Integration tests for each tool

**Step 1.4: Migration Script** (4 hours)
- **Action:** `scripts/migrate-to-sqlite.ts`
- **Reads:**
  - .aiknowsys/sessions/*.md → Parse YAML + markdown → Insert into SQLite
  - .aiknowsys/PLAN_*.md → Parse YAML + markdown → Insert into SQLite
  - .aiknowsys/learned/*.md → Parse → Insert into SQLite
- **Preserves:** All metadata, dates, topics, file references
- **Validates:** No data loss (diff original vs exported)
- **Tests:** Dry-run mode, rollback capability

**Step 1.5: Real-World Testing** (1 day)
- **Scenario 1:** AI creates session via MCP → Human views via AI query
- **Scenario 2:** AI adds learned pattern → Searchable via MCP
- **Scenario 3:** Export context → Commit to git → Restore on another machine
- **Scenario 4:** MCP server crashes → Graceful degradation?
- **Metrics:**
  - Query latency (<10ms?)
  - Human satisfaction (can they work comfortably?)
  - Reliability (any data loss?)

**Decision Gate:** Does POC prove MCP-only is viable?
- **YES** → Proceed to Phase 2
- **NO** → Stick with hybrid, improve MCP as supplement

---

### Phase 2: Full Migration (2 weeks) [CONDITIONAL]

**Only proceed if Phase 1 succeeds**

**Step 2.1: Expand MCP Tool Coverage** (1 week)
- Build remaining 20 tools from expansion plan
- 100% test coverage
- Performance benchmarks (<10ms all tools)

**Step 2.2: Human Interface Layer** (4 days)
- **Option A:** CLI for humans (`aiknowsys view sessions`, `aiknowsys edit plan`)
- **Option B:** Web UI (local server, browse context)
- **Option C:** AI-only (humans talk to AI to view/edit)
- **Decision:** User preference (ask stakeholders)

**Step 2.3: Migration Guide** (2 days)
- **Document:** How to migrate existing projects
- **Script:** Automated migration tool
- **Validation:** Diff checker (original files vs SQLite export)
- **Rollback:** Restore from files if issues

**Step 2.4: Update Documentation** (2 days)
- **AGENTS.md:** Remove file-reading instructions, add MCP-only workflow
- **CODEBASE_ESSENTIALS.md:** Archive or inline into AGENTS.md
- **README.md:** Update architecture description
- **mcp-server/README.md:** Document SQLite schema, tools

**Step 2.5: Deprecation Path** (1 day)
- **v0.11.0:** Hybrid (files + MCP, both work)
- **v0.12.0:** MCP-preferred (files deprecated, warnings)
- **v0.13.0:** MCP-only (files removed, migration required)
- **Migration window:** 2 releases, ~3 months

---

### Phase 3: Rollout & Support (1 month) [CONDITIONAL]

**Step 3.1: Beta Testing** (2 weeks)
- Release v0.11.0 (hybrid mode) to early adopters
- Collect feedback on human interface
- Monitor MCP reliability metrics
- Fix critical bugs

**SRevised Risk Analysis (With Correct Understanding)

**Previous concerns (based on wrong assumptions):**
- ❌ "Human loses file visibility" → **FALSE:** Humans query database via SQL/CLI/Web UI
- ❌ "Git version control lost" → **FALSE:** Code in git, knowledge in database (separate concerns)
- ❌ "Blackbox database" → **FALSE:** SQLite queryable, schema documented, export tools
- ❌ "Single point of failure" → **MITIGATED:** Database backups, read-only exports

**Actual risks (with mitigation):**

### Risk 1: Database Corruption (MEDIUM)
- **Description:** SQLite file corrupted, knowledge lost
- **Likelihood:** LOW (5%) - SQLite is stable
- **Impact:** HIGH - Historical knowledge gone
- **Mitigation:**
  - Auto-backup every session (git-tracked JSON exports)
  - ACID transactions (SQLite journaling mode)
  - Validation tool: `aiknowsys validate-db`
  - Recovery: Import from last backup

### Risk 2: Multi-User Conflicts (MEDIUM)
- **Description:** Two users modify same plan simultaneously
- **Likelihood:** MEDIUM (30%) - Team collaboration
- **Impact:** MEDIUM - Plan conflicts, lost edits
- **Mitigation:**
  - Optimistic locking (version numbers)
  - Conversation log (tracks all changes)
  - Conflict detection UI
  - Manual merge tool

### Risk 3: Cross-Repo Query Performance (LOW)
- **Description:** 100+ projects, database slows down
- **Likelihood:** LOW (10%) - SQLite handles millions of rows
- **Impact:** MEDIUM - Slower queries
- **Mitigation:**
  - Proper indexing (date, status, tags)
  - FTS5 full-text search (optimized)
  - Lazy loading (paginated queries)
  - Archive old projects (readonly archive DB)

### Risk 4: Migration Complexity (HIGH)
- **Description:** Existing file-based repos hard to migrate
- **Likelihood:** HIGH (80%) - Many repos to migrate
- **Impact:** MEDIUM - Time-consuming, manual fixes
- **Mitigation:**
  - Automated migration tool: `aiknowsys migrate-repo`
  - Dry-run validation (diff before/after)
  - Coexistence period (files + database both work)
  - Migration guide with examples

### Risk 5: Learning Curve (MEDIUM)
- **Description:** Users resist conversational workflow
- **Likelihood:** MEDIUM (40%) - Habit change
- **Impact:** MEDIUM - Slow adoption
- **Mitigation:**
  - Excellent documentation (examples, videos)
  - Familiar CLI: `aiknowsys query "show plans"`
  - Optional file export (can still edit markdown)
  - Gradual rollout (opt-in beta)
- **Impact:** MEDIUM (collaboration harder)
- **Mitigation:**
  - Auto-export to JSON after each operation
  - Commit JSON snapshots to git (.aiknowsys/exports/*.json)
  - **Review:** Diff JSON, not SQLite
  - **Merge:** Conflict resolution via manual import

#### Risk 5: Transparency Lost (MEDIUM)
- **Description:** Developers don't trust "black box" MCP
- **Likelihood:** MEDIUM (40%)
- **Impact:** MEDIUM (adoption resistance)
- **Mitigation:**
  - Readable exports (JSON with comments)
  - Audit log (who changed what, when)
  - **Documentation:** Clear schema, queryable
  - **Trust:** Show performance benefits (10-100x faster)

---

## Alternative: Hybrid Architecture (RECOMMENDED)

**Instead of MCP-only, keep hybrid:**

### Hybrid Model: "Best of Both Worlds"

**Files (Source of Truth):**
- AGENTS.md (bootstrap)
- Session files (.aiknowsys/sessions/*.md)
- Plan files (.aiknowsys/plans/*.md)
- Skill files (.github/skills/*/SKILL.md)
- Git-native version control
- Human-readable, directly editable

**MCP (Performance Layer):**
- Reads files, caches in memory (or builds SQLite index)
- Provides 10-100x faster queries
- Structured data for AI consumption
- **Auto-syncs** when files change (filesystem watch)

**Benefits:**
- ✅ AI gets speed (MCP)
- ✅ Humans get visibility (files)
- ✅ Git version control (plaintext)
- ✅ No data loss risk (files are authoritative)
- ✅ Graceful degradation (files work without MCP)

**Downsides:**
- ⚠️ Dual maintenance (MCP must sync files)
- ⚠️ Complexity (index rebuild logic)
- ⚠️ Potential sync bugs (file changed but index stale)

**Mitigation:**
- Filesystem watch (chokidar) rebuilds index automatically
- Index includes file mtime (staleness detection)
- Manual `rebuild_index()` tool for recovery

---

## Success Criteria

**Phase 0 (Decision):**
- [ ] Trade-off analysis complete
- [ ] Decision matrix filled out
- [ ] Stakeholder consensus (human interface acceptable?)

**Phase 1 (POC):**
- [ ] SQLite schema designed and validated
- [ ] 5 core MCP tools working (<10ms latency)
- [ ] Migration script tested (no data loss)
- [ ] Real-world testing passed (humans can work via AI)
- [ ] Decision: Proceed or pivot to hybrid

**Phase 2 (Full Migration):**
- [ ] 45 MCP tools operational
- [ ] Human interface acceptable (CLI/web/AI)
- [ ] Migration guide published
- [ ] All tests passing (300+ tests)
- [ ] Performance benchmarks met (<10ms queries)

**Phase 3 (Rollout):**
- [ ] Beta testing complete (no critical bugs)
- [ ] v0.12.0 released (MCP-preferred)
- [ ] Users migrated successfully (100% data retention)
- [ ] v0.13.0 released (MCP-only) or hybrid maintained

---

## Decision Required

**Three options:**

### Option A: Full MCP-Only (High Risk, High Reward)
- Remove all .md files except AGENTS.md
- SQLite-backed MCP server
- Humans interact via AI or custom UI
- **Timeline:** 3 weeks (POC → migration → release)
- **Risk:** Human abandonment, transparency loss

### Option B: Hybrid (Recommended, Balanced)
- Keep files as source of truth
- MCP indexes files for fast queries
- Auto-sync on file changes
- **Timeline:** 1 week (build index layer, filesystem watch)
- **Risk:** Sync bugs, dual maintenance

### Option C: Status Quo (Low Risk, Missed Opportunity)
- Keep current file + MCP supplement approach
- Improve MCP tool coverage incrementally
- No architectural change
- **Timeline:** Ongoing
- **Risk:** Slower queries, token waste continues

---

## Recommendation

**Start with Option B (Hybrid)**

**Rationale:**
1. **Preserves human workflow** - Files remain readable/editable
2. Recommendation: Full Cross-Repo Knowledge Bank

**This is the right architecture.** Previous "hybrid" recommendation was based on misunderstanding.

**Why this is better than old file-based approach:**

| Feature | File-Based (Old) | Cross-Repo DB (New) |
|---------|------------------|---------------------|
| **Knowledge Reuse** | Copy-paste patterns | Query across all projects |
| **Plan Creation** | Edit markdown | Conversational refinement |
| **Human Access** | Read files | SQL/CLI/Web UI queries |
| **Multi-Repo** | N separate contexts | Single knowledge graph |
| **Collaboration** | Git merge conflicts | Database transactions |
| **Speed** | 100-1000ms (file read) | <10ms (indexed query) |
| **Transparency** | Files visible | Database queryable |
| **Version Control** | All in git | Code in git, knowledge in DB |

**Key Insight:** Separating code (git) from knowledge (database) is correct separation of concerns.

---

## Implementation Roadmap

### Phase 0: Foundation (1 week)

**Step 0.1: Database Schema & Tooling** (3 days)
- Create `~/.aiknowsys/schema.sql` (tables from design above)
- Build `lib/storage/database.ts` (SQLite wrapper)
- Migration helper: `lib/storage/migrate-from-files.ts`
- **Tests:** Schema creation, CRUD operations (100% coverage)

**Step 0.2: Core MCP Tools** (2 days)
- `create_plan_conversation()` - Start conversational plan
- `refine_plan_step()` - Update via dialogue
- `render_plan()` - Export to markdown
- `query_patterns_across_repos()` - Cross-repo search
- `register_project()` - Add repo to knowledge bank
- **Tests:** Integration tests for each tool

**Step 0.3: Human Query Interface** (2 days)
- CLI: `aiknowsys query "active plans"`
- CLI: `aiknowsys db "SELECT * FROM plans"`
- Web UI POC: `aiknowsys serve` (simple read-only viewer)
- **Tests:** CLI commands, web UI smoke test

### Phase 1: Migration & Coexistence (2 weeks)

**Step 1.1: Migration Tooling** (1 week)
- `aiknowsys migrate-repo <path>` - Import legacy files
- Parse .aiknowsys/sessions/*.md → Insert into sessions table
- Parse PLAN_*.md → Insert into plans table
- Parse .aiknowsys/learned/*.md → Insert into patterns table
- Validation: Diff original vs exported (zero data loss)
- **Tests:** Migration roundtrip (import → export → diff)

**Step 1.2: Coexistence Mode** (3 days)
- Support BOTH file-based AND database workflows
- Auto-detect: If `~/.aiknowsys/knowledge.db` exists, use database
- Fallback: If DB missing, use files (graceful degradation)
- Migration banner: "Upgrade to cross-repo knowledge bank?"

**Step 1.3: Real-World Testing** (4 days)
- Migrate AIKnowSys repository itself (dogfooding)
- Test conversational plan workflow
- Test cross-repo queries (if multiple projects)
- Performance benchmarks (<10ms queries)
- User acceptance testing

### Phase 2: Full Rollout (1 month)

**Step 2.1: Expand MCP Tool Coverage** (2 weeks)
- Build remaining 30 tools from expansion plan
- Conversational plan tools (8 tools)
- Cross-repo knowledge (7 tools)
- Human query interface (6 tools)
- Repository management (4 tools)
- Admin/maintenance (5 tools)
- **Tests:** All tools >80% coverage

**Step 2.2: Web UI (Optional)** (1 week)
- Dashboard: Active plans, recent sessions, project overview
- Plan editor: Refine steps visually
- Pattern library: Browse, search, apply
- Database explorer: SQL query interface
- Export center: Generate markdown files

**Step 2.3: Documentation & Migration Guide** (1 week)
- **AGENTS.md:** Update for database-first workflow
- **docs/migration-guide.md:** Step-by-step repo migration
- **docs/query-examples.md:** SQL + CLI query cookbook
- **docs/conversational-planning.md:** How to refine plans via dialogue
- **mcp-server/README.md:** Database schema documentation

### Phase 3: Deprecation & Cleanup (2 weeks)

**Step 3.1: Deprecate File-Based Mode** (1 week)
- v0.11.0: Database mode default, files still work
- v0.12.0: Files deprecated (warnings), database required
- v0.13.0: File-based code removed

**Step 3.2: Template Updates** (3 days)
- Update templates/ to use .aiknowsys.config
- Remove CODEBASE_ESSENTIALS.md (knowledge in DB)
- Keep AGENTS.md (bootstrap only)
- Migration script for user projects

**Step 3.3: Team Collaboration Features** (4 days)
- Team database: `~/.aiknowsys/team-knowledge.db`
- Access control: Read-only vs read-write
- Sync protocol: Push/pull patterns to team DB
- Conflict resolution UI

---

## Success Criteria

**Phase 0 (Foundation):**
- [ ] Database schema created, validated
- [ ] 5 core MCP tools operational (<10ms)
- [ ] CLI query interface working
- [ ] Web UI POC serves dashboard

**Phase 1 (Migration):**
- [ ] Migration tool tested (zero data loss)
- [ ] AIKnowSys repo migrated successfully
- [ ] Conversational plan workflow validated
- [ ] Coexistence mode stable

**Phase 2 (Full Rollout):**
- [ ] 50 MCP tools operational
- [ ] Web UI feature-complete (optional)
- [ ] Documentation comprehensive
- [ ] 3+ repos using knowledge bank

**Phase 3 (Deprecation):**
- [ ] File-based code removed
- [ ] All templates updated
- [ ] Team collaboration tested
- [ ] Migration guide proven with real users

---

## Questions Answered

1. **✅ MCP as bridge:** Database lives outside repos, MCP server connects repos to `~/.aiknowsys/knowledge.db`
2. **✅ Repository ID:** Use git remote URL (stable, unique identifier)
3. **✅ Plan metadata:** Support external tracking (Jira IDs, GitHub issue links) via JSON metadata field
4. **✅ Human interface:** Defer web UI, generic tools sufficient (SQL, CLI query)
5. **✅ Salvage existing code:** See below

---

## Critical Issues Discovered

### Issue 1: Hardcoded Invariants (Project-Specific Configuration)

**Problem:**
```typescript
// mcp-server/src/tools/context.ts
export async function getCriticalInvariants() {
  const invariants = [
    { number: 6, name: 'Backwards Compatibility',
      rule: 'Bash scripts in scripts/ must remain functional' }
    // ❌ Hardcoded - assumes all projects have bash scripts!
  ];
}
```

**Current approach:**
- Invariants hardcoded in MCP server
- Same rules for JavaScript, Python, Rust, Go projects
- Includes project-specific assumptions (bash scripts, ES modules, etc.)

**Database-first solution:**
```sql
-- Per-project invariants
CREATE TABLE project_invariants (
  id INTEGER PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  rule TEXT NOT NULL,
  details JSON,
  order_num INTEGER,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Organization-wide invariants (team/company governance)
CREATE TABLE org_invariants (
  id INTEGER PRIMARY KEY,
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  rule TEXT NOT NULL,
  applies_to TEXT, -- "backend", "frontend", "all"
  severity TEXT,   -- "error", "warning", "info"
  explanation TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_org_invariants ON org_invariants(org_id);

-- Example data:
-- JavaScript project: "ES Modules Only", "path.resolve() required"
-- Python project: "Type hints required", "pytest for tests"
-- Bash project: "ShellCheck passing", "POSIX compliance"

-- Organization invariants (Acme Corp example):
-- "No secrets in code - use environment variables" (error, all)
-- "TDD required for new features" (error, all)
-- "Microservices communicate via events only" (error, backend)
-- "Prefer functional patterns over classes" (warning, all)
```

**Benefits:**
- Each project defines its own invariants
- Organization-wide rules enforced across all projects
- Reusable patterns across similar projects
- No hardcoded assumptions
- AI queries: "What are the invariants for THIS project?"
- AI queries: "What are the org-wide rules I must follow?"

**Impact on plan:**
- Add `project_invariants` table to schema ✅ (already added)
- Add `org_invariants` table to schema ✅ (already added)
- Update `get_critical_invariants()` to accept `projectId` parameter
- Add `get_org_invariants()` tool with `orgId` parameter
- Migration: Convert hardcoded invariants → default template during init

### Issue 2: Onboarding/Init Workflow (Needs Separate Plan)

**Current approach (CLI-based, file-heavy):**
```bash
npm install -g aiknowsys
aiknowsys init                    # Copies templates, creates files
# Creates: AGENTS.md, CODEBASE_ESSENTIALS.md, .aiknowsys/, etc.
```

**Problems:**
- Prescriptive (assumes project structure)
- File-based (conflicts with database-first vision)
- No conversation, just template copying
- Half-baked: Doesn't integrate with MCP

**Database-first vision (Conversational onboarding):**
```
1. Install package + MCP setup (one-time):
   npm install -g aiknowsys
   aiknowsys setup-mcp           # Configures VS Code MCP server

2. Initialize repo (conversational via AI):
   Human: "Initialize this repo for AIKnowSys"
   
   AI (via MCP): "I'll help set up this project. A few questions:
                  - Tech stack? (JavaScript/Python/Rust/Go/Other)
                  - Testing framework? (Vitest/Jest/pytest/etc.)
                  - Team project or personal?
                  - Existing patterns to preserve?"
   
   Human: "JavaScript, Vitest, team project, no existing patterns"
   
   AI: [Stores in database]
       - Creates .aiknowsys.config (repo link to database)
       - Creates minimal AGENTS.md (MCP bootstrap only)
       - Registers project in ~/.aiknowsys/knowledge.db
       - Sets up appropriate invariants for JavaScript
       
       "Setup complete. Ready to work."
```

**Benefits:**
- Conversational (AI asks clarifying questions)
- Minimal files (just .aiknowsys.config + AGENTS.md)
- Database-backed (config stored centrally)
- Reuses patterns from similar projects
- MCP-native (no separate CLI init process)

**Requires separate plan:**
- Design conversational init flow
- MCP tool: `initialize_project()`
- Prompt templates for different tech stacks
- Migration path from current `aiknowsys init`

**Dependency:**
- **AFTER** database architecture is implemented
- **SEPARATE PLAN:** "Conversational Onboarding Workflow"

**Action:** Create PLAN_conversational_onboarding.md after this plan complete

---

## What We Can Salvage (GREAT NEWS!)

**Current architecture already prepared for this!**

### ✅ Keep 100% (No Changes)

**lib/core/* (9 modules, ~800 LOC, 72 tests):**
- `create-session.ts`, `update-session.ts`
- `create-plan.ts`, `update-plan.ts`, `sync-plans.ts`
- `query-plans.ts`, `query-sessions.ts`, `search-context.ts`
- **Why:** Already pure business logic, storage-agnostic
- **Benefit:** All tests pass unchanged!

**lib/context/storage-adapter.ts (interface):**
```typescript
export class StorageAdapter {
  abstract queryPlans(filters: PlanFilters): Promise<...>;
  abstract querySessions(filters: SessionFilters): Promise<...>;
  abstract createPlan(data: ...): Promise<...>;
  // etc.
}
```
- **Why:** Abstract interface, database-agnostic
- **Benefit:** Polymorphic storage (JSON or SQLite)

**lib/context/types.ts (metadata types):**
- `PlanMetadata`, `SessionMetadata`, `SearchResult`
- `PlanFilters`, `SessionFilters`
- **Why:** Data structures independent of storage
- **Benefit:** API stays stable

**lib/commands/* (CLI wrappers):**
- Already call `lib/core/*` functions
- **Why:** Independent of storage implementation
- **Benefit:** CLI continues working

**mcp-server/src/tools/* (20 MCP tools):**
- Already call `lib/core/*` directly
- **Why:** Uses storage abstraction
- **Benefit:** MCP tools unaffected by storage change

**Test infrastructure (72 tests):**
- Vitest setup, test utilities
- **Why:** Test same business logic, different backend
- **Benefit:** Regression protection

**Total salvaged: ~85% of codebase!**

### 🔄 Adapt (Minor Changes)

**lib/context/index.ts (createStorage factory):**
```typescript
// CURRENT (line 53):
case 'sqlite':
  // TODO: Implement SQLite storage adapter in Phase 2
  throw new Error('Unsupported storage adapter: sqlite...');

// NEW:
case 'sqlite':
  storage = new SqliteStorage();
  break;
```
- **Change:** Remove TODO, implement SqliteStorage
- **Effort:** 1-2 hours

**lib/context/json-storage.ts → sqlite-storage.ts:**
- **Current:** 200 LOC reading/writing JSON files
- **New:** 200 LOC reading/writing SQLite database
- **Effort:** 1-2 days (implement StorageAdapter interface)
- **Benefit:** Same interface, different backend

### ✨ Add New (Database-Specific)

**lib/context/database-locator.ts:**
```typescript
export function getDatabasePath(): string {
  // Check .aiknowsys.config
  // Fall back to ~/.aiknowsys/knowledge.db
}

export function getRepoId(): string {
  // Read git remote URL
  // Or read from .aiknowsys.config
}
```
- **Effort:** 2-3 hours

**lib/context/schema.sql:**
- Database schema from plan
- **Effort:** Already designed!

### 🗑️ Remove (File-Specific Code)

**lib/utils/file-parser.ts (YAML frontmatter):**
- Only needed for markdown files
- Database has structured columns
- **Effort:** Delete when migration complete

**lib/utils/markdown-*.ts:**
- Markdown generation utils
- Only needed for exports
- **Effort:** Keep for on-demand rendering

---

## Revised Implementation (Leveraging Existing Code)

### Phase 0: Database Backend (3 days) ⚡️

**Day 1: SQLite Storage Adapter**
- Create `lib/context/sqlite-storage.ts`
- Implement `StorageAdapter` interface (queryPlans, querySessions, etc.)
- Database initialization logic
- **Tests:** Adapt existing JSON storage tests to SQLite

**Day 2: Database Location & Config**
- Create `lib/context/database-locator.ts`
- Support `.aiknowsys.config` (repo-id, database path)
- Fall back to `~/.aiknowsys/knowledge.db`
- **Tests:** Config reading, path resolution

**Day 3: Integration & Validation**
- Update `lib/context/index.ts` createStorage() factory
- Run full test suite against SQLite backend
- Performance benchmarks (<10ms queries)
- **Result:** All 72 tests passing with SQLite!

**Effort: 3 days vs 1 week (original estimate)**
**Why faster:** Architecture already prepared, just implement one class!

### Phase 1: MCP Tool Enhancement (1 week)

**No changes to MCP tools - they already work!**
- MCP tools → lib/core/* → storage abstraction → SQLite ✅
- Just need to build new conversational tools (8 tools)

**New conversational tools:**
1. `refine_plan_step(planId, stepNum, changes)` 
2. `add_plan_step(planId, position, content)`
3. `remove_plan_step(planId, stepNum)`
4. `get_plan_conversation_log(planId)`

**Effort: 1 week for new tools, 0 work for existing tools**

### Phase 2: Migration & Coexistence (1 week)

Same as before, but uses existing `lib/core/*` functions.

### Phase 3: Cross-Repo Features (2 weeks)

Build on solid foundation of working database backend.

---

## Updated Timeline

| Phase | Original Estimate | New Estimate | Savings |
|-------|------------------|--------------|---------|
| Phase 0: Foundation | 1 week | **3 days** | 4 days |
| Phase 1: MCP Tools | 2 weeks | **1 week** | 1 week |
| Phase 2: Migration | 2 weeks | **1 week** | 1 week |
| Phase 3: Cross-Repo | 1 month | **2 weeks** | 2 weeks |
| **TOTAL** | **6-8 weeks** | **4-5 weeks** | **2-3 weeks** |

**Why faster:** 85% of code already written and tested!

---

---

## Dependencies & Blockers

**⚠️ BLOCKER: Complete Phase 2 MCP Refactoring First**

**Current work in progress:**
- Phase 2 Batch 1: update-session extraction ✅ COMPLETE
- Phase 2 Batch 2: Query commands extraction ⏳ IN PROGRESS (7 tools remaining)

**DO NOT START THIS PLAN UNTIL:**
- [ ] Phase 2 Batch 2 complete (query-plans, query-sessions, search-context extracted to lib/core)
- [ ] All MCP tools using direct core imports (no CLI subprocess spawning)
- [ ] All 284+ tests passing
- [ ] Phase 2 work committed and validated

**Why this matters:**
- Architecture cleanup must be finished before adding database layer
- Half-finished refactoring + new database work = chaos
- Current work already prepared the codebase for this migration
- Finish what we started, THEN move forward

**Estimated completion:** 1-2 days for Phase 2 Batch 2

---

## Related Future Work

**After this plan completes, create:**

1. **PLAN_conversational_onboarding.md**
   - Conversational repo initialization via MCP
   - Replace file-based `aiknowsys init` with AI dialogue
   - Prompt-based setup (tech stack detection, pattern selection)
   - Minimal file generation (.aiknowsys.config + AGENTS.md only)

2. **PLAN_per_project_invariants.md**
   - Move hardcoded invariants to database
   - Per-project invariant configuration
   - Template library (JavaScript defaults, Python defaults, etc.)
   - AI-suggested invariants based on detected tech stack

---

**Next (AFTER Phase 2 complete):** Build SqliteStorage adapter (3 days, then full system works!)
   - Design filesystem watch + index sync
   - Build 5 core index tools
   - Test with real workflow
4. **If Option C (Status Quo):**
   - Continue incremental MCP tool additions
   - No major architectural change

**My recommendation: Option B (Hybrid) as starting point, revisit in 3 months.**

---

**Notes for Developer:**
- This is a **major architectural change** - requires careful planning
- **Hybrid model** balances speed (MCP) with visibility (files)
- **MCP-only** is theoretically cleaner but higher risk
- **Human interface** is the critical unknown - needs user testing
- **Version control** with SQLite is solvable (JSON exports) but adds complexity
- **Recommend:** Build hybrid POC first, gather data, then decide
