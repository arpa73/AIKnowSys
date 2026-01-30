# Implementation Plan: Plan Management System

**Status:** ✅ COMPLETE
**Created:** 2026-01-30  
**Completed:** 2026-01-30
**Goal:** Implement pointer-based plan management to prevent overwrites and enable multiple concurrent plans

## Overview

**Problem:** CURRENT_PLAN.md gets overwritten when starting new work (just happened with Terminal UX plan overwriting Sprint 2 at 67% complete).

**Solution:** Make CURRENT_PLAN.md a lightweight pointer/index that references actual plans stored as PLAN_*.md files.

**Benefits:**
- ✅ Prevents accidental overwrites (data loss protection)
- ✅ Multiple plans can coexist (parallel work streams)
- ✅ Pause/resume without losing context
- ✅ Historical tracking (completed plans visible)
- ✅ Clear "what's active" indicator

## Requirements

**Functional:**
- CURRENT_PLAN.md becomes index/pointer (small file)
- Actual plans stored as PLAN_<name>.md
- Agents check CURRENT_PLAN.md first, then follow link
- Can switch active plan by updating pointer
- Completed plans remain visible in index

**Non-functional:**
- Simple pattern (minimal complexity)
- Backward compatible (existing workflows still work)
- Self-documenting (pattern obvious from structure)

## Architecture Changes

**Before:**
```
.aiknowsys/
└── CURRENT_PLAN.md  # Big file, gets overwritten
```

**After:**
```
.aiknowsys/
├── CURRENT_PLAN.md              # Pointer/index (small)
├── PLAN_sprint2_quality.md      # Paused at 67%
├── PLAN_terminal_ux.md          # Active
└── PLAN_*.md                    # Other plans
```

**Files to modify:**
- [.aiknowsys/CURRENT_PLAN.md](.aiknowsys/CURRENT_PLAN.md) - Convert to pointer
- [AGENTS.md](../AGENTS.md) - Update workflow instructions
- [templates/AGENTS.template.md](../templates/AGENTS.template.md) - Update for new users

## Implementation Steps

### Phase 1: Create Pointer Structure

#### Step 1: Design CURRENT_PLAN.md Format
- **Action:** Define pointer file structure
- **Why:** Needs to be clear and self-explanatory
- **Dependencies:** None
- **Risk:** Low - documentation only
- **TDD:** No

**Proposed Format:**
```markdown
# Active Plan Pointer

**Currently Working On:** [Terminal UX Polish](PLAN_terminal_ux.md)  
**Last Updated:** 2026-01-30

---

## All Plans

| Plan | Status | Progress | Last Updated |
|------|--------|----------|--------------|
| [Terminal UX Polish](PLAN_terminal_ux.md) | 🎯 ACTIVE | Planning | 2026-01-30 |
| [Sprint 2: Quality](PLAN_sprint2_quality.md) | 🔄 PAUSED | 67% (Task 2.3: 2/3 tests) | 2026-01-30 |
| [Planner Boundaries](PLAN_planner_boundaries.md) | ✅ COMPLETE | Implemented v0.7.2 | 2026-01-29 |

---

## How This Works

**For @Planner:**
1. Check CURRENT_PLAN.md to see what's active
2. Read the linked PLAN_*.md file for details
3. When creating new plan:
   - Create PLAN_<descriptive-name>.md
   - Update CURRENT_PLAN.md pointer table
   - Set new plan as ACTIVE
4. When switching plans:
   - Update CURRENT_PLAN.md pointer
   - Mark previous plan PAUSED (don't delete!)

**For @Developer:**
1. Read CURRENT_PLAN.md to find active plan
2. Open the linked PLAN_*.md file
3. Follow steps in that plan
4. Update progress in PLAN_*.md (not CURRENT_PLAN.md)
5. When done, mark plan COMPLETE in CURRENT_PLAN.md table

**Plan Naming Convention:**
- `PLAN_<topic>_<variant>.md` - Descriptive, lowercase with underscores
- Examples: `PLAN_terminal_ux.md`, `PLAN_sprint2_quality.md`, `PLAN_icon_reduction.md`

**Status Values:**
- 🎯 ACTIVE - Currently being worked on
- 🔄 PAUSED - Work in progress, temporarily stopped
- ✅ COMPLETE - Finished and validated
- ❌ CANCELLED - Started but abandoned
- 📋 PLANNED - Created but not started yet
```

#### Step 2: Update Existing CURRENT_PLAN.md
- **Action:** Convert current CURRENT_PLAN.md to pointer format
- **Why:** Apply the pattern immediately
- **Dependencies:** Step 1 (design approved)
- **Risk:** Low
- **TDD:** No

**Implementation:**
```markdown
# Active Plan Pointer

**Currently Working On:** [Terminal UX Polish](PLAN_terminal_ux.md)  
**Last Updated:** 2026-01-30

This file is now a lightweight index. See individual PLAN_*.md files for details.

---

## All Plans

| Plan | Status | Progress | Last Updated |
|------|--------|----------|--------------|
| [Terminal UX Polish](PLAN_terminal_ux.md) | 🎯 ACTIVE | Phase 1 planning | 2026-01-30 |
| [Sprint 2: Quality & Real-World](PLAN_sprint2_quality.md) | 🔄 PAUSED | Task 2.3 at 67% | 2026-01-30 |
| [Plan Management System](PLAN_plan_management_system.md) | 📋 PLANNED | This plan | 2026-01-30 |
| [Planner Boundaries](PLAN_planner_boundaries.md) | ✅ COMPLETE | v0.7.2 | 2026-01-29 |

---

## How This Works

[... instructions from Step 1 ...]
```

### Phase 2: Update Agent Instructions

#### Step 3: Update AGENTS.md Workflow (File: `AGENTS.md`)
- **Action:** Add plan pointer workflow to session start protocol
- **Why:** Agents need to know to check pointer first
- **Dependencies:** Step 2
- **Risk:** Low
- **TDD:** No

**Changes to AGENTS.md:**
```markdown
### 0️⃣ SESSION START: Check Context Continuity (FIRST!)

**Before reading ESSENTIALS, check for session continuity:**

1. **Check .aiknowsys/CURRENT_PLAN.md** (pointer file)
   - Read to find active plan
   - Open the linked PLAN_*.md file
   - Review current progress and next steps

2. Check .aiknowsys/sessions/ for recent session files
   - If recent session exists (< 7 days old):
     - Read the latest session file
     - Review "Notes for Next Session"
     - Continue from where previous session ended

3. Acknowledge continuity: "Continuing from [plan/session]..."
```

**New section after "SESSION WORKFLOW":**
```markdown
## 📋 PLAN MANAGEMENT

**Multiple plans can coexist.** CURRENT_PLAN.md is just a pointer.

**Creating a new plan (@Planner):**
1. Create `PLAN_<descriptive-name>.md` in `.aiknowsys/`
2. Update `CURRENT_PLAN.md` table:
   - Add row for new plan
   - Set status to ACTIVE
   - Set previous active plan to PAUSED
3. Write plan details in the new PLAN_*.md file

**Switching plans:**
1. Update CURRENT_PLAN.md pointer
2. Change previous ACTIVE → PAUSED
3. Change target plan PAUSED → ACTIVE
4. Don't delete anything!

**Completing a plan:**
1. Mark status COMPLETE in CURRENT_PLAN.md table
2. Add completion date
3. Leave plan file in place (historical record)
```

#### Step 4: Update Template (File: `templates/AGENTS.template.md`)
- **Action:** Add plan management workflow to template
- **Why:** New users get the pattern from day 1
- **Dependencies:** Step 3
- **Risk:** Low
- **TDD:** No

**Add same sections as Step 3 to template.**

### Phase 3: Documentation Updates

#### Step 5: Update CODEBASE_ESSENTIALS.md (File: `CODEBASE_ESSENTIALS.md`)
- **Action:** Document plan management in Core Patterns
- **Why:** Part of the project's core workflow
- **Dependencies:** Steps 3-4
- **Risk:** Low
- **TDD:** No

**Add to "Core Patterns" section:**
```markdown
### Plan Management Pattern

**Multiple concurrent plans** enabled via pointer system.

**.aiknowsys/CURRENT_PLAN.md:**
- Lightweight index file (pointer)
- Lists all plans with status
- Indicates active plan

**Individual Plans (.aiknowsys/PLAN_*.md):**
- Full implementation details
- Progress tracking
- Phase/step breakdown

**Workflow:**
1. Planner creates PLAN_*.md
2. Updates CURRENT_PLAN.md pointer
3. Developer follows active plan
4. Progress tracked in PLAN_*.md
5. Completed plans stay visible

**Status Lifecycle:**
📋 PLANNED → 🎯 ACTIVE → 🔄 PAUSED or ✅ COMPLETE or ❌ CANCELLED

See: [AGENTS.md](AGENTS.md#plan-management)
```

#### Step 6: Update README.md (File: `README.md`)
- **Action:** Mention plan management in features section
- **Why:** Showcase the multi-plan capability
- **Dependencies:** Step 5
- **Risk:** Low
- **TDD:** No

**Add to features list:**
```markdown
- **Multi-Plan Support** - Work on multiple initiatives simultaneously without losing context
  - CURRENT_PLAN.md as lightweight pointer
  - Individual PLAN_*.md files for details
  - Pause/resume without data loss
```

### Phase 4: Migration & Validation

#### Step 7: Migrate Existing Plans
- **Action:** Move archived Sprint 2 content to PLAN_sprint2_quality.md (already done!)
- **Why:** Apply pattern to current work
- **Dependencies:** Steps 1-6 complete
- **Risk:** Low
- **TDD:** No

**Status:** ✅ Already complete - we saved:
- PLAN_terminal_ux.md (active)
- PLAN_sprint2_quality.md (paused at 67%)

#### Step 8: Create Learned Skill (File: `.aiknowsys/learned/plan-management.md`)
- **Action:** Document this pattern as a learned skill
- **Why:** Reusable pattern for other projects
- **Dependencies:** Step 7
- **Risk:** Low
- **TDD:** No

**Content:**
```markdown
---
name: plan-management
triggers: multiple plans, pause plan, switch plans, plan pointer, concurrent work
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
```

#### Step 9: Validate Workflow
- **Action:** Test the workflow by using it
- **Why:** Ensure pattern actually works
- **Dependencies:** All previous steps
- **Risk:** Low
- **TDD:** Manual workflow testing

**Test Cases:**
1. Create new plan → verify appears in CURRENT_PLAN.md
2. Switch active plan → verify pointer updated correctly
3. Pause plan → verify marked PAUSED, not deleted
4. Resume paused plan → verify all context still there
5. Complete plan → verify marked COMPLETE, not deleted

## Testing Strategy

**No automated TDD required** - this is workflow/documentation change

**Manual Testing:**
1. Follow this plan to implement itself (meta!)
2. Create Terminal UX plan
3. Switch between plans
4. Verify no data loss
5. Verify clear status indicators

## Risks & Mitigations

**Risk:** Agents forget to check pointer  
- **Likelihood:** Medium (new habit)
- **Impact:** Medium (work on wrong plan)
- **Mitigation:** Make it first step in AGENTS.md session start

**Risk:** Pointer gets out of sync with reality  
- **Likelihood:** Low (simple structure)
- **Impact:** Low (just confusing, no data loss)
- **Mitigation:** Regular reviews, validate during handoffs

**Risk:** Too complex for simple projects  
- **Likelihood:** Low (pattern is simple)
- **Impact:** Low (can use single plan if desired)
- **Mitigation:** Document when to use (multi-initiative projects)

## Success Criteria

- [x] CURRENT_PLAN.md converted to pointer format
- [x] PLAN_terminal_ux.md created and active
- [x] PLAN_sprint2_quality.md preserved (paused at 67%)
- [ ] AGENTS.md updated with plan management workflow
- [ ] Template updated for new users
- [ ] CODEBASE_ESSENTIALS.md documents pattern
- [ ] Learned skill created
- [ ] Manual workflow testing complete

## Notes for Developer

**Implementation Order:**
1. Design pointer format (Step 1)
2. Apply to current work immediately (Step 2)
3. Update documentation (Steps 3-6)
4. Create learned skill (Step 8)
5. Validate with usage (Step 9)

**Don't overthink it:**
- Simple table in CURRENT_PLAN.md
- Link to PLAN_*.md files
- That's it!

**This is meta:**
- We're using a plan to implement plan management
- This plan itself should become PLAN_plan_management_system.md
- CURRENT_PLAN.md should point here while implementing

**Completion:**
- When done, update CURRENT_PLAN.md to switch active plan
- Mark this plan COMPLETE
- Resume Terminal UX plan or Sprint 2
