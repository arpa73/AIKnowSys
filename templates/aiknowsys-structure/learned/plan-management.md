---
name: plan-management
triggers: multiple plans, pause plan, switch plans, plan pointer, concurrent work, overwrite
applies_to: [planner, developer]
related_patterns: [session-continuity, context-preservation]
problem_solved: plan-overwrites, data-loss, context-switching
type: project_specific
confidence: high
last_validated: 2026-01-30
---

# Plan Management System

## Problem

**Single CURRENT_PLAN.md file** creates conflicts:
- Gets overwritten when starting new work
- Can't work on multiple initiatives simultaneously
- Lose context when pausing work
- No historical record of completed plans

## Solution

**Pointer-based plan management:**

1. **CURRENT_PLAN.md** = lightweight index/pointer
2. **PLAN_*.md** = actual plan details
3. Multiple plans coexist peacefully
4. Clear status tracking (ACTIVE, PAUSED, COMPLETE)

## Pattern

**File Structure:**
```
.aiknowsys/
├── CURRENT_PLAN.md           # Pointer (small)
├── PLAN_feature_x.md         # Active plan
├── PLAN_refactor_y.md        # Paused plan
└── PLAN_sprint_z.md          # Complete plan
```

**CURRENT_PLAN.md Template:**
```markdown
# Active Plan Pointer

**Currently Working On:** [Feature X](PLAN_feature_x.md)

## All Plans

| Plan | Status | Progress |
|------|--------|----------|
| [Feature X](PLAN_feature_x.md) | 🎯 ACTIVE | 30% |
| [Refactor Y](PLAN_refactor_y.md) | 🔄 PAUSED | 60% |
| [Sprint Z](PLAN_sprint_z.md) | ✅ COMPLETE | 100% |
```

**Workflow:**

1. **@Planner creates plan:**
   - Create PLAN_<name>.md
   - Update CURRENT_PLAN.md table
   - Set as ACTIVE

2. **@Developer follows plan:**
   - Read CURRENT_PLAN.md pointer
   - Open linked PLAN_*.md
   - Update progress there

3. **Switch plans:**
   - Update CURRENT_PLAN.md pointer
   - Previous ACTIVE → PAUSED
   - Don't delete anything

## Validation

**Test by accident simulation:**
1. Create plan A
2. Start plan B without finishing A
3. Verify plan A content preserved
4. Switch back to A
5. Verify can resume from exact state

## Real-World Example

**Terminal UX work started while Sprint 2 at 67%:**
- Sprint 2 saved to PLAN_sprint2_quality.md (paused)
- Terminal UX in PLAN_terminal_ux.md (active)
- CURRENT_PLAN.md points to terminal UX
- Can resume Sprint 2 later without reconstruction

## Benefits

✅ Prevents data loss  
✅ Enables parallel work  
✅ Clear status tracking  
✅ Historical record  
✅ Pause/resume capability

## Trade-offs

**Pros:**
- Robust to interruptions
- Scales to many plans
- Clear active indicator

**Cons:**
- One extra indirection (pointer → plan)
- Requires discipline to update pointer
- Slightly more files to manage

**Verdict:** Trade-off worth it - data loss prevention is critical.
