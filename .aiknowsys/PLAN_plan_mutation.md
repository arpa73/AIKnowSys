---
id: "PLAN_plan_mutation"
title: "Plan Mutation Commands"
status: "COMPLETE"
author: "arno-paffen"
created: "2026-02-08"
completed: "2026-02-08"
---

# Implementation Plan: Plan Mutation Commands

**Status:** 📋 PLANNED  
**Created:** 2026-02-08 10:50  
**Goal:** Add `update-plan` command to manage plan lifecycle (status, progress, completion) via mutation commands instead of manual file editing

---

## Overview

Plans currently require manual editing for lifecycle management (activating, pausing, completing). This creates the same issues sessions had before mutation commands:
- Manual editing bypasses YAML validation
- No atomic updates (plan file + active pointer + team index can desync)
- Error-prone (finding insertion points, YAML formatting)
- AI agents must use `replace_string_in_file` instead of validated commands

**Current Pain Points:**

**To activate a plan:**
```bash
# Manual editing required:
# 1. Edit plans/active-username.md (point to plan, set ACTIVE status)
# 2. Edit PLAN_*.md frontmatter (status: PLANNED → ACTIVE, add started date)
# 3. Run sync-plans to update CURRENT_PLAN.md
# 3 separate file edits, no validation, can desync
```

**To mark plan complete:**
```bash
# Manual editing required:
# 1. Edit PLAN_*.md frontmatter (status: ACTIVE → COMPLETE, add completed date)
# 2. Edit plans/active-username.md (set plan to None)
# 3. Run sync-plans to update CURRENT_PLAN.md
# 3 separate file edits, no validation, can desync
```

**To add progress notes:**
```bash
# Manual editing with replace_string_in_file
# Same issues: bypasses validation, error-prone, manual insertion
```

**Solution:**
Add `update-plan` command with:
- Status management (PLANNED → ACTIVE → PAUSED → COMPLETE → CANCELLED)
- **Automatic sync-plans execution** (no manual sync step!)
- Automatic active pointer synchronization
- Progress notes append
- YAML validation
- Atomic operations (file + pointer + index together)

**Key Benefits:**
- ✅ **One command instead of 3 manual edits** (plan file + pointer + sync)
- ✅ **Auto-sync** - No remembering to run `sync-plans` separately
- ✅ **YAML validation** - Catch errors before breaking team index
- ✅ **Atomic updates** - All files update together (no desyncs)
- ✅ **AI-friendly** - Structured commands vs fragile `replace_string_in_file`

---

## Scope Comparison: Plans vs Sessions

| Aspect | Sessions | Plans | Impact on Scope |
|--------|----------|-------|----------------|
| **Update Frequency** | Multiple/day | Few/plan lifetime | Plans: Simpler implementation |
| **Content Type** | Long narratives, many sections | Status + progress notes | Plans: Fewer insertion modes |
| **Complexity** | 8 insertion modes | 2-3 insertion modes | Plans: 60% less code |
| **Current Pain** | ✅ SOLVED | ❌ MANUAL | Plans: High value from simple fix |
| **Development Time** | ~8 hours (10 phases) | ~2 hours (4 phases) | Plans: Quick win |

---

## Requirements

### Functional Requirements
- Status transitions: PLANNED → ACTIVE → PAUSED → COMPLETE → CANCELLED
- Automatic active pointer management (plans/active-username.md)
- Progress notes append capability
- Automatic sync-plans after mutations
- YAML frontmatter validation
- Atomic file + pointer + index updates
- Backward compatible with existing plans

### Non-Functional Requirements
- Commands easier than manual file editing
- Clear error messages for validation failures
- JSON output for AI agent consumption
- Performance <100ms for typical updates

---

## Architecture Changes

### Current State (v0.11.0)

**Plan Commands:**
```bash
npx aiknowsys create-plan --title "Feature X"  # ✅ Creates plan
npx aiknowsys query-plans --status ACTIVE      # ✅ Queries plans
npx aiknowsys sync-plans                       # ✅ Regenerates team index

# ❌ No update-plan command
# ❌ Manual editing for status changes
# ❌ Manual editing for progress notes
# ❌ Manual sync-plans after edits
```

### Proposed State (v0.12.0)

**Extended Plan Commands:**
```bash
# Status management (NEW)
npx aiknowsys update-plan PLAN_xyz --set-status ACTIVE
# → Updates PLAN_*.md frontmatter (status, started date)
# → Updates plans/active-username.md pointer
# → Runs sync-plans automatically
# → Atomic operation (all or nothing)

npx aiknowsys update-plan PLAN_xyz --set-status COMPLETE
# → Updates PLAN_*.md frontmatter (status, completed date)
# → Sets plans/active-username.md to None
# → Runs sync-plans automatically

# Progress tracking (NEW)
npx aiknowsys update-plan PLAN_xyz --append "Phase 1 complete"
# → Appends to ## Progress section
# → YAML validated
# → Index updated

# Shortcuts (NEW)
npx aiknowsys plan-activate PLAN_xyz   # update-plan --set-status ACTIVE
npx aiknowsys plan-complete PLAN_xyz   # update-plan --set-status COMPLETE
npx aiknowsys plan-pause PLAN_xyz      # update-plan --set-status PAUSED
```

---

**2026-02-08:** Phase 1 implementation complete: 19/19 tests passing, CLI integrated

**2026-02-08:** Testing progress append

**2026-02-08:** Phase 3 complete: Documentation updated (context-mutation skill, AGENTS.md, templates synced)

**2026-02-08:** Phase 4 complete: Enforcement hooks updated (mutation-enforcement.cjs, pre-commit validation)

**2026-02-08:** All 4 phases complete! Ready for final validation and plan completion.
## Implementation Steps

### Phase 1: Core update-plan Command (1 hour)

**Goal:** Add basic status management and progress append

#### Step 1.1: Design Options & Interface (10 min)

**New Command:**
```typescript
interface UpdatePlanOptions {
  planId?: string;              // Plan ID (PLAN_xyz) or auto-detect from active
  setStatus?: 'ACTIVE' | 'PAUSED' | 'COMPLETE' | 'CANCELLED';
  append?: string;              // Append to ## Progress section
  appendFile?: string;          // Append from file
  _silent?: boolean;            // Suppress output
  json?: boolean;               // JSON output
}
```

**Design Decisions:**
- Plan ID can be omitted (defaults to user's active plan)
- Status changes automatically update active pointer
- Progress appends to existing ## Progress section (or creates it)
- Automatic sync-plans after all mutations

#### Step 1.2: Implement Status Management (30 min)

**File:** `lib/commands/update-plan.ts`

**Action:**
1. Parse plan ID (from arg or active pointer)
2. Read existing plan file
3. Parse YAML frontmatter
4. Update status field
5. Add/update timestamps (started, completed)
6. Update plans/active-username.md pointer
7. Write plan file atomically
8. Run sync-plans automatically
9. Return structured result (JSON mode)

**Status Transition Logic:**
```typescript
// PLANNED → ACTIVE: Add started date, update active pointer
// ACTIVE → PAUSED: No date change, keep active pointer
// PAUSED → ACTIVE: No date change, restore active pointer
// ACTIVE → COMPLETE: Add completed date, clear active pointer
// * → CANCELLED: Add completed date, clear active pointer
```

**Tests to Write (TDD):**
- Update status: PLANNED → ACTIVE
- Update status: ACTIVE → COMPLETE
- Update status: ACTIVE → PAUSED
- Update status: PAUSED → ACTIVE
- Update status: * → CANCELLED
- Auto-detect plan ID from active pointer
- Error: Plan not found
- Error: Invalid status value
- Error: No active plan when ID omitted
- Verify sync-plans runs automatically
- Verify active pointer updated correctly
- Verify timestamps added correctly

**Expected Test Count:** 12-15 tests

#### Step 1.3: Implement Progress Append (15 min)

**File:** `lib/commands/update-plan.ts`

**Action:**
1. Find ## Progress section in plan content
2. If not exists, create after ## Implementation Steps
3. Append progress note with timestamp
4. Write back atomically
5. Rebuild index

**Progress Format:**
```markdown
## Progress

**[Date]:** [Progress note]
```

**Tests to Write:**
- Append to existing ## Progress section
- Create ## Progress section if missing
- Append from file
- Append with inline content
- Combined: status change + progress append

**Expected Test Count:** 5 tests

#### Step 1.4: CLI Integration & Validation (5 min)

**File:** `bin/cli.js`

**Action:**
- Register `update-plan` command
- Add option parsing
- Add help text with examples

**Validation:**
- Run new tests (17-20 tests)
- Run full test suite (ensure no regressions)
- Manual testing: Create plan, activate, add progress, complete
- Deliverables validation

---

### Phase 2: Shortcuts & Aliases (15 min)

**Goal:** Add convenient shortcuts like sessions have

#### Step 2.1: Add Shortcut Commands (10 min)

**File:** `bin/cli.js`

**Action:** Register aliases:
```typescript
// Status shortcuts
.command('plan-activate <planId>')
  .description('Activate plan (shortcut for update-plan --set-status ACTIVE)')
  .action(async (planId) => updatePlan({ planId, setStatus: 'ACTIVE' }));

.command('plan-complete <planId>')
  .description('Mark plan complete (shortcut for update-plan --set-status COMPLETE)')
  .action(async (planId) => updatePlan({ planId, setStatus: 'COMPLETE' }));

.command('plan-pause <planId>')
  .description('Pause plan (shortcut for update-plan --set-status PAUSED)')
  .action(async (planId) => updatePlan({ planId, setStatus: 'PAUSED' }));

.command('plan-cancel <planId>')
  .description('Cancel plan (shortcut for update-plan --set-status CANCELLED)')
  .action(async (planId) => updatePlan({ planId, setStatus: 'CANCELLED' }));
```

**Tests:**
- Test each shortcut command
- Verify equivalent to full command

**Expected Test Count:** 4 tests

#### Step 2.2: Visual Output Improvements (5 min)

**File:** `lib/commands/update-plan.ts`

**Action:** Add emoji-enhanced output (like update-session):
```typescript
log.header('Plan Updated', '✅');
console.log('\n📝 Changes:');
console.log(`   • Status: ${oldStatus} → ${newStatus}`);
if (progressAdded) {
  console.log(`   • Progress note added`);
}
console.log(`\n📂 File: ${planFile}`);
console.log(`🔍 Index: Rebuilt automatically`);
```

---

### Phase 3: Documentation & Skill Updates (30 min)

**Goal:** Update docs and skills with new commands

#### Step 3.1: Update context-mutation Skill (15 min)

**File:** `.github/skills/context-mutation/SKILL.md`

**Action:** Add plan mutation examples:
```markdown
### Plan Mutations (v0.12.0+)

**Activate plan:**
\`\`\`bash
npx aiknowsys update-plan PLAN_xyz --set-status ACTIVE
# or
npx aiknowsys plan-activate PLAN_xyz
\`\`\`

**Add progress:**
\`\`\`bash
npx aiknowsys update-plan PLAN_xyz --append "Phase 1 complete, 31/31 tests passing"
\`\`\`

**Complete plan:**
\`\`\`bash
npx aiknowsys update-plan PLAN_xyz --set-status COMPLETE
# or
npx aiknowsys plan-complete PLAN_xyz
\`\`\`
```

#### Step 3.2: Sync Template Skill (5 min)

**File:** `templates/skills/context-mutation/SKILL.md`

**Action:** Copy changes from .github version

#### Step 3.3: Update AGENTS.md (10 min)

**File:** `AGENTS.md`

**Action:** Update "SESSION/PLAN FILE MANAGEMENT" section:
```markdown
### 5️⃣½ SESSION/PLAN FILE MANAGEMENT: Use Mutation Commands (MANDATORY v0.11.0+)

**Default: Mutation Commands**
\`\`\`bash
# Sessions
npx aiknowsys update-session --append "Work complete"

# Plans (v0.12.0+)
npx aiknowsys update-plan PLAN_xyz --set-status COMPLETE
npx aiknowsys update-plan PLAN_xyz --append "Phase 1 done"
\`\`\`

**Exception: Manual Editing**
Only manually edit when:
- Commands don't support the required operation
- Fixing YAML corruption (after backup)
- Emergency hotfix with command unavailable
```

---

### Phase 4: Enforcement & Validation (15 min)

**Goal:** Extend hooks to detect plan manual edits

#### Step 4.1: Extend mutation-enforcement Hook (10 min)

**File:** `.github/hooks/mutation-enforcement.cjs`

**Action:** Add plan file detection:
```javascript
// Detect PLAN_*.md edits
if (filePath.includes('/.aiknowsys/PLAN_') && filePath.endsWith('.md')) {
  console.log('\n⚠️  Direct plan file edit detected');
  console.log('\n💡 Consider using mutation commands instead:');
  console.log('   npx aiknowsys update-plan PLAN_xyz --set-status COMPLETE');
  console.log('   npx aiknowsys update-plan PLAN_xyz --append "Progress note"');
  console.log('   npx aiknowsys plan-activate PLAN_xyz');
}

// Detect active-username.md edits
if (filePath.includes('/.aiknowsys/plans/active-') && filePath.endsWith('.md')) {
  console.log('\n⚠️  Direct active plan pointer edit detected');
  console.log('\n💡 Use mutation commands to auto-update pointer:');
  console.log('   npx aiknowsys update-plan PLAN_xyz --set-status ACTIVE');
}
```

**Tests:**
- Detect PLAN_*.md edits
- Detect active-username.md edits
- Verify warnings shown
- Verify non-blocking (exit 0)

**Expected Test Count:** 2-3 tests

#### Step 4.2: Extend pre-commit YAML Validation (5 min)

**File:** `.github/hooks/pre-commit`

**Action:** Add plan YAML validation (similar to sessions):
```bash
# Validate plan frontmatter
if echo "$file" | grep -q "^.aiknowsys/PLAN_.*\.md$"; then
  # Check YAML frontmatter exists
  # Validate required fields (id, title, status, author, created)
  # Warn if status transitions invalid
fi
```

---

## Testing & Validation

**Test Strategy:**
- TDD approach: Write tests BEFORE implementation
- Expected total: ~25-30 new tests
- All existing tests must pass (no regressions)
- Manual testing: Full lifecycle (create → activate → progress → complete)

**Validation Commands:**
```bash
npm test                            # All tests pass
npm run lint                        # No errors
node bin/cli.js update-plan --help  # Help shows correctly
npx aiknowsys validate-deliverables # Templates synced
```

**Manual Test Workflow:**
```bash
# 1. Create plan
npx aiknowsys create-plan --title "Test Plan"

# 2. Activate plan
npx aiknowsys plan-activate PLAN_test_plan

# 3. Add progress
npx aiknowsys update-plan --append "Phase 1 complete"

# 4. Pause plan
npx aiknowsys plan-pause PLAN_test_plan

# 5. Resume plan
npx aiknowsys plan-activate PLAN_test_plan

# 6. Complete plan
npx aiknowsys plan-complete PLAN_test_plan

# 7. Verify active pointer cleared
cat .aiknowsys/plans/active-$(git config user.name | tr ' ' '-').md

# 8. Verify sync ran
cat .aiknowsys/CURRENT_PLAN.md
```

---

## Risks & Mitigations

**Risk 1: Active pointer desyncs**
- **Likelihood:** Medium (multi-file update)
- **Impact:** High (workflow breaks)
- **Mitigation:** Atomic operations (all or nothing), transaction-like updates

**Risk 2: Status transition validation**
- **Likelihood:** Low (simple state machine)
- **Impact:** Medium (invalid states possible)
- **Mitigation:** Explicit validation, clear error messages, tests for all transitions

**Risk 3: Backward compatibility**
- **Likelihood:** Low (additive changes only)
- **Impact:** Medium (breaks existing plans)
- **Mitigation:** No breaking changes, existing plans work unchanged

---

## Success Criteria

- [ ] `update-plan` command implemented and tested (25-30 tests)
- [ ] All status transitions work correctly (PLANNED → ACTIVE → PAUSED → COMPLETE → CANCELLED)
- [ ] Active pointer automatically updated on status changes
- [ ] Progress notes append capability working
- [ ] sync-plans runs automatically after mutations
- [ ] Shortcuts (plan-activate, plan-complete, etc.) working
- [ ] Enforcement hooks detect plan manual edits
- [ ] Documentation updated (skills, AGENTS.md)
- [ ] Templates synced (.github ↔ templates)
- [ ] Full test suite passing (no regressions)
- [ ] Deliverables validation passing

---

## Phase Completion Status

### Planned Phases

- 📋 Phase 1: Core update-plan command (1 hour)
- 📋 Phase 2: Shortcuts & aliases (15 min)
- 📋 Phase 3: Documentation & skill updates (30 min)
- 📋 Phase 4: Enforcement & validation (15 min)

**Total Estimated Time:** ~2 hours

**Complexity:** LOW-MEDIUM (simpler than sessions, reuses patterns)

---

## Related Work

**Depends On:**
- PLAN_session_mutation_workflow.md ✅ COMPLETE (provides patterns/foundation)

**Enables:**
- Consistent mutation workflow across all knowledge system entities
- AI agents can manage full plan/session lifecycle via commands
- Reduced YAML corruption (validation enforced)

**Future Enhancements:**
- `update-plan --add-phase "Phase Name"` (append new phase to plan)
- `update-plan --mark-phase-complete "Phase 1"` (checklist management)
- `merge-plans` command (combine related plans)

---

**Plan Status:** 📋 PLANNED  
**Ready to Implement:** Yes (no blockers, clear scope)  
**Estimated Complexity:** LOW-MEDIUM (reuses session mutation patterns)  
**Risk Level:** LOW (additive changes, backward compatible)
