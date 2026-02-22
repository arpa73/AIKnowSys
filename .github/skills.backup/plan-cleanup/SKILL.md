---
name: plan-cleanup
description: Archive completed plans and clean workspace using CLI commands
triggers:
  - "archive plans"
  - "clean plans"
  - "cleanup workspace"
  - "remove old plans"
  - "archive completed"
maintainer: false
---

# Plan Cleanup & Archival Skill

**What:** Systematically archive completed plans and clean workspace

**When to use:**
- Plans accumulating in `.aiknowsys/` (>20 active plans)
- Completed plans need archival
- Periodic workspace cleanup (monthly/quarterly)
- Before major releases (declutter workspace)
- Plan pointer files getting cluttered

**Commands:** `archive-plans`, `clean`

---

## Prerequisites

- AIKnowSys project initialized
- Plan files exist in `.aiknowsys/PLAN_*.md`
- Plan pointer files in `.aiknowsys/plans/active-*.md` (optional but recommended)

---

## Workflow

### Step 1: Assess Current State

**Check plan count:**
```bash
ls -1 .aiknowsys/PLAN_*.md | wc -l
```

**Preview what would be archived:**
```bash
npx aiknowsys archive-plans --dry-run
```

**Preview full cleanup:**
```bash
npx aiknowsys clean --dry-run
```

---

### Step 2: Choose Cleanup Strategy

**Option A: Archive Completed Plans Only**

Use when:
- You want fine-grained control
- Need to archive specific status (COMPLETE, CANCELLED, PAUSED)
- Want to set custom age threshold

**Command:**
```bash
npx aiknowsys archive-plans --status COMPLETE --threshold 0
```

**Options:**
- `--status <status>` - Archive by status (COMPLETE, CANCELLED, PAUSED, etc.) - default: COMPLETE
- `--threshold <days>` - Archive plans older than N days (use 0 for immediate) - default: 7
- `--dry-run` - Preview without actually moving files

**What it does:**
1. Reads plan pointer files (`.aiknowsys/plans/active-*.md`)
2. Finds plans with matching status and age threshold
3. Moves plan files to `.aiknowsys/archived/plans/`
4. Updates plan pointer files to remove archived references
5. Shows summary of archived vs kept plans

---

**Option B: All-in-One Workspace Cleanup**

Use when:
- Monthly/quarterly cleanup routine
- Want to clean everything at once
- Preparing for release or major milestone

**Command:**
```bash
npx aiknowsys clean
```

**What it cleans:**
1. ✅ Archives old sessions (>30 days by default)
2. ✅ Archives completed plans (COMPLETE status)
3. ✅ Removes temp files and directories (test artifacts, etc.)

**Preview first (recommended):**
```bash
npx aiknowsys clean --dry-run
```

---

### Step 3: Verify Archival

**Check archived plans:**
```bash
ls -1 .aiknowsys/archived/plans/ | grep PLAN_
```

**Check remaining active plans:**
```bash
ls -1 .aiknowsys/PLAN_*.md | wc -l
```

**Verify plan pointers updated:**
```bash
cat .aiknowsys/plans/active-*.md
# Should not reference archived plans
```

---

### Step 4: Commit Changes

**Review changes:**
```bash
git status
# Should show plan files moved to archived/
```

**Commit:**
```bash
git add -A
git commit -m "chore: archive completed plans (cleanup)

Archived X plans to .aiknowsys/archived/plans/:
- PLAN_feature_x.md (completed)
- PLAN_feature_y.md (completed)
...

Result: N plans → M active plans"
```

---

## Common Scenarios

### Scenario 1: Monthly Cleanup Routine

**Goal:** Declutter workspace at end of month

**Steps:**
```bash
# 1. Preview what would be cleaned
npx aiknowsys clean --dry-run

# 2. Review output, ensure nothing important would be removed

# 3. Run cleanup
npx aiknowsys clean

# 4. Verify results
ls -1 .aiknowsys/PLAN_*.md | wc -l
ls -1 .aiknowsys/archived/plans/ | tail -10

# 5. Commit
git add -A
git commit -m "chore: monthly workspace cleanup"
```

---

### Scenario 2: Archive Specific Status

**Goal:** Archive all cancelled plans (failed experiments)

**Steps:**
```bash
# 1. Preview
npx aiknowsys archive-plans --status CANCELLED --dry-run

# 2. Archive
npx aiknowsys archive-plans --status CANCELLED --threshold 0

# 3. Verify
ls -1 .aiknowsys/archived/plans/ | grep CANCELLED

# 4. Commit
git add -A
git commit -m "chore: archive cancelled plans"
```

---

### Scenario 3: Pre-Release Cleanup

**Goal:** Clean workspace before major release

**Steps:**
```bash
# 1. Archive completed plans from this release cycle
npx aiknowsys archive-plans --status COMPLETE --threshold 0

# 2. Archive old sessions (free up space)
npx aiknowsys clean --dry-run  # Preview
npx aiknowsys clean            # Execute

# 3. Verify workspace state
tree .aiknowsys -L 2

# 4. Commit with release context
git add -A
git commit -m "chore: workspace cleanup for v0.11.0 release

Archived completed plans and old sessions
Active plans remaining: $(ls -1 .aiknowsys/PLAN_*.md | wc -l)"
```

---

### Scenario 4: Manual Archival (Without Commands)

**When:** Commands unavailable or need custom logic

**Steps:**
```bash
# 1. Create archive directory if needed
mkdir -p .aiknowsys/archived/plans

# 2. Move completed plans
mv .aiknowsys/PLAN_feature_x.md .aiknowsys/archived/plans/
mv .aiknowsys/PLAN_feature_y.md .aiknowsys/archived/plans/

# 3. Update plan pointer files manually
# Edit .aiknowsys/plans/active-*.md to remove archived plan references

# 4. Verify and commit
git add -A
git commit -m "chore: archive completed plans (manual)"
```

**⚠️ Limitation:** Manual archival doesn't update plan pointer files automatically. Use commands when possible.

---

## Best Practices

### DO ✅

- **Preview first:** Always run `--dry-run` before actual cleanup
- **Commit after archival:** Keep git history clean
- **Archive regularly:** Monthly or after major milestones
- **Use status-based archival:** Archive COMPLETE, CANCELLED separately
- **Keep active plans focused:** <20 active plans per developer ideal
- **Document archival in commit message:** List what was archived

### DON'T ❌

- **Don't archive ACTIVE plans:** Use status transitions first (ACTIVE → COMPLETE)
- **Don't delete archived plans:** Keep for historical reference
- **Don't archive without git:** Risk losing plan history
- **Don't archive plans with uncommitted work:** Complete work first
- **Don't use aggressive thresholds:** `--threshold 0` is safe, avoid high values unless certain

---

## Integration with Plan Management

**Plan Lifecycle:**
1. Create plan: `npx aiknowsys create-plan --title "Feature X"`
2. Work on plan: Update status to ACTIVE
3. Complete work: Update status to COMPLETE
4. Archive plan: `npx aiknowsys archive-plans --status COMPLETE`
5. Historical reference: Plans remain in `.aiknowsys/archived/plans/`

**Plan Pointer Workflow:**
- Plan pointers track active plans per developer
- Archival removes completed plans from pointers automatically
- Pointers keep workspace organized (no manual tracking)

---

## Troubleshooting

### Archive Command Not Found

**Symptom:** `npx aiknowsys archive-plans` → command not recognized

**Solution:**
```bash
# Rebuild CLI
npm run build

# Verify command exists
npx aiknowsys --help | grep archive
```

---

### Plans Not Archived (Kept)

**Symptom:** `archive-plans` reports 0 plans archived

**Possible causes:**
1. Plans don't have COMPLETE status
2. Plans are too recent (within threshold)
3. No plan pointer files exist

**Solutions:**
```bash
# Check plan status
grep -r "status:" .aiknowsys/PLAN_*.md

# Use threshold 0 for immediate archival
npx aiknowsys archive-plans --threshold 0

# Check if plan pointers exist
ls -1 .aiknowsys/plans/active-*.md
```

---

### Accidentally Archived Active Plan

**Symptom:** Archived a plan still being worked on

**Solution:**
```bash
# Move back from archive
mv .aiknowsys/archived/plans/PLAN_feature_x.md .aiknowsys/

# Update plan pointer if needed
# Edit .aiknowsys/plans/active-<username>.md to re-add plan

# Commit restoration
git add -A
git commit -m "chore: restore accidentally archived plan"
```

---

## Related Commands

- `create-plan` - Create new implementation plan
- `update-plan` - Update plan status and content
- `query-plans` - Query plan metadata
- `clean` - All-in-one workspace cleanup

---

## Related Skills

- [context-mutation](../context-mutation/SKILL.md) - Create/update plans and sessions
- [context-query](../context-query/SKILL.md) - Query plans and sessions

---

## See Also

- [Plan Management Learned Pattern](../../.aiknowsys/learned/plan-management.md) - Plan workflow patterns
- [Multi-Developer Plan Tracking](../../docs/multi-developer-workflow.md) - Plan pointer system

---

**Last Updated:** 2026-02-09  
**AIKnowSys Version:** 0.10.0+
