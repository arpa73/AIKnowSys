# Implementation Plan: Review Pointer System

**Status:** 📋 PLANNED  
**Created:** 2026-01-31  
**Goal:** Prevent review collisions by implementing a pointer pattern for architect reviews

---

## Problem Analysis

### Current Issue

**File:** `.aiknowsys/PENDING_REVIEW.md` (single file)

**Problem:** When multiple phases are reviewed concurrently or consecutively:
1. Phase 3 review written → PENDING_REVIEW.md created
2. Developer addresses Phase 3 issues → File updated to "✅ Addressed"
3. Phase 4 review starts → Overwrites Phase 3 content
4. **Result:** Lost history, mixed content, confusion

**Evidence from Session:**
```markdown
# ✅ Architect Review - Issues Addressed  # ← Phase 3 header
**Topic:** VSCode Hooks Phase 3           # ← Phase 3
...
# ⚠️ Architect Review Pending              # ← Phase 4 header (collision!)
**Topic:** Phase 4                         # ← Phase 4
```

### Why This Matters

1. **Lost History** - Can't reference what was reviewed/fixed in Phase 3 later
2. **Collision Risk** - Multiple reviews happening creates file conflicts
3. **No Tracking** - Can't see "3 reviews pending" at a glance
4. **Inefficient** - Developer might not know which review to prioritize

---

## Proposed Solution: Review Pointer Pattern

**Inspired by:** `.aiknowsys/CURRENT_PLAN.md` (multiple plans, single pointer)

### New Structure

```
.aiknowsys/
├── PENDING_REVIEWS.md          ← Lightweight index (pointer)
├── REVIEW_phase3_workspace.md  ← Individual review
├── REVIEW_phase4_quality.md    ← Individual review
└── REVIEW_*.md                 ← Future reviews
```

### PENDING_REVIEWS.md (Pointer File)

```markdown
# Pending Reviews Index

**Active Reviews:** 2 pending, 1 addressed  
**Last Updated:** 2026-01-31

This file is a lightweight index pointing to individual reviews.

---

## Review Status Table

| Review | Status | Topic | Architect | Date |
|--------|--------|-------|-----------|------|
| [Phase 4 Quality](REVIEW_phase4_quality.md) | ⏳ PENDING | Quality checkers | Senior Arch | 2026-01-31 |
| [Phase 3 Workspace](REVIEW_phase3_workspace.md) | ✅ ADDRESSED | Archive commands | Senior Arch | 2026-01-31 |

---

## For Developer

**When review appears:**
1. Read this file to see pending reviews
2. Open the linked `REVIEW_*.md` file
3. Address issues listed
4. Update status in individual review file
5. Update status in this table
6. Delete individual review file OR move to archive

**Priority:** Address reviews in order (oldest first, or by urgency tag)
```

### Individual Review Files

**Naming:** `REVIEW_<phase>_<topic>.md`

**Examples:**
- `REVIEW_phase3_workspace.md`
- `REVIEW_phase4_quality.md`
- `REVIEW_compression_performance.md`

**Format:**
```markdown
# Architect Review: [Topic]

**Status:** ⏳ PENDING / ✅ ADDRESSED / 🔄 IN PROGRESS  
**Date:** 2026-01-31  
**Reviewer:** Senior Architect  
**Phase:** Phase 4  
**Topic:** Code Quality & Health Monitoring

---

## Issues Found

### [CRITICAL] Issue Title
...

### [MEDIUM] Issue Title
...

---

## Developer Response

**Status:** ✅ ALL ISSUES ADDRESSED  
**Date:** 2026-01-31

### Issue 1: [Title] - FIXED ✅
- Applied fix: ...
- Validation: ...

...

---

## Architect Verification

**Status:** ✅ APPROVED  
**Final Comments:** Production ready
```

---

## Benefits

### ✅ Advantages

1. **No Collisions** - Each review is a separate file
2. **Historical Record** - All reviews preserved
3. **Multiple Concurrent** - Can have 5 reviews pending simultaneously
4. **Clear Tracking** - Table shows all reviews at a glance
5. **Prioritization** - Can mark urgent reviews
6. **Archive Pattern** - Move completed reviews to `.aiknowsys/archive/reviews/`
7. **Consistency** - Matches CURRENT_PLAN.md pattern (familiar)

### 📊 Comparison

| Aspect | Current (Single File) | New (Pointer Pattern) |
|--------|----------------------|----------------------|
| Concurrent reviews | ❌ Collides | ✅ Supports |
| Historical record | ❌ Overwritten | ✅ Preserved |
| Status tracking | ⚠️ Manual | ✅ Table view |
| Prioritization | ❌ N/A | ✅ Sortable |
| Discoverability | ⚠️ Single file | ✅ Index + files |

---

## Implementation Plan

### Phase 1: Create Pointer Infrastructure

**Step 1: Create PENDING_REVIEWS.md template**
**File:** `templates/PENDING_REVIEWS.template.md`

**Action:** Create pointer file template
```markdown
# Pending Reviews Index

**Active Reviews:** 0 pending  
**Last Updated:** {{DATE}}

This file is a lightweight index pointing to individual reviews.

---

## Review Status Table

| Review | Status | Topic | Reviewer | Date |
|--------|--------|-------|----------|------|
| *No pending reviews* | - | - | - | - |

---

## Status Legend

- ⏳ **PENDING** - Awaiting developer action
- 🔄 **IN PROGRESS** - Developer actively addressing
- ✅ **ADDRESSED** - All issues resolved, awaiting verification
- ✅ **APPROVED** - Architect verified, production ready

## For Architect

**When creating new review:**
1. Create `REVIEW_<phase>_<topic>.md` in `.aiknowsys/`
2. Add row to table above with ⏳ PENDING status
3. Update "Active Reviews" count
4. Write detailed review in individual file

## For Developer

**When review appears:**
1. Read this file to see pending reviews
2. Open the linked `REVIEW_*.md` file
3. Address issues listed
4. Update status: ⏳ PENDING → 🔄 IN PROGRESS → ✅ ADDRESSED
5. Notify architect for verification

**Priority:** Address reviews in order (oldest first, or by urgency tag)
```

**Step 2: Create individual review template**
**File:** `templates/REVIEW.template.md`

**Action:** Create individual review template
```markdown
# Architect Review: {{TOPIC}}

**Status:** ⏳ PENDING  
**Date:** {{DATE}}  
**Reviewer:** {{REVIEWER}}  
**Phase:** {{PHASE}}  
**Topic:** {{TOPIC}}  
**Files Reviewed:** {{FILE_COUNT}}

---

## Summary

**Issues Found:** {{ISSUE_COUNT}}  
**Severity Breakdown:**
- Critical: {{CRITICAL_COUNT}}
- Medium: {{MEDIUM_COUNT}}
- Low: {{LOW_COUNT}}

---

## Issues Found

### [CRITICAL] Issue Title

**Location:** [file.js](../file.js#L123)

**Problem:** Description

**Why this matters:** Impact explanation

**Recommendation:** How to fix

---

### [MEDIUM] Issue Title

...

---

## Code Quality Assessment

**✅ Strengths:**
- Point 1
- Point 2

**⚠️ Issues:**
- Issue 1
- Issue 2

---

## Compliance Check

| Invariant | Status | Notes |
|-----------|--------|-------|
| ES Modules Only | ✅ PASS | ... |
| Absolute Paths | ✅ PASS | ... |
...

---

## Developer Response Section

**Status:** *Awaiting developer action*

*Developer: Add your responses below each issue*

### Issue 1: [Title] - STATUS

**Actions Taken:**
- [ ] Action 1
- [ ] Action 2

**Validation:**
- [ ] Tests passing
- [ ] Manual verification

---

## Architect Verification

**Status:** *Pending developer response*

*Architect: Review developer responses and update status*
```

### Phase 2: Migration Strategy

**Step 3: Migrate existing PENDING_REVIEW.md**

**Action:** Split current file into individual reviews

1. **Identify reviews in current file:**
   - Phase 3 review (workspace-health)
   - Phase 4 review (quality checkers)

2. **Extract Phase 3 review:**
   - Create `REVIEW_phase3_workspace.md`
   - Copy Phase 3 content
   - Status: ✅ ADDRESSED (already resolved)

3. **Extract Phase 4 review:**
   - Create `REVIEW_phase4_quality.md`
   - Copy Phase 4 content
   - Status: ✅ ADDRESSED (just completed)

4. **Create PENDING_REVIEWS.md:**
   - List both reviews in table
   - Both marked ✅ ADDRESSED
   - Active reviews: 0

5. **Archive or delete PENDING_REVIEW.md:**
   - Move to `.aiknowsys/archive/PENDING_REVIEW.md.backup`
   - Or delete if content extracted to individual files

**Step 4: Update AGENTS.md**

**File:** `AGENTS.md`

**Action:** Document review pointer pattern

Add section to AGENTS.md:
```markdown
## Architect Review Pattern

**Multiple concurrent reviews** enabled via pointer system.

**.aiknowsys/PENDING_REVIEWS.md:**
- Lightweight index file (pointer)
- Lists all reviews with status
- Shows pending vs addressed

**Individual Reviews (.aiknowsys/REVIEW_*.md):**
- Full review details
- Developer responses
- Verification status

**Workflow:**
1. Architect creates REVIEW_*.md
2. Updates PENDING_REVIEWS.md table
3. Developer addresses issues
4. Updates status in both files
5. Architect verifies and approves
6. Review archived or deleted

**Status Lifecycle:**
⏳ PENDING → 🔄 IN PROGRESS → ✅ ADDRESSED → ✅ APPROVED

See: [AGENTS.md](AGENTS.md#architect-review-pattern)
```

### Phase 3: Update Agent Instructions

**Step 5: Update Architect agent instructions**

**File:** `.github/agents/architect.md` (if exists) or AGENTS.md

**Action:** Update review creation process

**OLD:**
```markdown
- Architect writes review to `.aiknowsys/PENDING_REVIEW.md`
```

**NEW:**
```markdown
**Review Workflow:**

1. **Create individual review file:**
   ```bash
   .aiknowsys/REVIEW_<phase>_<topic>.md
   ```

2. **Update PENDING_REVIEWS.md table:**
   - Add new row
   - Set status: ⏳ PENDING
   - Increment "Active Reviews" count

3. **Write detailed review in individual file**

4. **Notify Developer:**
   - Update session file with review marker
   - Point to PENDING_REVIEWS.md in response
```

**Step 6: Update Developer workflow**

**Action:** Update AGENTS.md with new workflow

**Add to "SESSION START PROTOCOL":**
```markdown
### Before Making ANY Code Changes:

**Step 0: Check for Pending Reviews**
```
1. Read .aiknowsys/PENDING_REVIEWS.md
2. If reviews pending (⏳ or 🔄):
   - Read individual REVIEW_*.md files
   - Address issues BEFORE starting new work
   - Update status: ⏳ → 🔄 IN PROGRESS
3. When complete:
   - Mark ✅ ADDRESSED in review file
   - Update PENDING_REVIEWS.md table
   - Request verification from Architect
```

**Step 1: Read Context** (existing)
...
```

### Phase 4: Testing & Validation

**Step 7: Test the new pattern**

**Scenario 1: Single pending review**
1. Create REVIEW_test1.md with ⏳ PENDING
2. Update PENDING_REVIEWS.md
3. Developer reads, addresses, marks ✅ ADDRESSED
4. Verify no collisions

**Scenario 2: Multiple concurrent reviews**
1. Create REVIEW_test2.md (⏳ PENDING)
2. Create REVIEW_test3.md (⏳ PENDING)
3. Both listed in PENDING_REVIEWS.md
4. Developer addresses test2 first → ✅ ADDRESSED
5. test3 remains ⏳ PENDING
6. Verify table updates correctly

**Scenario 3: Review while another in progress**
1. REVIEW_test2.md is 🔄 IN PROGRESS
2. New REVIEW_test4.md created (⏳ PENDING)
3. Both appear in table
4. No collision, no data loss

---

## Success Criteria

- [ ] PENDING_REVIEWS.md template created
- [ ] REVIEW.template.md created
- [ ] Current PENDING_REVIEW.md migrated (split into individual files)
- [ ] AGENTS.md updated with review pointer pattern
- [ ] Architect workflow documented
- [ ] Developer workflow updated
- [ ] Test scenarios pass (no collisions)
- [ ] Historical reviews preserved (Phase 3, Phase 4)
- [ ] Pattern matches CURRENT_PLAN.md consistency

---

## Risks & Mitigations

**Risk:** More files to manage (cognitive overhead)
- **Mitigation:** Index file provides single entry point, table view

**Risk:** Forgetting to update both files (individual + pointer)
- **Mitigation:** Document in AGENTS.md, make it part of checklist

**Risk:** Naming conflicts (two reviews same name)
- **Mitigation:** Use descriptive names with phase/topic: `REVIEW_phase4_quality.md`

**Risk:** Confusion about which file to read
- **Mitigation:** PENDING_REVIEWS.md is the entry point (documented)

---

## Notes for Developer

**Similarities to CURRENT_PLAN.md:**
- Both use pointer pattern
- Both support multiple concurrent items
- Both preserve history
- Both have status lifecycle

**Key Difference:**
- Plans are long-lived (weeks/months)
- Reviews are short-lived (hours/days, then archived)

**Archiving Pattern:**
After review ✅ APPROVED:
1. Move `REVIEW_*.md` to `.aiknowsys/archive/reviews/`
2. OR delete if captured in session file
3. Remove from PENDING_REVIEWS.md table
4. Decrement "Active Reviews" count

**Integration with Sessions:**
Session files should reference reviews:
```markdown
## Architect Review: Quality Checkers (18:30) ✅
**Status:** ADDRESSED  
**Review:** See `.aiknowsys/REVIEW_phase4_quality.md`  
**Outcome:** All issues fixed, tests passing
```

---

## Alternative Considered: Single File with Sections

**Rejected because:**
- Still causes collision when editing
- Harder to track status per review
- No clear separation of concerns
- Doesn't scale to many reviews

**Pointer pattern is superior:**
- Clear separation (1 file = 1 review)
- No editing conflicts
- Easy to track status
- Matches existing CURRENT_PLAN.md pattern

---

## Implementation Estimate

**Time:** 1-2 hours
**Complexity:** Low (similar to plan management system)
**Files Created:** 2 templates, 2-3 individual reviews
**Files Modified:** AGENTS.md, existing PENDING_REVIEW.md (migrate)
**Testing:** 30 min (3 scenarios)

---

*This plan addresses the review collision issue by implementing a pointer pattern similar to CURRENT_PLAN.md, allowing multiple concurrent reviews without conflicts.*
