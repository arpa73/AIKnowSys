---
name: bash-script-tdd
description: Test-Driven Development workflow for bash scripts using Node.js test runner. Write comprehensive tests for bash utilities to catch bugs before production.
trigger_words: [bash TDD, test bash script, bash testability, script testing, test shell script]
created: 2026-02-06
origin: cleanup-test-dirs.sh implementation
pattern_type: testing_workflow
---

# Bash Script TDD Workflow

## When to Use This Skill

**Trigger words:**
- "bash TDD"
- "test bash script"
- "bash testability"
- "script testing"
- "test shell script"
- "bash utility testing"

**Use this skill when:**
- Creating new bash utility scripts (cleanup, deployment, build scripts)
- Adding tests to existing bash scripts
- Making bash scripts more testable
- Preventing bugs in destructive operations (rm -rf, deployments)
- Ensuring script reliability before production use

---

## Prerequisites

**Before starting, ensure:**
- [ ] Project uses Node.js test runner (`node:test`)
- [ ] Bash 4+ available on target systems
- [ ] Script follows strict error handling (`set -euo pipefail`)
- [ ] Understanding of TDD workflow (RED-GREEN-REFACTOR)

**Required knowledge:**
- Bash scripting basics (functions, variables, control flow)
- Node.js child_process module (execSync)
- Temporary file/directory creation for test isolation

**Required tools:**
- Node.js 20+ (for native test runner)
- Bash 4+
- Common utilities: find, mkdir, rm, etc.

---

## Why Test Bash Scripts?

**Common bash script risks:**
- 🔥 Destructive operations (`rm -rf`, `git reset --hard`)
- 🐛 Silent failures (commands fail but script continues)
- 🎯 Wrong targets (delete wrong directory, deploy wrong environment)
- 💥 Edge cases (empty strings, spaces in filenames, missing directories)

**Benefits of TDD for bash:**
- ✅ Catch bugs BEFORE running `rm -rf` in production
- ✅ Test edge cases safely (empty workspaces, missing files)
- ✅ Document expected behavior with executable specs
- ✅ Refactor safely (tests catch regressions)
- ✅ CI/CD validation (scripts don't break deployments)

**Real example from this project:**
```bash
# Bug caught by tests BEFORE production:
# Script matched cleanup-test-* directory (itself!)
# Would have deleted working directory (catastrophic)
# Test revealed issue, fixed before any git commit
```

---

## Design Principles for Testable Bash Scripts

### 1. Accept Directory Arguments

**❌ Hard to test:**
```bash
#!/usr/bin/env bash
# Always operates in current directory
cd "$(dirname "$0")/.."
find . -name "test-*" -delete
```

**✅ Testable:**
```bash
#!/usr/bin/env bash
# Accepts target directory argument
TARGET_DIR="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
find "$TARGET_DIR" -name "test-*" -delete
```

**Why:** Tests can create isolated temp directories instead of polluting project.

---

### 2. Support Flags for Safety and Automation

**Essential flags:**
```bash
--dry-run   # Preview changes without executing
--force     # Skip confirmation prompts (CI-friendly)
--verbose   # Detailed output for debugging
```

**Pattern:**
```bash
DRY_RUN=false
FORCE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --force) FORCE=true; shift ;;
    *) TARGET_DIR="$1"; shift ;;
  esac
done

# Confirmation for destructive actions (skip in tests with --force)
if [[ "$DRY_RUN" == "false" && "$FORCE" == "false" ]]; then
  read -p "Continue? [y/N] " -n 1 -r
  [[ ! $REPLY =~ ^[Yy]$ ]] && exit 0
fi
```

**Why:** 
- Dry-run enables safe testing (no actual changes)
- Force flag prevents tests blocking on interactive prompts
- Tests can validate both modes independently

---

### 3. Explicit Protection Logic

**❌ Implicit assumptions:**
```bash
find . -name "test-*" -delete  # Might delete important test/ directory!
```

**✅ Explicit protection:**
```bash
for dir in $(find "$TARGET_DIR" -maxdepth 1 -name "test-*"); do
  # Skip if this is TARGET_DIR itself (prevent self-deletion)
  if [[ "$dir" == "$TARGET_DIR" ]]; then
    continue
  fi
  
  # Protect actual test/ directory (preserve test suite)
  if [[ "$(basename "$dir")" == "test" ]]; then
    continue
  fi
  
  rm -rf "$dir"
done
```

**Why:** Tests can verify protection logic actually works.

---

### 4. Deterministic Output for Assertions

**Structure output for parsing:**
```bash
# Summary line that tests can assert against
echo "Deleted: $DELETED_COUNT test directories"

# Or use structured output (JSON)
echo "{\"deleted\": $DELETED_COUNT, \"found\": $FOUND_COUNT}"
```

**Why:** Tests can validate exact counts, not just exit codes.

---

## Step-by-Step TDD Workflow

### Step 1: 🔴 RED - Write Failing Tests FIRST

**Goal:** Define expected behavior through tests before implementation exists.

**Actions:**

1. **Create test file** (Node.js ES module):

```javascript
// test/my-script.test.js
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(__dirname, '../scripts/my-script.sh');

describe('my-script.sh', () => {
  let tempWorkspace;

  beforeEach(() => {
    // Create isolated test workspace
    tempWorkspace = fs.mkdtempSync(path.join('/tmp', 'test-script-'));
  });

  afterEach(() => {
    // Cleanup after each test
    if (tempWorkspace && fs.existsSync(tempWorkspace)) {
      fs.rmSync(tempWorkspace, { recursive: true, force: true });
    }
  });

  // Test 1: Dry-run mode doesn't make changes
  it('should NOT make changes in dry-run mode', () => {
    // Setup: Create something that would be deleted
    fs.mkdirSync(path.join(tempWorkspace, 'target-dir'));
    
    // Execute: Run script in dry-run mode
    execSync(`bash ${scriptPath} --dry-run ${tempWorkspace}`);
    
    // Assert: Target still exists
    assert.ok(fs.existsSync(path.join(tempWorkspace, 'target-dir')));
  });

  // Test 2: Actual execution makes changes
  it('should delete target when run without dry-run', () => {
    fs.mkdirSync(path.join(tempWorkspace, 'target-dir'));
    
    // Use --force to skip confirmation prompt
    execSync(`bash ${scriptPath} --force ${tempWorkspace}`);
    
    assert.ok(!fs.existsSync(path.join(tempWorkspace, 'target-dir')));
  });

  // Test 3: Protection logic works
  it('should protect important directories', () => {
    fs.mkdirSync(path.join(tempWorkspace, 'important'));
    fs.writeFileSync(path.join(tempWorkspace, 'important', 'data.txt'), 'keep me');
    
    execSync(`bash ${scriptPath} --force ${tempWorkspace}`);
    
    assert.ok(fs.existsSync(path.join(tempWorkspace, 'important')));
  });
});
```

2. **Run tests** (they should FAIL - script doesn't exist yet):

```bash
node --test test/my-script.test.js
```

**Expected output:** Test failures (script not found, or wrong behavior)

**Why this step:** 
- Confirms tests actually test something (if they pass without code, they're broken)
- Documents expected behavior before implementation
- Guides implementation (you know what to build)

---

### Step 2: 🟢 GREEN - Implement Minimal Code to Pass

**Goal:** Make tests pass with simplest possible implementation.

**Actions:**

1. **Create script skeleton:**

```bash
#!/usr/bin/env bash
# Script description
# Usage: bash scripts/my-script.sh [--dry-run] [--force] [directory]

set -euo pipefail

# Parse arguments
DRY_RUN=false
FORCE=false
TARGET_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --force) FORCE=true; shift ;;
    *) 
      if [[ -z "$TARGET_DIR" ]]; then
        TARGET_DIR="$1"
      fi
      shift
      ;;
  esac
done

# Default to script's parent directory
if [[ -z "$TARGET_DIR" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  TARGET_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
else
  # Resolve to absolute path
  TARGET_DIR="$(cd "$TARGET_DIR" 2>/dev/null && pwd || echo "$TARGET_DIR")"
fi

# Confirmation prompt (unless --force or --dry-run)
if [[ "$DRY_RUN" == "false" && "$FORCE" == "false" ]]; then
  echo "⚠️  This will modify: $TARGET_DIR"
  read -p "Continue? [y/N] " -n 1 -r
  echo
  [[ ! $REPLY =~ ^[Yy]$ ]] && exit 0
fi

# Main logic
if [[ "$DRY_RUN" == "true" ]]; then
  echo "DRY RUN - No changes will be made"
  # ... preview logic
else
  # ... actual changes
fi
```

2. **Run tests again:**

```bash
node --test test/my-script.test.js
```

3. **Iterate until all tests pass:**
   - Tests reveal bugs (wrong logic, missing protection)
   - Fix implementation
   - Re-run tests
   - Repeat until green ✅

**Example bugs caught during this step:**
```bash
# Bug 1: Script matched temp directory itself (cleanup-test-*)
# Fix: Add skip logic for TARGET_DIR exact match

# Bug 2: Count was 4 instead of expected 3
# Fix: Adjust counting to match actual deletions

# Bug 3: test/ directory not fully protected
# Fix: Add explicit basename check
```

**Expected output:** All tests passing ✅

---

### Step 3: 🔵 REFACTOR - Improve While Keeping Tests Green

**Goal:** Clean up code, add safety features, improve UX without breaking tests.

**Actions:**

1. **Add color-coded output:**

```bash
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}✓ Success${NC}"
echo -e "${RED}✗ Deleted${NC}"
echo -e "${YELLOW}⚠️  Warning${NC}"
```

2. **Add summary statistics:**

```bash
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary:"
echo "  Deleted: $DELETED_COUNT directories"
echo "  Skipped: $SKIPPED_COUNT directories"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

3. **Add helpful documentation:**

```bash
# Usage comment at top of file
# Usage: bash scripts/my-script.sh [--dry-run] [--force] [directory]
#   --dry-run: Preview changes without making them
#   --force:   Skip confirmation prompt (for CI/automation)
#   directory: Target directory (defaults to project root)
```

4. **Run tests after each change:**

```bash
node --test test/my-script.test.js
```

**Expected:** All tests still passing (no regressions)

**Why this step:**
- Tests protect against accidental breakage during cleanup
- UX improvements don't compromise functionality
- Safe to experiment (tests catch mistakes)

---

## Advanced Testing Patterns

### Pattern 1: Testing Output Messages

```javascript
it('should show correct summary in dry-run mode', () => {
  fs.mkdirSync(path.join(tempWorkspace, 'test-123'));
  fs.mkdirSync(path.join(tempWorkspace, 'test-456'));
  
  const output = execSync(`bash ${scriptPath} --dry-run ${tempWorkspace}`, {
    encoding: 'utf-8'
  });
  
  assert.match(output, /Found: 2/, 'Should report 2 directories found');
  assert.match(output, /Would delete/, 'Should show dry-run message');
});
```

---

### Pattern 2: Testing Edge Cases

```javascript
it('should handle empty workspace gracefully', () => {
  const cleanWorkspace = fs.mkdtempSync(path.join('/tmp', 'clean-'));
  
  try {
    const output = execSync(`bash ${scriptPath} --force ${cleanWorkspace}`, {
      encoding: 'utf-8'
    });
    
    assert.match(output, /Workspace is clean/, 'Should show clean message');
    assert.doesNotMatch(output, /error/i, 'Should not show errors');
  } finally {
    fs.rmSync(cleanWorkspace, { recursive: true, force: true });
  }
});
```

---

### Pattern 3: Testing Error Conditions

```javascript
it('should fail gracefully on invalid directory', () => {
  assert.throws(
    () => execSync(`bash ${scriptPath} --force /nonexistent/path`, {
      encoding: 'utf-8'
    }),
    'Should throw error for invalid directory'
  );
});
```

---

### Pattern 4: Testing Protection Logic

```javascript
it('should never delete important directories', () => {
  // Create directories that match pattern BUT should be protected
  fs.mkdirSync(path.join(tempWorkspace, 'test'));  // Protected name
  fs.writeFileSync(path.join(tempWorkspace, 'test', 'important.test.js'), '// test');
  
  execSync(`bash ${scriptPath} --force ${tempWorkspace}`);
  
  // Assert important directory still exists
  assert.ok(fs.existsSync(path.join(tempWorkspace, 'test')));
  assert.ok(fs.existsSync(path.join(tempWorkspace, 'test', 'important.test.js')));
});
```

---

## Common Bash Testing Gotchas

### Gotcha 1: Interactive Prompts Block Tests

**Problem:**
```bash
read -p "Continue? [y/N]"  # Blocks forever in CI
```

**Solution:**
```bash
# Add --force flag to skip prompts
if [[ "$FORCE" == "false" ]]; then
  read -p "Continue? [y/N]"
fi

# In tests, always use --force
execSync(`bash ${scriptPath} --force ${tempWorkspace}`);
```

---

### Gotcha 2: Path Spaces Break String Comparisons

**Problem:**
```bash
if [[ $dir == $TARGET_DIR ]]; then  # Breaks with spaces!
```

**Solution:**
```bash
if [[ "$dir" == "$TARGET_DIR" ]]; then  # Always quote variables
```

---

### Gotcha 3: Exit Code 0 Hides Errors

**Problem:**
```bash
#!/usr/bin/env bash
# Without strict mode, script continues on errors
rm nonexistent-file  # Fails silently
echo "Success!"  # Still runs, exit code 0
```

**Solution:**
```bash
#!/usr/bin/env bash
set -euo pipefail  # Exit on error, undefined vars, pipe failures

rm nonexistent-file  # Script stops here with exit code 1
echo "Success!"  # Never runs
```

---

### Gotcha 4: Temp Directory Conflicts

**Problem:**
```bash
// Multiple tests use same temp directory
beforeEach(() => {
  tempWorkspace = '/tmp/test';  // Conflict!
});
```

**Solution:**
```bash
beforeEach(() => {
  tempWorkspace = fs.mkdtempSync('/tmp/test-');  // Unique each time
});
```

---

## Final Validation

**Run these commands to verify everything works:**

```bash
# 1. Run tests
node --test test/my-script.test.js

# Expected: All tests passing ✅

# 2. Manual dry-run test (safe, no changes)
bash scripts/my-script.sh --dry-run

# Expected: Shows what would happen, no errors

# 3. Verify script is executable (if needed)
chmod +x scripts/my-script.sh

# 4. Run full test suite (ensure no regressions)
npm test

# Expected: All 580+ tests passing
```

---

## Checklist for Production-Ready Bash Scripts

- [ ] **Error handling:** `set -euo pipefail` at top
- [ ] **Testability:** Accepts directory argument for isolation
- [ ] **Safety flags:** `--dry-run` and `--force` implemented
- [ ] **Protection logic:** Explicit checks for important directories
- [ ] **Deterministic output:** Counts, summaries that tests can assert
- [ ] **Interactive prompts:** Skippable with `--force` flag
- [ ] **Comprehensive tests:** Dry-run, actual execution, edge cases, protection
- [ ] **Test isolation:** Each test uses unique temp workspace
- [ ] **Cleanup:** `afterEach` removes temp directories
- [ ] **Documentation:** Clear usage comments, help text
- [ ] **Color output:** Green/yellow/red for better UX
- [ ] **Summary stats:** Show what happened (counts, results)

---

## Real-World Example

**Reference implementation:** `scripts/cleanup-test-dirs.sh` and `test/cleanup-test-dirs.test.js`

**What it demonstrates:**
- ✅ 7 comprehensive tests (all scenarios covered)
- ✅ Tests caught 3 bugs BEFORE production (self-deletion, wrong count, missing protection)
- ✅ Safety features: dry-run + confirmation + force flag
- ✅ Protection logic: Skips test/ and TARGET_DIR itself
- ✅ Clean test isolation: Temp workspaces, proper cleanup
- ✅ 100% test coverage: All code paths tested

**Bugs caught by TDD:**
1. Script matched `cleanup-test-*` (itself!) → would delete working directory
2. Reported 4 deletions instead of 3 → confusing feedback
3. test/ directory protection had edge cases → could delete test suite

**ROI:** Writing tests FIRST saved debugging time, prevented production bugs, and documented expected behavior.

---

## Related Patterns

- **TDD Workflow:** `.github/skills/tdd-workflow/SKILL.md` - Core RED-GREEN-REFACTOR cycle
- **Validation Troubleshooting:** `.github/skills/validation-troubleshooting/SKILL.md` - Debug test failures
- **Logger Pattern:** `.aiknowsys/learned/logger-pattern.md` - Testable logging for Node.js

---

*Pattern discovered during cleanup-test-dirs.sh implementation (Feb 6, 2026)*  
*Demonstrates TDD applied to bash utilities - caught 3 bugs before production*
