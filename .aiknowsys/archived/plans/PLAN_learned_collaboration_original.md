# Implementation Plan: Multi-Developer Collaboration (File Conflicts)

**Status:** 📋 PLANNED  
**Created:** 2026-01-31  
**Goal:** Solve merge conflicts in multi-developer teams for learned patterns, plan tracking, and reviews

---

## Problem Statement

### The Collaboration Issues

**Problem 1: Learned Patterns**
- `.aiknowsys/learned/*.md` files are committed to git (shared team knowledge)
- Multiple developers can create/modify the same learned pattern file
- **Result:** Merge conflicts or silent overwrites

**Problem 2: Plan Tracking (CURRENT_PLAN.md)**
- Multiple developers update CURRENT_PLAN.md (mark complete, switch active plan)
- **Result:** Merge conflicts on plan status

**Problem 3: Architect Reviews (PENDING_REVIEW.md)**
- Single file for all reviews
- Multiple developers on same branch get reviews
- **Result:** Overwrites or conflicts

**Scenario 1: Learned Patterns**
```
Developer A (feature/auth):
  Discovers pattern → .aiknowsys/learned/api-error-handling.md
  Commits to branch

Developer B (feature/payments):
  Discovers similar pattern → .aiknowsys/learned/api-error-handling.md
  Different content, same filename

Both merge to main → CONFLICT 💥
```

**Scenario 2: Plan Tracking**
```
Developer A (feature/auth):
  Marks Plan X complete → Updates CURRENT_PLAN.md
  Sets Plan Y active
  Commits

Developer B (feature/payments):
  Marks Plan Z complete → Updates CURRENT_PLAN.md
  Sets Plan W active
  Commits

Both merge to main → CONFLICT on CURRENT_PLAN.md 💥
```

**Scenario 3: Architect Reviews**
```
Developer A working → Architect reviews → .aiknowsys/PENDING_REVIEW.md
Developer B working → Architect reviews → .aiknowsys/PENDING_REVIEW.md (overwrites!)

OR: Both on same branch → Both get reviews → conflict 💥
```

**Additional problems:**
1. **Duplicate patterns** - Same concept, different filenames (database-pooling.md vs db-connection-pool.md)
2. **No review process** - Learned patterns committed without team validation
3. **No visibility** - Can't see what teammates discovered
4. **Conflicting advice** - Two patterns suggest opposite approaches
5. **Stale patterns** - Old workarounds committed, never cleaned up
6. **Plan coordination** - Who's working on what? Last merge wins arbitrarily
7. **Review overwrites** - One developer's review disappears when another gets reviewed

### Why This Matters

Learned patterns are **accumulated team wisdom** - they should:
- Be reviewed before sharing (quality control)
- Avoid duplicates (single source of truth)
- Be discoverable (teammates benefit)
- Stay current (remove obsolete patterns)

---

## Requirements

### Functional Requirements
1. **Prevent merge conflicts** on learned pattern files, plan tracking, and reviews
2. **Review process** before patterns become shared knowledge
3. **Deduplication** - Detect similar patterns before commit
4. **Discoverability** - Easy to browse team's learned patterns
5. **Cleanup workflow** - Archive or remove stale patterns
6. **Per-developer reviews** - Architect reviews don't overwrite each other
7. **Plan visibility** - See what teammates are working on (without conflicts)

### Non-Functional Requirements
- Don't break existing workflows (backward compatible)
- Minimal overhead (don't slow down development)
- Git-friendly (standard git workflow, no custom hooks required)
- AI-parseable (patterns remain markdown with frontmatter)

---

## Proposed Solutions (3 Options)

### Option 1: Personal + Shared Split (Recommended)

**Concept:** Separate personal discoveries from team-validated patterns

**Structure:**
```
.aiknowsys/
  learned/              # Team-validated (committed)
    README.md
    api-error-handling.md
    database-pooling.md
  
  personal/             # Personal discoveries (gitignored)
    arno/
      api-retry-pattern.md
      clickhouse-optimization.md
    colleague/
      vue-composable-pattern.md
```

**Workflow:**
1. Developer discovers pattern → Saves to `.aiknowsys/personal/<username>/pattern.md`
2. Developer runs: `npx aiknowsys share-pattern api-retry-pattern`
3. Command checks for duplicates, prompts for review
4. If approved, moves to `.aiknowsys/learned/` and commits
5. Teammates pull and benefit

**Pros:**
- ✅ No merge conflicts (personal is gitignored)
- ✅ Review process built-in
- ✅ Deduplication on share (not on commit)
- ✅ Personal experimentation space

**Cons:**
- ❌ Requires new command (`share-pattern`)
- ❌ Developers must remember to share
- ❌ Personal patterns lost if not shared

---

### Option 2: Append-Only Journal (Git-Friendly)

**Concept:** Learned patterns as append-only entries in shared journal file

**Structure:**
```
.aiknowsys/
  learned/
    README.md
    patterns.jsonl      # JSON Lines format (append-only)
```

**patterns.jsonl:**
```jsonl
{"id":"1","author":"arno","date":"2026-01-31","title":"API Error Handling","content":"...","tags":["api","errors"]}
{"id":"2","author":"colleague","date":"2026-02-01","title":"Database Pooling","content":"...","tags":["database","performance"]}
```

**Workflow:**
1. Developer discovers pattern
2. Command appends new entry to `patterns.jsonl`
3. Git merge = append both entries (no conflict)
4. `npx aiknowsys learned` generates individual .md files from journal

**Pros:**
- ✅ No merge conflicts (append-only)
- ✅ Full history preserved
- ✅ Easy to query/filter (JSON)
- ✅ Automatic deduplication by ID

**Cons:**
- ❌ Journal file grows indefinitely
- ❌ Less human-readable than markdown
- ❌ Requires build step (generate .md files)
- ❌ AI agents need to read JSONL format

---

### Option 3: Git Submodule for Learned Patterns

**Concept:** Separate git repository for shared patterns

**Structure:**
```
project/
  .aiknowsys/
    learned/          # Git submodule → team-patterns repo
    personal/         # Gitignored local patterns
```

**Workflow:**
1. Create `team-patterns` repo
2. Add as submodule: `git submodule add <repo> .aiknowsys/learned`
3. Developers commit to submodule separately
4. Pull requests for pattern additions (review process)

**Pros:**
- ✅ Formal review process (PR workflow)
- ✅ Centralized patterns across projects
- ✅ Version control independent of main project

**Cons:**
- ❌ Complexity (submodules are confusing)
- ❌ Extra repo management overhead
- ❌ Overkill for small teams
- ❌ Harder to discover patterns locally

---

## Recommended Approach: Combined Solution

**For Learned Patterns: Personal + Shared Split (Option 1)**
- Personal discoveries in `.aiknowsys/personal/<username>/` (gitignored)
- Team-validated in `.aiknowsys/learned/` (committed)
- Share command with review

**For Plan Tracking: Per-Developer Pointers**
- `.aiknowsys/plans/active-<username>.md` (committed)
- Shows what each developer is working on
- No conflicts (separate files)
- CURRENT_PLAN.md becomes index (generated or manual)

**For Architect Reviews: Per-Developer Files**
- `.aiknowsys/reviews/PENDING_<username>.md` (ephemeral, gitignored)
- Each developer gets their own review file
- Auto-cleanup after addressing
- No overwrites, no conflicts

**Why this approach:**
- Solves all three collision scenarios
- Maintains visibility (can see teammate plans)
- Backward compatible with careful migration
- Simple mental model: personal → review → share

---

## Architecture Changes

### New Directories

**1. `.aiknowsys/personal/<username>/`** (gitignored)
- Per-developer personal patterns
- Automatically created on first use
- Username from git config or prompt

**2. `.aiknowsys/plans/`** (committed)
- Per-developer active plan pointers
- Files: `active-<username>.md`
- Shows what each developer is currently working on

**3. `.aiknowsys/reviews/`** (gitignored)
- Per-developer pending reviews
- Files: `PENDING_<username>.md`
- Auto-deleted after addressing issues

### New Files

**1. `lib/commands/share-pattern.js` (NEW)**
- Command: `npx aiknowsys share-pattern <pattern-name>`
- Finds pattern in personal/<username>/
- Checks for duplicates in learned/
- Prompts for confirmation/merge
- Moves to learned/ (or merges content)
- Commits to git (optional)

**2. `lib/commands/learn.js` (UPDATE - existing file)**
- Add `--personal` flag (save to personal/ instead of learned/)
- Default: Save to personal/ (prevents accidental commits)
- Update skill detection to check both personal/ and learned/

**3. `.gitignore` update in templates**
- Add `.aiknowsys/personal/` to gitignore
- Add `.aiknowsys/reviews/` to gitignore (ephemeral reviews)
- Ensure `.aiknowsys/learned/` is NOT gitignored
- Ensure `.aiknowsys/plans/` is NOT gitignored (team visibility)

**4. `lib/commands/list-patterns.js` (NEW)**
- Command: `npx aiknowsys list-patterns`
- Shows personal patterns (ready to share)
- Shows team patterns (already shared)
- Suggests patterns to share based on usage

**5. `.aiknowsys/plans/active-<username>.md` (NEW - generated)**
- Per-developer active plan pointer
- Shows current plan, status, progress
- Visible to team (committed)
- No conflicts (separate files per developer)

**6. `.aiknowsys/CURRENT_PLAN.md` (MODIFIED - becomes index)**
- Changes from active pointer to team index
- Aggregates all developers' active plans
- Can be manually edited or auto-generated
- Shows: who's working on what

**7. `.aiknowsys/reviews/PENDING_<username>.md` (NEW - replaces PENDING_REVIEW.md)**
- Per-developer review file
- Created by Architect agent
- Gitignored (ephemeral)
- Auto-deleted by Developer after addressing

### Modified Files

**1. `lib/commands/init/templates.js`**
- Update `setupSessionPersistence()` to create:
  * `.aiknowsys/personal/<username>/`
  * `.aiknowsys/plans/`
  * `.aiknowsys/reviews/`
- Copy READMEs for each directory

**2. `templates/.gitignore.template`**
- Add `.aiknowsys/personal/` (gitignored - personal patterns)
- Add `.aiknowsys/reviews/` (gitignored - ephemeral reviews)
- Ensure `.aiknowsys/learned/` tracked (team patterns)
- Ensure `.aiknowsys/plans/` tracked (team visibility)

**3. `templates/CODEBASE_ESSENTIALS.template.md`**
- Update Project Structure to show personal/ vs learned/ vs plans/ vs reviews/
- Add "Multi-Developer Collaboration" section explaining all three workflows

**4. `templates/AGENTS.template.md`**
- Update "Continuous Learning" section
- Update "Plan Management" section for per-developer pointers
- Update "Architect Review" workflow for per-developer reviews
- Document all new file locations

**5. `.github/agents/Developer.md` and `SeniorArchitect.md` (if custom agents installed)**
- Developer: Read from `.aiknowsys/reviews/PENDING_<username>.md`
- Developer: Update `.aiknowsys/plans/active-<username>.md`
- Architect: Write to `.aiknowsys/reviews/PENDING_<username>.md`

---

## Implementation Steps

### Phase 1: Directory Structure
**Goal:** Create per-developer directories

**1. Update gitignore template** (File: `templates/.gitignore.template`)
   - **Action**: Add `.aiknowsys/personal/` and `.aiknowsys/reviews/` to gitignore
   - **Why**: Personal patterns should never be committed automatically
   - **Dependencies**: None
   - **Risk**: Low - just a gitignore entry
   - **TDD**: N/A (template file)

**2. Create personal directory during init** (File: `lib/commands/init/templates.js`)
   - **Action**: In `setupSessionPersistence()`, create `.aiknowsys/personal/<username>/` directory
   - **Why**: Ready for personal pattern storage
   - **Dependencies**: Step 1
   - **Risk**: Low - directory creation
   - **TDD**: Update `test/init.test.js`

**3. Add personal patterns README** (File: `templates/.aiknowsys/personal/README.template.md`)
   - **Action**: Create README explaining personal vs learned
   - **Why**: Developers understand the distinction
   - **Dependencies**: None
   - **Risk**: Low - documentation only
   - **TDD**: N/A (documentation)

### Phase 2: Learn Command Updates
**Goal:** Save new patterns to personal/ by default

**4. Update learn command** (File: `lib/commands/learn.js`)
   - **Action**: 
     - Add `--personal` and `--shared` flags
     - Default to `--personal` (save to personal/<username>/)
     - Add `--shared` for legacy behavior (direct to learned/)
     - Get username from git config or prompt
   - **Why**: Prevent accidental commits of unreviewed patterns
   - **Dependencies**: Step 2
   - **Risk**: Low - additive flags, backward compatible if --shared used
   - **TDD**: Update `test/learn.test.js`

**5. Update skill detection** (File: `lib/skill-mapping.js` or relevant agent code)
   - **Action**: Check both `.aiknowsys/personal/<username>/` and `.aiknowsys/learned/` for patterns
   - **Why**: Personal patterns should still be usable by AI
   - **Dependencies**: Step 4
   - **Risk**: Medium - changes skill detection logic
   - **TDD**: Update skill detection tests

### Phase 3: Share Pattern Command
**Goal:** Enable reviewed sharing of patterns

**6. Create share-pattern command** (File: `lib/commands/share-pattern.js`)
   - **Action**:
     - Load pattern from personal/<username>/<pattern-name>.md
     - Check for duplicates in learned/ (fuzzy match on title/content)
     - If duplicate found, offer merge or rename
     - If unique, prompt for confirmation
     - Move to learned/ (or merge with existing)
     - Optionally git add + commit
     - Display success message
   - **Why**: Review process for team knowledge
   - **Dependencies**: Steps 1-5
   - **Risk**: Medium - file operations, duplicate detection
   - **TDD**: Write tests first in `test/share-pattern.test.js`

**7. Create list-patterns command** (File: `lib/commands/list-patterns.js`)
   - **Action**:
     - Scan personal/<username>/ for patterns
     - Scan learned/ for team patterns
     - Display categorized list:
       * Personal (not shared yet)
       * Team (already shared)
       * Suggested to share (based on usage count from sessions)
   - **Why**: Discoverability and reminders to share
   - **Dependencies**: Step 6
   - **Risk**: Low - read-only operation
   - **TDD**: Write tests first in `test/list-patterns.test.js`

**8. Register commands in CLI** (File: `bin/cli.js`)
   - **Action**: Add `.command('share-pattern')` and `.command('list-patterns')`
   - **Why**: Make commands available via CLI
   - **Dependencies**: Steps 6, 7
   - **Risk**: Low - standard Commander.js registration
   - **TDD**: Update `test/cli.test.js`

### Phase 4: Documentation & Migration
**Goal:** Update docs and help users migrate

**9. Update ESSENTIALS template** (File: `templates/CODEBASE_ESSENTIALS.template.md`)
   - **Action**: 
     - Update Project Structure section (show personal/ and learned/)
     - Add "Learned Patterns Collaboration" section explaining workflow
     - Document share-pattern and list-patterns commands
   - **Why**: Users understand the system
   - **Dependencies**: None
   - **Risk**: Low - documentation only
   - **TDD**: N/A (documentation)

**10. Update AGENTS.md** (File: `templates/AGENTS.template.md`)
   - **Action**:
     - Update "Continuous Learning" section
     - Explain personal/ vs learned/ distinction
     - Document workflow: discover → personal → review → share → learned
   - **Why**: AI agents understand where to save patterns
   - **Dependencies**: None
   - **Risk**: Low - documentation only
   - **TDD**: N/A (documentation)

**11. Create migration guide** (File: `docs/learned-collaboration-migration.md`)
   - **Action**:
     - Explain the change (why personal/ was added)
     - Migration steps for existing projects:
       1. Create .aiknowsys/personal/<username>/
       2. Optionally move some learned/ to personal/ if not team-validated
       3. Update .gitignore
     - Backward compatibility notes
   - **Why**: Smooth transition for existing projects
   - **Dependencies**: None
   - **Risk**: Low - documentation only
   - **TDD**: N/A (documentation)

### Phase 5: VSCode Hooks Integration (Optional)
**Goal:** Automate pattern sharing reminders

**12. Add pre-commit hook for personal patterns** (File: `templates/hooks/learned-reminder.cjs`)
   - **Action**:
     - Hook: `stop` event (before git commit)
     - Check if .aiknowsys/personal/<username>/ has patterns (count files)
     - If >3 patterns unshared, display reminder:
       ```
       💡 You have 5 personal patterns that could be shared with the team:
          • api-error-handling.md
          • database-pooling.md
          • vue-composable-pattern.md
       
       Share with: npx aiknowsys share-pattern <name>
       List all: npx aiknowsys list-patterns
       ```
     - Non-blocking (just a reminder)
   - **Why**: Gentle nudge to share valuable discoveries
   - **Dependencies**: Steps 6, 7
   - **Risk**: Low - optional automation, non-blocking
   - **TDD**: Write tests in `test/hooks-learned-reminder.test.js`

**13. Update hooks.json template** (File: `templates/hooks/hooks.json`)
   - **Action**: Add learned-reminder.cjs to stop event hooks
   - **Why**: Auto-register the hook
   - **Dependencies**: Step 12
   - **Risk**: Low - just configuration
   - **TDD**: N/A (configuration)

---

## Testing Strategy

**TDD Approach:** Write tests first for all new commands

**Test Coverage:**

**Unit Tests:**
- `test/share-pattern.test.js` (NEW)
  - Share pattern moves file from personal/ to learned/
  - Duplicate detection works (fuzzy matching)
  - Merge option combines content
  - Rename option avoids conflicts
  - Git commit is optional
- `test/list-patterns.test.js` (NEW)
  - List shows personal patterns
  - List shows team patterns
  - Suggested patterns based on usage
- `test/learn.test.js` (UPDATE)
  - --personal flag saves to personal/<username>/
  - --shared flag saves to learned/ (legacy)
  - Default is personal/
  - Username detection from git config
- `test/init.test.js` (UPDATE)
  - Personal directory created during init
  - Personal README copied
- `test/hooks-learned-reminder.test.js` (NEW)
  - Hook detects unshared patterns
  - Reminder displayed correctly
  - Non-blocking behavior

**Integration Tests:**
- Full workflow: learn → personal → list → share → learned
- Multiple developers sharing same pattern (conflict resolution)
- Git operations (add, commit) work correctly

**Manual Validation:**
- Create pattern in personal/
- Run list-patterns and verify output
- Share pattern and verify move to learned/
- Attempt to share duplicate and verify merge prompt

---

## Risks & Mitigations

**Risk 1: Breaking existing workflows**
- **Likelihood:** Medium (learn command changes default)
- **Impact:** Medium (patterns go to wrong location)
- **Mitigation:** 
  - Add `--shared` flag for legacy behavior
  - Migration guide for existing projects
  - Backward compatible (learned/ still works)

**Risk 2: Developers forget to share**
- **Likelihood:** High (manual process)
- **Impact:** Low (patterns still work locally)
- **Mitigation:**
  - Pre-commit hook reminder
  - list-patterns shows "suggested to share"
  - Documentation emphasizes sharing

**Risk 3: Duplicate detection fails**
- **Likelihood:** Medium (fuzzy matching is hard)
- **Impact:** Low (duplicate patterns, not catastrophic)
- **Mitigation:**
  - Manual review during share
  - Simple keyword matching (good enough)
  - Users can rename if needed

**Risk 4: Personal patterns lost (not backed up)**
- **Likelihood:** Medium (gitignored files)
- **Impact:** Medium (lose discoveries if disk fails)
- **Mitigation:**
  - Documentation recommends regular sharing
  - list-patterns shows count of unshared
  - Users can manually backup personal/ if desired

**Risk 5: Username detection fails**
- **Likelihood:** Low (git config usually set)
- **Impact:** Low (prompt for username)
- **Mitigation:**
  - Fallback to prompt if git config missing
  - Cache username in .aiknowsys.config.json

---

## Success Criteria

**Functional:**
- [ ] Personal patterns saved to `.aiknowsys/personal/<username>/` (gitignored)
- [ ] Team patterns in `.aiknowsys/learned/` (committed)
- [ ] `npx aiknowsys share-pattern <name>` moves personal → learned
- [ ] Duplicate detection prevents conflicts
- [ ] `npx aiknowsys list-patterns` shows both personal and team patterns
- [ ] Pre-commit hook reminds to share (optional)
- [ ] No merge conflicts on learned patterns

**Quality:**
- [ ] All tests passing (520+ existing + ~30 new = 550+ total)
- [ ] TDD followed for all new commands
- [ ] Migration guide for existing projects
- [ ] Documentation updated (ESSENTIALS, AGENTS, migration guide)

**User Experience:**
- [ ] Clear distinction between personal and team patterns
- [ ] Easy sharing workflow (one command)
- [ ] Helpful reminders (but not annoying)
- [ ] Duplicate detection prevents confusion

---

## Alternative Considered: Auto-Share on Commit

**Concept:** Git hook that auto-promotes personal → learned before commit

**Rejected because:**
1. No review process (quality control lost)
2. Confusing (files move without user action)
3. Still have merge conflicts (just delayed)
4. Violates principle of least surprise

**Better:** Explicit share command with review

---

## Notes for Developer

**Username Detection Priority:**
1. Git config: `git config user.name`
2. Environment: `$USER` or `$USERNAME`
3. Prompt: Ask user to enter username
4. Cache: Store in `.aiknowsys.config.json` for future use

**Fuzzy Duplicate Detection:**
```javascript
// Simple approach (good enough):
function isDuplicate(newPattern, existingPatterns) {
  const newTitle = extractTitle(newPattern).toLowerCase();
  const newKeywords = extractKeywords(newPattern);
  
  for (const existing of existingPatterns) {
    const existingTitle = extractTitle(existing).toLowerCase();
    
    // Exact title match
    if (newTitle === existingTitle) return { duplicate: true, file: existing };
    
    // Similar keywords (>50% overlap)
    const overlap = keywordOverlap(newKeywords, extractKeywords(existing));
    if (overlap > 0.5) return { similar: true, file: existing };
  }
  
  return { duplicate: false };
}
```

**Share Pattern Workflow:**
```
1. User runs: npx aiknowsys share-pattern api-retry-pattern
2. Find: .aiknowsys/personal/arno/api-retry-pattern.md
3. Check duplicates in learned/
4. If duplicate:
   - Show both patterns side-by-side
   - Offer: [Merge] [Rename] [Cancel]
5. If unique:
   - Confirm: "Share 'API Retry Pattern' with team? (y/N)"
6. Move file to learned/
7. Git add learned/api-retry-pattern.md
8. Optionally commit: "Add learned pattern: API Retry Pattern"
9. Success: "✅ Pattern shared! Teammates will see it after pulling."
```

**List Patterns Output:**
```
📚 Learned Patterns

Personal (3 patterns - not shared):
  • api-retry-pattern.md (used 5 times this week)
  • vue-composable-best-practices.md
  • clickhouse-optimization.md

Team (7 patterns - shared):
  • database-pooling.md (by arno, 2026-01-15)
  • error-handling-strategy.md (by colleague, 2026-01-20)
  • api-pagination-pattern.md (by arno, 2026-01-25)
  ...

💡 Suggested to share:
  • api-retry-pattern.md (referenced 5 times - seems valuable!)

Share with: npx aiknowsys share-pattern <name>
```

**Migration for Existing Projects:**
```bash
# Create personal directory
mkdir -p .aiknowsys/personal/$(git config user.name)

# Optionally move unvalidated patterns to personal
# (manual decision per project)

# Update .gitignore
echo ".aiknowsys/personal/" >> .gitignore

# Done! Existing learned/ patterns remain shared.
```

---

**Total Estimated Changes:**
- New files: 4 (share-pattern.js, list-patterns.js, learned-reminder.cjs hook, migration guide)
- Modified files: 6 (learn.js, init/templates.js, skill-mapping.js, bin/cli.js, ESSENTIALS template, AGENTS template)
- New tests: 3 (share-pattern.test.js, list-patterns.test.js, hooks-learned-reminder.test.js)
- Lines added: ~600-800 (code + tests + docs)
- Complexity: Medium (file operations, duplicate detection, git integration)

---

*Plan ready for implementation. Solves merge conflict problem while adding valuable collaboration features.*
