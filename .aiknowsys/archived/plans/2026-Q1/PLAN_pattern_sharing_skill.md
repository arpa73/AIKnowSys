# Implementation Plan: Pattern Sharing Skill (AI-Assisted Workflow)

**Status:** 📋 PLANNED  
**Created:** 2026-02-03 00:30  
**Goal:** Create skill for AI-assisted pattern sharing workflow (not manual CLI)

---

## Context

**Supersedes:** PLAN_learned_collaboration_original.md (workflow portion)

**Philosophy:** AIKnowSys is about **AI-assisted workflows**, not CLI commands for users to remember.

**User Insight:** "I don't see users doing it manual, asking the AI Agents yes I think that's more likely"

**Problem Solved:** 
- Multi-dev pattern implemented ✅ (personal/, reviews/, plans/)
- Pattern sharing workflow still needs implementation
- BUT: Users won't run `npx aiknowsys share-pattern` manually
- INSTEAD: AI agents guide the conversation

---

## Proposed Workflow

### AI-Assisted Pattern Sharing

**Scenario 1: Agent creates pattern during session**

```markdown
Agent: "I noticed we're handling API rate limiting repeatedly. I've created 
a learned pattern: .aiknowsys/personal/your-name/api-rate-limiting.md

This seems valuable for the team. Would you like me to share it?"

User: "yes"

Agent: 
1. Checks for duplicates in learned/
2. If duplicate: "Similar pattern exists (api-retry-pattern.md). Should I:
   - Merge them (combine best practices)
   - Keep separate (different use cases)
   - Cancel"
3. If unique: Moves personal/ → learned/, updates frontmatter
4. "✅ Pattern shared! Added to .aiknowsys/learned/api-rate-limiting.md"
```

**Scenario 2: User discovers existing personal pattern**

```markdown
User: "I have some patterns in my personal folder I want to share"

Agent: [Reads personal/ directory]
"You have 3 personal patterns:
 • api-rate-limiting.md (created Jan 15, used 8 times)
 • vue-composable-lifecycle.md (created Jan 20, used 3 times)
 • clickhouse-optimization.md (created Jan 28, used 12 times)

Which would you like to share?"

User: "the clickhouse one"

Agent: [Checks duplicates, moves to learned/]
"✅ Shared! Teammates will see it after pulling."
```

**Scenario 3: End-of-session reminder**

```markdown
Agent (during session end): "You created 2 new patterns today:
 • error-recovery-strategy.md
 • database-connection-pooling.md

Both seem valuable (referenced multiple times). Share with team?"

User: "yes, both"

Agent: [Shares both, checks for duplicates]
"✅ Both patterns shared!"
```

---

## Implementation Plan

### Phase 1: Create Pattern Sharing Skill

**File:** `.github/skills/pattern-sharing/SKILL.md`

**Trigger Words:**
- "share pattern", "share this pattern", "share with team"
- "make this a team pattern", "this could help others"
- "team would benefit", "share my patterns"
- "what patterns can I share", "list my patterns"

**Skill Content:**

```markdown
# Pattern Sharing Skill

**When to use:** User wants to share personal patterns with team, or agent suggests sharing valuable pattern.

## Workflow

### Step 1: Identify Pattern to Share

**If agent created pattern:**
- Mention pattern location: `.aiknowsys/personal/<username>/<pattern-name>.md`
- Explain why valuable (usage count, complexity solved, team benefit)
- Ask: "Would you like me to share this with the team?"

**If user asks to share:**
- Read `.aiknowsys/personal/<username>/` directory
- List patterns with metadata (created date, usage count if available)
- Ask which to share

**If user has multiple patterns:**
- Suggest most valuable based on:
  * Usage count (if tracked in session files)
  * Recency (recently created = fresh knowledge)
  * Complexity (longer patterns = more investment)

### Step 2: Check for Duplicates

**Read `.aiknowsys/learned/` directory:**
- Extract titles from all learned patterns
- Compare with pattern to share:
  * Exact title match = duplicate
  * Similar keywords (>50% overlap) = possibly duplicate

**If duplicate found:**
```
"Similar pattern exists: api-retry-strategy.md

Your pattern: API Rate Limiting (focuses on backoff algorithms)
Team pattern: API Retry Strategy (focuses on circuit breakers)

These seem related. Would you like to:
1. Merge them (combine both approaches)
2. Keep separate (different focus areas)
3. Cancel (review manually later)"
```

**If unique:**
- Proceed to Step 3

### Step 3: Move Pattern to Learned

**File operations:**
1. Read pattern from `.aiknowsys/personal/<username>/<pattern>.md`
2. Update frontmatter (add `shared_by`, `shared_date`)
3. Write to `.aiknowsys/learned/<pattern>.md`
4. Delete from personal/ (optional - user preference)

**Example frontmatter update:**
```yaml
---
type: error_resolution
created: 2026-01-15
shared_by: arno-paffen
shared_date: 2026-02-03
tags: [api, rate-limiting, backoff]
---
```

**Git operations (optional):**
- `git add .aiknowsys/learned/<pattern>.md`
- Suggest commit message: "Add learned pattern: <Title>"
- User decides whether to commit immediately or later

### Step 4: Confirm Success

**Agent response:**
```
"✅ Pattern shared!

Location: .aiknowsys/learned/api-rate-limiting.md
Teammates will see it after pulling from git.

Updated session notes with this sharing action."
```

**Update session file:**
- Add entry documenting pattern sharing
- Helps track what was shared when

### Step 5: Handle Merge (If Duplicate)

**If user chose "Merge":**

1. **Read both patterns:**
   - Personal pattern (to share)
   - Existing learned pattern

2. **Analyze differences:**
   - Unique sections in each
   - Overlapping content
   - Complementary vs conflicting advice

3. **Propose merge:**
```
"I can merge these patterns. Here's my proposal:

COMBINED PATTERN: API Retry & Rate Limiting Strategy

Sections:
1. Overview (from both)
2. Rate Limiting (from your pattern)
3. Circuit Breakers (from existing pattern)
4. Backoff Algorithms (from your pattern)
5. Code Examples (combined)

Does this look good? I can:
- Apply this merge
- Show me the full merged content first
- Cancel and keep separate"
```

4. **Execute merge:**
   - Combine content intelligently
   - Update frontmatter (list both authors)
   - Save merged version to learned/
   - Archive old version (optional)

### Step 6: End-of-Session Suggestion (Optional)

**At session end, check:**
- Count patterns in `.aiknowsys/personal/<username>/`
- If >2 unshared patterns, suggest:

```
"You have 3 personal patterns that could benefit the team:
 • api-rate-limiting.md (used 8 times today)
 • database-pooling.md (created 3 days ago)
 • error-recovery.md (used 12 times this week)

Want to share any of these before we finish?"
```

**User can:**
- Share all: "yes, all of them"
- Share some: "just the first two"
- Skip: "not right now"

## Error Handling

**Pattern not found:**
```
"I couldn't find that pattern in .aiknowsys/personal/<username>/.

Available patterns:
 • pattern1.md
 • pattern2.md

Which would you like to share?"
```

**No personal patterns:**
```
"You don't have any personal patterns yet.

Personal patterns are created when you use the 'learn' workflow.
They're saved in .aiknowsys/personal/<username>/ until shared."
```

**Learned directory doesn't exist:**
```
"The .aiknowsys/learned/ directory doesn't exist yet.

This usually happens in new projects. I'll create it now."

[Create directory, then proceed]
```

## Examples

### Example 1: Share Single Pattern

**User:** "Can you share the API retry pattern I created yesterday?"

**Agent:**
1. Searches personal/ for "api retry" keywords
2. Finds: `api-retry-pattern.md`
3. Checks learned/ for duplicates
4. None found
5. Moves to learned/, updates frontmatter
6. "✅ Pattern shared! .aiknowsys/learned/api-retry-pattern.md"

### Example 2: Share with Duplicate

**User:** "Share the database pooling pattern"

**Agent:**
1. Finds: `personal/arno/database-pooling.md`
2. Checks learned/
3. Found: `learned/database-connection-pool.md` (similar title)
4. Reads both patterns
5. Detects 60% keyword overlap
6. Asks: "Similar pattern exists. Merge, keep separate, or cancel?"

**User:** "merge them"

**Agent:**
1. Combines both patterns intelligently
2. Saves merged version to learned/
3. Updates frontmatter with both authors
4. "✅ Patterns merged! .aiknowsys/learned/database-pooling.md"

### Example 3: Bulk Share

**User:** "what patterns should I share?"

**Agent:**
1. Reads personal/ directory
2. Analyzes each pattern (usage, recency, size)
3. Suggests:
```
"You have 5 personal patterns. I recommend sharing:

HIGH PRIORITY (used frequently):
 • api-rate-limiting.md (used 12 times)
 • error-recovery.md (used 8 times)

MEDIUM PRIORITY (recently created):
 • vue-composable-best-practices.md (created yesterday)

LOW PRIORITY (rarely used):
 • temp-debugging-notes.md (used once, might be temporary?)
 • experiment-with-webgl.md (used once, experimental?)

Share the high priority ones?"
```

**User:** "yes, and the vue one too"

**Agent:**
1. Shares api-rate-limiting.md (checks duplicates, moves)
2. Shares error-recovery.md (checks duplicates, moves)
3. Shares vue-composable-best-practices.md (checks duplicates, moves)
4. "✅ Shared 3 patterns! Teammates will see them after pulling."

## Technical Notes

**File reading:**
- Use `fs.readdir()` to list patterns
- Use `fs.readFile()` to read content
- Use `fs.rename()` or `fs.copyFile()` + `fs.unlink()` to move

**Frontmatter parsing:**
- Use gray-matter library (or manual regex)
- Extract YAML frontmatter
- Update fields: `shared_by`, `shared_date`

**Duplicate detection:**
- Simple keyword extraction from title and content
- Calculate overlap percentage
- Threshold: >50% overlap = similar, >80% = duplicate

**Git operations (optional):**
- Run: `git add .aiknowsys/learned/<pattern>.md`
- Suggest commit but don't auto-commit
- User decides timing

## Success Criteria

- [ ] Agent can suggest sharing during session
- [ ] Agent can list personal patterns on request
- [ ] Agent can share single pattern with duplicate check
- [ ] Agent can merge duplicates intelligently
- [ ] Agent can bulk share multiple patterns
- [ ] End-of-session sharing suggestions work
- [ ] Session file updated with sharing actions
- [ ] All file operations are safe (no data loss)
```

---

### Phase 2: Backend Support (Commands for Agent Use)

**Note:** CLI commands exist for agents to invoke programmatically, not for users to run.

**Commands needed:**
1. ✅ `learn` - Already exists (create pattern in personal/)
2. ✅ `share-pattern` - Already exists (can be invoked by agent)
3. ✅ `list-patterns` - Already exists (agent can invoke to get list)

**Agent skill invokes these via file operations, not CLI:**
- Agents can read/write files directly
- No need to shell out to CLI commands
- Faster, more reliable, easier to test

---

### Phase 3: Register Skill

**Update:** `.github/skills/README.md` or skill registry

**Entry:**
```markdown
- **pattern-sharing** - Share personal patterns with team
  - Triggers: "share pattern", "share with team", "make this team knowledge"
  - Workflow: Check duplicates, merge if needed, move personal → learned
  - Examples: Share API retry pattern, bulk share all patterns
```

**Update:** `lib/commands/install-skills.js` (if skills are installed via command)

---

## Other Commands Fit for Skill Pattern

**Based on research of all 23 commands, these should be skills:**

### 1. **compress-essentials** → Skill

**Current:** User runs `npx aiknowsys compress-essentials --analyze`

**Better as skill:**
```
Agent (during session): "I noticed CODEBASE_ESSENTIALS.md is 1,200 lines (target: <800).

I can extract bloat to learned skills:
 • Common Gotchas section → learned/common-gotchas.md (150 lines)
 • Testing Patterns section → learned/testing-patterns.md (200 lines)

This would reduce ESSENTIALS to 850 lines. Want me to do this?"

User: "yes"

Agent: [Runs compress-essentials extract, updates ESSENTIALS]
"✅ Compressed! ESSENTIALS now 850 lines (within target)."
```

**Trigger words:** "essentials too long", "compress essentials", "reduce bloat"

### 2. **archive-sessions** → Skill

**Current:** User runs `npx aiknowsys archive-sessions --days 30`

**Better as skill:**
```
Agent (at session start): "You have 15 session files older than 30 days.

Would you like me to archive them to keep the workspace clean?
This moves them to .aiknowsys/archived/sessions/2026-Q1/"

User: "yes"

Agent: [Archives sessions, updates session file]
"✅ Archived 15 old sessions. Workspace cleaner!"
```

**Trigger words:** "too many sessions", "clean up sessions", "archive old sessions"

### 3. **archive-plans** → Skill

**Current:** User runs `npx aiknowsys archive-plans --days 90`

**Better as skill:**
```
Agent (during planning): "You have 8 completed plans older than 90 days:
 • PLAN_context7_integration.md (completed Dec 2025)
 • PLAN_vscode_hooks_phase1.md (completed Jan 2026)
 ...

Archive these to clean up your plans/ directory?"

User: "yes"

Agent: [Archives plans, updates plan pointers]
"✅ Archived 8 plans to .aiknowsys/archived/plans/2025-Q4/"
```

**Trigger words:** "archive old plans", "clean up plans", "too many plans"

### 4. **quality-check** → Skill

**Current:** User runs `npx aiknowsys quality-check`

**Better as skill:**
```
Agent (before claiming "done"): "Running quality checks...

 ✅ Tests: 612/612 passing
 ✅ Lint: No errors
 ✅ Type check: No errors
 ⚠️  Build: 2 warnings (unused imports)

Want me to fix the warnings?"

User: "yes"

Agent: [Removes unused imports, re-runs checks]
"✅ All quality checks passing!"
```

**Trigger words:** "quality check", "validate everything", "ready to commit"

### 5. **deps-health** → Skill

**Current:** User runs `npx aiknowsys deps-health`

**Better as skill:**
```
Agent (periodic check): "I noticed some dependencies are outdated:
 • chalk 5.6.2 → 5.7.0 (minor update, safe)
 • commander 14.0.2 → 14.1.0 (minor update, safe)
 • inquirer 13.2.1 → 13.3.0 (minor update, has security fix ⚠️)

Update the one with security fix?"

User: "yes"

Agent: [Updates inquirer, runs tests]
"✅ Updated inquirer to 13.3.0. All tests passing."
```

**Trigger words:** "check dependencies", "outdated packages", "security updates"

### 6. **list-patterns** → Skill (Enhancement)

**Current:** User runs `npx aiknowsys list-patterns`

**Better as skill:**
```
User: "what patterns do I have?"

Agent: [Reads personal/ and learned/]
"You have:

PERSONAL (3 patterns - not shared):
 • api-rate-limiting.md (used 8 times this week - suggest sharing!)
 • vue-composable.md
 • temp-notes.md

TEAM (12 patterns - shared):
 • database-pooling.md (by you, Jan 2026)
 • error-handling.md (by colleague, Dec 2025)
 ...

Want to share the high-usage one (api-rate-limiting)?"
```

**Trigger words:** "list patterns", "what patterns", "show patterns"

---

## Skills vs Commands Matrix

| Command | User Runs? | Agent Uses? | Should Be Skill? |
|---------|-----------|-------------|------------------|
| init | ✅ Yes | ❌ No | ❌ No (setup only) |
| scan | ✅ Yes | ⚠️ Maybe | ⚠️ Maybe |
| migrate | ✅ Yes | ❌ No | ❌ No (one-time) |
| install-agents | ✅ Yes | ❌ No | ❌ No (setup) |
| install-skills | ✅ Yes | ❌ No | ❌ No (setup) |
| update | ✅ Yes | ❌ No | ❌ No (maintenance) |
| check | ❌ No | ✅ Yes | ❌ No (validation) |
| sync | ❌ No | ✅ Yes | ❌ No (internal) |
| sync-plans | ❌ No | ✅ Yes | ❌ No (internal) |
| migrate-to-multidev | ✅ Yes | ❌ No | ❌ No (one-time) |
| audit | ⚠️ Maybe | ✅ Yes | ⚠️ Maybe |
| **learn** | ❌ No | ✅ Yes | ✅ **YES** |
| **share-pattern** | ❌ No | ✅ Yes | ✅ **YES** |
| **list-patterns** | ❌ No | ✅ Yes | ✅ **YES** |
| **compress-essentials** | ❌ No | ✅ Yes | ✅ **YES** |
| **archive-sessions** | ❌ No | ✅ Yes | ✅ **YES** |
| **archive-plans** | ❌ No | ✅ Yes | ✅ **YES** |
| **quality-check** | ❌ No | ✅ Yes | ✅ **YES** |
| ci-check | ✅ Yes (CI) | ❌ No | ❌ No (CI-only) |
| **clean** | ❌ No | ✅ Yes | ⚠️ Maybe |
| **deps-health** | ❌ No | ✅ Yes | ✅ **YES** |
| config | ⚠️ Maybe | ⚠️ Maybe | ❌ No (config) |
| plugins | ⚠️ Maybe | ⚠️ Maybe | ❌ No (meta) |

**Skills needed (9 total):**
1. ✅ **pattern-sharing** (this plan)
2. **essentials-compression** (detect bloat, suggest extraction)
3. **session-archival** (suggest archiving old sessions)
4. **plan-archival** (suggest archiving completed plans)
5. **quality-validation** (pre-commit checks, suggest fixes)
6. **dependency-maintenance** (suggest updates, especially security)
7. **pattern-discovery** (list patterns, suggest sharing)
8. **workspace-cleanup** (clean generated files, suggest maintenance)
9. **pattern-creation** (assist in creating learned patterns)

---

## Implementation Phases

### Phase 1: Pattern Sharing Skill (This Plan)

**Time:** 3-4 hours

1. Create `.github/skills/pattern-sharing/SKILL.md` (45 min)
2. Test with sample patterns (30 min)
3. Document in AGENTS.md (15 min)
4. Validate with real workflow (30 min)

**Deliverable:** Functional pattern-sharing skill

---

### Phase 2: Maintenance Skills (Future)

**Time:** 2-3 hours each

Skills to create (in order of value):
1. quality-validation (high value - prevents bugs)
2. essentials-compression (medium value - keeps ESSENTIALS lean)
3. dependency-maintenance (medium value - security)
4. session-archival (low value - nice to have)
5. plan-archival (low value - nice to have)

**Not in v0.9.0** - Future versions (v0.10.0+)

---

## Success Criteria

**Phase 1 (Pattern Sharing):**
- [ ] Skill file created and documented
- [ ] Agent can suggest sharing during session
- [ ] Agent can list personal patterns
- [ ] Agent can share with duplicate checking
- [ ] Agent can merge duplicate patterns
- [ ] End-of-session suggestions work
- [ ] Session file updated with sharing actions

**Phase 2 (Other Skills):**
- [ ] All 9 maintenance skills identified
- [ ] Priority order established
- [ ] Implementation plans created for top 3

---

## Estimated Time

**Phase 1: Pattern Sharing Skill**
- Skill creation: 45 min
- Testing: 30 min
- Documentation: 15 min
- Validation: 30 min
- **Total: 2 hours**

**Phase 2: Other Skills (deferred to v0.10.0+)**
- Per skill: 2-3 hours
- 9 skills × 2.5 hours = ~22.5 hours
- **Not in scope for v0.9.0**

---

## Notes for Implementation

**Pattern-sharing skill should be:**
- Conversational (not command-driven)
- Intelligent (detect duplicates, suggest merges)
- Gentle (remind, don't nag)
- Documented (clear examples)

**Other skills follow same pattern:**
- Agent detects situation (bloat, old files, outdated deps)
- Agent suggests action
- User approves
- Agent executes and confirms

**Philosophy:**
Users shouldn't need to know CLI commands exist. They just talk to the agent, and the agent does the right thing.

---

*This plan converts CLI-driven workflows into AI-assisted conversations. Users benefit without learning commands.*
