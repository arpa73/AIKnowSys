# Active Plan Pointer

**Currently Working On:** [Terminal UX Polish](PLAN_terminal_ux.md)  
**Last Updated:** 2026-01-30

This file is now a lightweight index pointing to actual plans. See individual `PLAN_*.md` files for full details.

---

## All Plans

| Plan | Status | Progress | Last Updated |
|------|--------|----------|--------------|
| [Terminal UX Polish](PLAN_terminal_ux.md) | 🎯 ACTIVE | Starting Phase 1 | 2026-01-30 |
| [Plan Management System](PLAN_plan_management_system.md) | ✅ COMPLETE | All steps done | 2026-01-30 |
| [Sprint 2: Quality & Real-World](PLAN_sprint2_quality.md) | 🔄 PAUSED | Task 2.3 at 67% | 2026-01-30 |
| [Planner Boundaries](PLAN_planner_boundaries.md) | ✅ COMPLETE | Implemented v0.7.2 | 2026-01-29 |

---

## How This Works

### For @Planner

**When starting work:**
1. Check CURRENT_PLAN.md to see what's active
2. Read the linked `PLAN_*.md` file for details
3. Continue that plan OR start a new one

**When creating new plan:**
1. Create `PLAN_<descriptive-name>.md` in `.aiknowsys/`
2. Update this table (add row, set status ACTIVE)
3. Set previous active plan to PAUSED
4. Write full plan details in the new file

**When switching plans:**
1. Update "Currently Working On" pointer above
2. Change previous ACTIVE → PAUSED in table
3. Change target plan to ACTIVE
4. Don't delete anything! Paused plans resume later

### For @Developer

**When receiving handoff:**
1. Read this file to find active plan
2. Open the linked `PLAN_*.md` file
3. Follow steps in that plan
4. Update progress in `PLAN_*.md` (not this file)

**When completing work:**
1. Mark plan status COMPLETE in this table
2. Update "Last Updated" date
3. Leave plan file in place (historical record)

### Plan Naming Convention

**Format:** `PLAN_<topic>_<variant>.md`
- Use lowercase with underscores
- Be descriptive but concise
- Examples: `PLAN_terminal_ux.md`, `PLAN_sprint2_quality.md`

### Status Values

- 🎯 **ACTIVE** - Currently being worked on (only ONE at a time)
- 🔄 **PAUSED** - Work in progress, temporarily stopped
- 📋 **PLANNED** - Created but not started yet
- ✅ **COMPLETE** - Finished and validated
- ❌ **CANCELLED** - Started but abandoned

---

## Why This Pattern?

**Problem:** Old approach had single `CURRENT_PLAN.md` that got overwritten when starting new work. Lost context, lost progress.

**Solution:** Pointer-based system lets multiple plans coexist. Pause/resume without data loss.

**Benefits:**
- ✅ Prevents accidental overwrites
- ✅ Multiple initiatives can exist simultaneously
- ✅ Clear status tracking
- ✅ Historical record preserved
- ✅ Pause/resume capability

---

## Quick Reference

**Check active plan:**
```bash
# Read pointer
cat .aiknowsys/CURRENT_PLAN.md

# Open active plan
# (Currently: PLAN_plan_management_system.md)
```

**List all plans:**
```bash
ls -1 .aiknowsys/PLAN_*.md
```

**Switch to different plan:**
1. Edit this file
2. Update "Currently Working On" pointer
3. Update status in table (ACTIVE ↔ PAUSED)

---

*This pointer system implemented 2026-01-30 to prevent plan overwrites. See [PLAN_plan_management_system.md](PLAN_plan_management_system.md) for implementation details.*

---

## Overview

User feedback: Terminal output has too many icons (defeats the purpose). Some lines have 2 emojis! Need to polish UX with professional ASCII banner and strategic icon usage.

## Requirements

**Functional:**
- Add ASCII art banner at start of `aiknowsys init`
- Reduce icon overuse (max 1 icon per line, only where meaningful)
- Clarify status of legacy bash scripts (deprecate or keep?)

**Non-functional:**
- Professional first impression with banner
- Clean, readable terminal output
- Maintain test coverage (287 tests passing)

## Architecture Changes

**Files to modify:**
- [lib/banner.js](lib/banner.js) - NEW - ASCII art banner utility
- [lib/commands/init.js](lib/commands/init.js) - Import and display banner
- [lib/commands/init/display.js](lib/commands/init/display.js) - Reduce icon spam
- [scripts/README.md](scripts/README.md) - NEW - Document script status
- [README.md](README.md) - Update script references

## Implementation Steps

### Phase 1: Banner Creation & Integration

**Goal:** Professional ASCII art banner at start of setup

#### Step 1: Create Banner Utility (File: `lib/banner.js`)
- **Action:** Create banner.js with ASCII art and display function
- **Why:** Separates banner logic, makes it reusable
- **Dependencies:** None
- **Risk:** Low - cosmetic change
- **TDD:** No - visual output, tested manually

**Implementation:**
```javascript
// lib/banner.js
export const banner = `
   ___   ______ _   __                 _____            
  / _ \\ |_   _|| | / /                /  ___|           
 / /_\\ \\  | |  | |/ / _ __   _____  _\\ \`--.  _   _ ___ 
 |  _  |  | |  |    \\| '_ \\ / _ \\ \\/ /\`--. \\| | | / __|
 | | | | _| |_ | |\\  \\ | | | (_) >  < /\\__/ /| |_| \\__ \\
 \\_| |_/ \\___/ \\_| \\_/_| |_|\\___/_/\\_\\\\____/  \\__, |___/
                                                __/ |    
                                               |___/     
`;

export function displayBanner(log, version) {
  log.log('\x1b[36m' + banner + '\x1b[0m'); // Cyan
  log.dim(`                           AI-Powered Development Workflow v${version}`);
  log.blank();
}
```

#### Step 2: Integrate Banner in init.js (File: `lib/commands/init.js`)
- **Action:** Import banner, call displayBanner() at start of init command
- **Why:** First thing users see - sets professional tone
- **Dependencies:** Step 1
- **Risk:** Low
- **TDD:** Update init tests to check banner appears

**Changes:**
```javascript
// At top of lib/commands/init.js
import { displayBanner } from '../banner.js';
import { readFileSync } from 'fs';
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// In init() function, BEFORE log.header()
export async function init(options) {
  const log = createLogger(silent);
  
  // Show banner first (unless silent)
  if (!silent) {
    displayBanner(log, pkg.version);
  }
  
  log.header('Knowledge System Setup', '🎯');
  // ... rest of init
}
```

### Phase 2: Icon Reduction

**Goal:** Clean up icon spam - max 1 icon per line, only where meaningful

#### Step 3: Audit Current Icon Usage
- **Action:** Review display.js and identify redundant icons
- **Why:** User reported lines with 2+ icons, defeats the purpose
- **Dependencies:** None (analysis only)
- **Risk:** None
- **TDD:** N/A

**Current issues found:**
```javascript
// lib/commands/init/display.js

// ❌ BAD: Double icons on one line
log.success('✨ This demonstrates...');  // Line 176
log.success('✅ Copied to clipboard...'); // Line 181

// ❌ REDUNDANT: Icons in validation matrix table
rows.push(`| Tests | \`${testCmd}\` | ✅ Before commit |`); // Icons in data

// ⚠️ OVERUSE: Icons on section headers
log.section('Summary', '📋');  // Line 61 - section() already adds icon
log.cyan('💡 What happens next:'); // Line 163 - manual icon addition
```

#### Step 4: Simplify Icon Usage (File: `lib/commands/init/display.js`)
- **Action:** Remove redundant icons, keep only meaningful ones
- **Why:** Clean, professional output
- **Dependencies:** Step 3
- **Risk:** Low - cosmetic change
- **TDD:** No - visual output, but verify tests don't break

**Icon Strategy:**
- ✅ **Keep:** Section headers (log.header, log.section already add icons)
- ✅ **Keep:** Success/error messages (but max 1 icon)
- ❌ **Remove:** Icons from table data (validation matrix)
- ❌ **Remove:** Double icons on same line
- ❌ **Remove:** Manual icons when logger adds them

**Changes:**
```javascript
// Remove icons from validation matrix data
rows.push(`| Tests | \`${testCmd}\` | Before commit |`);  // No ✅
rows.push(`| Linting | \`${lintCmd}\` | Before commit |`);  // No ✅
// ... etc

// Fix double icon lines  
log.success('This demonstrates the power of AI-assisted development from day 1!'); // No ✨
log.success('Copied to clipboard! Just paste into your AI assistant.'); // Keep ✅

// Use section() for "What happens next"
log.section('What happens next', '💡'); // Replaces log.cyan('💡 ...')
```

#### Step 5: Review Prompt Text Icons
- **Action:** Audit AI prompt lines for icon overuse
- **Why:** Prompt is copied to AI - should be clean
- **Dependencies:** Step 4
- **Risk:** Low
- **TDD:** No

**Decision:** Keep prompt icons - they're intentional for AI emphasis:
```javascript
'🎯 YOUR GOAL: ...'  // Highlights goal
'📋 WORKFLOW: ...'   // Highlights workflow
'⚠️ PRESERVE ...'    // Highlights warnings
'🚫 DO NOT ...'      // Highlights restrictions
'✅ ONLY ...'        // Highlights what to do
```

### Phase 3: Script Status Documentation

**Goal:** Clarify which bash scripts are deprecated vs actively used

#### Step 6: Document Script Status (File: `scripts/README.md`)
- **Action:** Create README explaining script status
- **Why:** Users are confused about script vs CLI usage
- **Dependencies:** None
- **Risk:** Low - documentation only
- **TDD:** No

**Content:**
```markdown
# Scripts Directory

## Status: LEGACY / MIGRATION PATH

This directory contains bash scripts that were the original setup method. They are now **superseded by the CLI** but kept for:

1. **Migration path** for users who bookmarked old documentation
2. **Cross-reference** for testing CLI feature parity  
3. **Examples** of bash-based setup patterns

## Recommended Approach

✅ **Use the CLI:**
```bash
npx aiknowsys init         # New projects
npx aiknowsys migrate      # Existing projects
npx aiknowsys scan         # Scan codebase
```

❌ **Old bash scripts:**
```bash
./scripts/setup.sh              # → Use: npx aiknowsys init
./scripts/migrate-existing.sh   # → Use: npx aiknowsys migrate
./scripts/scan-codebase.sh      # → Use: npx aiknowsys scan
```

## What About install-git-hooks.sh?

✅ **STILL ACTIVE** - This one is different!

- Copied from `templates/scripts/install-git-hooks.sh` during init
- Runs in USER's project (not aiknowsys itself)
- Installs git hooks for TDD enforcement
- Part of the template system, not a setup script

## Should Scripts Be Removed?

**Not yet.** They serve as:
- Documentation of original design
- Bash implementation reference
- Fallback for environments without Node.js (rare)

**Future:** Mark deprecated in v0.8.x, remove in v1.0.0
```

#### Step 7: Update README.md References (File: `README.md`)
- **Action:** Add note directing users to CLI instead of scripts
- **Why:** Don't send new users down deprecated path
- **Dependencies:** Step 6
- **Risk:** Low
- **TDD:** No

**Changes in README.md:**
```markdown
## Quick Start

```bash
# New project
npx aiknowsys init

# Existing project
npx aiknowsys migrate
```

> **Note:** This package includes legacy bash scripts in `scripts/` directory. See [scripts/README.md](scripts/README.md) for their status. **Use the CLI** for best cross-platform experience.
```

### Phase 4: Testing & Validation

**Goal:** Ensure changes don't break functionality

#### Step 8: Update Test Expectations
- **Action:** Update tests that check for specific output
- **Why:** Icon changes may affect snapshots/assertions
- **Dependencies:** Steps 1-5 complete
- **Risk:** Medium - test updates can introduce bugs
- **TDD:** This IS the testing phase

**Files to check:**
- `test/init.test.js` - May check for specific text/icons
- `test/migrate.test.js` - May check for success messages
- Any snapshot tests

**Validation:**
```bash
npm test                           # All 287 tests should pass
node bin/cli.js init --help        # Should show banner + help
node bin/cli.js init --yes --dir /tmp/test-banner  # Test full flow
```

#### Step 9: Manual Visual Testing
- **Action:** Run init command and verify output looks clean
- **Why:** Icons and banners are visual - automated tests can't judge UX
- **Dependencies:** Step 8
- **Risk:** Low
- **TDD:** Manual testing

**Test cases:**
```bash
# 1. Banner appears at start
npx aiknowsys init --yes --dir /tmp/test1

# 2. No double icons in output
# Check: grep for patterns like "✅ ✅" or "✨ ✅"

# 3. Clipboard message clear and simple
# Should see single icon at end: "✅ Copied to clipboard!"

# 4. Silent mode hides banner
npx aiknowsys init --yes --silent --dir /tmp/test2
# Should see NO banner, minimal output
```

## Testing Strategy

**No new TDD required** - cosmetic/UX changes to existing functionality

**Test Coverage:**
- Unit: Verify banner module exports correctly
- Integration: Init command shows banner (update existing tests)
- Manual: Visual inspection of terminal output
- Regression: All 287 existing tests still pass

## Risks & Mitigations

**Risk:** Test assertions expect specific icons
- **Likelihood:** Medium (tests check output text)
- **Impact:** Low (easy to update test expectations)
- **Mitigation:** Grep tests for icon characters, update assertions

**Risk:** Users rely on specific icon patterns
- **Likelihood:** Low (UX is new, not widely adopted yet)
- **Impact:** Low (cosmetic change only)
- **Mitigation:** Mention in release notes as UX improvement

**Risk:** Banner breaks in some terminals
- **Likelihood:** Low (standard ASCII)
- **Impact:** Low (banner skipped in silent mode anyway)
- **Mitigation:** Test in multiple terminals (VS Code, iTerm2, gnome-terminal)

## Success Criteria

- [ ] ASCII banner displays at start of `aiknowsys init`
- [ ] No lines with 2+ icons (except intentional prompt emphasis)
- [ ] Validation matrix tables don't have icons in data cells
- [ ] Scripts README.md explains deprecation status
- [ ] README.md directs users to CLI over scripts
- [ ] All 287 tests passing
- [ ] Manual testing shows clean, professional output
- [ ] Banner skipped in silent mode (existing behavior preserved)

## Notes for Developer

**Icon Philosophy:**
- Icons draw attention → too many = none stand out
- Use strategically: headers, success/error, warnings
- Avoid in: data tables, body text, repeated messages

**Banner Considerations:**
- ASCII art generated at patorjk.com (ANSI Shadow font)
- 7 lines tall (reasonable size)
- Cyan color matches existing theme
- Only shown in interactive mode (skipped if silent)

**Script Deprecation Path:**
- v0.7.x: Keep scripts, add deprecation notices
- v0.8.x: Mark deprecated in docs, warning on use
- v1.0.0: Remove scripts directory entirely

**Testing Priority:**
- High: Existing tests don't break
- Medium: Banner appears correctly
- Low: Visual perfection (subjective anyway)

---

## ARCHIVED: Sprint 1: Polish & Robustness (Week 1) ✅ COMPLETE

**Goal:** Fix tech debt and extend proven patterns to all commands

**Success Criteria:**
- ✅ 0 ESLint warnings (DONE - commit 89b8e55)
- ✅ FileTracker rollback in migrate.js (DONE - commit 7c2cafb, aeac955)
- ✅ Progress indicators on all long-running operations (DONE - commits 43aa90b, 8b0b9c2, 084dddc)
- ✅ All tests passing with new features (DONE - 255/256 passing, 99.6%)
- ✅ **BONUS:** Documentation framework + ESSENTIALS lean-out (39% reduction!)

**Completed:** 2026-01-29 (~2.5 hours vs 4-6 hour estimate = 2.4x faster!)  
**Commits:** 89b8e55, 7c2cafb, aeac955, 43aa90b, 8b0b9c2, 084dddc, f92732e, cd0e1d1, e337be9, b98a121, 4dfe6f7

---

## Sprint 2: Edge Cases & Error Messages (Week 2) 🔄 IN PROGRESS

**Goal:** Handle edge cases gracefully and provide helpful error messages

**Success Criteria:**
- ✅ Edge case handling (empty files, huge files, special chars) (DONE - commit e46c858)
- ✅ Better error messages with helpful suggestions (DONE - commit 785c658)
- 🔄 Real-world testing on 3+ projects (2/3 complete - styleguide project ✅)
- ✅ All tests passing (287 tests, 286 pass, 1 skip)

**Progress:** Task 2.1 ✅ | Task 2.2 ✅ | Task 2.3 🔄 67% (2/3 tests)  
**Commits:** e46c858, 785c658, v0.7.2 (UX improvements from dogfooding)

---

### Task 1.1: Fix ESLint Warnings (30 minutes)

**Why:** Don't accumulate tech debt, shows professional quality  
**Risk:** Low - Simple fixes  
**TDD Required:** No (linting issues)

**Steps:**

1. **Fix unused createLogger in templates.js**
   - File: [lib/commands/init/templates.js](lib/commands/init/templates.js#L7)
   - Action: Either use it or rename to `_createLogger`
   - Why: Was probably needed before logger migration, now unused

2. **Fix quote style in scan.js**
   - File: [lib/commands/scan.js](lib/commands/scan.js#L273)
   - Action: Run `npm run lint:fix` (auto-fixable)
   - Why: Consistency with project style

3. **Fix unused normalizedBase in sanitize.js**
   - File: [lib/sanitize.js](lib/sanitize.js#L201)
   - Action: Either use it or rename to `_normalizedBase`
   - Why: Variable calculated but never used

**Validation:**
```bash
npm run lint  # Should show 0 errors, 0 warnings
npm test      # All tests still passing
```

**Commit Message:**
```
fix: Clean up ESLint warnings

- Remove unused createLogger import in templates.js
- Fix quote style in scan.js (auto-fixed)
- Prefix unused normalizedBase with _ in sanitize.js

All tests passing, 0 linting issues
```

---

### Task 1.2: Extend FileTracker to migrate.js (2-3 hours, TDD)

**Why:** Same safety guarantees for migrations as init, proven pattern  
**Risk:** Low - Pattern already works in init.js  
**Dependencies:** None - Task 1.1 can run in parallel

**TDD Approach:**

#### Phase 1: RED - Write Tests First

1. **Create test/migrate-rollback.test.js** (new file)
   - Test: Rollback on scanCodebase failure
   - Test: Rollback on generateEssentials failure
   - Test: Rollback on file write failure
   - Test: Successful migration (no rollback)
   - Test: Partial rollback (some files created before error)
   
2. **Run tests** - All should fail (FileTracker not integrated yet)

#### Phase 2: GREEN - Implement Minimal Code

1. **Import FileTracker in migrate.js**
   - File: [lib/commands/migrate.js](lib/commands/migrate.js#L10)
   - Action: `import { FileTracker } from '../utils.js';`

2. **Integrate into migrateProject() function**
   - File: [lib/commands/migrate.js](lib/commands/migrate.js#L50-L100)
   - Action: 
     ```javascript
     const tracker = new FileTracker();
     try {
       // Track each file as created
       if (!essentialsExists) {
         await createEssentialsFile(...);
         tracker.trackFile(essentialsPath);
       }
       if (!agentsExists) {
         await createAgentsFile(...);
         tracker.trackFile(agentsPath);
       }
       if (!changelogExists) {
         await createChangelogFile(...);
         tracker.trackFile(changelogPath);
       }
       // ... existing success logic
     } catch (error) {
       await tracker.rollback(log);
       throw error;  // Re-throw after cleanup
     }
     ```

3. **Run tests** - All should pass

#### Phase 3: REFACTOR - Clean Up While Tests Stay Green

1. **Extract file creation to helper functions** (if needed for clarity)
2. **Add JSDoc comments** explaining rollback behavior
3. **Ensure consistent error messages**
4. **Run tests** - All should still pass

**Files Modified:**
- [lib/commands/migrate.js](lib/commands/migrate.js) - Add FileTracker integration
- [test/migrate-rollback.test.js](test/migrate-rollback.test.js) - NEW comprehensive tests

**Validation:**
```bash
npm test  # All tests passing including 5 new rollback tests
# Manual test: Trigger error during migrate, verify rollback
```

**Documentation Update:**
- [CODEBASE_CHANGELOG.md](CODEBASE_CHANGELOG.md) - Add session entry
- Note: FileTracker now used in both init and migrate commands

**Commit Message:**
```
feat: Add FileTracker rollback to migrate command

Following same TDD pattern as init.js:
- RED: 5 comprehensive tests for migrate rollback scenarios
- GREEN: FileTracker integration in migrateProject()
- REFACTOR: Clean error handling, consistent patterns

Validation:
- All tests passing (251/252 total, +5 tests)
- Manual testing confirms rollback on failure
- Atomic migrations (all or nothing)
```

---

### Task 1.3: Add Progress Indicators (1-2 hours)

**Why:** Professional UX for long operations, especially at scale  
**Risk:** Low - Ora spinners already used elsewhere  
**TDD Required:** Partial (test _silent mode respects progress bars)

**Commands Needing Progress:**

1. **scan.js - File scanning progress**
   - File: [lib/commands/scan.js](lib/commands/scan.js)
   - Current: Silent during file traversal
   - Add: `Scanning codebase... (X files found)`
   - Pattern: Update spinner text periodically

2. **audit.js - Analysis progress**
   - File: [lib/commands/audit.js](lib/commands/audit.js)
   - Current: Shows results at end
   - Add: `Analyzing CODEBASE_ESSENTIALS.md... (X checks)`
   - Pattern: Multi-step spinner (check placeholders → DRY → size → etc.)

3. **migrate.js - Multi-phase progress**
   - File: [lib/commands/migrate.js](lib/commands/migrate.js)
   - Current: Single spinner for whole operation
   - Add: Phase indicators (Scan → Generate → Write)
   - Pattern: Spinner per phase with success marks

**Implementation Pattern:**

```javascript
// For file counting during scan
const spinner = silent ? null : ora('Scanning codebase...').start();
let fileCount = 0;

for (const file of files) {
  fileCount++;
  if (spinner && fileCount % 100 === 0) {
    spinner.text = `Scanning codebase... (${fileCount} files)`;
  }
}
```

**Tests to Add:**
```javascript
// test/scan.test.js
test('scan respects silent mode with progress updates', async () => {
  // Verify no spinner created when _silent = true
  // Verify file counting still works
});
```

**Validation:**
```bash
npm test  # All tests passing
aiknowsys scan  # Should show "Scanning... (X files)" updates
aiknowsys audit  # Should show multi-step progress
aiknowsys migrate  # Should show phase indicators
```

**Commit Message:**
```
feat: Add progress indicators to long-running commands

- scan: Show file count during traversal
- audit: Multi-step check progress
- migrate: Phase indicators (Scan → Generate → Write)

All progress respects --silent mode for testing
```

---

### Sprint 1 Deliverables Summary

**Code Quality:**
- ✅ 0 ESLint warnings (professional polish)
- ✅ FileTracker in migrate.js (proven safety pattern)
- ✅ Progress indicators (better UX at scale)

**Test Coverage:**
- Before: 246 tests
- After: ~251 tests (+5 migrate rollback tests)
- Pass rate: 99.6% maintained

**User Impact:**
- Better experience on large codebases (progress feedback)
- Same rollback safety for migrate as init
- Clean codebase shows professionalism

**Time Estimate:** 4-6 hours total (doable in 1 week part-time)

---

## Sprint 2: Real-World Edge Cases & Error Handling (Week 2-3)

**Goal:** Make AIKnowSys bulletproof for actual project usage

**Success Criteria:**
- ✅ Graceful handling of edge cases (empty files, huge files, special characters)
- ✅ Helpful error messages with suggestions (not just "Error: X")
- ✅ Validation hints when check/audit fails
- ✅ Real-world testing on 3+ actual projects

---

### Task 2.1: Edge Case Hardening (3-4 hours, TDD)

**Why:** Real projects have edge cases unit tests don't cover  
**Risk:** Medium - Need to test carefully  
**TDD Required:** Yes - write test for each edge case first

**Edge Cases to Handle:**

#### 1. Empty File Handling
**Scenario:** User has empty CODEBASE_ESSENTIALS.md  
**Current Behavior:** Might crash or show confusing errors  
**Expected:** "Error: CODEBASE_ESSENTIALS.md is empty. Run 'aiknowsys scan' to generate content."

**Tests to Add:**
```javascript
// test/check.test.js
test('check handles empty CODEBASE_ESSENTIALS.md', async () => {
  await fs.writeFile('CODEBASE_ESSENTIALS.md', '');
  const result = await check({ _silent: true });
  assert.strictEqual(result.valid, false);
  assert.match(result.error, /empty/i);
});
```

**Implementation:**
- File: [lib/commands/check.js](lib/commands/check.js)
- Add: Early validation for file size > 0
- Action: Return helpful error with suggestion

#### 2. Huge File Handling (>10MB ESSENTIALS)
**Scenario:** User has massive ESSENTIALS file (legacy monolith)  
**Current Behavior:** Might hang or run out of memory  
**Expected:** Warn user, offer to split or proceed with caution

**Tests to Add:**
```javascript
// test/audit.test.js
test('audit warns on files >5MB', async () => {
  const hugeContent = 'x'.repeat(6 * 1024 * 1024);  // 6MB
  await fs.writeFile('CODEBASE_ESSENTIALS.md', hugeContent);
  const result = await audit({ _silent: true });
  assert.match(result.warnings[0], /large file/i);
});
```

**Implementation:**
- Files: [lib/commands/audit.js](lib/commands/audit.js), [lib/commands/check.js](lib/commands/check.js)
- Add: File size check before processing
- Action: Warn if >5MB, error if >50MB with streaming suggestion

#### 3. Special Characters in Project Names
**Scenario:** User wants project name with Unicode, emoji, or special chars  
**Current Behavior:** Might create invalid npm package name  
**Expected:** Sanitize with warning or reject with clear error

**Already handled by sanitize.js!** But let's add more tests:
```javascript
// test/sanitize.test.js
test('sanitizeProjectName handles emoji', async () => {
  const result = sanitizeProjectName('my-app-🚀');
  assert.strictEqual(result.valid, false);  // npm doesn't allow emoji
  assert.match(result.errors[0], /emoji|unicode/i);
});
```

#### 4. Git Not Installed
**Scenario:** User runs init in environment without git  
**Current Behavior:** Might crash when trying git operations  
**Expected:** Graceful degradation or clear error

**Tests to Add:**
```javascript
// test/init.test.js
test('init gracefully handles missing git', async () => {
  // Mock which('git') to return null
  // Verify init either skips git hooks or shows clear error
});
```

**Implementation:**
- File: [lib/commands/init.js](lib/commands/init.js)
- Add: Check for git availability before git operations
- Action: Skip git hooks with warning if git not found

#### 5. Permission Errors
**Scenario:** User runs in directory without write permissions  
**Current Behavior:** Generic "EACCES" error  
**Expected:** "Cannot write to directory. Check permissions or run in a different location."

**Tests to Add:**
```javascript
// test/init.test.js (if testable - might need manual verification)
test('init shows helpful error on permission denied', async () => {
  // This is hard to test automatically, document as manual test case
});
```

**Implementation:**
- Files: All commands that write files
- Add: Catch EACCES errors specifically
- Action: Show helpful message with permission troubleshooting

**Files Modified:**
- [lib/commands/check.js](lib/commands/check.js) - Empty file, huge file handling
- [lib/commands/audit.js](lib/commands/audit.js) - Huge file warning
- [lib/commands/init.js](lib/commands/init.js) - Git availability check, permission errors
- [test/check.test.js](test/check.test.js) - Edge case tests
- [test/audit.test.js](test/audit.test.js) - Edge case tests
- [test/sanitize.test.js](test/sanitize.test.js) - More special character tests

**Validation:**
```bash
npm test  # All tests passing with +10 edge case tests
# Manual tests with real edge cases:
echo "" > CODEBASE_ESSENTIALS.md && aiknowsys check  # Empty file
dd if=/dev/zero of=HUGE.md bs=1M count=10  # Huge file test
```

**Commit Message:**
```
feat: Add edge case handling for real-world scenarios

RED phase: 10 tests for edge cases
- Empty CODEBASE_ESSENTIALS.md
- Huge files (>5MB warning, >50MB error)
- Special characters in project names
- Missing git installation
- Permission errors

GREEN phase: Graceful handling with helpful errors
- Early validation before processing
- Specific error messages with suggestions
- Fallback behavior where appropriate

REFACTOR: Extract error message constants

Tests: 261/262 passing (+10 edge case tests)
```

---

### Task 2.2: Better Error Messages with Suggestions (2-3 hours)

**Why:** Users should know HOW to fix problems, not just THAT there's a problem  
**Risk:** Low - Documentation/UX improvement  
**TDD Required:** Partial (test error message content)

**Current vs Improved:**

#### Example 1: Missing CODEBASE_ESSENTIALS.md
**Current:**
```
Error: ENOENT: no such file or directory, open 'CODEBASE_ESSENTIALS.md'
```

**Improved:**
```
✗ CODEBASE_ESSENTIALS.md not found

This file is required for AIKnowSys to work. You can create it by:
  
  1. Generate from existing codebase:
     aiknowsys scan
  
  2. Start from scratch:
     aiknowsys init
  
  3. Create manually:
     cp node_modules/aiknowsys/templates/CODEBASE_ESSENTIALS.template.md ./CODEBASE_ESSENTIALS.md
```

#### Example 2: Audit finds placeholder
**Current:**
```
Warnings:
- Unfilled placeholders found: {{PROJECT_NAME}}
```

**Improved:**
```
⚠ Unfilled placeholders found (2)

  Line 15: {{PROJECT_NAME}}
  Line 42: {{TECH_STACK}}

To fix: Search for '{{' in CODEBASE_ESSENTIALS.md and replace with actual values.
Tip: These are usually set during 'aiknowsys init' - you might need to re-run setup.
```

#### Example 3: Check fails validation
**Current:**
```
✗ Validation failed: Missing Critical Invariants section
```

**Improved:**
```
✗ Validation failed (3 issues)

Missing required sections:
  1. Critical Invariants - defines your non-negotiable rules
  2. Validation Matrix - commands to run before commits
  
See example: https://github.com/arpa73/AIKnowSys#codebase-essentials-structure

Quick fix:
  aiknowsys update  # Refresh from latest template
```

**Implementation Pattern:**

```javascript
// lib/error-helpers.js - NEW FILE
export class AIKnowSysError extends Error {
  constructor(message, suggestion, learnMore = null) {
    super(message);
    this.suggestion = suggestion;
    this.learnMore = learnMore;
    this.name = 'AIKnowSysError';
  }
  
  format(log) {
    log.error(`✗ ${this.message}\n`);
    if (this.suggestion) {
      log.info(this.suggestion);
    }
    if (this.learnMore) {
      log.info(`\nLearn more: ${this.learnMore}`);
    }
  }
}

// Usage in commands:
throw new AIKnowSysError(
  'CODEBASE_ESSENTIALS.md not found',
  'Create it by running:\n  aiknowsys scan  (from existing code)\n  aiknowsys init   (from scratch)',
  'https://github.com/arpa73/AIKnowSys#getting-started'
);
```

**Files to Update:**
- [lib/error-helpers.js](lib/error-helpers.js) - NEW helper class
- [lib/commands/check.js](lib/commands/check.js) - Use AIKnowSysError
- [lib/commands/audit.js](lib/commands/audit.js) - Better audit messages
- [lib/commands/sync.js](lib/commands/sync.js) - Helpful sync errors

**Tests:**
```javascript
// test/error-helpers.test.js
test('AIKnowSysError formats with suggestion', () => {
  const err = new AIKnowSysError('Test', 'Run: aiknowsys fix');
  // Verify format() includes both message and suggestion
});
```

**Validation:**
```bash
npm test  # Error helper tests passing
# Manual: Trigger each error, verify suggestions appear
rm CODEBASE_ESSENTIALS.md && aiknowsys check  # Should show helpful message
```

**Commit Message:**
```
feat: Add contextual error messages with suggestions

NEW: AIKnowSysError class for structured error handling
- Primary message (what went wrong)
- Suggestion (how to fix it)
- Learn more link (documentation)

Updated commands:
- check: File not found, missing sections, validation failures
- audit: Placeholder locations, fix suggestions
- sync: Mismatch resolution steps

Users now get actionable next steps, not just error codes.
```

---

### Task 2.3: Real-World Project Testing (3-5 hours) 🔄 IN PROGRESS

**Why:** Dogfooding reveals issues no test suite can  
**Risk:** Low - Testing only, not changing code  
**TDD Required:** No - but document bugs found for future TDD fixes

**Status:** 1/3 projects tested ✅

**Projects to Test:**

#### Test 1: Styleguide Project (Work) ✅ COMPLETE

**Date:** 2026-01-30  
**Project:** Work styleguide/component library  
**Commands Tested:** `init --yes`, clipboard integration, TDD enforcement

**Results:**
- ✅ Setup completed successfully (~5 minutes)
- ✅ Found 2 UX issues during dogfooding:
  1. AI prompt hard to copy (50+ lines) → Fixed with clipboard auto-copy
  2. TDD enforcement invisible with --yes → Fixed with status visibility
- ✅ Both fixes released in v0.7.2 same day
- ✅ Planning team adoption

**Overall:** ✅ Ready for daily use

**Detailed notes:** See [.aiknowsys/TESTING_LOG.md](.aiknowsys/TESTING_LOG.md#test-1)

#### Test 2: Day Job Project (Complexity: High)
**Project:** [Corporate codebase - sanitize details]  
**Goals:**
- Test on larger, more complex codebase
- Verify corporate naming standards work (--essentials flag)
- See if it helps team coordination

**Special Considerations:**
- Can't share proprietary code → generic testing only
- Might need custom stack template
- Performance testing (large codebase)

#### Test 3: Open Source Project (Complexity: Low)
**Project:** Small OSS project or example  
**Goals:**
- Verify works on "normal" projects
- Create case study for documentation
- Get community feedback

**Deliverable:** Real-world usage examples for README

**Documentation:**
- [.aiknowsys/TESTING_LOG.md](.aiknowsys/TESTING_LOG.md) - NEW file tracking real-world tests
- [docs/case-studies/](docs/case-studies/) - Success stories (sanitized)

**Outcome:** List of bugs/improvements to prioritize in Sprint 3

---

### Sprint 2 Deliverables Summary

**Robustness:**
- ✅ Edge case handling (empty files, huge files, special chars, missing git, permissions)
- ✅ Better error messages with actionable suggestions
- ✅ Real-world testing on 3 projects

**Test Coverage:**
- Before: ~251 tests
- After: ~271 tests (+20 edge case and error handling tests)
- Pass rate: 99.6% maintained

**User Impact:**
- Fewer "WTF is this error?" moments
- Clear next steps when things go wrong
- Confidence from real-world validation

**Time Estimate:** 8-12 hours total (doable in 2 weeks part-time)

---

## Sprint 3: Performance & Integration Testing (Week 4)

**Goal:** Ensure AIKnowSys scales and components work together seamlessly

**Success Criteria:**
- ✅ Performance benchmarks for large codebases
- ✅ Integration test suite (multi-command workflows)
- ✅ No performance regressions on large files
- ✅ Clean architecture (all integration points tested)

---

### Task 3.1: Performance Benchmarking (2-3 hours)

**Why:** Need to know performance limits before hitting them in production  
**Risk:** Low - Measurement only  
**TDD Required:** No - but establish baselines

**Benchmarks to Create:**

#### 1. Scan Performance
**Test:** How long does scan take on N files?  
**Sizes:** 100, 1K, 10K, 50K files

```javascript
// benchmark/scan-performance.js
import { performance } from 'node:perf_hooks';
import { scanCommand } from '../lib/commands/scan.js';

const sizes = [100, 1000, 10000];
for (const size of sizes) {
  const start = performance.now();
  // Create temp directory with N files
  await scanCommand({ _silent: true, dir: tempDir });
  const duration = performance.now() - start;
  console.log(`${size} files: ${duration.toFixed(2)}ms`);
}
```

**Baseline Targets:**
- 100 files: <100ms
- 1K files: <1s
- 10K files: <10s
- 50K files: <60s (acceptable for large projects)

#### 2. Audit Performance on Large ESSENTIALS
**Test:** Audit 100KB, 1MB, 5MB ESSENTIALS files

**Baseline Targets:**
- 100KB: <50ms
- 1MB: <500ms
- 5MB: <3s

#### 3. Memory Usage
**Test:** Track memory during large operations

```javascript
// Check memory before/after large scan
const memBefore = process.memoryUsage().heapUsed;
await scanCommand({ dir: hugeProject });
const memAfter = process.memoryUsage().heapUsed;
console.log(`Memory delta: ${(memAfter - memBefore) / 1024 / 1024}MB`);
```

**Baseline Targets:**
- No memory leaks (memory returns to baseline)
- <100MB increase for 10K file scan

**Deliverable:**
- [benchmark/](benchmark/) - NEW directory with benchmark scripts
- [benchmark/RESULTS.md](benchmark/RESULTS.md) - Baseline results to track regressions
- [package.json](package.json) - Add `npm run benchmark` script

**Commit Message:**
```
test: Add performance benchmarks for scan, audit, memory

Established baselines:
- scan: 10K files in ~8.5s
- audit: 5MB file in ~2.1s  
- memory: <80MB increase for large scans

Run benchmarks: npm run benchmark
```

---

### Task 3.2: Integration Test Suite (4-5 hours, TDD)

**Why:** Unit tests don't catch workflow integration bugs  
**Risk:** Medium - Need to think through scenarios  
**TDD Required:** Yes - write integration scenarios first

**Integration Scenarios:**

#### Scenario 1: Fresh Project Init → Develop → Review
**Steps:**
1. Run `aiknowsys init` with all options
2. Modify CODEBASE_ESSENTIALS.md
3. Run `aiknowsys check` (should pass)
4. Run `aiknowsys sync` (should update AGENTS.md)
5. Run `aiknowsys audit` (should be clean)

**Test:**
```javascript
// test/integration/init-workflow.test.js
test('fresh init → modify → check → sync → audit workflow', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'integration-'));
  
  // Step 1: Init
  await init({ dir: tmpDir, stack: 'nextjs', _silent: true });
  
  // Step 2: Modify ESSENTIALS
  const essentials = path.join(tmpDir, 'CODEBASE_ESSENTIALS.md');
  let content = await fs.readFile(essentials, 'utf8');
  content += '\n## New Section\nCustom content\n';
  await fs.writeFile(essentials, content);
  
  // Step 3: Check should pass
  const checkResult = await check({ dir: tmpDir, _silent: true });
  assert.strictEqual(checkResult.valid, true);
  
  // Step 4: Sync should update AGENTS.md
  await sync({ dir: tmpDir, _silent: true });
  const agents = await fs.readFile(path.join(tmpDir, 'AGENTS.md'), 'utf8');
  assert.match(agents, /New Section/);
  
  // Step 5: Audit should be clean
  const auditResult = await audit({ dir: tmpDir, _silent: true });
  assert.strictEqual(auditResult.clean, true);
  
  await fs.rm(tmpDir, { recursive: true });
});
```

#### Scenario 2: Existing Project Migration → Custom Agents → Review
**Steps:**
1. Create dummy existing project
2. Run `aiknowsys migrate`
3. Install custom agents
4. Verify agents reference correct ESSENTIALS filename

**Test:**
```javascript
// test/integration/migrate-workflow.test.js
test('migrate existing → install agents → agents work', async () => {
  // Create existing project structure
  // Run migrate
  // Install agents
  // Verify .github/agents/ files created
  // Verify USAGE.txt shows correct workflow
});
```

#### Scenario 3: Update Workflow (Existing → Latest)
**Steps:**
1. Create project with old template version
2. Run `aiknowsys update`
3. Verify files updated correctly
4. Check backward compatibility

**Test:**
```javascript
// test/integration/update-workflow.test.js
test('old template → update → latest version', async () => {
  // Create project with v0.5.0 template structure
  // Run update command
  // Verify new files added
  // Verify existing customizations preserved
});
```

#### Scenario 4: Error Recovery (Init Fails → Rollback → Retry)
**Steps:**
1. Trigger init failure mid-way
2. Verify FileTracker rollback works
3. Retry init successfully
4. Verify no artifacts from failed attempt

**Test:**
```javascript
// test/integration/error-recovery.test.js
test('init fails → rollback → retry succeeds', async () => {
  // Mock failure after 2 files created
  // Verify rollback deletes those 2 files
  // Retry init without mock
  // Verify success and clean state
});
```

#### Scenario 5: Large Codebase Scan → Audit → Fix
**Steps:**
1. Create project with 5K files
2. Run scan (generates ESSENTIALS)
3. Run audit (finds issues)
4. Fix issues
5. Re-audit (clean)

**Test:**
```javascript
// test/integration/large-codebase.test.js
test('large codebase → scan → audit → fix → re-audit', async () => {
  // Generate 5K dummy files
  // Scan should complete without timeout
  // Audit generated ESSENTIALS
  // Simulate fixing placeholder
  // Re-audit should be clean
});
```

**Files to Create:**
- [test/integration/](test/integration/) - NEW directory
- [test/integration/init-workflow.test.js](test/integration/init-workflow.test.js)
- [test/integration/migrate-workflow.test.js](test/integration/migrate-workflow.test.js)
- [test/integration/update-workflow.test.js](test/integration/update-workflow.test.js)
- [test/integration/error-recovery.test.js](test/integration/error-recovery.test.js)
- [test/integration/large-codebase.test.js](test/integration/large-codebase.test.js)

**Validation:**
```bash
npm run test:integration  # New script for integration tests only
npm test  # All tests (unit + integration) passing
```

**Expected Test Count:** +15 integration tests (286 total)

**Commit Message:**
```
test: Add comprehensive integration test suite

5 end-to-end workflow scenarios:
1. Fresh init → develop → review cycle
2. Existing project migration → agents
3. Update workflow (old → latest)
4. Error recovery (fail → rollback → retry)
5. Large codebase performance (5K files)

Tests ensure commands work together seamlessly.
All 286 tests passing (unit + integration)
```

---

### Task 3.3: Architecture Validation & Documentation (2 hours)

**Why:** Document integration points for future contributors  
**Risk:** Low - Documentation only  
**TDD Required:** No

**Deliverables:**

#### 1. Architecture Diagram
Create [docs/architecture.md](docs/architecture.md) showing:
- Command dependencies (which commands call which utils)
- File flow (how data moves between commands)
- Integration points (where commands interact)

```
┌─────────────────────────────────────────────┐
│              CLI Entry Point                │
│              (bin/cli.js)                   │
└────────────────┬────────────────────────────┘
                 │
        ┌────────┴────────┐
        │   Commands      │
        │                 │
   ┌────┴────┐  ┌────┴────┐  ┌────┴────┐
   │  init   │  │ migrate │  │  scan   │
   └────┬────┘  └────┬────┘  └────┬────┘
        │            │             │
        └────────┬───┴─────────────┘
                 │
        ┌────────┴────────┐
        │   Utilities     │
        │                 │
   ┌────┴────┐  ┌────┴────┐  ┌────┴────┐
   │  utils  │  │ logger  │  │sanitize │
   │FileTrack│  │         │  │         │
   └─────────┘  └─────────┘  └─────────┘
```

#### 2. Integration Points Documentation
Document in CODEBASE_ESSENTIALS.md:
- Which commands share FileTracker
- Where logger is used
- How sanitization flows through init → prompts
- Shared configuration patterns

#### 3. Testing Matrix
Create table showing what's tested:

| Component | Unit Tests | Integration Tests | Manual Tests |
|-----------|------------|-------------------|--------------|
| init.js | ✅ 25 | ✅ 3 workflows | ✅ Real projects |
| migrate.js | ✅ 18 | ✅ 2 workflows | ✅ Legacy code |
| FileTracker | ✅ 11 | ✅ Error recovery | ✅ Edge cases |
| ... | ... | ... | ... |

**Files to Update:**
- [docs/architecture.md](docs/architecture.md) - NEW architecture overview
- [CODEBASE_ESSENTIALS.md](CODEBASE_ESSENTIALS.md) - Add Integration Points section
- [docs/testing-strategy.md](docs/testing-strategy.md) - NEW testing philosophy

**Commit Message:**
```
docs: Add architecture and integration documentation

- Architecture diagram showing command dependencies
- Integration points section in ESSENTIALS
- Testing matrix (unit, integration, manual)

Helps contributors understand system design.
```

---

### Sprint 3 Deliverables Summary

**Performance:**
- ✅ Benchmarks for scan, audit, memory usage
- ✅ Baseline metrics to track regressions
- ✅ Performance targets documented

**Integration:**
- ✅ 5 end-to-end workflow tests
- ✅ Error recovery validated
- ✅ Large codebase testing

**Documentation:**
- ✅ Architecture diagram
- ✅ Integration points documented
- ✅ Testing strategy explained

**Test Coverage:**
- Before: ~271 tests
- After: ~286 tests (+15 integration tests)
- Pass rate: 99.6% maintained

**User Impact:**
- Confidence in scalability
- System behaves predictably
- Integration bugs caught before users hit them

**Time Estimate:** 8-10 hours total (doable in 1 week part-time)

---

## Overall 3-Sprint Summary

### Timeline
- **Sprint 1 (Week 1):** 4-6 hours → Polish & robustness
- **Sprint 2 (Week 2-3):** 8-12 hours → Edge cases & real-world testing
- **Sprint 3 (Week 4):** 8-10 hours → Performance & integration

**Total:** 20-28 hours over 4 weeks (5-7 hours/week part-time)

### Test Growth
- **v0.6.0 baseline:** 246 tests
- **After Sprint 1:** ~251 tests (+5 migrate rollback)
- **After Sprint 2:** ~271 tests (+20 edge cases)
- **After Sprint 3:** ~286 tests (+15 integration)

**Total growth:** +40 tests (+16% increase)

### Quality Improvements
1. **0 ESLint warnings** (professional polish)
2. **FileTracker in all file-creating commands** (safety)
3. **Progress indicators** (better UX at scale)
4. **Edge case handling** (robustness)
5. **Helpful error messages** (UX)
6. **Real-world validation** (3+ projects tested)
7. **Performance benchmarks** (scalability confidence)
8. **Integration test suite** (workflow reliability)

### User Impact
- **Day 1:** Can use on personal project with confidence
- **Week 2:** Can introduce at day job without embarrassment
- **Week 4:** Can scale to large codebases
- **Ongoing:** Clear path for contributions (architecture docs)

---

## Success Metrics

**Quality (Primary Goal):**
- ✅ 286+ tests passing (99%+ pass rate)
- ✅ 0 ESLint warnings
- ✅ Performance baselines established
- ✅ Real-world testing on 3 projects
- ✅ Integration workflows validated

**Reliability:**
- ✅ Edge cases handled gracefully
- ✅ Helpful error messages (not cryptic)
- ✅ Rollback mechanism in all file operations
- ✅ No memory leaks

**Professionalism:**
- ✅ Clean codebase (linting, architecture)
- ✅ Comprehensive tests (unit + integration)
- ✅ Documentation (architecture, testing strategy)
- ✅ Performance benchmarks

**Ready for Production:**
- ✅ Can use on your projects daily
- ✅ Can introduce at day job
- ✅ Can recommend to others without caveats

---

## Risks & Mitigations

**Risk:** Real-world testing reveals major bugs  
**Mitigation:** Sprint 2 is flexible - pause to fix if needed

**Risk:** Integration tests take longer than estimated  
**Mitigation:** Start with high-value scenarios, defer others to backlog

**Risk:** Performance benchmarks reveal scalability issues  
**Mitigation:** Document limits, add streaming for large files (future work)

**Risk:** Part-time schedule slips  
**Mitigation:** Each sprint delivers value independently, can adjust timeline

---

## Post-Sprint 3: What's Next?

After these 3 sprints, you'll have:
- ✅ Production-quality foundation
- ✅ Confidence from real-world usage
- ✅ Data from benchmarks and testing

**Then consider:**
1. **Community growth** (if adoption goal)
   - Video tutorial (5 min demo)
   - Blog post / case study
   - Submit to awesome lists

2. **Advanced features** (if needed)
   - Plugin system (if requests come in)
   - Web dashboard (if teams ask)
   - CI/CD integrations (GitHub Actions examples)

3. **Maintenance mode** (if stable)
   - Fix bugs as reported
   - Keep dependencies updated
   - Respond to community PRs

**The key:** These 3 sprints make AIKnowSys "done" for your needs. Anything beyond is optional enhancement based on real feedback, not speculation.

---

**Next Step:** Start Sprint 1, Task 1.1 (Fix ESLint warnings) - 30 minutes

Ready to begin? 🚀
