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
---

# Hook Troubleshooting Pattern

## Symptoms

- No output from sessionStart hooks (no recent session reminders)
- No TDD reminders during file edits (preToolUse hooks)
- No validation warnings when claiming work complete
- Session files not auto-created (sessionEnd hooks)
- No hook execution evidence in conversation or terminal

## Root Causes Discovered

### 1. Environment Requirement - VSCode Copilot Coding Agent

**Discovery:** Hooks ONLY execute in specific environment:
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

### 2. Hook Configuration Issue

**Symptoms:** Hooks exist but don't run

**Checks:**
- `hooks.json` exists in `.github/hooks/`
- Hook files have correct paths in `hooks.json`
- Hook registration matches lifecycle events
- No syntax errors in hook files

**Manual Test:**
```bash
# Test hooks directly (proves they work)
node .github/hooks/session-start.js
node .github/hooks/session-end.js
echo '{"tool": "create_file", "parameters": {"filePath": ".aiknowsys/test.md"}}' | node .github/hooks/mutation-enforcement.cjs
```

If manual tests work but hooks don't fire during sessions → **Environment issue (not using VSCode Copilot coding agent)**

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

**Two-Pronged Investigation:**
1. **Environment Issue:** Hooks didn't execute (not using VSCode Copilot coding agent)
2. **Code Issue:** Hook missing `create_file` detection (would fail even if environment correct)

**Both mattered:**
- Environment investigation: Proved hooks work when run manually (not broken)
- Code fix: Added `create_file` + tests (closes gap for when hooks DO run)

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
