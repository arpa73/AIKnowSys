# Implementation Plan: Milestone-Focused Changelog Evolution

**Status:** 📋 PLANNED (Waiting for Phase B Mini completion)  
**Created:** 2026-02-07 14:00  
**Blocked By:** PLAN_context_query_completion.md (Phase B Mini)  
**Reason:** Needs mutation commands (`create-session`) to reference in documentation  
**Goal:** Evolve CODEBASE_CHANGELOG.md from session-by-session archive to queryable milestone summary

---

## Overview

The indexed query system (`query-sessions`, `search-context`) makes session-level changelog entries redundant. This plan migrates the changelog to milestone-focused summaries while making session files the single source of truth for daily development history.

**Current Problem:**
- CODEBASE_CHANGELOG.md is 5,743 lines (write-only archive)
- AI agents use CLI queries instead of reading changelog
- Maintaining TWO systems: session files (queryable) + changelog (append-only)
- Nobody reads 5,743 lines sequentially

**Solution:**
- Archive historical session-level entries (2025 and earlier)
- Keep only milestone summaries (releases, architectural changes)
- Session files + context-index.json become single source for daily history
- Queries replace manual reading: `query-sessions --topic "X"`

---

## Requirements

### Functional Requirements
- Historical entries preserved (archived, not deleted)
- Session query system proven working (already implemented in v0.10.0)
- Milestone format guide for future entries
- All template references updated
- No loss of valuable historical context

### Non-Functional Requirements
- Migration must be reversible (backups created)
- Documentation changes preserve clarity
- Templates remain consistent with workflow
- No breaking changes to existing commands

---

## Architecture Changes

### File Structure Evolution

**Before (v0.10.0):**
```
CODEBASE_CHANGELOG.md (5,743 lines)
├── Session entries (lines 1-5500) ← ARCHIVE THIS
└── Milestone summaries (lines 5501-5743) ← KEEP THIS

.aiknowsys/sessions/ (gitignored)
└── YYYY-MM-DD-session.md ← Currently secondary
```

**After (v0.11.0):**
```
CODEBASE_CHANGELOG.md (300-500 lines)
└── Milestone summaries only ← Primary historical record

docs/archived/
└── changelog-2025-and-earlier.md ← Historical archive

.aiknowsys/sessions/ (gitignored, indexed)
└── YYYY-MM-DD-session.md ← Primary development record

.aiknowsys/context-index.json (committed)
└── Sessions queryable via: query-sessions, search-context
```

### Workflow Changes

| Activity | Old (v0.10.0) | New (v0.11.0) |
|----------|---------------|---------------|
| **Daily development notes** | Session file → Changelog | Session file only |
| **Find recent work** | Read changelog (manual) | `query-sessions --days 7` |
| **Search for topic** | grep changelog (slow) | `search-context "topic"` |
| **Milestone documentation** | Changelog entry (buried) | Changelog entry (visible) |
| **Release documentation** | RELEASE_NOTES_v*.md | Same (no change) |

---

## Implementation Steps

### Phase 1: Archive Historical Changelog (1.5 hours)

**Goal:** Preserve old entries while cleaning main changelog

#### Step 1.1: Create Archive Script (30 min)
**File:** `scripts/archive-changelog.js`

**Action:** Create script to:
- Read CODEBASE_CHANGELOG.md (lines 1-N)
- Identify milestone vs session entries (milestone = version header)
- Extract session entries from 2025 and earlier
- Write to `docs/archived/changelog-2025-and-earlier.md`
- Create backup: `CODEBASE_CHANGELOG.md.pre-v0.11.backup`

**Why:** Automated archiving ensures consistency and reversibility

**Dependencies:** None

**Risk:** Low - Creates new files, doesn't modify originals yet

**Algorithm:**
```javascript
// Detect milestone entries:
// - Contains version number (v0.X.0, v1.X.0)
// - Or contains "## Milestone:", "## Release:", "## Major Change:"
// - All other "## Session:" entries = archive candidates

// Archive criteria:
// - Sessions dated 2025-12-31 or earlier
// - Keep all 2026+ sessions initially (manual review later)
// - Keep all milestone entries regardless of date
```

#### Step 1.2: Review Archive Content (20 min)
**Action:** 
- Run script with `--dry-run` flag
- Review what will be archived vs kept
- Verify milestone entries correctly identified
- Check date boundaries (2025 vs 2026)

**Why:** Manual verification prevents accidental loss of important context

**Dependencies:** Step 1.1 complete

**Risk:** Low - Dry-run mode, no actual changes

#### Step 1.3: Execute Archive (10 min)
**Action:**
- Run `node scripts/archive-changelog.js`
- Verify `docs/archived/changelog-2025-and-earlier.md` created
- Verify `CODEBASE_CHANGELOG.md.pre-v0.11.backup` created
- Verify main changelog now ~300-500 lines (milestones + 2026 sessions)

**Why:** Preserve history while reducing main file bloat

**Dependencies:** Step 1.2 approved

**Risk:** Low - Backup created, reversible

#### Step 1.4: Add Archive Index (30 min)
**File:** `docs/archived/README.md`

**Action:** Create index documenting:
- What's archived and why
- How to search archives (`grep`, `query-sessions` with date filters)
- Link to context-index.json for recent history
- Migration rationale (indexed queries > manual reading)

**Why:** Users can find historical context when needed

**Dependencies:** Step 1.3 complete

**Risk:** Low - Documentation only

---

### Phase 2: Update Core Documentation (1 hour)

**Goal:** Align AGENTS.md and ESSENTIALS with new workflow

#### Step 2.1: Update AGENTS.md Workflow (20 min)
**File:** [AGENTS.md](../AGENTS.md)

**Changes:**

**Location 1: Session Start Protocol (line ~132)**
```diff
 **When you need history:**
-- **@CODEBASE_CHANGELOG.md** - Session-by-session changes and validation notes
+- **CLI queries** - Use `query-sessions`, `search-context` for development history
+- **@CODEBASE_CHANGELOG.md** - Milestone summaries (releases, architectural changes)
 - **@.aiknowsys/learned/** - Project-specific patterns discovered over time
```

**Location 2: Documentation Step (line ~191)**
```diff
 ### 5️⃣ DOCUMENT: Update Changelog (MANDATORY for significant changes)
 
 **When to update** (automatic, don't ask):
-- After architectural changes, new features, performance fixes
-- After bug fixes that reveal design issues
+- At release milestones (v0.x.0, v1.x.0)
+- After architectural changes affecting multiple systems
+- Breaking changes or major API redesigns
 - When you discover missing/outdated patterns
+- **NOT for routine development** (use session files + index)
 
 **What to update**:
 ```bash
-# Add session entry to CODEBASE_CHANGELOG.md at the TOP
+# Add milestone entry to CODEBASE_CHANGELOG.md at the TOP
 # Update CODEBASE_ESSENTIALS.md if patterns/invariants changed
 ```
+
+**For daily work:** Session files are auto-indexed and queryable:
+```bash
+# Update session file (not changelog)
+vim .aiknowsys/sessions/$(date +%Y-%m-%d)-session.md
+
+# Query history instead of reading changelog
+npx aiknowsys query-sessions --days 30
+npx aiknowsys search-context "topic"
+```
```

**Location 3: Update Changelog Guideline (line ~200)**
```diff
-**When to update** (automatic, don't ask):
-- Trivial changes (typos, formatting)
+**When NOT to update changelog:**
+- Daily development work (use session files)
 - Work in progress (wait until complete)
 - Exploratory research without implementation
-- Simple bug fixes that don't reveal new patterns
+- Routine bug fixes without architectural impact
+
+**Search recent work instead:**
+```bash
+npx aiknowsys query-sessions --days 7 --json
+npx aiknowsys search-context "recent feature" --json
+```
```

**Why:** Prevents AI agents from creating session-level changelog entries

**Dependencies:** Phase 1 complete

**Risk:** Low - Documentation change only

#### Step 2.2: Update CODEBASE_ESSENTIALS.md (15 min)
**File:** [CODEBASE_ESSENTIALS.md](../CODEBASE_ESSENTIALS.md)

**Changes:**

**Location: Project Structure section (line ~40-60)**
```diff
 ├── .aiknowsys/             # AI knowledge system
 │   ├── context-index.json  # Context index (auto-generated, committed)
+│   │                       # Enables: query-sessions, search-context
 │   ├── PLAN_*.md           # Implementation plans
 │   ├── plans/              # Multi-developer plan tracking
-│   ├── learned/            # Project-specific learned patterns
-│   └── sessions/           # Session notes (gitignored)
+│   ├── learned/            # Project-specific patterns
+│   └── sessions/           # Development history (gitignored, indexed)
+│                           # Query with: npx aiknowsys query-sessions
+├── docs/archived/          # Historical content
+│   └── changelog-2025-and-earlier.md  # Pre-v0.11.0 sessions
 └── package.json
```

**Why:** Clarifies session files are indexed and queryable

**Dependencies:** Phase 1 complete

**Risk:** Low - Adds clarity, no functional change

#### Step 2.3: Update context-query Skill (25 min)
**File:** [.github/skills/context-query/SKILL.md](../.github/skills/context-query/SKILL.md)

**Changes:**

**Location: Introduction/Overview (after line 17)**
```diff
+## Why Use This vs Reading Files?
+
+**Before indexed queries (v0.9.x and earlier):**
+- AI agents: Read CODEBASE_CHANGELOG.md (5,743 lines)
+- Humans: grep through session files manually
+- Problem: O(n) file reads, slow, overwhelming
+
+**After indexed queries (v0.10.0+):**
+- AI agents: `query-sessions --topic "X"` (O(1) index lookup)
+- Humans: Same commands (consistent workflow)
+- Benefit: Fast, precise, queryable history
+
+**v0.11.0 Evolution:**
+- Session files = primary development record (indexed, queryable)
+- CODEBASE_CHANGELOG.md = milestone summaries only (releases, arch changes)
+- Search replaces reading: `search-context "topic"` > grep > manual files
+
+---
```

**Why:** Explains architectural evolution and benefits

**Dependencies:** Phase 1 complete

**Risk:** Low - Educational content

---

### Phase 3: Create Milestone Format Guide (45 min)

**Goal:** Document how to write effective milestone entries

#### Step 3.1: Create Milestone Writing Guide (30 min)
**File:** `docs/milestone-changelog-format.md`

**Content:**
```markdown
# Milestone Changelog Format Guide

**Purpose:** CODEBASE_CHANGELOG.md now tracks milestones only (not daily sessions).

**For daily work:** Use session files (`.aiknowsys/sessions/YYYY-MM-DD-session.md`)

---

## When to Add Milestone Entries

✅ **Add milestone entry when:**
- Releasing new version (v0.x.0, v1.x.0)
- Major architectural changes (new subsystem, breaking changes)
- Significant feature completion (multi-week effort)
- Important learnings affecting project direction
- Security fixes or critical bug resolutions

❌ **Don't add entry for:**
- Daily development work (use session files)
- Routine bug fixes (use session files)
- Work in progress (wait until complete)
- Exploratory research (use session files)

---

## Milestone Entry Format

### Template

\`\`\`markdown
## v0.X.0: [Brief Title] (MMM DD, YYYY)

**Major Change:** [One sentence summary of what changed and why]

**Architecture:**
- [Component/System 1]: Description of change
- [Component/System 2]: Description of change
- [Component/System 3]: Description of change

**Migration:**
- [How users upgrade or adapt to changes]
- [Commands to run or files to update]
- [Link to migration guide if complex]

**Key Learning:** 
[What was discovered or realized during this work]

**Impact:**
- [How this changes user workflow]
- [Performance implications]
- [Breaking changes (if any)]

**Files Changed:** X created, Y modified  
**Test Coverage:** X/Y tests passing  
**Validation:** [List validation commands run]
\`\`\`

### Example: Good Milestone Entry

\`\`\`markdown
## v0.11.0: Milestone-Focused Changelog (Feb 7, 2026)

**Major Change:** Evolved changelog from session-by-session archive to queryable milestone summaries. Session files + context-index.json now primary development record.

**Architecture:**
- Session files (`.aiknowsys/sessions/`) indexed in `context-index.json`
- CLI queries (`query-sessions`, `search-context`) replace manual file reading
- Auto-indexing with git hooks prevents staleness
- Historical entries archived to `docs/archived/changelog-2025-and-earlier.md`

**Migration:**
- Old workflow: Read CODEBASE_CHANGELOG.md for history
- New workflow: `npx aiknowsys query-sessions --days 30`
- Search topics: `npx aiknowsys search-context "topic"`
- No breaking changes, old changelog preserved in `docs/archived/`

**Key Learning:** 
Write-only archives become technical debt. If AI agents query via CLI, humans should too. Indexed systems scale better than manual file reading.

**Impact:**
- CODEBASE_CHANGELOG.md reduced from 5,743 → 500 lines
- History queries faster (O(1) index vs O(n) file reads)
- Session files become first-class development record
- Milestone entries more visible (not buried in 5K lines)

**Files Changed:** 1 archived, 12 templates updated, 3 skills updated  
**Test Coverage:** 845/845 passing  
**Validation:** All query commands working, archive reversible
\`\`\`

---

## Finding Historical Information

**For recent work (2026+):**
\`\`\`bash
# Last 7 days of work
npx aiknowsys query-sessions --days 7

# Search by topic
npx aiknowsys search-context "TypeScript migration"

# Specific date
npx aiknowsys query-sessions --date "2026-02-07"
\`\`\`

**For historical work (2025 and earlier):**
- See `docs/archived/changelog-2025-and-earlier.md`
- Use text search: `grep -r "topic" docs/archived/`
- Or query if session files exist: `query-sessions --date "2025-12-15"`

---

## Benefits of Milestone-Only Changelog

1. **Signal vs Noise**: Milestones visible, not buried in daily updates
2. **Queryable History**: CLI queries faster than reading 5K lines
3. **Single Source**: Session files = development record (no duplication)
4. **Better AI Context**: Milestone summaries provide high-level architecture
5. **Human-Readable**: 500 lines > 5,743 lines
6. **Scalable**: Grows slower (milestones not sessions)

---

*Part of AIKnowSys v0.11.0 - Indexed Query System Architecture*
```

**Why:** Clear guidelines prevent regression to session-level entries

**Dependencies:** Phase 1 complete

**Risk:** Low - Documentation only

#### Step 3.2: Link from AGENTS.md (15 min)
**File:** [AGENTS.md](../AGENTS.md)

**Action:** Add reference to milestone format guide in documentation step

**Location: Documentation section (line ~200)**
```diff
 **What to update**:
 ```bash
 # Add milestone entry to CODEBASE_CHANGELOG.md at the TOP
+# See: docs/milestone-changelog-format.md for format
 # Update CODEBASE_ESSENTIALS.md if patterns/invariants changed
 ```
```

**Why:** AI agents can find format guide when needed

**Dependencies:** Step 3.1 complete

**Risk:** Low - Reference link only

---

### Phase 4: Update Templates (1.5 hours)

**Goal:** Ensure distributed templates reflect new workflow

#### Step 4.1: Update AGENTS.template.md (20 min)
**File:** `templates/AGENTS.template.md`

**Action:** Apply same changes as AGENTS.md (Phase 2.1)
- Line ~132: Change "session-by-session" → "CLI queries"
- Line ~191: Add "milestone-only" guidance
- Line ~200: Add "when NOT to update" section

**Why:** Templates must match implemented workflow

**Dependencies:** Phase 2.1 complete (copy changes)

**Risk:** Low - Template consistency

#### Step 4.2: Update CODEBASE_CHANGELOG.template.md (25 min)
**File:** `templates/CODEBASE_CHANGELOG.template.md`

**Action:**
- Update header purpose statement
- Replace session entry template with milestone template
- Add "Query History" section with CLI commands
- Update archiving guidance (reference milestone format guide)

**Changes:**
```diff
 # {{PROJECT_NAME}} - Changelog
 
-> Session-by-session development history for AI context preservation.
+> Milestone summaries for releases and architectural changes.
+> For development history, use: `npx aiknowsys query-sessions`
 
-⚠️ **AI REMINDER:** For multi-hour/multi-task work, ALSO maintain `.aiknowsys/sessions/YYYY-MM-DD-session.md`  
-📝 **Changelog** = Permanent history (committed) | **Sessions** = Working memory (gitignored)
+📝 **Changelog** = Milestones (releases, architecture)  
+📝 **Sessions** = Development history (queryable via CLI)  
+📝 **Query:** `npx aiknowsys query-sessions --days 30`

+## Querying Development History
+
+**Instead of reading this file for daily work:**
+\`\`\`bash
+# Recent sessions (last 7 days)
+npx aiknowsys query-sessions --days 7
+
+# Search by topic
+npx aiknowsys search-context "feature implementation"
+
+# Specific date
+npx aiknowsys query-sessions --date "YYYY-MM-DD"
+\`\`\`
+
+**See:** `docs/milestone-changelog-format.md` for milestone entry format
+
 ---
 
-## Session: [Brief Title] (MMM D, YYYY)
+## v0.X.0: [Brief Title] (MMM DD, YYYY)
 
-**Goal**: [One sentence]
+**Major Change:** [What changed and why]
 
-**Changes**:
-- [file/path](file/path#L123): Description with line numbers
-- [another/file](another/file): What changed
+**Architecture:**
+- [Component]: Description
 
-**Validation**:
-- ✅ Tests: X passed
-- ✅ Type check: No errors
+**Migration:**
+- [How to upgrade]
 
-**Key Learning**: [Optional: pattern or gotcha for future reference]
+**Key Learning:** [Insights from this work]
+
+**Files Changed:** X created, Y modified  
+**Test Coverage:** X/Y passing  
+**Validation:** [Commands run]
```

**Why:** Template distributed to new users must reflect current workflow

**Dependencies:** Phase 3.1 complete (references milestone guide)

**Risk:** Low - Template improvement

#### Step 4.3: Update CODEBASE_ESSENTIALS.template.md (20 min)
**File:** `templates/CODEBASE_ESSENTIALS.template.md`

**Action:** Update "Three Files" section (if exists) or "Purpose" section

**Location: Lines mentioning CODEBASE_CHANGELOG.md**
```diff
-CODEBASE_CHANGELOG.md   ←  What HAPPENED (session history, decisions, learnings)
+CODEBASE_CHANGELOG.md   ←  MILESTONES (releases, architecture, major changes)
+.aiknowsys/sessions/    ←  Development history (queryable via CLI)
```

**Why:** Template sets correct user expectations

**Dependencies:** None

**Risk:** Low - Clarity improvement

#### Step 4.4: Update Skill Templates (30 min)
**Files:**
- `templates/skills/feature-implementation/SKILL.md`
- `templates/skills/validation-troubleshooting/SKILL.md`
- `templates/skills/skill-creator/SKILL.md`

**Action:** Find references to "Add to CODEBASE_CHANGELOG.md" and update:

```diff
-- [ ] Add to CODEBASE_CHANGELOG.md
+- [ ] Update session file (`.aiknowsys/sessions/YYYY-MM-DD-session.md`)
+- [ ] If milestone (release/arch change): Add to CODEBASE_CHANGELOG.md
```

**Why:** Skills guide user workflow correctly

**Dependencies:** None

**Risk:** Low - Better guidance

#### Step 4.5: Update Agent Templates (15 min)
**Files:**
- `templates/agents/developer.agent.template.md`
- `templates/agents/architect.agent.template.md`

**Action:** Update changelog references

**Location: Developer agent**
```diff
-**Update CODEBASE_CHANGELOG.md when:**
-- Architectural changes completed
-- New features implemented
-- Bug fixes revealing design issues
+**Update CODEBASE_CHANGELOG.md when (milestones only):**
+- Releasing new version (v0.x.0)
+- Major architectural changes
+- Breaking changes or API redesigns
+
+**For daily work:** Update session files (auto-indexed, queryable)
```

**Location: Architect agent**
```diff
-- **Update CODEBASE_CHANGELOG.md:** For significant changes (architectural changes, new features, bug fixes that reveal design issues)
+- **Update CODEBASE_CHANGELOG.md:** For milestones only (releases, architectural changes affecting multiple systems)
+- **Update session file:** For all development work (`.aiknowsys/sessions/YYYY-MM-DD-session.md`)
```

**Why:** Prevents agents from creating session-level changelog entries

**Dependencies:** None

**Risk:** Low - Workflow correction

---

### Phase 5: Validation & Testing (1 hour)

**Goal:** Ensure migration works without breaking functionality

#### Step 5.1: Run Deliverables Validation (10 min)
**Action:**
```bash
npx aiknowsys validate-deliverables
```

**Expected:** 
- ✅ All templates consistent
- ✅ No broken template variable references
- ✅ Skills format valid

**Why:** Catches template inconsistencies early

**Dependencies:** Phase 4 complete

**Risk:** Low - Automated validation

#### Step 5.2: Test Query Commands (15 min)
**Action:**
```bash
# Verify session queries work
npx aiknowsys query-sessions --days 90 --json

# Verify search works
npx aiknowsys search-context "milestone" --json

# Verify archive queryable (if session files exist)
npx aiknowsys query-sessions --date "2025-12-01" --json
```

**Expected:**
- ✅ Returns session results from last 90 days
- ✅ Search finds relevant content
- ✅ Historical queries work (if pre-2026 session files exist)

**Why:** Confirms query system replaces changelog reading

**Dependencies:** Phase 1 complete (archive exists)

**Risk:** Low - Read-only commands

#### Step 5.3: Test Template Initialization (20 min)
**Action:**
```bash
# Create test project
mkdir -p test-tmp-milestone-test
cd test-tmp-milestone-test

# Initialize with new templates
npx aiknowsys init --no-ai

# Verify CODEBASE_CHANGELOG.md format
cat CODEBASE_CHANGELOG.md | head -50

# Verify AGENTS.md references
grep -A5 "CODEBASE_CHANGELOG" AGENTS.md
```

**Expected:**
- ✅ CODEBASE_CHANGELOG.md has milestone template (not session template)
- ✅ AGENTS.md mentions "CLI queries" (not "session-by-session")
- ✅ Templates reference queryable sessions

**Why:** Ensures new users get correct workflow from day 1

**Dependencies:** Phase 4 complete

**Risk:** Low - Test directory, not production

#### Step 5.4: Run Full Test Suite (10 min)
**Action:**
```bash
npm test
```

**Expected:**
- ✅ All 845+ tests passing
- ✅ No regressions from documentation changes

**Why:** Confirms no functional breakage

**Dependencies:** All phases complete

**Risk:** Low - Tests are comprehensive

#### Step 5.5: Manual Review (5 min)
**Action:**
- Open CODEBASE_CHANGELOG.md
- Verify milestone entries visible (not buried)
- Verify file size reduced to ~300-500 lines
- Verify archive file exists and contains old entries

**Expected:**
- ✅ Main changelog readable and focused
- ✅ Historical content preserved
- ✅ Migration reversible (backup exists)

**Why:** Human verification of UX improvement

**Dependencies:** All phases complete

**Risk:** None - Read-only review

---

## Testing Strategy

### Unit Tests
**No new unit tests needed** - This is documentation/workflow evolution

**Existing tests verify:**
- ✅ query-sessions command works (91 tests)
- ✅ search-context command works (24 tests)
- ✅ context-index.json updates correctly (11 tests)
- ✅ Template validation (68 tests)

### Integration Tests
**Manual integration test:**
1. Create session file
2. Run query-sessions (should find it)
3. Search for content (should find it)
4. Verify changelog not needed for daily work

### Migration Validation
**Reversibility test:**
```bash
# If migration goes wrong
cp CODEBASE_CHANGELOG.md.pre-v0.11.backup CODEBASE_CHANGELOG.md
rm docs/archived/changelog-2025-and-earlier.md
# Back to original state
```

---

## Risks & Mitigations

### Risk 1: Loss of Historical Context
**Likelihood:** Low  
**Impact:** Medium  
**Mitigation:** 
- Archive preserves all old entries
- Backup created before any changes
- Session files from 2026+ still queryable
- Migration is reversible

### Risk 2: User Confusion During Transition
**Likelihood:** Medium  
**Impact:** Low  
**Mitigation:**
- RELEASE_NOTES_v0.11.0.md explains change clearly
- Milestone format guide provides examples
- Both old (manual reading) and new (queries) workflows work
- Documentation updated consistently across all files

### Risk 3: Template Inconsistencies
**Likelihood:** Low  
**Impact:** Medium  
**Mitigation:**
- validate-deliverables catches mismatches
- Phase 4 updates ALL template files
- Phase 5.3 tests template initialization

### Risk 4: AI Agents Regress to Session-Level Entries
**Likelihood:** Medium  
**Impact:** Low  
**Mitigation:**
- AGENTS.md explicitly states "NOT for routine development"
- Milestone format guide linked from workflow
- Templates use milestone format (not session format)
- Agent templates updated to prevent regression

---

## Success Criteria

- [ ] CODEBASE_CHANGELOG.md reduced from 5,743 → ~500 lines
- [ ] Historical entries archived to `docs/archived/changelog-2025-and-earlier.md`
- [ ] All templates updated (12 files)
- [ ] All skills updated (3 files)
- [ ] AGENTS.md workflow reflects new approach
- [ ] Milestone format guide created and linked
- [ ] `validate-deliverables` passes
- [ ] All 845+ tests passing
- [ ] Query commands verified working
- [ ] Template initialization tested
- [ ] Migration reversible (backup created)
- [ ] RELEASE_NOTES_v0.11.0.md documents change

---

## Notes for Developer

### Key Decisions

**Why milestone-only changelog?**
- Query system (v0.10.0) makes session-level entries redundant
- AI agents already use `query-sessions` instead of reading changelog
- Humans should use same tools as AI (consistency)
- 500 lines > 5,743 lines (readability, maintenance)

**Why archive (not delete)?**
- Historical context valuable for architectural understanding
- Users may want to trace decision history
- Reversibility important for risk mitigation
- Archive file is searchable (grep, query-sessions if indexed)

**Why archive 2025 and earlier (not all sessions)?**
- 2026 sessions still recent and relevant
- Clear date boundary (year rollover)
- Can archive more later if needed
- Incremental approach reduces risk

### Implementation Order Matters

1. **Phase 1 first**: Create archive before modifying workflow docs
2. **Phase 2-3 together**: Docs + format guide inform template updates
3. **Phase 4 must be complete**: All templates or none (consistency)
4. **Phase 5 validates everything**: Catches issues before release

### Optional Enhancements (Not Required)

**Phase 6: Create Milestone Helper Command (Optional)**
```bash
npx aiknowsys create-milestone "v0.11.0" "Milestone-Focused Changelog"
# Generates milestone entry template
# Fills in date, version, template structure
# AI agent completes the content
```

**Benefit:** Ensures consistent milestone format  
**Effort:** 1 hour (command + tests)  
**Decision:** Defer to v0.12.0 (not critical for v0.11.0)

---

## Estimated Timeline

| Phase | Estimated | Actual | Notes |
|-------|-----------|--------|-------|
| Phase 1: Archive Historical | 1.5 hours | | Automated script + review |
| Phase 2: Update Core Docs | 1 hour | | AGENTS, ESSENTIALS, skills |
| Phase 3: Milestone Format Guide | 45 min | | New doc + examples |
| Phase 4: Update Templates | 1.5 hours | | 12 template files |
| Phase 5: Validation & Testing | 1 hour | | Deliverables, queries, tests |
| **Total** | **5.75 hours** | | ~1 work day |

**Buffer:** +1 hour for unexpected issues (total estimation: 6.75 hours)

---

## Follow-Up Work (Future)

**After v0.11.0 release:**
1. Monitor user feedback on milestone-only approach
2. Consider archiving 2026-Q1 sessions after Q2 (quarterly archiving)
3. Evaluate creating `create-milestone` command if users struggle with format
4. Consider auto-detecting milestone-worthy changes (version tag, breaking changes)

**Metrics to track:**
- Changelog growth rate (lines/month before vs after)
- Query command usage (logs if available)
- User questions about finding history

---

*Plan created by @Planner based on architectural analysis and query system implementation.*
*Ready for handoff to @Developer for implementation.*
