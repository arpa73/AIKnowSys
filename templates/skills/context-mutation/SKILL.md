---
name: context-mutation
description: Create and modify AIKnowSys sessions and plans using mutation commands
triggers:
  - "create session"
  - "update session"
  - "create plan"
  - "document work"
  - "record completion"
  - "session notes"
  - "log progress"
  - "mark session complete"
  - "add topic to session"
  - "link file to session"
maintainer: false
---

#Context Mutation Skill

## When to Use

Use this skill when you need to:
- Create new session files with YAML frontmatter
- Update existing session metadata (topics, files, status)
- Create new implementation plans
-  Document completed work in session files
- **INSTEAD OF:** Manual file editing with replace_string_in_file

**Benefits:**
- ✅ YAML frontmatter validation
- ✅ Atomic updates (file + index together)
- ✅ AI-friendly (structured input/output)
- ✅ Prevents schema violations
- ✅ Easier than manual editing

---

## Why Use Commands vs Manual Editing?

**Manual file editing problems:**
- ❌ YAML syntax errors break indexing
- ❌ No validation of frontmatter schema
- ❌ Index not rebuilt (stale data)
- ❌ Easy to forget updating topics/files
- ❌ Harder than using dedicated commands

**Mutation command benefits:**
- ✅ Schema validated automatically
- ✅ Index rebuilt atomically
- ✅ Structured JSON output
- ✅ Duplicate prevention
- ✅ Easier and safer

---

## Commands Available

### create-session

Create a new session file with YAML frontmatter:

```bash
# Create session with topics
npx aiknowsys create-session --topics "TDD,validation" --plan PLAN_context_query

# Create with custom title
npx aiknowsys create-session --title "Bug Fix Session" --topics "debugging"

# JSON output (for AI agents)
npx aiknowsys create-session --topics "refactor" --json
```

**Options:**
- `--topics <topics>` - Comma-separated topics (e.g., "TDD,validation")
- `--plan <plan>` - Link to active plan (e.g., PLAN_xyz)
- `--title <title>` - Session title (default: "Work Session")
- `--json` - Structured JSON output

**JSON Output:**
```json
{
  "filePath": ".aiknowsys/sessions/2026-02-07-session.md",
  "created": true,
  "metadata": {
    "date": "2026-02-07",
    "topics": ["TDD", "validation"],
    "plan": "PLAN_context_query",
    "title": "Work Session"
  }
}
```

**When to use:**
- Starting work on a new feature/task
- No session exists for today yet
- Need to link session to a plan

---

### update-session

Modify today's session metadata:

```bash
# Add topic
npx aiknowsys update-session --add-topic "TypeScript"

# Add file
npx aiknowsys update-session --add-file "lib/commands/create-plan.ts"

# Mark complete
npx aiknowsys update-session --set-status complete

# Multiple updates
npx aiknowsys update-session \
  --add-topic "debugging" \
  --add-file "lib/context/auto-index.ts" \
  --set-status complete
```

**Options:**
- `--add-topic <topic>` - Add topic to session (no duplicates)
- `--add-file <file>` - Add file to session (no duplicates)
- `--set-status <status>` - Set session status (in-progress | complete | abandoned)
- `--appendSection <title>` - Add markdown section header at end (e.g., "## Notes")
- `--content <text>` - Section body content (requires section option)
- `--appendFile <path>` - Append content from markdown file
- `--prependSection <title>` - Add section at beginning (after frontmatter)
- `--insert-after <pattern>` - Insert section after matching pattern
- `--insert-before <pattern>` - Insert section before matching pattern
- `--json` - Structured JSON output

**Shortcuts (v0.11.0):**
- `--done` - Shortcut for `--set-status complete`
- `--wip` - Shortcut for `--set-status in-progress`
- `--append <content>` - Shortcut for `--appendSection "Update"` + auto-detect content/file
  - If content looks like a file path (contains `/` or `.md`), reads from file
  - Otherwise treats as inline markdown content

**Command Aliases (v0.11.0):**
```bash
# Ultra-short commands for common operations
npx aiknowsys done              # → update-session --done
npx aiknowsys wip               # → update-session --wip
npx aiknowsys log "message"     # → update-session --append "message"
```

**Features:**
- Duplicate prevention (topics/files only added once)
- Status validation (only accepts valid enum values)
- Preserves markdown content (only modifies YAML frontmatter)
- Auto-rebuilds index after update

**When to use:**
- Recording work as you complete it
- Marking session complete at end of day
- Adding topics/files incrementally during work
- **INSTEAD OF:** Manual editing of session file

#### Content Manipulation Examples (v0.11.0)

**Append section with inline content:**
```bash
npx aiknowsys update-session \
  --appendSection "## Work Complete" \
  --content "Finished all polishing items.\n\nTests passing: 963/969"
```

**Append content from file:**
```bash
npx aiknowsys update-session --appendFile meeting-notes.md
```

**Combine metadata + content updates:**
```bash
npx aiknowsys update-session \
  --add-topic "polishing" \
  --set-status complete \
  --appendSection "## Summary" \
  --content "Completed all enhancements."
```

**Shortcuts (v0.11.0):**
```bash
# Mark complete (shortcut)
npx aiknowsys update-session --done
# → Same as: --set-status complete

# Quick note with auto-detection
npx aiknowsys update-session --append "Fixed validation bug"
# → Creates "## Update" section with content

# Auto-detect file path
npx aiknowsys update-session --append ./notes.md
# → Reads file and appends (auto-detected from path)

# Ultra-short command aliases
npx aiknowsys done                    # Mark complete
npx aiknowsys wip                     # Mark in-progress
npx aiknowsys log "Fixed bug #123"    # Quick note
```
**Advanced Insertion (Phase 1):**
```bash
# Prepend section at beginning (after frontmatter)
npx aiknowsys update-session \
  --prependSection "## Critical Issue" \
  --content "Security vulnerability found"

# Insert section after specific pattern
npx aiknowsys update-session \
  --insert-after "## Goal" \
  --appendSection "## Implementation" \
  --content "Steps taken..."

# Insert section before specific pattern
npx aiknowsys update-session \
  --insert-before "## Notes" \
  --appendSection "## Changes" \
  --content "List of changes..."
```

**When to use advanced insertion:**
- Prepend: Critical updates that should appear first
- Insert-after: Add content in specific position (e.g., after Goal, before Notes)
- Insert-before: Insert content right before a specific section
---

### create-plan

Generate implementation plan with active pointer:

```bash
# Create plan
npx aiknowsys create-plan --title "API Redesign"

# With custom author
npx aiknowsys create-plan --title "Performance Fix" --author jane-dev

# With topics
npx aiknowsys create-plan --title "TypeScript Migration" --topics "migration,types"

# JSON output
npx aiknowsys create-plan --title "Feature X" --json
```

**Options:**
- `--title <title>` - Plan title (REQUIRED)
- `--author <author>` - Plan author (auto-detected from git config)
- `--topics <topics>` - Comma-separated topics
- `--json` - Structured JSON output

**What it creates:**
- Plan file: `.aiknowsys/PLAN_{title_normalized}.md`
- Active pointer: `.aiknowsys/plans/active-{author}.md`
- Updates context index automatically

**JSON Output:**
```json
{
  "planId": "PLAN_api_redesign",
  "filePath": ".aiknowsys/PLAN_api_redesign.md",
  "activePointer": ".aiknowsys/plans/active-arno.md",
  "created": true
}
```

**When to use:**
- Planning a multi-step feature implementation
- Starting a new development track
- Need to track progress across multiple sessions

---

### update-plan

Modify plan status and progress (v0.12.0):

```bash
# Activate a plan
npx aiknowsys update-plan PLAN_feature_xyz --set-status ACTIVE

# Auto-detect plan from active pointer
npx aiknowsys update-plan --set-status PAUSED

# Add progress note
npx aiknowsys update-plan PLAN_feature_xyz --append "Phase 1 complete: all tests passing"

# Complete plan with final notes
npx aiknowsys update-plan PLAN_feature_xyz \
  --set-status COMPLETE \
  --append "Feature deployed to production"

# Append progress from file
npx aiknowsys update-plan PLAN_feature_xyz --append-file ./sprint-notes.md

# JSON output
npx aiknowsys update-plan PLAN_feature_xyz --set-status ACTIVE --json
```

**Options:**
- `[planId]` - Plan identifier (PLAN_xyz) or omit to auto-detect from active pointer
- `--set-status <status>` - Set plan status (PLANNED|ACTIVE|PAUSED|COMPLETE|CANCELLED)
- `--append <content>` - Inline progress note to append (auto-timestamped)
- `--append-file <file>` - Path to file containing progress notes to append
- `--author <author>` - Plan author for auto-detection (defaults to git user)
- `--json` - Structured JSON output

**Shortcut Commands (v0.12.0):**
```bash
# Ultra-short commands for common status changes
npx aiknowsys plan-activate PLAN_xyz    # → update-plan --set-status ACTIVE
npx aiknowsys plan-complete PLAN_xyz    # → update-plan --set-status COMPLETE
npx aiknowsys plan-pause PLAN_xyz       # → update-plan --set-status PAUSED
npx aiknowsys plan-cancel PLAN_xyz      # → update-plan --set-status CANCELLED
```

**What it does:**
- Updates plan status with automatic timestamp management
- Adds progress notes to ## Progress section (creates if missing)
- Updates active pointer (`.aiknowsys/plans/active-{author}.md`)
- **Automatically runs sync-plans** (updates team plan index)
- Rebuilds context index atomically

**Status Transitions:**
- `PLANNED → ACTIVE`: Adds started date, creates active pointer
- `ACTIVE → PAUSED`: Keeps pointer, no date change
- `PAUSED → ACTIVE`: Restores pointer
- `ACTIVE → COMPLETE`: Adds completed date, clears pointer
- `* → CANCELLED`: Adds completed date, clears pointer

**JSON Output:**
```json
{
  "planId": "PLAN_feature_xyz",
  "filePath": ".aiknowsys/PLAN_feature_xyz.md",
  "updated": true,
  "changes": [
    "Status: PLANNED → ACTIVE",
    "Added progress note"
  ]
}
```

**When to use:**
- Changing plan status (activate, pause, complete, cancel)
- Recording progress throughout implementation
- Completing plan with final summary
- **INSTEAD OF:** Manual editing + manual sync-plans command

**Key Benefits:**
- ✅ Auto-sync eliminates manual sync-plans step
- ✅ Atomic updates (plan file + pointer + index together)
- ✅ YAML validation prevents frontmatter corruption
- ✅ Progress notes auto-timestamped
- ✅ Shortcut commands reduce typing

---

## AI Agent Workflow

### Documenting Completed Work

**Scenario:** You just finished implementing a feature and want to document it.

**Old way (manual editing):**
```markdown
1. Detect: "document work" → No trigger, skill not loaded
2. Use replace_string_in_file on .aiknowsys/sessions/YYYY-MM-DD-session.md
3. Manually format YAML frontmatter (error-prone)
4. No validation, no index rebuild
5. Harder and riskier
```

**New way (mutation commands):**
```markdown
1. Detect: "document work" → context-mutation skill loaded
2. Follow skill guidance:
   npx aiknowsys update-session \
     --add-topic "feature-implementation" \
     --add-file "lib/commands/new-feature.ts" \
     --set-status complete \
     --json
3. Command validates YAML, rebuilds index
4. ✅ Easier, safer, faster
```

### Creating a New Session

**Scenario:** Starting work for the day, session doesn't exist yet.

```bash
# Create session linked to active plan
npx aiknowsys create-session \
  --topics "TypeScript,migration" \
  --plan PLAN_typescript_migration \
  --title "Day 2: Migrate lib/ directory" \
  --json
```

**Output:**
```json
{
  "filePath": ".aiknowsys/sessions/2026-02-07-session.md",
  "created": true,
  "metadata": {
    "date": "2026-02-07",
    "topics": ["TypeScript", "migration"],
    "plan": "PLAN_typescript_migration",
    "title": "Day 2: Migrate lib/ directory"
  }
}
```

**Next steps:**
- Session file created with proper frontmatter
- Index rebuilt automatically
- Ready to document work as you progress

---

## Common Patterns

### End-of-Session Documentation

```bash
# Mark session complete with topics/files
npx aiknowsys update-session \
  --add-topic "refactoring" \
  --add-topic "testing" \
  --add-file "lib/commands/update-session.ts" \
  --add-file "test/update-session.test.ts" \
  --set-status complete \
  --json
```

### Incremental Work Tracking

```bash
# Add topic as you start new workstream
npx aiknowsys update-session --add-topic "debugging"

# Add file as you modify it
npx aiknowsys update-session --add-file "lib/context/auto-index.ts"

# Mark complete when done
npx aiknowsys update-session --set-status complete
```

### Plan-Driven Development

```bash
# 1. Create plan at start of feature
npx aiknowsys create-plan --title "Session Mutation Workflow" --json

# 2. Create daily sessions linked to plan
npx aiknowsys create-session \
  --topics "mutation-commands,session-management" \
  --plan PLAN_session_mutation_workflow \
  --json

# 3. Update session as work progresses
npx aiknowsys update-session \
  --add-file "lib/commands/update-session.ts" \
  --set-status complete
```

---

## Related Commands

For querying existing sessions/plans, see:
- [context-query skill](./../context-query/SKILL.md) - Query plans, sessions, context
- `npx aiknowsys query-sessions --days 7 --json` - Recent sessions
- `npx aiknowsys query-plans --status ACTIVE --json` - Active plans

---

## Output Format

All mutation commands support `--json` flag for structured output:

**Benefits:**
- Easy to parse in AI agent code
- Structured error messages
- File paths for follow-up actions
- Metadata for validation

**Example JSON response:**
```json
{
  "success": true,
  "action": "update-session",
  "filePath": ".aiknowsys/sessions/2026-02-07-session.md",
  "changes": {
    "topicsAdded": ["TypeScript"],
    "filesAdded": ["lib/commands/new.ts"],
    "statusChanged": "complete"
  },
  "indexRebuilt": true
}
```

---

## Error Handling

**Invalid status value:**
```bash
$ npx aiknowsys update-session --set-status invalid
Error: Invalid status. Must be one of: in-progress, complete, abandoned
```

**Session doesn't exist (update-session):**
```bash
$ npx aiknowsys update-session --add-topic "testing"
Error: No session file found for today (2026-02-07).
Create one first: npx aiknowsys create-session --topics "testing"
```

**Missing required option:**
```bash
$ npx aiknowsys create-plan
Error: required option '--title <title>' not specified
```

---

## Best Practices

### Always Use Mutation Commands
- ✅ **DO:** Use `update-session` to modify session files
- ❌ **DON'T:** Use `replace_string_in_file` on `.aiknowsys/sessions/`

### Incremental Updates
- ✅ Update session as work progresses (not just at end)
- ✅ Add topics/files immediately when relevant
- ✅ Mark complete when actually done

### JSON Output for AI Agents
- ✅ Always use `--json` flag in AI agent workflows
- ✅ Parse structured responses for next actions
- ✅ Handle errors gracefully

### Session Lifecycle
1. **Start:** `create-session` with topics/plan
2. **Progress:** `update-session --add-topic/file` as you work
3. **End:** `update-session --set-status complete`

---

## Troubleshooting

**Problem:** "Session file already exists"
- **Solution:** Use `update-session` instead of `create-session`

**Problem:** "Index out of sync"
- **Solution:** Run `npx aiknowsys rebuild-index` (mutation commands do this automatically)

**Problem:** "YAML frontmatter invalid"
- **Solution:** Mutation commands validate frontmatter - this shouldn't happen unless you manually edited

**Problem:** "Duplicate topics/files added"
- **Solution:** Mutation commands prevent duplicates automatically - safe to run multiple times

---

## Next Steps

After using mutation commands:
1. **Query your work:** Use [context-query skill](./../context-query/SKILL.md) to find sessions/plans
2. **Validate:** Run `npx aiknowsys query-sessions --days 1 --json` to confirm session indexed
3. **Continue workflow:** Session metadata guides future AI agent decisions

---

*Part of AIKnowSys v0.10.0+ mutation workflow. See also: [context-query](./../context-query/SKILL.md), [AGENTS.md](../../../AGENTS.md)*
