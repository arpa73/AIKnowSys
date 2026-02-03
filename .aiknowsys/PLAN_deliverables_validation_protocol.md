# Implementation Plan: Deliverables Validation Protocol

**Status:** 🎯 PLANNING COMPLETE  
**Created:** 2026-02-03 17:45  
**Goal:** Implement comprehensive deliverables validation to prevent shipping broken templates

## Overview

Architect review identified critical gap: template files (deliverables) were not updated with multi-dev pattern, would have shipped broken v0.9.0. Need systematic validation to prevent this class of errors.

**User Decision:** Implement ALL validation approaches (quality-check, separate command, git hook) because deliverables are core - we build on them ourselves.

## Requirements

**Functional:**
- Automated detection of template/non-template parity violations
- Pre-commit validation prevents committing broken templates
- quality-check integration provides release validation
- Standalone command for manual validation
- Documentation updates ensure everyone knows the protocol

**Non-Functional:**
- Fast enough for git hooks (<2s)
- Clear error messages (show exactly what's wrong)
- Zero false positives (don't block valid changes)
- Comprehensive coverage (all deliverable types)

## Architecture Changes

### Phase 1: Core Validation Logic (New Command)

#### File: [lib/commands/validate-deliverables.js](../../lib/commands/validate-deliverables.js)
**What:** New command to validate all deliverables
**Why:** Standalone validation + reusable by other tools

**Checks to implement:**
1. **Pattern consistency:** Templates match non-template equivalents
2. **Legacy pattern detection:** Grep for known anti-patterns
3. **Placeholder detection:** No unresolved {{VARIABLES}}
4. **Fresh init test:** Actually run init and validate output
5. **Cross-reference:** Agent templates vs actual agents

### Phase 2: quality-check Integration

#### File: [lib/commands/quality-check.js](../../lib/commands/quality-check.js)
**What:** Add deliverables validation as check
**Why:** Part of pre-release validation matrix

### Phase 3: Git Pre-Commit Hook

#### File: [templates/git-hooks/pre-commit-deliverables](../../templates/git-hooks/pre-commit-deliverables)
**What:** Validate deliverables before commit
**Why:** Prevent committing broken templates

### Phase 4: Documentation Updates

#### Files to update:
- [CODEBASE_ESSENTIALS.md](../../CODEBASE_ESSENTIALS.md) - New Critical Invariant
- [AGENTS.md](../../AGENTS.md) - Plan requirements for breaking changes
- [.github/skills/tdd-workflow/SKILL.md](../../.github/skills/tdd-workflow/SKILL.md) - Add to validation checklist

### Phase 5: Learned Skill

#### File: [.aiknowsys/learned/deliverables-validation.md](deliverables-validation.md)
**What:** Pattern for deliverables validation
**Why:** Discoverable via trigger words

## Implementation Steps

### Phase 1: Create validate-deliverables Command (45-60 min)

#### Step 1: Create Command File
**File:** `lib/commands/validate-deliverables.js`

**Action:** Create command with validation logic
- **Why:** Core validation reusable across tools
- **Dependencies:** None
- **Risk:** MEDIUM (new command, needs thorough testing)
- **TDD:** Write tests FIRST

**Validation checks to implement:**

1. **Template Schema Validation:**
   ```javascript
   // Define which placeholders SHOULD exist in each template
   const templateSchema = {
     'templates/agents/architect.agent.template.md': {
       requiredPlaceholders: ['{{ESSENTIALS_FILE}}'],
       forbiddenPatterns: ['PENDING_REVIEW.md', 'Edit CURRENT_PLAN.md']
     },
     'templates/agents/developer.agent.template.md': {
       requiredPlaceholders: ['{{ESSENTIALS_FILE}}'],
       forbiddenPatterns: ['PENDING_REVIEW.md', 'Delete CURRENT_PLAN.md']
     },
     'templates/agents/planner.agent.template.md': {
       requiredPlaceholders: ['{{ESSENTIALS_FILE}}'],
       forbiddenPatterns: ['PENDING_REVIEW.md']
     }
   };
   // Validates CORRECT placeholders exist, not just that none are unresolved
   ```

2. **Pattern Consistency Check with Mapping:**
   ```javascript
   // Define which templates map to which non-templates
   const templateMappings = {
     'templates/agents/architect.agent.template.md': [
       '.github/agents/architect.agent.md'
     ],
     'templates/agents/developer.agent.template.md': [
       '.github/agents/developer.agent.md'
     ],
     'templates/agents/planner.agent.template.md': [
       '.github/agents/planner.agent.md'
     ],
     'templates/AGENTS.template.md': [
       'AGENTS.md'
     ]
   };
   
   // For known patterns, check template vs non-template
   const patterns = [
     { 
       legacy: 'PENDING_REVIEW.md',
       correct: 'reviews/PENDING_<username>.md',
       files: ['templates/agents/*.md', '.github/agents/*.md']
     },
     {
       legacy: 'CURRENT_PLAN.md',
       context: 'manual editing',
       correct: 'plans/active-<username>.md',
       files: ['templates/agents/*.md', '.github/agents/*.md']
     }
   ];
   ```

3. **Legacy Pattern Detection:**
   ```javascript
   // Grep templates for anti-patterns
   const antiPatterns = [
     'PENDING_REVIEW.md',
     'Edit CURRENT_PLAN.md',
     'Single-dev mode',
     'Check if .aiknowsys/plans/ exists'
   ];
   ```

4. **Placeholder Check:**
   ```javascript
   // Verify no unresolved {{VARIABLES}} in templates
   // Except in .template.md files (those are source templates)
   const templateExceptions = [
     'templates/AGENTS.template.md',
     'templates/CODEBASE_ESSENTIALS.template.md',
     'templates/CODEBASE_CHANGELOG.template.md'
   ];
   ```

5. **Visual Diff on Failure:**
   ```javascript
   // When template doesn't match non-template, SHOW the diff
   function showDiff(template, nonTemplate, pattern) {
     console.error(`\n❌ Pattern mismatch detected!\n`);
     console.error(`Template:    ${pattern.correct}`);
     console.error(`Non-template: ${pattern.legacy}`);
     console.error(`\nFile: ${template}:${lineNumber}\n`);
     console.error(`Expected (from ${nonTemplate}):`);
     console.error(`+ ${expectedLine}`);
     console.error(`\nFound in template:`);
     console.error(`- ${actualLine}`);
     console.error(`  ${'^'.repeat(errorColumn)}`);
   }
   ```

6. **Auto-Fix Mode (--fix flag):**
   ```javascript
   // For KNOWN patterns, auto-fix them
   const autoFixablePatterns = [
     { find: /PENDING_REVIEW\.md/g, replace: 'reviews/PENDING_<username>.md' },
     { find: /Edit CURRENT_PLAN\.md/g, replace: 'Edit plans/active-<username>.md' }
   ];
   // Only simple pattern replacements - complex issues should error
   ```

7. **Template Execution Test (--full mode):**
   ```javascript
   // Actually EXECUTE the template workflow
   async function testTemplateExecution(templateFile) {
     // 1. Copy template to temp dir
     // 2. Replace {{VARIABLES}} with test values
     // 3. Parse as chatagent YAML frontmatter
     // 4. Verify structure valid (name, description, model, etc.)
     // 5. Compare with known-good .github/agents/*
     // 6. Check for syntax errors, invalid frontmatter
   }
   ```

8. **Fresh Init Test (--full flag):**
   ```javascript
   // Actually run npx aiknowsys init in temp directory
   // Verify generated files are correct
   // Expensive check - only for --full mode
   ```

**Return format:**
```javascript
return {
  passed: boolean,
  checks: [
    { name: 'Template Schema', passed: true, issues: [] },
    { name: 'Pattern Consistency', passed: true, issues: [] },
    { name: 'Legacy Patterns', passed: false, issues: ['Found PENDING_REVIEW.md in architect.agent.template.md:35'] },
    { name: 'Placeholders', passed: true, issues: [] },
    { name: 'Template Execution', passed: true, issues: [] }, // --full only
    { name: 'Fresh Init', passed: true, issues: [] } // --full only
  ],
  summary: '5/6 checks passed',
  exitCode: passed ? 0 : 1,
  metrics: {
    templatesChecked: 8,
    patternsValidated: 14,
    duration: 1234 // ms
  }Template schema: Validates required placeholders exist
- ✅ Template schema: Detects forbidden patterns
- ✅ Detects legacy PENDING_REVIEW.md in templates
- ✅ Detects unresolved {{PLACEHOLDERS}}
- ✅ Passes when templates match non-templates
- ✅ Visual diff: Shows exact location of mismatch
- ✅ Auto-fix: Fixes simple pattern replacements
- ✅ Auto-fix: Doesn't break complex patterns
- ✅ Template execution: Validates YAML frontmatter (--full)
- ✅ Template execution: Catches syntax errors (--full)
- ✅ Fresh init: Validates generated files (--full)
- ✅ Metrics: Logs validation history
- ✅ Handles missing templates directory gracefully
```javascript
// Log validation runs to .aiknowsys/validation-history.json
{
  "2026-02-03": {
    "preCommit": { runs: 5, failures: 1, avgDuration: 850 },
    "qualityCheck": { runs: 1, failures: 0, avgDuration: 4200 },
    "standalone": { runs: 3, failures: 0, avgDuration: 1100 }
  }
}
```

#### Step 2: Write Tests FIRST (TDD)
**File:** `test/commands/validate-deliverables.test.js`

**Test cases:**
- ✅ Detects legacy PENDING_REVIEW.md in templates
- ✅ Detects unresolved {{PLACEHOLDERS}}
- ✅ Passes when templates match non-templates
- ✅ Handles missing templates directory gracefully
- ✅ Fresh init test validates generated files (--full mode)
- ✅ Reports multiple issues clearly
- ✅ Silent mode works for programmatic use

**TDD Cycle:**
1. 🔴 RED: Write test (should fail)
2. 🟢 GREEN: Implement minimal code
3. 🔵 REFACTOR: Clean up

#### Step 3: Register Command in CLItemplate execution + fresh init)')
  .option('--fix', 'Attempt to auto-fix simple pattern issues')
  .option('--metrics', 'Show validation metrics and history

**Action:** Add command to Commander
```javascript
program
  .command('validate-deliverables')
  .description('Validate all deliverable files (templates)')
  .option('--full', 'Run expensive checks (fresh init test)')
  .option('--fix', 'Attempt to auto-fix issues')
  .action(async (options) => {
    const { validateDeliverables } = await import('../lib/commands/validate-deliverables.js');
    await validateDeliverables(options);
  });
```

#### Step 4: Manual Testing
**Action:** Test command with real templates
- Run against current codebase (should pass)
- Introduce intentional errors (should catch)
- Test --full mode
- Test error messages clarity

### Phase 2: Integrate with quality-check (20-30 min)

#### Step 5: Update quality-check Command
**File:** `lib/command - ALWAYS run --full mode in quality-check
const deliverables = await validateDeliverables({ 
  _silent: true, 
  full: true  // quality-check always runs comprehensive validation
});
checks.push({
  name: 'Deliverables Validation',
  passed: deliverables.passed,
  issues: deliverables.checks.filter(c => !c.passed),
  metrics: deliverables.metrics
});

// Display metrics in summary
if (deliverables.metrics) {
  log.dim(`\n  Deliverables Validation:`);
  log.dim(`  - Templates checked: ${deliverables.metrics.templatesChecked}`);
  log.dim(`  - Duration: ${deliverables.metrics.duration}ms`);
  log.dim(`  - Last pre-commit run: ${getLastRunTime('preCommit')}`);
}
**Code change:**
```javascript
// Add to checks array with --full flag
- Verify failures reported correctly
- Verify metrics displayed in summary
- Verify expensive checks (template execution, fresh init) run in quality-checkeliverables({ _silent: true });
checks.push({
  name: 'Deliverables Validation',
  passed: deliverables.passed,
  issues: deliverables.checks.filter(c => !c.passed)
});
```

#### Step 6: Update Tests
**File:** `test/commands/quality-check.test.js`

**Action:** Add test for deliverables check
- Verify deliverables check runs
- Verify failures reported correctly

### Phase 3: Git Pre-Commit Hook (25-35 min)

#### Step 7: Create Pre-Commit Hook
**File:** `templates/git-hooks/pre-commit-deliverables`

**Action:** Bash script to validate before commit
- **Why:** Prevent committing broken templates
- **Dependencies:** Phase 1 complete
- **Risk:** MEDIUM (git hooks can be tricky)

**Script logic:**
```bash
#!/bin/bash
# Pre-commit hook: Validate deliverables

# Only run if templates/ files changed
if ! git diff --cached --name-only | grep -q '^templates/'; then
  exit 0
fi

# Run validation
if ! node bin/cli.js validate-deliverables --silent; then
  echo "❌ Deliverables validation failed!"
  echo "   Run: npx aiknowsys validate-deliverables"
  echo "   Or skip: git commit --no-verify (not recommended)"
  exit 1 with visual diff)
- Test auto-fix: `validate-deliverables --fix`
- Commit (should succeed)
- Verify metrics logged to validation-history.json
exit 0
```

**Installation:**
- Add to templates/git-hooks/
- Install during init command
- Document in SETUP_GUIDE.md

#### Step 8: Test Hook Installation
**Action:** Test in fresh repo
- Install hook
- Modify template (introduce error)
- Attempt commit (should fail)
- Fix error
- Commit (should succeed)

### Phase 4: Documentation Updates (30-40 min)

#### Step 9: Update CODEBASE_ESSENTIALS.md
**File:** `CODEBASE_ESSENTIALS.md`

**Action:** Add "Critical Invariant #8: Deliverables Consistency"
- **Why:** Templates are first-class citizens
- **Dependencies:** None
- **Risk:** LOW (documentation)

**Content to add:**
```markdown
## 5. Critical Invariants
 --full` | Deliverables validation | All checks pass |
| `node bin/cli.js validate-deliverables --fix` | Auto-fix simple patterns | Patterns fixed
8. **Deliverables Consistency**
   - Templates (`templates/` directory) are **deliverables** distributed to users
   - ANY change to core functionality MUST update corresponding templates
   - Run `npx aiknowsys validate-deliverables` before release
   - Templates must match non-template equivalents (agents, workflows, etc.)
   - Breaking changes MUST be reflected in all deliverables
   - **Validation:** 
     - Pre-commit hook prevents committing broken templates
     - quality-check includes deliverables validation
     - Standalone command for manual checks
```

**Also update Validation Matrix:**
```markdown
| `node bin/cli.js validate-deliverables` | Deliverables validation | All checks pass |
```

#### Step 10: Update AGENTS.md
**File:** `AGENTS.md`

**Action:** Add deliverables check to plan requirements
- **Why:** Every breaking change plan needs this
- **Dependencies:** None
- **Risk:** LOW (documentation)

**Content to add:**
```markdown
### Plan Requirements for Breaking Changes

When creating plans for breaking changes:

**MANDATORY checklist:**
- [ ] Core functionality changes documented
- [ ] Non-template files updated
- [ ] **🚨 Template files verified** (deliverables!)
- [ ] Tests updated for new pattern
- [ ] **Deliverables validation passing** (`validate-deliverables`)
- [ ] Fresh init test performed
- [ ] Pre-commit hook validates templates

**Deliverables to check:**
- `templates/agents/*.md` - Agent templates distributed to users
- `templates/AGENTS.template.md` - User workflow guide
- `templates/CODEBASE_ESSENTIALS.template.md` - User docs template
- `templates/skills/` - Universal skills distributed
- **Rule:** If behavior changes, templates MUST reflect it
```

#### Step 11: Update TDD Workflow Skill
**File:** `.github/skills/tdd-workflow/SKILL.md`

**Action:** Add deliverables validation to checklist
- **Why:** Part of validation before claiming done
- **Dependencies:** None
- **Risk:** LOW (documentation)

**Content to add:**
```markdown
### Validation Checklist

**Before claiming work complete:**
- [ ] All tests passing (npm test)
- [ ] Type checks passing (if applicable)
- [ ] Linting passing (npm run lint)
- [ ] **Deliverables validated** (if templates changed)
- [ ] Fresh init test (if breaking change)
```

#### Step 12: Update SETUP_GUIDE.md
**File:** `SETUP_GUIDE.md`

**Action:** Document deliverables validation
- **Why:** Users need to know about this
- **Dependencies:** None
- **Risk:** LOW (documentation)

### Phase 5: Create Learned Skill (15-20 min)

#### Step 13: Create deliverables-validation.md
**File:** `.aiknowsys/learned/deliverables-validation.md`

**Action:** Create learned skill pattern
- **Why:** Discoverable via trigger words
- **Dependencies:** None
- **Risk:** LOW (documentation)

**Content:**
```markdown
---
name: Deliverables Validation
description: Protocol for validating all deliverable files before release
triggerWords: ["breaking change", "template update", "release prep", "validate deliverables", "pre-release"]
category: quality-assurance
created: 2026-02-03
---

## Purpose

Prevent shipping broken templates by validating deliverables systematically.

## When to Use

- Before any release
- After changing agent behavior
- When modifying templates
- During breaking changes
- Pre-commit (automated)

## Validation Approaches

**1. Pre-Commit Hook (Automatic)**
- Runs on every commit touching templates/
- Fast checks only (<2s)
- Prevents committing broken templates

**2. quality-check Command (Pre-Release)**
- Part of release validation matrix
- Comprehensive checks
- Run before npm publish

**3. Standalone Command (Manual)**
- `npx aiknowsys validate-deliverables`
- Use during development
- --full flag for expensive checks

## What Gets Validated

**Pattern Consistency:**
- Templates match non-template equivalents
- No legacy patterns (PENDING_REVIEW.md, etc.)
- Workflow documentation accurate

**Placeholder Resolution:**
- No unresolved {{VARIABLES}} (except .template.md)
- Proper variable substitution tested

**Fresh Init Test:**
- Actually run init in temp directory
- Verify generated files correct
- Validate multi-dev structure created

## Example Workflow

**Breaking Change:**
1. Update non-template files (.github/agents/*.md)
2. Update template files (templates/agents/*.md)
3. Run: `npx aiknowsys validate-deliverables`
4. Fix any issues
5. Commit (hook validates automatically)
6. Before release: `npx aiknowsys quality-check`

## Common Issues

**"Legacy pattern detected":**
- Template still uses old pattern
- Check templates/agents/*.md
- Compare with .github/agents/*.md

**"Placeholder not resolved":**
- {{VARIABLE}} found outside .template.md
- Check generated files vs source templates

**"Init test failed":**
- Generated files don't match expected pattern
- Run init manually to debug
```

### Phase 6: Testing & Validation (30-40 min)

#### Step 14: Test Full Workflow
**Action:** End-to-end test of all components

**Test scenario:**
1. Introduce breaking change pattern
2. Update non-template files
3. Forget to update templates (simulate bug)
4. Pre-commit hook should catch
5. Fix templates
6. quality-check should pass
7. Fresh init should work

#### Step 15: Run Full Test Suite
**Action:** `npm test`
- **Why:** Ensure no regressions
- **Dependencies:** All previous steps
- **Risk:** HIGH (critical validation)

**Expected:**
- All existing tests pass
- New validate-deliverables tests pass
- quality-check tests pass

#### Step 16: Manual Validation
**Action:** Test each validation approach

**Pre-commit hook:**
- Modify template with error
- Attempt commit
- Should fail with clear message

**quality-check:**
- Run full quality check
- Deliverables check should pass

**Standalone command:**
- Run validate-deliverables
- Test --full mode
- Test error reporting

### Phase 7: Release Preparation (15-20 min)

#### Step 17: Update CODEBASE_CHANGELOG.md
**Action:** Document deliverables validation protocol
- **Why:** Track architectural decision
- **Dependencies:** All previous steps
- **Risk:** LOW (documentation)

**Session entry:**
```markdown
## Session: Deliverables Validation Protocol (Feb 3, 2026)

**Goal**: Implement systematic validation to prevent shipping broken templates

**Changes**:
- [lib/commands/validate-deliverables.js]: New command for deliverables validation
- [lib/commands/quality-check.js]: Integrated deliverables check
- [templates/git-hooks/pre-commit-deliverables]: Pre-commit validation
- [CODEBASE_ESSENTIALS.md]: Added Critical Invariant #8
- [AGENTS.md]: Updated plan requirements for breaking changes
- [.aiknowsys/learned/deliverables-validation.md]: Created learned skill

**Validation**:
- ✅ Full test suite: All tests passing
- ✅ Pre-commit hook: Prevents committing broken templates
- ✅ quality-check: Includes deliverables validation
- ✅ Fresh init test: Validates generated files

**Key Learning**:
- Templates are deliverables - first-class citizens
- Multi-layered validation (hook, command, quality-check)
- Prevention > detection (pre-commit catches early)
- Learned skill makes pattern discoverable
```

#### Step 18: Update RELEASE_NOTES_v0.9.0.md
**Action:** Document deliverables validation feature
- **Why:** Part of v0.9.0 improvements
- **Dependencies:** All previous steps
- **Risk:** LOW (documentation)

**Content to add:**
```markdown
## 🛡️ Deliverables Validation (Post-Release Enhancement)

**Issue:** Template files not updated with breaking change, caught in pre-release review

**Solution:** Comprehensive deliverables validation protocol
 (fast checks only)
npx aiknowsys validate-deliverables

# Full validation (includes template execution + fresh init)
npx aiknowsys validate-deliverables --full

# Auto-fix simple patterns
npx aiknowsys validate-deliverables --fix

# Show metrics and history
npx aiknowsys validate-deliverables --metrics

# Part of quality check (always runs --full)TIALS as Critical Invariant #8

**Benefits:**
- Prevents shipping broken templates
- Multi-layered validation (hook, command, quality-check)
- Fast enough for git hooks (<2s)
- Clear error messages

**Usage:**
```bash
# Manual validation
npx aiknowsys validate-deliverables

# Full validation (includes init test)
npx aiknowsys validate-deliverables --full

# Part of quality check
npx aiknowsys quality-check
```
```

#### Step 19: Final Validation Checklist
- [ ] All tests passing (npm test)
- [ ] Pre-commit hook installed and tested
- [ ] quality-check includes deliverables validation
- [ ] Documentation updated (ESSENTIALS, AGENTS, skills)
- [ ] Learned skill created and documented
- [ ] CHANGELOG updated
- [ ] RELEASE_NOTES updated
- [ ] Fresh init test validates multi-dev structure

## Testing Strategy
  - Template schema validation
  - Pattern consistency with mappings
  - Visual diff output
  - Auto-fix logic
  - Template execution test
  - Metrics logging
- quality-check.js: Deliverables integration (--full mode)
- Pre-commit hook: Script logic validation (fast checks only)nd)
- 🔴 RED: Write tests for validate-deliverables command
- 🟢 GREEN: Implement validation logic
- 🔵 REFACTOR: Clean up and optimize

**Test Coverage:**

**Unit Tests:** with visual diff)
5. Test auto-fix: `validate-deliverables --fix`
6. Verify template corrected
7. Commit (should succeed)
8. Run quality-check (should pass with metrics)
9. Check validation-history.json (metrics logged)
10. Run with --full flag (template execution + fresh init testvalidation

**Integration Tests:**
- Full workflow: Modify template → commit → hook validates
- quality-check: Runs all validations including deliverables
- Fresh init: Generated files validated

**Manual Validation:**
1. Create test repo
2. Run init
3. Modify template (introduce error)
4. Attempt commit (should fail)
5. Fix template
6. Commit (should succeed)
7. Run quality-check (should pass)

## Risks & Mitigations

**Risk: Pre-commit hook too slow**
- **Likelihood:** MEDIUM
- **Impact:** HIGH (developers will bypass with --no-verify)
- **Mitigation:**
  - Fast checks only in pre-commit (<2s)
  - Expensive checks (fresh init) only in quality-check
  - Clear progress indicators

**Risk: False positives block valid changes**
- **Likelihood:** MEDIUM
- **Impact:** HIGH (loss of developer trust)
- **Mitigation:**
  - Comprehensive testing with edge cases
  - Clear error messages showing exactly what's wrong
  - Escape hatch: --no-verify (documented as last resort)

**Risk: Validation logic becomes outdated**
- **Likelihood:** HIGH
- **Impact:** MEDIUM (misses new patterns)
- **Mi**Template schema validation** (required placeholders checked)
- [ ] **Template-to-non-template mapping** defined and validated
- [ ] **Visual diff on failures** (shows exact mismatch location)
- [ ] **Auto-fix mode** (--fix) for simple patterns
- [ ] **Template execution test** (--full) validates YAML frontmatter
- [ ] **Metrics logging** to validation-history.json
- [ ] **CI always runs --full mode** (comprehensive validation)
- [ ] Pre-commit hook installed during init
- [ ] quality-check includes deliverables validation (--full mode)
- [ ] All tests passing (including new tests)
- [ ] Documentation updated (ESSENTIALS, AGENTS, skills)
- [ ] Learned skill created with trigger words
- [ ] Fresh init test validates multi-dev structure
- [ ] No false positives (doesn't block valid changes)
- [ ] Fast enough for pre-commit (<2s for fast checkotected)
- **Mitigation:**
  - Install during init
  - Document in SETUP_GUIDE
  - quality-check verifies hook installed

## Success Criteria

- [ ] validate-deliverables command exists and works
- [ ] Pre-commit hook installed during init
- [ ] quality-check includes deliverables validation
- [ ] All tests passing (including new tests)
- [ ] Documentation updated (ESSENTIALS, AGENTS, skills)
- [ ] Learned skill created with trigger words
- [ ] Fresh init test validates multi-dev structure
- [ ] No false positives (doesn't block valid changes)
- [ ] Fast enough for pre-commit (<2s)
- [ ] Clear error messages guide fixing issues
- [ ] CHANGELOG and RELEASE_NOTES updated

## Notes for Developer

**Context:**
- Architect review caught critical bug: templates not updated
- Would have shipped v0.9.0 with broken agent templates
- Need systematic validation to prevent this class of errors
- User decision: Implement ALL validation approaches (core to our system)
- Template schema: Keep in sync when adding new templates
- Template mappings: Update when adding new template types
- Visual diff: Handle multi-line patterns correctly
- Auto-fix: Only simple replacements, complex issues should error
- Metrics file: Gitignore validation-history.json (local only)

**Important:**
- TDD for new command (tests FIRST)
- Run full test suite before claiming complete
- Test pre-commit hook thoroughly (hard to debug in production)
- Document in multiple places (ESSENTIALS, AGENTS, learned skill)
- CI must always run --full mode (comprehensive validation)
- Template execution test catches YAML syntax errors early

**Estimated Time:** 180-230 minutes total (increased due to additional features)
- Phase 1 (Command): 60-80 min (added schema, diff, auto-fix, execution test)
- Phase 2 (quality-check): 20-30 min
- Phase 3 (Git hook): 25-35 min
- Phase 4 (Documentation): 30-40 min
- Phase 5 (Learned skill): 15-20 min
- Phase 6 (Testing): 40-50 min (more comprehensive)
- Phase 7 (Release prep): 15-20 min
   - Known anti-patterns (PENDING_REVIEW.md, etc.)
   - Cross-reference templates with non-templates
   - Fresh init test validates actual user experience

3. **Performance:**
   - Pre-commit must be fast (<2s)
   - Expensive checks (fresh init) only in --full mode
   - quality-check runs comprehensive validation

**Gotchas:**
- Pre-commit hook path: templates/git-hooks/ (not .git/hooks/)
- Hook installation: During init, also document manual install
- Silent mode: Command must support _silent for programmatic use
- Fresh init test: Create temp directory, clean up after

**Important:**
- TDD for new command (tests FIRST)
- Run full test suite before claiming complete
- Test pre-commit hook thoroughly (hard to debug in production)
- Document in multiple places (ESSENTIALS, AGENTS, learned skill)

**Estimated Time:** 150-190 minutes total
- Phase 1 (Command): 45-60 min
- Phase 2 (quality-check): 20-30 min
- Phase 3 (Git hook): 25-35 min
- Phase 4 (Documentation): 30-40 min
- Phase 5 (Learned skill): 15-20 min
- Phase 6 (Testing): 30-40 min
- Phase 7 (Release prep): 15-20 min

**Next:** Hand off to Developer for TDD implementation
