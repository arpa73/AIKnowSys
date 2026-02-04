# Implementation Plan: v0.9.0 Pre-Release Updates

**Status:** 🎯 PLANNING COMPLETE  
**Created:** 2026-02-02 23:30  
**Goal:** Fix all v0.9.0 multi-dev compatibility issues before release

## Overview

v0.9.0 introduces **mandatory multi-developer pattern** (breaking change). During manual plan archival, discovered that `archive-plans` command doesn't work with new structure. Comprehensive research revealed additional files needing updates before release.

**Problem:** v0.9.0 multi-dev pattern changes:
- `CURRENT_PLAN.md`: Now auto-generated team index (read-only), no longer contains full plan table
- `plans/active-<username>.md`: Personal plan pointers (manual editing)
- `reviews/PENDING_<username>.md`: Per-developer review files (replaces `PENDING_REVIEW.md`)

**Impact:** Commands and documentation referencing old single-dev pattern need updates.

## Requirements

**Functional:**
- `archive-plans` command works with multi-dev structure
- `audit` command checks for correct gitignore patterns (reviews/ directory)
- Documentation accurately reflects multi-dev workflow
- Agent files handle multi-dev pattern exclusively (no legacy references)

**Non-Functional:**
- Maintain v0.9.0 breaking change philosophy (no backwards compatibility)
- Clear migration path documented (npx aiknowsys migrate-to-multidev)
- All changes validated with test suite

## Architecture Changes

### Phase 1: Command Updates (CRITICAL)

#### File: [lib/commands/archive-plans.js](../../lib/commands/archive-plans.js)
**Current State:** Reads `CURRENT_PLAN.md` directly (lines 24, 27, 32), expects full plan table
**Problem:** In v0.9.0, `CURRENT_PLAN.md` is auto-generated team index (doesn't contain historical plans)
**Required Changes:**
1. Read all `plans/active-*.md` files instead of `CURRENT_PLAN.md`
2. Parse each personal pointer for completed plans (status: ✅ COMPLETE)
3. Build plan list from aggregated pointers
4. Keep archive logic same (move files, create README, etc.)

#### File: [lib/commands/audit.js](../../lib/commands/audit.js)
**Current State:** Checks for `PENDING_REVIEW.md` gitignore pattern (lines 273, 289, 292)
**Problem:** v0.9.0 uses `reviews/` directory, not `PENDING_REVIEW.md`
**Required Changes:**
1. Replace `PENDING_REVIEW.md` check with `reviews/` directory check
2. Update messages: "reviews/ directory gitignored" (instead of "PENDING_REVIEW.md")
3. Check pattern: `/\.aiknowsys\/reviews\//i` (instead of `PENDING_REVIEW\.md`)

### Phase 2: Documentation Updates (HIGH PRIORITY)

#### File: [docs/advanced-workflows.md](../../docs/advanced-workflows.md)
**Current State:** 4 references to editing `CURRENT_PLAN.md` manually (lines 153, 173, 205, 259)
**Problem:** Instructions assume manual editing of `CURRENT_PLAN.md` (old single-dev pattern)
**Required Changes:**
- Line 153: "Edit `plans/active-<username>.md` to switch work"
- Line 173: "Edit `plans/active-<username>.md` to resume plan"
- Line 205: "plans/active-<username>.md" (heading/section reference)
- Line 259: "plans/active-<username>.md → finds API Auth plan"
- Add note: "Run `npx aiknowsys sync-plans` after editing pointer"

#### File: [docs/deliverables-review-process.md](../../docs/deliverables-review-process.md)
**Current State:** Line 270 references "CURRENT_PLAN.md - Create review plan as active plan"
**Problem:** Should reference personal plan pointer, not auto-generated team index
**Required Change:**
- Line 270: "plans/active-<username>.md - Create pointer to review plan"
- Add note: "Run `npx aiknowsys sync-plans` to update team index"

### Phase 3: Agent File Updates (CRITICAL - Remove Legacy)

#### File: [.github/agents/architect.agent.md](../../.github/agents/architect.agent.md)
**Current State:** Multiple references to `PENDING_REVIEW.md` as "legacy" or "single-dev" fallback (lines 38, 94, 105, 110, 155, 165)
**Problem:** v0.9.0 is mandatory multi-dev (no backwards compatibility), legacy references misleading
**Required Changes:**
1. **Line 38:** Remove "Single-developer: Write to `.aiknowsys/PENDING_REVIEW.md` (legacy)"
2. **Line 94-105:** Remove "(or `PENDING_REVIEW.md`)" from session markers
3. **Line 110:** Remove "Single-dev: `.aiknowsys/PENDING_REVIEW.md` (legacy, for backwards compatibility)"
4. **Line 155:** Remove "(or PENDING_REVIEW.md for single-dev)"
5. **Line 165:** Remove "(or PENDING_REVIEW.md for single-dev)"
6. **Simplify logic:** Always use `reviews/PENDING_<username>.md` (no fallback)

**Reasoning:**
- v0.9.0 MANDATES multi-dev migration (`npx aiknowsys migrate-to-multidev`)
- No user should have `PENDING_REVIEW.md` after migration
- Keeping legacy references creates confusion ("which file do I check?")
- Migration tool already handles conversion (migrate-to-multidev.js)

#### File: [.github/agents/developer.agent.md](../../.github/agents/developer.agent.md)
**Current State:** Lines 84-86 reference `PENDING_REVIEW.md`
**Problem:** Should use multi-dev pattern exclusively
**Required Changes:**
- Line 84: "Read `.aiknowsys/reviews/PENDING_<username>.md` if exists"
- Line 86: "Delete `reviews/PENDING_<username>.md` after addressing all issues"
- Remove all `PENDING_REVIEW.md` references

#### File: [.github/agents/planner.agent.md](../../.github/agents/planner.agent.md)
**Current State:** Line 372 references "PENDING_REVIEW.md" in example workflow
**Problem:** Should show multi-dev pattern in examples
**Required Change:**
- Line 372: "Writes review to `.aiknowsys/reviews/PENDING_<username>.md`"

### Phase 4: Template Updates (MODERATE - Already Correct!)

**Checked templates/AGENTS.template.md:**
- ✅ Already documents multi-dev workflow correctly
- ✅ Uses `plans/active-<username>.md` in examples
- ✅ No legacy single-dev references

**Checked templates/CODEBASE_ESSENTIALS.template.md:**
- ✅ Already uses `CURRENT_PLAN.md` as team index (read-only)
- ✅ Documents multi-dev structure correctly

**No template changes needed!**

### Phase 5: Verify No Other References (LOW PRIORITY)

**Checked and cleared:**
- ❌ README.md: No "single-dev" references found
- ✅ Multi-developer-collaboration.md: Contains historical references (OK - learned pattern documents evolution)
- ✅ PLAN_mandatory_multidev_migration.md: Archived plan (historical record)

**No additional files need updates.**

## Implementation Steps

### Phase 1: Command Updates (20-30 min)

#### Step 1: Fix archive-plans.js Command
**File:** `lib/commands/archive-plans.js`

1. **Read all plan pointers instead of CURRENT_PLAN.md**
   - **Action:** Replace CURRENT_PLAN.md reading with plans/active-*.md reading
   - **Why:** CURRENT_PLAN.md no longer contains full plan history
   - **Dependencies:** None
   - **Risk:** MEDIUM (core command functionality)
   - **Code Change:**
     ```javascript
     // OLD (lines 24-32):
     const currentPlanPath = path.join(aiknowsysDir, 'CURRENT_PLAN.md');
     currentPlanContent = await fs.readFile(currentPlanPath, 'utf-8');
     
     // NEW:
     const plansDir = path.join(aiknowsysDir, 'plans');
     if (!fs.existsSync(plansDir)) {
       log.error('No plans/ directory found - run npx aiknowsys migrate-to-multidev');
       process.exit(1);
     }
     const planPointers = fs.readdirSync(plansDir)
       .filter(f => f.startsWith('active-') && f.endsWith('.md'));
     ```

2. **Parse each pointer file for completed plans**
   - **Action:** Replace plan table regex parsing with pointer file parsing
   - **Why:** Pointers contain plan status, not CURRENT_PLAN.md
   - **Dependencies:** Step 1
   - **Risk:** MEDIUM (parsing logic change)
   - **Code Change:**
     ```javascript
     // OLD (lines 37-48):
     const planTableRegex = /\| \[([^\]]+)\]\(([^)]+)\) \| (✅ COMPLETE|...)/g;
     
     // NEW:
     const plans = [];
     for (const pointerFile of planPointers) {
       const content = fs.readFileSync(path.join(plansDir, pointerFile), 'utf-8');
       const planRegex = /## (.*?)\n\*\*Status:\*\* ✅ COMPLETE/g;
       let match;
       while ((match = planRegex.exec(content)) !== null) {
         const planName = match[1];
         const planFile = `PLAN_${planName.toLowerCase().replace(/\s+/g, '_')}.md`;
         plans.push({ name: planName, file: planFile, status: 'COMPLETE' });
       }
     }
     ```

3. **Test with manual archive scenario**
   - **Action:** Run archive-plans with test data
   - **Why:** Verify parsing logic works with real multi-dev structure
   - **Dependencies:** Steps 1-2
   - **Risk:** LOW (validation step)

#### Step 2: Fix audit.js Gitignore Check
**File:** `lib/commands/audit.js`

1. **Replace PENDING_REVIEW.md check with reviews/ directory check**
   - **Action:** Update regex pattern and messages
   - **Why:** v0.9.0 uses reviews/ directory, not single file
   - **Dependencies:** None
   - **Risk:** LOW (simple pattern replacement)
   - **Code Change:**
     ```javascript
     // OLD (line 273):
     const hasPendingReviewIgnore = /\.aiknowsys\/PENDING_REVIEW\.md/i.test(gitignoreContent);
     
     // NEW:
     const hasReviewsIgnore = /\.aiknowsys\/reviews\//i.test(gitignoreContent);
     
     // OLD (lines 289-292):
     if (!hasPendingReviewIgnore) {
       log.log('  ℹ️  PENDING_REVIEW.md not gitignored (optional)');
     } else {
       log.log('  ✓ PENDING_REVIEW.md gitignored');
     }
     
     // NEW:
     if (!hasReviewsIgnore) {
       log.log('  ⚠️  reviews/ directory not gitignored');
       issues.push({
         type: 'warning',
         category: 'Gitignore Configuration',
         message: 'reviews/ directory should be gitignored (contains temporary review files)',
         fix: 'Add to .gitignore: .aiknowsys/reviews/'
       });
       warnings++;
     } else {
       log.log('  ✓ reviews/ directory gitignored');
     }
     ```

2. **Test with sample .gitignore**
   - **Action:** Create test .gitignore, run audit
   - **Why:** Verify pattern matching works
   - **Dependencies:** Step 1
   - **Risk:** LOW (validation step)

### Phase 2: Documentation Updates (15-20 min)

#### Step 3: Update advanced-workflows.md
**File:** `docs/advanced-workflows.md`

1. **Update all CURRENT_PLAN.md references**
   - **Action:** Replace 4 instances with plans/active-<username>.md + sync-plans note
   - **Why:** Workflow docs must match v0.9.0 pattern
   - **Dependencies:** None
   - **Risk:** LOW (documentation only)
   - **Changes:**
     - Line 153: Replace with plans/active-<username>.md workflow
     - Line 173: Replace with plans/active-<username>.md workflow
     - Line 205: Update section heading/reference
     - Line 259: Update example to use plan pointer
     - Add note after each: "Run `npx aiknowsys sync-plans` to update team index"

#### Step 4: Update deliverables-review-process.md
**File:** `docs/deliverables-review-process.md`

1. **Fix line 270 reference**
   - **Action:** Replace CURRENT_PLAN.md with plans/active-<username>.md
   - **Why:** Review process should use personal pointer, not team index
   - **Dependencies:** None
   - **Risk:** LOW (documentation only)
   - **Change:**
     ```markdown
     // OLD (line 270):
     CURRENT_PLAN.md - Create review plan as active plan during review
     
     // NEW:
     plans/active-<username>.md - Create pointer to review plan during review
     
     Note: Run `npx aiknowsys sync-plans` after creating pointer to update team index.
     ```

### Phase 3: Agent File Updates (15-20 min)

#### Step 5: Clean architect.agent.md (Remove Legacy)
**File:** `.github/agents/architect.agent.md`

1. **Remove all PENDING_REVIEW.md references**
   - **Action:** Delete 6 legacy/single-dev references
   - **Why:** v0.9.0 mandates multi-dev (no backwards compatibility)
   - **Dependencies:** None
   - **Risk:** LOW (simplification)
   - **Changes:**
     - Line 38: Delete entire "Single-developer" bullet
     - Line 94: Remove "(or `PENDING_REVIEW.md`)"
     - Line 105: Remove "(or `PENDING_REVIEW.md`)"
     - Line 110: Delete entire "Single-dev" bullet
     - Line 155: Remove "(or PENDING_REVIEW.md for single-dev)"
     - Line 165: Remove "(or PENDING_REVIEW.md for single-dev)"

2. **Simplify review file logic**
   - **Action:** Remove conditionals, always use reviews/PENDING_<username>.md
   - **Why:** Only one pattern now (no fallback needed)
   - **Dependencies:** Step 1
   - **Risk:** LOW (simplification)

#### Step 6: Clean developer.agent.md
**File:** `.github/agents/developer.agent.md`

1. **Update PENDING_REVIEW.md references**
   - **Action:** Replace with reviews/PENDING_<username>.md
   - **Why:** Consistency with multi-dev pattern
   - **Dependencies:** None
   - **Risk:** LOW (documentation update)
   - **Changes:**
     - Line 84: "Read `.aiknowsys/reviews/PENDING_<username>.md` if exists"
     - Line 86: "Delete `reviews/PENDING_<username>.md` after addressing issues"

#### Step 7: Clean planner.agent.md
**File:** `.github/agents/planner.agent.md`

1. **Fix example workflow**
   - **Action:** Update line 372 to show multi-dev pattern
   - **Why:** Examples should demonstrate current pattern
   - **Dependencies:** None
   - **Risk:** LOW (documentation update)
   - **Change:**
     - Line 372: "Writes review to `.aiknowsys/reviews/PENDING_<username>.md`"

### Phase 4: Testing & Validation (20-25 min)

#### Step 8: Test archive-plans Command
1. **Create test environment**
   - **Action:** Set up test repo with multi-dev structure
   - **Why:** Validate archive-plans works with new logic
   - **Dependencies:** Phase 1 Step 1-2
   - **Risk:** MEDIUM (integration test)

2. **Run archive-plans**
   - **Action:** Execute `npx aiknowsys archive-plans --quarter 2026-Q1`
   - **Why:** Verify completed plans are found and archived
   - **Dependencies:** Step 1
   - **Risk:** MEDIUM (integration test)

3. **Verify results**
   - **Action:** Check that completed plans moved to archive
   - **Why:** Confirm functionality intact
   - **Dependencies:** Step 2
   - **Risk:** LOW (validation)

#### Step 9: Test audit Command
1. **Create test .gitignore**
   - **Action:** Test both with and without reviews/ pattern
   - **Why:** Verify audit detects missing gitignore
   - **Dependencies:** Phase 1 Step 2
   - **Risk:** LOW (simple test)

2. **Run audit**
   - **Action:** Execute `npx aiknowsys audit`
   - **Why:** Confirm reviews/ directory check works
   - **Dependencies:** Step 1
   - **Risk:** LOW (validation)

#### Step 10: Full Test Suite
1. **Run all tests**
   - **Action:** Execute `npm test`
   - **Why:** Ensure no regressions from command changes
   - **Dependencies:** Phases 1-3
   - **Risk:** HIGH (critical validation)

2. **Manual E2E test**
   - **Action:** Test archive-plans, audit, sync-plans commands
   - **Why:** Verify workflow in real scenario
   - **Dependencies:** Step 1
   - **Risk:** MEDIUM (integration test)

### Phase 5: Release Preparation (10-15 min)

#### Step 11: Update RELEASE_NOTES_v0.9.0.md
1. **Add "Pre-Release Compatibility Updates" section**
   - **Action:** Document all changes made in this plan
   - **Why:** Users need to know what was fixed
   - **Dependencies:** All previous steps
   - **Risk:** LOW (documentation)
   - **Content:**
     ```markdown
     ## Pre-Release Compatibility Updates
     
     **Commands:**
     - ✅ archive-plans: Updated to read plans/active-*.md pointers
     - ✅ audit: Now checks for reviews/ directory gitignore
     
     **Documentation:**
     - ✅ advanced-workflows.md: Updated CURRENT_PLAN.md references (4 instances)
     - ✅ deliverables-review-process.md: Updated plan reference
     
     **Agent Files:**
     - ✅ architect.agent.md: Removed legacy PENDING_REVIEW.md references
     - ✅ developer.agent.md: Updated to use reviews/PENDING_<username>.md
     - ✅ planner.agent.md: Updated example workflow
     
     **Why:** v0.9.0 mandates multi-dev pattern. All legacy/backwards-compatible
     references removed for clarity.
     ```

#### Step 12: Final Validation Checklist
- [ ] archive-plans command works with multi-dev structure
- [ ] audit command checks reviews/ directory gitignore
- [ ] All documentation references multi-dev pattern
- [ ] No agent files reference PENDING_REVIEW.md (legacy)
- [ ] Full test suite passes
- [ ] RELEASE_NOTES updated

## Testing Strategy

**TDD Approach:** (commands already have tests, updating existing)
- Update test fixtures to use multi-dev structure
- Modify test assertions for new parsing logic
- Add test case: archive-plans with plans/active-*.md pointers
- Add test case: audit with reviews/ directory check

**Test Coverage:**

**Unit Tests:**
- archive-plans.js: Parse plans from plan pointers (not CURRENT_PLAN.md)
- audit.js: Detect reviews/ directory gitignore pattern

**Integration Tests:**
- archive-plans: Full workflow with multi-dev structure
- audit: Full workflow with and without reviews/ gitignore
- sync-plans: Verify still generates CURRENT_PLAN.md correctly

**Manual Validation:**
1. Create test repo with multi-dev structure
2. Create 3 completed plans in plans/active-test.md
3. Run `npx aiknowsys archive-plans --quarter 2026-Q1`
4. Verify plans archived correctly
5. Run `npx aiknowsys audit`
6. Verify reviews/ directory check works

## Risks & Mitigations

**Risk: archive-plans parsing breaks**
- **Likelihood:** MEDIUM
- **Impact:** HIGH (users can't archive quarterly plans)
- **Mitigation:** 
  * Comprehensive unit tests for new parsing logic
  * Manual E2E test with real multi-dev structure
  * Keep old logic commented out for rollback

**Risk: Documentation updates create confusion**
- **Likelihood:** LOW
- **Impact:** MEDIUM (users follow wrong workflow)
- **Mitigation:**
  * Clear migration notes in each updated doc
  * Link to migrate-to-multidev command
  * Consistent terminology (plan pointer, team index)

**Risk: Agent files break developer workflow**
- **Likelihood:** LOW
- **Impact:** HIGH (developers can't get reviews)
- **Mitigation:**
  * Test architect → developer handoff manually
  * Verify review file paths correct
  * Document in RELEASE_NOTES

**Risk: Test suite failures after command changes**
- **Likelihood:** MEDIUM
- **Impact:** HIGH (can't release with failing tests)
- **Mitigation:**
  * Update test fixtures first
  * Run tests after each change (incremental validation)
  * Keep full test run as final gate

## Success Criteria

- [x] Research complete: All v0.9.0 compatibility issues identified
- [ ] archive-plans.js: Reads plans/active-*.md pointers successfully
- [ ] audit.js: Checks reviews/ directory gitignore pattern
- [ ] docs/advanced-workflows.md: 4 CURRENT_PLAN.md references updated
- [ ] docs/deliverables-review-process.md: Line 270 updated
- [ ] .github/agents/architect.agent.md: 6 legacy references removed
- [ ] .github/agents/developer.agent.md: 2 references updated
- [ ] .github/agents/planner.agent.md: 1 reference updated
- [ ] All tests passing (npm test)
- [ ] Manual E2E tests complete (archive-plans, audit, sync-plans)
- [ ] RELEASE_NOTES_v0.9.0.md updated with compatibility section
- [ ] Zero references to PENDING_REVIEW.md in agent files
- [ ] Zero references to editing CURRENT_PLAN.md manually in docs

## Notes for Developer

**Context:**
- This plan created during pre-release v0.9.0 preparation
- User completed mandatory multi-dev migration
- Manually archived 32 Q1 2026 plans
- Discovered archive-plans command doesn't work with v0.9.0 structure
- Comprehensive research revealed 4 files needing updates

**Key Decisions:**
1. **No backwards compatibility** - v0.9.0 mandates multi-dev (breaking change)
2. **Remove ALL legacy references** - Prevents confusion ("which file do I check?")
3. **Migration tool handles conversion** - migrate-to-multidev.js already exists
4. **Templates already correct** - No template changes needed (already v0.9.0 compliant)

**Gotchas:**
- archive-plans.js: Regex parsing different for plan pointers vs plan table
- Agent files: Developer might wonder why removing legacy support (answer: breaking change mandate)
- Documentation: 4 separate files need updates (easy to miss one)

**Important:**
- Test archive-plans with REAL multi-dev structure (not just unit tests)
- Verify audit checks reviews/ (not PENDING_REVIEW.md)
- Run full test suite before claiming complete
- Update RELEASE_NOTES with comprehensive list of changes

**Estimated Time:** 65-80 minutes total
- Phase 1 (Commands): 20-30 min
- Phase 2 (Docs): 15-20 min
- Phase 3 (Agents): 15-20 min
- Phase 4 (Testing): 20-25 min
- Phase 5 (Release): 10-15 min

**Next:** Hand off to Developer for implementation
