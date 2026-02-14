# workspace-maintenance-commands

**Trigger Words:** archive plans, archive sessions, cleanup workspace, old plans, completed plans, session files, workspace maintenance, clean up files

## Problem
Over time, `.aiknowsys/` directory accumulates many completed plans and old session files. Finding what you need becomes harder as clutter grows. Need to organize historical files while keeping workspace focused on active work.

**Common Questions:**
- "Do we have a command to archive old plans?"
- "How do I clean up completed plans?"
- "Where are old session files stored?"
- "How to organize workspace history?"

## Solution
AIKnowSys has built-in workspace maintenance commands implemented in **VSCode Hooks Phase 3**.

### Available Commands

**1. Archive Completed Plans**
```bash
# Preview what would be archived (dry-run)
node bin/cli.js archive-plans --dry-run

# Archive plans completed >7 days ago (default)
node bin/cli.js archive-plans

# Recommended for active teams: 30-60 days
node bin/cli.js archive-plans --threshold 30
node bin/cli.js archive-plans --threshold 60

# Check with dry-run first to find your sweet spot
node bin/cli.js archive-plans --threshold 45 --dry-run
```

**What it does:**
- Moves completed plans from `.aiknowsys/` to `.aiknowsys/archive/YYYY/MM/`
- Updates `CURRENT_PLAN.md` with archived plan locations
- Preserves history (non-destructive move)
- Default: Archives plans completed >7 days ago
- **Tip:** For productive teams, use `--threshold 30` or higher to keep recent wins visible

**2. Archive Old Sessions**
```bash
# Preview what would be archived
node bin/cli.js archive-sessions --dry-run

# Archive sessions >30 days old
node bin/cli.js archive-sessions

# Custom threshold (e.g., 60 days)
node bin/cli.js archive-sessions --threshold 60
```

**What it does:**
- Moves old sessions from `.aiknowsys/sessions/` to `.aiknowsys/sessions/archive/YYYY/MM/`
- Keeps recent sessions easily accessible
- Default: Archives sessions >30 days old

**3. Clean Workspace (All-in-One)**
```bash
# Preview everything that would be cleaned
node bin/cli.js clean --dry-run

# Archive old sessions + completed plans
node bin/cli.js clean
```

**What it does:**
- Runs both archive-sessions and archive-plans
- One command to tidy entire workspace
- Safe to run anytime (dry-run first!)

## Benefits
- ✅ Reduced clutter in `.aiknowsys/` directory
- ✅ Faster file navigation and search
- ✅ History preserved in organized archives
- ✅ Easy to find active vs historical work
- ✅ Non-destructive (can restore from archive)

## Implementation Details

**Plan:** [PLAN_vscode_hooks_phase3.md](../PLAN_vscode_hooks_phase3.md)  
**Status:** ✅ COMPLETE (Jan 31, 2026)

**Source Files:**
- `lib/commands/archive-sessions.js` - Session archiving logic
- `lib/commands/archive-plans.js` - Plan archiving logic
- `lib/commands/clean.js` - Combined cleanup
- `templates/hooks/workspace-health.cjs` - Reminder hook (optional)

**Tests:** `test/archive.test.js` (20+ tests)

## When to Use

**Archive plans when:**
- Working on new feature, old completed plans are noise
- CURRENT_PLAN.md table is too long (>20 completed plans)
- Searching for active plans becomes difficult

**Archive sessions when:**
- `.aiknowsys/sessions/` has >50 files
- Only need recent session context (last month)
- Want faster grep/search in session files

**Run clean command:**
- Monthly workspace maintenance
- Before starting major new feature
- When onboarding new developer (clean slate)

## Configuration

Default thresholds can be customized in `templates/hooks/config.json`:

```json
{
  "archiving": {
    "sessionThresholdDays": 30,
    "planThresholdDays": 7
  }
}
```

## Pro Tips

1. **Always dry-run first:** See what would be archived before committing
2. **Adjust threshold for your pace:** 7 days default is aggressive. For productive teams, try `--threshold 30` to keep recent accomplishments visible
3. **Keep active plan visible:** Archive moves completed plans out of main table
4. **Reversible:** Just move files back from archive/ if needed
5. **Automated reminders:** workspace-health.cjs hook suggests cleanup when needed
6. **Git-friendly:** Archive directories are not gitignored (preserves team history)
7. **Find your sweet spot:** Run with different thresholds in dry-run mode to see what feels right

## Example Workflow

```bash
# Monthly maintenance routine
cd .aiknowsys

# Check what would be cleaned
node ../bin/cli.js clean --dry-run

# If looks good, archive everything
node ../bin/cli.js clean

# Verify CURRENT_PLAN.md updated
cat CURRENT_PLAN.md | grep -A5 "All Plans"
```

## Related

- [PLAN_vscode_hooks_phase3.md](../PLAN_vscode_hooks_phase3.md) - Implementation details
- [documentation-management skill](../../.github/skills/documentation-management/SKILL.md) - Changelog archiving patterns
