# VSCode File Operations Troubleshooting

**Skill Type:** `error_resolution`  
**Environment:** VSCode only  
**Trigger Words:** "file operation fail", "file doesn't exist", "file already exists", "can't delete file", "git add failed", "no such file or directory"

---

## When to Use This Skill

**Apply this troubleshooting ONLY when:**
- User is working in VSCode (check for VSCode-specific context)
- File operations fail mysteriously (terminal commands succeed but file state is inconsistent)
- User mentions seeing VSCode diff/conflict UI

**DO NOT apply when:**
- Working in other editors (vim, Sublime, IntelliJ, etc.)
- Working in pure terminal/SSH session
- File genuinely doesn't exist or has permission issues

---

## Problem Description

**Issue:** [VSCode #262495](https://github.com/microsoft/vscode/issues/262495)

When VSCode has a file open/modified, file system operations from terminal can fail or behave unexpectedly until user explicitly resolves the conflict in VSCode's diff UI.

**Common Scenarios:**
- AI creates/modifies file → VSCode shows diff → Terminal sees stale state
- AI deletes file → VSCode holds reference → Terminal reports "file not found"
- AI commits file → VSCode has unsaved changes → Git fails to stage

---

## Symptoms

### Terminal Operations Fail
```bash
# File exists in VSCode explorer, but:
rm .aiknowsys/PENDING_REVIEW.md
# rm: cannot remove '.aiknowsys/PENDING_REVIEW.md': No such file or directory

# File doesn't appear to exist, but:
create_file session.md "content"
# Error: File already exists. You must use an edit tool to modify it.

# Git operations fail:
git add .aiknowsys/sessions/file.md
# error: The following paths are ignored by one of your .gitignore files
# (even when trying to force-add a non-ignored file)
```

### VSCode UI Indicators
- Diff view showing changes (left/right split)
- "Keep" or "Discard" buttons in editor
- File appears modified but you didn't change it
- Git decorations showing unexpected states

---

## Solution

### Step 1: Check VSCode Diff UI

**Look for:**
- Split view showing "Working Tree" vs "Index" or similar
- Buttons: "Keep Incoming Change", "Discard Change", "Accept Both"
- File tab showing "↔" icon (diff mode)

### Step 2: Resolve Conflict

**Click one of:**
- **"Keep"** - Accept the file state from disk/terminal
- **"Discard"** - Reject changes and revert to previous state
- **"Accept Both"** - Merge changes (if applicable)

**Example:**
```
VSCode shows:
┌─────────────────────────────────────────────┐
│ PENDING_REVIEW.md                      [↔] │
├─────────────────────────────────────────────┤
│ [Keep Incoming Change] [Discard Change]    │
└─────────────────────────────────────────────┘

Action: Click "Keep Incoming Change"
```

### Step 3: Retry Failed Operation

After resolving conflict:
```bash
# Now retry the failed command
rm .aiknowsys/PENDING_REVIEW.md  # Should succeed
git add file.md                    # Should succeed
```

---

## Prevention Strategies

### For AI Agents

**Before file operations:**
1. **Check file state:** Use `read_file` to verify current state
2. **Inform user:** "I'll modify/delete [file]. Please save/close it in VSCode if open."
3. **Use VSCode APIs when available:** Prefer `replace_string_in_file` over `rm + create_file`

**When operation fails:**
1. **Detect pattern:** Check error message for "No such file" or "already exists"
2. **Inform user:** "VSCode may be showing a diff/conflict for this file. Please click 'Keep' or 'Discard' in the editor."
3. **Wait for confirmation:** Don't retry immediately - let user resolve conflict
4. **Retry once:** After user confirms, retry the same operation

### For Developers

**Best practices:**
- Close files before asking AI to delete/modify them via terminal
- Save all changes before major operations (git commit, refactoring)
- If you see diff UI unexpectedly, resolve it before continuing
- Use VSCode's "Revert and Commit" workflow for clean states

---

## Examples

### Example 1: File Deletion Failure

**Scenario:**
```bash
# AI attempts to delete review file
rm .aiknowsys/PENDING_REVIEW.md
# rm: cannot remove: No such file or directory
```

**What happened:**
1. AI created PENDING_REVIEW.md via tool
2. VSCode detected file creation
3. VSCode opened diff view (new file vs. empty)
4. Terminal sees file as "not committed" state
5. VSCode holds file reference → Terminal can't delete

**Resolution:**
1. User clicks "Keep" in VSCode diff UI
2. AI retries: `rm .aiknowsys/PENDING_REVIEW.md` → Success

### Example 2: Git Add Failure

**Scenario:**
```bash
# AI attempts to commit session file
git add .aiknowsys/sessions/2026-02-01-session.md
# error: The following paths are ignored by one of your .gitignore files
```

**What happened:**
1. File is actually gitignored (correct)
2. BUT: VSCode also had file open with unsaved edits
3. Git saw stale state due to VSCode lock
4. Error message was misleading (real issue was VSCode lock, not gitignore)

**Resolution:**
1. User clicks "Discard" in VSCode (file is gitignored, shouldn't be committed)
2. AI understands file is intentionally gitignored
3. Alternative approach: Document in CHANGELOG instead

### Example 3: Create File Collision

**Scenario:**
```bash
# AI attempts to create session file
create_file .aiknowsys/sessions/session.md "content"
# Error: File already exists. You must use an edit tool to modify it.
```

**What happened:**
1. File was created in previous operation
2. VSCode opened file in editor
3. AI tool reported "file exists" (correct)
4. But AI thought operation failed

**Resolution:**
1. AI should have used `read_file` first to check if file exists
2. If exists, use `replace_string_in_file` instead of `create_file`
3. No VSCode conflict - just tool usage error

---

## Detection Logic (for AI)

**Check if VSCode environment:**
```javascript
// In VSCode, check for environment indicators
const isVSCode = 
  process.env.TERM_PROGRAM === 'vscode' ||
  process.env.VSCODE_GIT_ASKPASS_NODE !== undefined ||
  process.env.VSCODE_GIT_IPC_HANDLE !== undefined;

// Only apply this troubleshooting if isVSCode === true
```

**In AI agent context:**
- Check for VSCode-specific error patterns
- Look for "diff", "conflict", "keep/discard" in user messages
- If file operation fails mysteriously AND user is in VSCode → suggest this fix

---

## Related Issues

- VSCode Issue #262495 (main issue)
- Similar behavior in other editors with file watching (Atom, Sublime with plugins)
- Git lock files can cause similar symptoms

---

## Maintenance Notes

**Last Validated:** 2026-02-01  
**VSCode Versions Affected:** All versions (design limitation, not a bug)  
**Workaround Status:** Permanent (unlikely to be "fixed" - by design)

**Update Triggers:**
- VSCode changes diff UI behavior
- New file operation patterns emerge
- Better detection methods discovered

---

*Part of AIKnowSys learned patterns. See [AGENTS.md](../../AGENTS.md) for general workflow.*
