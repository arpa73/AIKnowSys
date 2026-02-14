---
name: hook-troubleshooting
pattern_type: debugging_technique
trigger_words:
  - "hooks not working"
  - "no hook output"
  - "VSCode hooks"
  - "missing session reminders"
  - "hooks don't execute"
  - "hook troubleshooting"
discovered: "2026-02-08"
context: "Diagnosed why VSCode hooks weren't executing during investigation of PLAN_deliverables_sync_hooks"
updated: "2026-02-08"
status: "RESOLVED (v0.11.0+)" # Shell wrappers implemented
---

# Hook Troubleshooting Pattern

## ⚠️ UPDATE (2026-02-08): Root Cause Corrected

**Previous diagnosis (WRONG):** Environment issue - not using VSCode Copilot coding agent
**Actual root cause:** **Wrong file format** - hooks implemented as Node.js modules instead of shell scripts
**Status:** ✅ **FIXED in v0.11.0+** - Shell wrappers (.sh/.ps1) now implemented

See "Shell Wrapper Architecture" section below for technical details.

## Symptoms

- No output from sessionStart hooks (no recent session reminders)
- No TDD reminders during file edits (preToolUse hooks)
- No validation warnings when claiming work complete
- Session files not auto-created (sessionEnd hooks)
- No hook execution evidence in conversation or terminal

## Root Causes & Solutions

### 1. ✅ FIXED: File Format Issue (v0.11.0+)

**Problem (pre-v0.11.0):** Hooks were Node.js modules (.js/.cjs/.mjs), not executable shell scripts
**GitHub Copilot requires:** Executable shell scripts (.sh for Unix, .ps1 for Windows)
**Solution implemented:** Shell wrapper architecture (see below)

**If using v0.11.0+:** Hooks should work automatically in VSCode Copilot. If not, see "Environment Configuration" section.

### 2. Environment Configuration

**Hooks execute ONLY in:**
- ✅ **Visual Studio Code** (desktop application)
- ✅ **GitHub Copilot extension** installed and active  
- ✅ **Copilot coding agent** mode (not regular chat)

**Not supported:**
- ❌ Claude Code/Chat
- ❌ Cursor IDE
- ❌ Web-based AI assistants
- ❌ GitHub Copilot web interface
- ❌ GitHub Copilot regular chat mode (non-coding agent)

**How to verify:**
1. Check VSCode extensions: Is GitHub Copilot installed?
2. Check Copilot mode: Coding agent vs regular chat?
3. Open Output panel (`Cmd/Ctrl + Shift + U`)
4. Select "GitHub Copilot" from dropdown
5. Look for hook execution logs during session

### 3. Hook Configuration Issue

**Symptoms:** Hooks exist but don't run

**Checks:**
- `hooks.json` exists in `.github/hooks/`
- Hook files have correct paths in `hooks.json`
- Hook registration matches lifecycle events
- No syntax errors in hook files

**Manual Test:**
```bash
# Test hooks using shell wrappers (v0.11.0+)
.github/hooks/session-start.sh
.github/hooks/session-end.sh
echo '{"tool": "create_file", "parameters": {"filePath": ".aiknowsys/test.md"}}' | .github/hooks/mutation-enforcement.sh

# Or test Node.js directly (bypasses wrapper)
node .github/hooks/session-start.js
node .github/hooks/session-end.js
echo '{"tool": "create_file", "parameters": {"filePath": ".aiknowsys/test.md"}}' | node .github/hooks/mutation-enforcement.cjs
```

If manual shell tests work but hooks don't fire during sessions → **Environment configuration issue (see section 2)**

---

## Shell Wrapper Architecture (v0.11.0+)

**Why shell wrappers?**

GitHub Copilot requires hooks to be **executable shell scripts**, not Node.js module invocations.

**Previous (WRONG):**
```json
{
  "bash": "node .github/hooks/hook.js",  // ❌ VSCode Copilot can't execute this
  "powershell": "node .github/hooks/hook.js"
}
```

**Current (CORRECT):**
```json
{
  "bash": ".github/hooks/hook.sh",        // ✅ Executable shell script  
  "powershell": ".github/hooks/hook.ps1"  // ✅ Cross-platform support
}
```

**File structure:**
```
.github/hooks/
├── session-start.js         # Node.js logic (unchanged)
├── session-start.sh         # Bash wrapper (auto-generated)
├── session-start.ps1        # PowerShell wrapper (auto-generated)
...
```

**Wrapper implementation (bash):**
```bash
#!/usr/bin/env bash
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

**Key points:**
- ✅ Preserves all existing Node.js logic (zero code changes)
- ✅ Cross-platform: .sh (Unix) + .ps1 (Windows)
- ✅ Auto-generated: 32 wrapper files (16 hooks × 2 platforms)
- ✅ Executable: `chmod +x .github/hooks/*.sh`
- ✅ Tested: Unit tests validate wrapper execution

**Regenerating wrappers:**
```bash
# After adding new hooks or updating templates
npm run generate:hooks      # Create .sh/.ps1 wrappers
npm run update:hooks-config # Update hooks.json
npm test                    # Validate all wrappers work
```

**Troubleshooting wrappers:**

**Symptom:** "Permission denied" when hook executes
```bash
# Fix: Make wrappers executable
chmod +x .github/hooks/*.sh
```

**Symptom:** "No such file" error for Node.js file
```bash
# Check: Does corresponding .js/.cjs/.mjs exist?
ls .github/hooks/hook-name.*

# If missing: Node.js file was deleted but wrapper wasn't regenerated
npm run generate:hooks  # Recreate wrappers
```

**Symptom:** Wrapper hangs/times out
```bash
# Check: Does Node.js logic have infinite loop?
node .github/hooks/hook-name.js  # Test Node.js directly

# Check: Is stdin being consumed?
echo '{}' | .github/hooks/hook-name.sh  # Test with empty JSON
```

---

### 3. Hook Incomplete or Has Bugs

**Example discovered:** mutation-enforcement.cjs missing `create_file` detection

**Symptom:** Hook should warn but doesn't (even when environment correct)

**Discovered via:** Created plan file with `create_file` tool, no warning appeared

**Root cause:** `isFileEditTool()` function missing tool name in check list

**Solution:** Add missing tool + write test to prevent regression

## Solutions

### If Using Non-VSCode Environment

**Option A: Switch to VSCode + Copilot**
- Install Visual Studio Code
- Install GitHub Copilot extension
- Use Copilot coding agent mode
- Hooks will execute automatically

**Option B: Manual Workflow (Hooks-Free)**
- Follow workflows in [AGENTS.md](../../AGENTS.md)
- Manually create session files: `cat >> .aiknowsys/sessions/YYYY-MM-DD-session.md`
- Manually run validation: `npm test`, `npm run lint`
- Manually check TDD compliance before commits
- Mutation commands still work: `npx aiknowsys update-session`, `update-plan`

**Note:** Mutation commands (create-session, update-plan) work in ANY environment - they don't require hooks

### If Using VSCode But Hooks Don't Run

**Step 1: Verify Copilot Mode**
- Open Command Palette (`Cmd/Ctrl + Shift + P`)
- Search "GitHub Copilot"
- Ensure you're in coding agent mode, not regular chat

**Step 2: Check hooks.json**
```bash
# Verify hooks.json exists and is valid
cat .github/hooks/hooks.json | jq .

# Expected: 14 hooks across 5 lifecycle events
```

**Step 3: Test Hook Manually**
```bash
# Test sessionStart
node .github/hooks/session-start.js

# Expected output: Recent session detection or "no sessions found"
# No output = hook has issue, check syntax
```

**Step 4: Check VSCode Output Panel**
1. Open Output panel (`Cmd/Ctrl + Shift + U`)
2. Select "GitHub Copilot" from dropdown
3. Start new conversation with Copilot
4. Look for hook execution logs

**Step 5: Reinstall Hooks**
```bash
# Copy templates/hooks/ to .github/hooks/
cp -r templates/hooks/* .github/hooks/

# Verify hooks.json copied correctly
ls -la .github/hooks/hooks.json
```

### Debugging Hook Logic Issues

**If hooks run but behave incorrectly:**

**Method 1: Add Debug Logging**
```javascript
// Add to hook file
console.error('[DEBUG] Hook started');
console.error('[DEBUG] Data received:', JSON.stringify(data, null, 2));
console.error('[DEBUG] Current directory:', process.cwd());
console.error('[DEBUG] Files found:', fs.readdirSync('.').slice(0, 5));
```

**Method 2: Isolate Input Data**
```bash
# Save hook input to file during session
echo '{"tool": "replace_string_in_file", "parameters": {...}}' > test-input.json

# Test hook with saved input
cat test-input.json | node .github/hooks/your-hook.cjs
```

**Method 3: Write Tests**
```typescript
// test/hooks/your-hook.test.ts
import { describe, it, expect } from 'vitest';
import { exec } from 'child_process';

describe('your-hook', () => {
  it('warns when expected', async () => {
    const input = { tool: 'create_file', parameters: { filePath: 'test.md' } };
    const result = await runHook(input);
    expect(result.stderr).toContain('expected warning');
  });
});
```

## Prevention Strategies

### 1. Test Hooks After Creation

```bash
# Always test manually before deploying
node .github/hooks/new-hook.cjs '{}'

# Test with realistic data
echo '{"tool": "replace_string_in_file", "parameters": {"filePath": "lib/test.js"}}' | node .github/hooks/new-hook.cjs
```

### 2. Write Automated Tests

- Add test file: `test/hooks/your-hook.test.ts`
- Test expected warnings and silent cases
- Test tool detection logic
- Test file pattern matching

### 3. Document Environment Requirements

- Include in README if hooks required
- Add to SETUP_GUIDE.md
- Mention in team onboarding docs
- Add comment to hooks.json

### 4. Provide Fallback Workflows

- Manual validation steps in AGENTS.md
- CLI commands that work without hooks
- pre-commit hooks as safety net
- CI/CD validation as final check

## Key Learning

**Root Cause Journey (2026-02-08):**

1. **Initial Symptom:** Hooks not executing during VSCode sessions
2. **Investigation:** Tested hooks manually - all worked correctly
3. **First Conclusion (WRONG):** "Environment issue - not using VSCode Copilot coding agent"
4. **User Discovery:** GitHub documentation shows hooks as `.sh` files, not JavaScript
5. **Corrected Root Cause:** **File format issue** - hooks were Node.js modules, not shell scripts
6. **Solution:** Implemented shell wrapper architecture (v0.11.0+)

**Lessons:**

1. **Test with actual execution model:** Manual testing (`node hook.js`) != integration testing (VSCode calling `.sh`)
2. **Read official docs carefully:** GitHub examples were ALL shell scripts, we missed this
3. **Verify assumptions early:** "Hooks work manually" doesn't mean "hooks work in VSCode Copilot"
4. **Document uncertainty:** Previous diagnosis wrong because spec wasn't checked first
5. **TDD prevented regression:** Writing wrapper tests FIRST ensured new implementation correct

**Additional Discovery During Investigation:**

**Code Issue:** mutation-enforcement.cjs missing `create_file` detection
- **Symptom:** Hook should warn but didn't
- **Discovery:** Created plan file with `create_file` tool, no warning appeared  
- **Root cause:** `isFileEditTool()` function missing tool name in check list
- **Solution:** Added `create_file` + tests (closes gap for future hook execution)

**Both issues mattered:**
- File format fix: Enables hooks to execute at all (critical)
- Code fix: Ensures hooks work correctly when they DO execute (important)

**Final Status (v0.11.0+):**
- ✅ Shell wrappers implemented (.sh + .ps1)
- ✅ hooks.json updated to use wrappers
- ✅ mutation-enforcement.cjs fixed (create_file detection)
- ✅ Tests validate all wrappers executable and functional
- ✅ Hooks now execute automatically in VSCode Copilot

**Lesson:** When debugging "feature not working":
- Test feature in isolation (manual execution)
- Check environment requirements (are we in the right context?)
- Look for code gaps (even if environment wrong, fix code issues found)

## Related Documentation

- [docs/vscode-hooks-guide.md](../../docs/vscode-hooks-guide.md) - Complete hooks reference
- [AGENTS.md](../../AGENTS.md) - Manual workflow (hooks-free)
- [.github/hooks/hooks.json](../../.github/hooks/hooks.json) - Hook configuration
- [SETUP_GUIDE.md](../../SETUP_GUIDE.md#vscode-hooks-optional) - Initial setup

---

*Pattern discovered during PLAN_deliverables_sync_hooks investigation (2026-02-08)*  
*User observation: "Hooks should have warned when creating plan - proves hooks aren't working!"*
