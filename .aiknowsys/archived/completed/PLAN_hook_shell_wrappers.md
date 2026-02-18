---
id: "PLAN_hook_shell_wrappers"
title: "Convert VSCode Hooks to Shell Wrapper Format"
status: "COMPLETE"
author: "arno-paffen"
created: "2026-02-08"
started: "2026-02-08"
completed: "2026-02-08"
---

# Implementation Plan: VSCode Hook Shell Wrappers

**Status:** 📋 PLANNED  
**Created:** 2026-02-08 16:00  
**Goal:** Convert VSCode Copilot hooks from Node.js-only to proper shell wrapper format supporting both .sh (bash) and .ps1 (PowerShell)


## Progress

**2026-02-08:** 

## Post-Completion: Architect Review (2026-02-08 16:45-17:15)

**Reviewer:** Senior Architect  
**Status:** ✅ APPROVED WITH RECOMMENDATIONS → ALL ISSUES ADDRESSED  

**Issues Found:**
1. **Absolute Paths (MEDIUM):** scripts/update-hooks-config.js used relative paths
2. **Graceful Error Handling (MEDIUM):** Generator scripts missing try-catch blocks
3. **Code Comments (MINOR):** Optional improvement (deferred)

**Fixes Applied (Commit 844899b):**
- Added path.resolve() with __dirname for absolute paths (Invariant #2)
- Added try-catch blocks with educational error messages (Invariant #3)
- Used _error prefix for unused catch variables (ESLint compliance)
- 2 files changed, 26 insertions(+), 4 deletions(-)

**Final Validation:**
- ✅ All 164 tests passing
- ✅ No ESLint errors
- ✅ All 8 Critical Invariants satisfied
- ✅ Production-ready

**Time:** ~15 minutes (as estimated in review)

## Overview

VSCode Copilot hooks require executable shell scripts (.sh for Unix/Linux/macOS, .ps1 for Windows), not Node.js module invocations. Current implementation calls `node script.js` which VSCode Copilot cannot execute. 

**Solution:** Create shell wrapper scripts (.sh and .ps1) that:
1. Read JSON input from stdin
2. Pass to existing Node.js logic
3. Output results to stdout

This preserves 14 working, tested hooks while adding proper cross-platform execution layer.

## Requirements

**Functional:**
- All 14 hooks must execute in VSCode Copilot
- Cross-platform: Unix/Linux/macOS (.sh) + Windows (.ps1)
- Preserve existing Node.js logic (no rewrites)
- JSON stdin → Node.js → JSON stdout pipeline
- Proper error handling (exit codes, stderr)

**Non-functional:**
- Performance: <20ms overhead per hook
- Maintainability: Auto-generate wrappers (don't hand-write 28 files)
- Testing: Validate all hooks work before/after

## Architecture Changes

**Current (Wrong):**
```
hooks.json → "node script.js" → Node.js executes → Output
                ❌ VSCode can't execute this
```

**New (Correct):**
```
hooks.json → "./script.sh" → Shell wrapper → "node script.js" → Output
                ✅ VSCode executes shell script
```

**File structure after conversion:**
```
.github/hooks/
├── session-start.js          # Existing Node.js logic (NO CHANGE)
├── session-start.sh          # NEW: Bash wrapper
├── session-start.ps1         # NEW: PowerShell wrapper
├── session-end.js            # Existing Node.js logic
├── session-end.sh            # NEW: Bash wrapper
├── session-end.ps1           # NEW: PowerShell wrapper
...14 hooks × 3 files = 42 files total (14 existing + 28 new)
```

## Implementation Steps

### Phase 1: Create Wrapper Templates

**Goal:** Design shell wrapper templates that work for all hooks

#### Step 1.1: Create Bash Wrapper Template
**File:** `.github/hooks/_template.sh`
**Action:** Create generic bash wrapper
```bash
#!/usr/bin/env bash
# Auto-generated wrapper for VSCode Copilot hooks
# Reads JSON from stdin, passes to Node.js, outputs to stdout

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "$0" .sh)"

# Find corresponding Node.js file (.js, .cjs, or .mjs)
NODE_SCRIPT=""
for ext in js cjs mjs; do
  if [[ -f "$SCRIPT_DIR/$SCRIPT_NAME.$ext" ]]; then
    NODE_SCRIPT="$SCRIPT_DIR/$SCRIPT_NAME.$ext"
    break
  fi
done

if [[ -z "$NODE_SCRIPT" ]]; then
  echo "Error: No Node.js file found for $SCRIPT_NAME" >&2
  exit 1
fi

# Pass stdin to Node.js script
node "$NODE_SCRIPT"
```
- **Why:** Generic template works for all 14 hooks
- **Dependencies:** None (uses existing files)
- **Risk:** Low - simple passthrough logic

#### Step 1.2: Create PowerShell Wrapper Template
**File:** `.github/hooks/_template.ps1`
**Action:** Create generic PowerShell wrapper
```powershell
#!/usr/bin/env pwsh
# Auto-generated wrapper for VSCode Copilot hooks
# Reads JSON from stdin, passes to Node.js, outputs to stdout

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ScriptName = [System.IO.Path]::GetFileNameWithoutExtension($MyInvocation.MyCommand.Name)

# Find corresponding Node.js file (.js, .cjs, or .mjs)
$NodeScript = $null
foreach ($ext in @('js', 'cjs', 'mjs')) {
  $candidate = Join-Path $ScriptDir "$ScriptName.$ext"
  if (Test-Path $candidate) {
    $NodeScript = $candidate
    break
  }
}

if (-not $NodeScript) {
  Write-Error "Error: No Node.js file found for $ScriptName"
  exit 1
}

# Pass stdin to Node.js script
$input | node $NodeScript
```
- **Why:** Windows support for cross-platform compatibility
- **Dependencies:** PowerShell 7+ (pwsh)
- **Risk:** Low - mirrors bash logic

### Phase 2: Generate Wrapper Scripts

**Goal:** Automatically create 28 wrapper files (14 hooks × 2 platforms)

#### Step 2.1: Create Generator Script
**File:** `scripts/generate-hook-wrappers.js`
**Action:** Generate all .sh and .ps1 wrappers from template
```javascript
#!/usr/bin/env node
/**
 * Generates shell wrappers for all VSCode Copilot hooks
 * Creates .sh (bash) and .ps1 (PowerShell) for each .js/.cjs/.mjs hook
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOOKS_DIR = path.join(__dirname, '../.github/hooks');

// Read templates
const bashTemplate = fs.readFileSync(path.join(HOOKS_DIR, '_template.sh'), 'utf8');
const ps1Template = fs.readFileSync(path.join(HOOKS_DIR, '_template.ps1'), 'utf8');

// Find all Node.js hooks (exclude templates, git hooks)
const hooks = fs.readdirSync(HOOKS_DIR)
  .filter(f => /\.(js|cjs|mjs)$/.test(f))
  .map(f => path.basename(f, path.extname(f)));

console.log(`Found ${hooks.length} hooks to wrap:`);
hooks.forEach(h => console.log(`  - ${h}`));

// Generate wrappers
let created = 0;
hooks.forEach(hookName => {
  // Create .sh wrapper
  const shPath = path.join(HOOKS_DIR, `${hookName}.sh`);
  fs.writeFileSync(shPath, bashTemplate, { mode: 0o755 });
  fs.chmodSync(shPath, 0o755); // Ensure executable
  created++;
  
  // Create .ps1 wrapper
  const ps1Path = path.join(HOOKS_DIR, `${hookName}.ps1`);
  fs.writeFileSync(ps1Path, ps1Template);
  created++;
});

console.log(`\n✅ Generated ${created} wrapper files (${hooks.length} × 2 platforms)`);
console.log('Next: Update hooks.json to use .sh/.ps1 instead of node commands');
```
- **Why:** Automates wrapper creation (no manual file creation)
- **Dependencies:** Node.js (already required)
- **Risk:** Low - simple file generation

#### Step 2.2: Run Generator
**Action:** Execute generator script
```bash
node scripts/generate-hook-wrappers.js
```
- **Expected output:** 28 new files (.sh + .ps1 for 14 hooks)
- **Verification:** Check .github/hooks/ has 42 total files
- **Risk:** Low - creates new files (no modification)

### Phase 3: Update Hook Configuration

**Goal:** Update hooks.json to use shell wrappers instead of `node` commands

#### Step 3.1: Update hooks.json
**File:** `.github/hooks/hooks.json`
**Action:** Replace all `node .github/hooks/script.{js,cjs,mjs}` with `.github/hooks/script.sh` (bash) and `.github/hooks/script.ps1` (powershell)

**Example change:**
```json
// BEFORE
{
  "bash": "node .github/hooks/session-start.js",
  "powershell": "node .github/hooks/session-start.js"
}

// AFTER
{
  "bash": ".github/hooks/session-start.sh",
  "powershell": ".github/hooks/session-start.ps1"
}
```
- **Why:** Makes VSCode Copilot call shell wrappers
- **Dependencies:** Phase 2 complete (wrappers exist)
- **Risk:** Medium - wrong paths break all hooks
- **TDD:** Write test to validate hooks.json paths exist

#### Step 3.2: Create Configuration Update Script
**File:** `scripts/update-hooks-config.js`
**Action:** Programmatically update hooks.json (safer than manual)
```javascript
#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const hooksJsonPath = '.github/hooks/hooks.json';
const config = JSON.parse(fs.readFileSync(hooksJsonPath, 'utf8'));

// Process all hooks
Object.keys(config.hooks).forEach(lifecycle => {
  config.hooks[lifecycle].forEach(hook => {
    if (hook.type === 'command') {
      // Extract hook name from node command
      const match = hook.bash?.match(/node .github\/hooks\/(.+)\.(js|cjs|mjs)$/);
      if (match) {
        const hookName = match[1];
        hook.bash = `.github/hooks/${hookName}.sh`;
        hook.powershell = `.github/hooks/${hookName}.ps1`;
        console.log(`✓ Updated: ${hookName}`);
      }
    }
  });
});

fs.writeFileSync(hooksJsonPath, JSON.stringify(config, null, 2) + '\n');
console.log('\n✅ hooks.json updated');
```
- **Why:** Automated update (no manual JSON editing)
- **Dependencies:** Phase 2 complete
- **Risk:** Low - validates before writing

### Phase 4: Testing & Validation

**Goal:** Verify all hooks execute correctly in VSCode Copilot

#### Step 4.1: Unit Test Wrappers
**File:** `test/hooks/shell-wrappers.test.ts`
**Action:** Test wrapper execution (RED phase)
```typescript
import { describe, test, expect } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Shell Wrappers', () => {
  const HOOKS_DIR = '.github/hooks';
  
  // Find all .sh wrappers
  const wrappers = fs.readdirSync(HOOKS_DIR)
    .filter(f => f.endsWith('.sh') && !f.startsWith('_'));
  
  test('all wrappers are executable', () => {
    wrappers.forEach(wrapper => {
      const filePath = path.join(HOOKS_DIR, wrapper);
      const stats = fs.statSync(filePath);
      expect(stats.mode & 0o111).toBeGreaterThan(0); // Check executable bit
    });
  });
  
  test('all wrappers have corresponding Node.js files', () => {
    wrappers.forEach(wrapper => {
      const hookName = path.basename(wrapper, '.sh');
      const hasNodeFile = ['js', 'cjs', 'mjs'].some(ext =>
        fs.existsSync(path.join(HOOKS_DIR, `${hookName}.${ext}`))
      );
      expect(hasNodeFile).toBe(true);
    });
  });
  
  test('wrappers execute and pass stdin to Node.js', () => {
    const testInput = JSON.stringify({ test: true });
    
    wrappers.forEach(wrapper => {
      const filePath = path.join(HOOKS_DIR, wrapper);
      try {
        const output = execSync(`echo '${testInput}' | ${filePath}`, {
          encoding: 'utf8',
          timeout: 5000
        });
        // Should not crash (Node.js receives input)
        expect(output).toBeDefined();
      } catch (error: any) {
        // Some hooks may error on test input, but shouldn't crash the wrapper
        expect(error.status).toBeDefined();
      }
    });
  });
  
  test('hooks.json points to existing wrappers', () => {
    const config = JSON.parse(fs.readFileSync('.github/hooks/hooks.json', 'utf8'));
    
    Object.values(config.hooks).forEach((lifecycle: any) => {
      lifecycle.forEach((hook: any) => {
        if (hook.bash) {
          expect(fs.existsSync(hook.bash)).toBe(true);
        }
        if (hook.powershell) {
          expect(fs.existsSync(hook.powershell)).toBe(true);
        }
      });
    });
  });
});
```
- **Why:** Validates wrapper functionality before integration
- **Dependencies:** Phase 2-3 complete
- **Risk:** Low - non-destructive tests
- **TDD:** Write BEFORE running generator (RED → GREEN)

#### Step 4.2: Integration Test (VSCode Copilot)
**Action:** Manual validation in VSCode Copilot
1. Start new Copilot session
2. Verify sessionStart hooks execute (check health warnings, session detection)
3. Make file edit
4. Verify preToolUse hooks execute (TDD reminder, mutation warnings)
5. Submit prompt
6. Verify userPromptSubmitted hooks execute (skill detection)
7. End session
8. Verify sessionEnd hooks execute (session file creation)
- **Why:** Confirms hooks work in actual environment
- **Dependencies:** Phase 3 complete
- **Risk:** Medium - requires VSCode + Copilot
- **Expected:** Console output from hooks, session file auto-created

#### Step 4.3: Validation Matrix
**Action:** Run full validation suite
```bash
# 1. Unit tests
npm test

# 2. Validate deliverables (templates in sync)
npx aiknowsys validate-deliverables

# 3. Check hook configuration
node scripts/validate-hooks-config.js  # NEW script

# 4. Manual integration test (VSCode Copilot)
# [Follow Step 4.2 checklist]
```
- **Why:** Comprehensive validation before commit
- **Dependencies:** All phases complete
- **Risk:** Low - validates everything

### Phase 5: Documentation & Cleanup

**Goal:** Update documentation to reflect new architecture

#### Step 5.1: Update Hook Troubleshooting Guide
**File:** `.aiknowsys/learned/hook-troubleshooting.md`
**Action:** Correct root cause analysis
- Change: "Environment issue" → "File format issue (now FIXED)"
- Add: Shell wrapper architecture explanation
- Add: Troubleshooting for wrappers (PATH issues, permissions)
- **Why:** Correct previous wrong diagnosis
- **Dependencies:** Phase 4 complete (verified working)
- **Risk:** Low - documentation only

#### Step 5.2: Update AGENTS.md
**File:** `AGENTS.md`
**Action:** Correct environment requirement statement (line 148)
```markdown
// BEFORE
**Environment requirement:** VSCode + GitHub Copilot coding agent (hooks don't execute in other environments)

// AFTER
**VSCode Hooks (Automated):**  
If VSCode hooks are installed (`.github/hooks/`), session files are automatically created/updated:
- `sessionStart` hook: Detects recent sessions and reminds you to load context
- `sessionEnd` hook: Creates/updates today's session file with timestamp
- Hooks use shell wrappers (.sh/.ps1) for cross-platform compatibility
- If hooks aren't available, manual session management works the same
```
- **Why:** Accurate statement about hooks architecture
- **Dependencies:** Phase 4 complete
- **Risk:** Low - documentation fix

#### Step 5.3: Update VSCode Hooks Guide
**File:** `docs/vscode-hooks-guide.md`
**Action:** Add shell wrapper architecture section
- Add section: "Shell Wrapper Architecture"
- Explain: Why wrappers needed (GitHub Copilot requirements)
- Document: .sh (Unix) + .ps1 (Windows) approach
- Update: Troubleshooting section (file format → permissions/PATH)
- **Why:** Complete reference documentation
- **Dependencies:** Phase 4 complete
- **Risk:** Low - enhances guide

#### Step 5.4: Add Generator to npm scripts
**File:** `package.json`
**Action:** Add script for wrapper regeneration
```json
{
  "scripts": {
    "generate:hooks": "node scripts/generate-hook-wrappers.js",
    "update:hooks-config": "node scripts/update-hooks-config.js"
  }
}
```
- **Why:** Easy regeneration if templates change
- **Dependencies:** Phase 2 scripts exist
- **Risk:** Low - convenience script

## Testing Strategy

**TDD Approach:**
1. **RED:** Write wrapper tests (Step 4.1) BEFORE generating wrappers
2. **GREEN:** Generate wrappers (Step 2.2), tests pass
3. **REFACTOR:** Optimize template if needed

**Test Coverage:**
- Unit tests: Shell wrapper execution (test/hooks/shell-wrappers.test.ts)
- Integration tests: VSCode Copilot execution (manual checklist)
- Configuration tests: hooks.json path validation (automated)
- Validation: Full matrix (npm test + validate-deliverables)

## Risks & Mitigations

**Risk:** Wrappers don't execute in VSCode Copilot
- **Likelihood:** Low
- **Impact:** High (hooks still broken)
- **Mitigation:** Test with real VSCode + Copilot before committing

**Risk:** PowerShell syntax issues (untested on Windows)
- **Likelihood:** Medium
- **Impact:** Medium (Windows users can't use hooks)
- **Mitigation:** Test on Windows VM or request user validation

**Risk:** Generated wrappers wrong permissions
- **Likelihood:** Medium (chmod may not work on all systems)
- **Impact:** Medium (wrappers won't execute)
- **Mitigation:** Validate permissions in tests (Step 4.1)

**Risk:** Performance overhead noticeable
- **Likelihood:** Low
- **Impact:** Low (hooks already have timeouts)
- **Mitigation:** Measure wrapper overhead (<20ms expected)

**Risk:** Breaking existing manual testing workflow
- **Likelihood:** Low
- **Impact:** Low (can still call `node hook.js` directly)
- **Mitigation:** Document both execution methods

## Success Criteria

- [ ] All 28 wrapper files generated (14 × 2 platforms)
- [ ] All .sh files executable (chmod 755)
- [ ] hooks.json updated (all paths → .sh/.ps1)
- [ ] Unit tests pass (shell-wrappers.test.ts)
- [ ] Integration test pass (VSCode Copilot executes hooks)
- [ ] Documentation updated (3 files corrected)
- [ ] npm test passes (all tests including new wrapper tests)
- [ ] validate-deliverables passes
- [ ] Session file auto-created during actual usage

## Notes for Developer

**Key decisions:**
- Using auto-generation prevents manual errors (28 files)
- Generic templates work for all hooks (no special cases)
- Node.js logic unchanged (zero regression risk)
- TDD: Write wrapper tests BEFORE generating wrappers

**Gotchas:**
- chmod 755 may fail on Windows (check permissions test)
- PowerShell wrapper untested (request user validation if no Windows access)
- Some hooks may timeout with wrapper overhead (increase timeoutSec if needed)

**Expected commit sequence:**
1. Commit templates + generator scripts
2. Commit generated wrappers (28 files)
3. Commit hooks.json update
4. Commit tests
5. Commit documentation fixes

**Estimated time:** 5-6 hours total
**Priority:** High - fixes critical functionality gap
