# Plan: Document VSCode File Operations Bug Workaround

**Status:** 📋 PLANNED  
**Created:** 2026-02-01  
**Assignee:** @Planner  
**Priority:** Medium (Developer Experience)

---

## Problem Discovery

**Issue:** AI agents encounter mysterious file operation failures when VSCode has files open/modified.

**Symptoms:**
- ❌ `rm <file>` fails with "No such file or directory" (file exists)
- ❌ `create_file` fails with "File already exists" (file doesn't appear to exist)
- 🔒 Files appear locked or in limbo state
- ⚠️ Terminal operations fail until user clicks "Keep"/"Discard" in VSCode diff UI

**Root Cause:** [VSCode Issue #262495](https://github.com/microsoft/vscode/issues/262495)  
When VSCode has a file open/modified, file system operations from terminal can fail or behave unexpectedly until user explicitly resolves the conflict in VSCode's UI.

**Discovered:** 2026-02-01 during architect review workflow  
**Context:** Developer attempted to delete `PENDING_REVIEW.md` and commit session file, both operations failed mysteriously until user clicked "Keep" in VSCode UI.

---

## Solution Required

**Document this gotcha in appropriate places:**

1. **AGENTS.md** - Add troubleshooting section for AI agents
2. **CONTRIBUTING.md** - Add note for developers using AI assistants
3. **Possibly:** Create learned skill for "file-operation-troubleshooting"

**Key Points to Document:**
- **Symptom Recognition:** How to identify this issue (file operation fails mysteriously)
- **User Action Required:** Click "Keep" or "Discard" in VSCode diff UI
- **AI Agent Workaround:** Inform user about VSCode conflict state
- **Prevention:** Close files or save before terminal operations (when possible)

---

## Documentation Targets

### 1. AGENTS.md

**Section:** Add new troubleshooting section after "🚫 When NOT to Update Changelog"

**Content:**
```markdown
## 🐛 Common Issues & Workarounds

### VSCode File Operation Conflicts

**Symptom:** File operations fail mysteriously:
- `rm <file>` → "No such file or directory" (but file exists)
- `create_file` → "File already exists" (but file doesn't appear to exist)
- Git operations fail on files that appear to exist

**Root Cause:** [VSCode Issue #262495](https://github.com/microsoft/vscode/issues/262495)  
When VSCode has a file open/modified, terminal operations may fail until user resolves the conflict.

**Solution:**
1. **Inform user:** "VSCode may be showing a diff/conflict for this file. Please click 'Keep' or 'Discard' in the editor."
2. **Retry operation** after user confirms conflict resolved
3. **Alternative:** Use VSCode file API instead of terminal operations (when available)

**Prevention:** Close/save files before terminal operations when possible.
```

### 2. CONTRIBUTING.md

**Section:** Add to "Working with AI Assistants" (or create section if doesn't exist)

**Content:**
```markdown
### File Operation Conflicts with AI Tools

When working with AI coding assistants (Copilot, Claude, etc.) that use terminal operations:

**Known Issue:** [VSCode #262495](https://github.com/microsoft/vscode/issues/262495)  
Terminal file operations may fail if VSCode has the file open/modified.

**Symptoms:**
- AI reports "file doesn't exist" but you see it in explorer
- AI reports "file already exists" but you can't find it
- Git operations fail on files that appear to exist

**Fix:** Click "Keep" or "Discard" in VSCode's diff/conflict UI, then ask AI to retry.

**Tip:** Close files before asking AI to delete/modify them via terminal.
```

### 3. Learned Skill (Optional)

**File:** `.aiknowsys/learned/vscode-file-operations.md`

**Trigger Words:** "file operation fail", "file doesn't exist", "file already exists", "can't delete file", "git add failed"

**Content:** Detailed troubleshooting guide with examples

---

## Implementation Steps

1. **Read Context:**
   - [AGENTS.md](../../AGENTS.md)
   - [CONTRIBUTING.md](../../CONTRIBUTING.md)
   - [.github/skills/skill-creator/SKILL.md](../../.github/skills/skill-creator/SKILL.md)

2. **Update AGENTS.md:**
   - Add troubleshooting section after changelog section
   - Include symptom recognition, solution steps, prevention tips
   - Link to VSCode issue for reference

3. **Update CONTRIBUTING.md:**
   - Add "Working with AI Assistants" section if doesn't exist
   - Document file conflict issue and resolution
   - Include practical tips for developers

4. **Consider Learned Skill:**
   - Evaluate if this warrants a learned skill
   - If yes, create `vscode-file-operations.md` in `.aiknowsys/learned/`
   - Follow skill-creator format

5. **Validate:**
   - Check that documentation is clear and actionable
   - Ensure links are valid
   - Test with sample scenario (simulate the issue)

6. **Update CURRENT_PLAN.md:**
   - Add this plan to the table
   - Set status to ACTIVE when starting

---

## Success Criteria

- [ ] AGENTS.md includes troubleshooting section for file operations
- [ ] CONTRIBUTING.md documents the issue for developers
- [ ] Documentation includes clear symptoms, solution, and prevention
- [ ] Links to VSCode issue for reference
- [ ] Optional: Learned skill created if warranted
- [ ] Plan marked COMPLETE in CURRENT_PLAN.md

---

## Notes

**Why This Matters:**
- Prevents developer frustration with mysterious errors
- Reduces back-and-forth between AI and user
- Provides clear resolution path
- Documents known limitation of VSCode + terminal operations

**Related Work:**
- This issue was discovered during architect review workflow implementation
- Affects all file operations performed by AI agents via terminal
- May affect custom agents (Developer, Architect, Planner)

---

*Part of AIKnowSys continuous improvement. See [CODEBASE_CHANGELOG.md](../../CODEBASE_CHANGELOG.md) for implementation history.*
