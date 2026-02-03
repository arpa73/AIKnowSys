---
name: plan-management
triggers: multiple plans, pause plan, switch plans, plan pointer, concurrent work, overwrite, team plans, multi-dev
applies_to: [planner, developer]
related_patterns: [session-continuity, context-preservation, multi-developer-collaboration]
problem_solved: plan-overwrites, data-loss, context-switching, merge-conflicts
type: project_specific
confidence: high
last_validated: 2026-02-02
---

# Plan Management System (Multi-Dev Pattern)

## Problem

**Conflicts in plan tracking:**
- Plan files get overwritten when starting new work
- Can't work on multiple initiatives simultaneously
- Lose context when pausing work
- No historical record of completed plans
- **Team conflicts:** Multiple developers editing same CURRENT_PLAN.md causes merge conflicts

## Solution

**Multi-developer pointer-based plan management (v0.9.0+):**

1. **plans/active-<username>.md** = your personal plan pointer (committed)
2. **CURRENT_PLAN.md** = auto-generated team index (committed, read-only)
3. **PLAN_*.md** = actual plan details (committed)
4. **sync-plans** = regenerate team index from individual pointers
5. Clear status tracking (ACTIVE, PAUSED, COMPLETE)

## Pattern

**File Structure:**
```
.aiknowsys/
├── CURRENT_PLAN.md                    # Team index (auto-generated, read-only)
├── PLAN_feature_x.md                  # Alice's active plan
├── PLAN_refactor_y.md                 # Bob's active plan
├── PLAN_sprint_z.md                   # Completed plan
└── plans/                             # Committed to git
    ├── README.md                      # Workflow explanation
    ├── active-alice.md                # Alice's plan pointer
    └── active-bob.md                  # Bob's plan pointer
```

**plans/active-<username>.md Template:**
```markdown
# alice's Active Plan

**Plan:** [Feature X](../PLAN_feature_x.md)
**Status:** 🎯 ACTIVE
**Last Updated:** 2026-02-02

**Summary:** Implementing new feature X
**Next:** Complete Phase 2 testing
```

**CURRENT_PLAN.md (Auto-Generated):**
```markdown
# Current Team Plans

**Last Synced:** Feb 2, 2026, 10:30 PM
**Developer Count:** 2

> ⚠️ AUTO-GENERATED FILE - Do not edit manually

| Developer | Plan | Status | Last Updated |
|-----------|------|--------|--------------|
| alice | [Feature X](PLAN_feature_x.md) | 🎯 ACTIVE | Feb 2, 2026 |
| bob | [Refactor Y](PLAN_refactor_y.md) | 🎯 ACTIVE | Feb 2, 2026 |
```

**Workflow:**

1. **@Planner creates plan:**
   - Create PLAN_<name>.md
   - Update your `plans/active-<username>.md` to point to it
   - Run `npx aiknowsys sync-plans`
   - Set status as ACTIVE

2. **@Developer follows plan:**
   - Check CURRENT_PLAN.md for team overview
   - Read your `plans/active-<username>.md` pointer
   - Open linked PLAN_*.md
   - Update progress in PLAN_*.md

3. **Switch plans:**
   - Edit your `plans/active-<username>.md`
   - Change previous ACTIVE → PAUSED
   - Change target plan to ACTIVE
   - Run `npx aiknowsys sync-plans`
   - Don't delete anything

## Validation

**Test by accident simulation:**
1. Create plan A
2. Start plan B without finishing A
3. Verify plan A content preserved
4. Switch back to A
5. Verify can resume from exact state

**Multi-dev test:**
1. Two developers create different plans
2. Both update their own plan pointers
3. Both run `sync-plans`
4. Verify CURRENT_PLAN.md shows both
5. Verify no merge conflicts

## Real-World Example

**Solo developer (still uses multi-dev pattern):**
- Sprint 2 saved to PLAN_sprint2_quality.md (paused)
- Terminal UX in PLAN_terminal_ux.md (active)
- `plans/active-arno-paffen.md` points to terminal UX
- Can resume Sprint 2 later without reconstruction

**Team scenario:**
- Alice: PLAN_feature_api.md (active)
- Bob: PLAN_refactor_frontend.md (active)
- Each has own plan pointer: `plans/active-alice.md`, `plans/active-bob.md`
- CURRENT_PLAN.md shows both (auto-generated, no conflicts)
- No merge conflicts - each dev owns their pointer

## Benefits

✅ Prevents data loss  
✅ Enables parallel work (personal and team)  
✅ Clear status tracking  
✅ Historical record  
✅ Pause/resume capability  
✅ **No merge conflicts** (each dev has own pointer file)  
✅ **Team visibility** (auto-generated index)  
✅ **Solo-friendly** (works same way with one username)

## Trade-offs

**Pros:**
- Robust to interruptions
- Scales to many plans AND many developers
- Clear active indicator per developer
- No merge conflicts on plan tracking
- Team visibility without coordination overhead
- Solo developers get same workflow (just one entry)

**Cons:**
- One extra indirection (pointer → plan)
- Requires discipline to run `sync-plans`
- Slightly more files to manage
- CURRENT_PLAN.md is read-only (can't edit directly)

**Verdict:** Trade-off worth it - prevents data loss AND team conflicts.

## Migration (v0.9.0+)

**Existing projects pre-v0.9.0:**
```bash
npx aiknowsys migrate-to-multidev
```

This converts:
- Old `CURRENT_PLAN.md` (pointer) → `plans/active-<username>.md`
- Regenerates `CURRENT_PLAN.md` as team index
- Creates `plans/` and `reviews/` directories
- Updates `.gitignore`

**New projects (v0.9.0+):**
Multi-dev pattern created automatically by `npx aiknowsys init`
