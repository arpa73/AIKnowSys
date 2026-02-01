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

### Phase 1: Update AGENTS.md (Documentation-only change)

**File:** [AGENTS.md](../../AGENTS.md)  
**Insert after:** Line 347 (after "## 🚫 When NOT to Update Changelog" section)  
**TDD:** N/A (documentation only)

**Action:**
1. Add new section header: `## 🐛 Common Issues & Workarounds`
2. Add subsection: `### VSCode File Operation Conflicts`
3. Insert content from "Documentation Targets > 1. AGENTS.md" above
4. Verify markdown formatting is correct

**Exact insertion point:**
```markdown
- Simple bug fixes that don't reveal new patterns

---

## 🐛 Common Issues & Workarounds

### VSCode File Operation Conflicts

**Symptom:** File operations fail mysteriously:
...

---

## 📚 Skills Workflow
```

### Phase 2: Update CONTRIBUTING.md (Documentation-only change)

**File:** [CONTRIBUTING.md](../../CONTRIBUTING.md)  
**Insert after:** Line 100 (after "Code Contributions" section, before "Getting Help")  
**TDD:** N/A (documentation only)

**Action:**
1. Add new section header: `## Working with AI Assistants`
2. Add subsection: `### File Operation Conflicts with AI Tools`
3. Insert content from "Documentation Targets > 2. CONTRIBUTING.md" above
4. Verify markdown formatting is correct

**Exact insertion point:**
```markdown
**Documentation**: Update relevant docs

---

## Working with AI Assistants

### File Operation Conflicts with AI Tools

When working with AI coding assistants (Copilot, Claude, etc.) that use terminal operations:
...

---

## Getting Help
```

### Phase 3: Decide on Learned Skill (Optional)

**Decision:** Skip learned skill for now - documentation in AGENTS.md is sufficient.

**Reasoning:**
- Issue is environmental (VSCode-specific), not project-specific pattern
- AGENTS.md section provides clear troubleshooting steps
- Learned skills are for reusable coding patterns, not IDE quirks
- If issue becomes frequent, can revisit and create learned skill later

**Alternative:** If user experiences this frequently and wants deeper troubleshooting:
- Create `.aiknowsys/learned/vscode-file-operations.md`
- Follow skill-creator format with trigger words
- Include detailed examples and edge cases

### Phase 4: Validation (Documentation review)

**Actions:**
1. **Read updated files:** Verify sections added correctly
2. **Check links:** Ensure VSCode issue link works
3. **Verify formatting:** Run markdown linter if available
4. **Test readability:** Read as if encountering issue for first time
5. **Update CURRENT_PLAN.md:** Mark plan COMPLETE

**Validation commands:**
```bash
# Check markdown formatting (if markdownlint installed)
npx markdownlint AGENTS.md CONTRIBUTING.md

# Manual checks:
# 1. VSCode issue link loads: https://github.com/microsoft/vscode/issues/262495
# 2. Sections are properly nested (## then ###)
# 3. Code blocks have proper fences (```markdown)
# 4. No broken internal links
```

---

## Success Criteria

- [ ] AGENTS.md includes troubleshooting section after "When NOT to Update Changelog" (line ~347)
- [ ] CONTRIBUTING.md includes "Working with AI Assistants" section before "Getting Help" (line ~100)
- [ ] Documentation includes clear symptoms, solution steps, and prevention tips
- [ ] VSCode issue #262495 link is valid and accessible
- [ ] Markdown formatting is correct (proper headers, code blocks, lists)
- [ ] Optional: Learned skill created if issue becomes frequent (deferred for now)
- [ ] CURRENT_PLAN.md updated to mark plan COMPLETE

**Definition of Done:**
- AI agents will find troubleshooting steps when file operations fail
- Developers understand why AI reports mysterious file errors
- Clear resolution path documented (click Keep/Discard in VSCode)
- No code changes required (documentation-only task)

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

**Implementation Complexity:** Low (documentation-only, no code changes)  
**Estimated Time:** 15-20 minutes  
**Risk:** Very low - cannot break existing functionality

**Files to Modify:**
- [AGENTS.md](../../AGENTS.md) - Add section after line 347
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Add section after line 100  
- [.aiknowsys/CURRENT_PLAN.md](CURRENT_PLAN.md) - Mark complete

**No Testing Required:** Documentation changes verified by reading only

---

## Ready for Development? ✅

**Status:** Plan is complete and ready for implementation.

**What Developer needs:**
1. Read this plan (you're doing it!)
2. Follow Phase 1-4 implementation steps
3. Use exact content from "Documentation Targets" sections
4. Insert at specified line numbers
5. Validate markdown formatting
6. Mark plan COMPLETE

**Handoff Notes:**
- All insertion points identified (line numbers provided)
- Exact content templates provided in plan
- Decided to skip learned skill (not warranted yet)
- This is a quick documentation task (~15 min)
- No code changes = no tests needed

---

*Part of AIKnowSys continuous improvement. See [CODEBASE_CHANGELOG.md](../../CODEBASE_CHANGELOG.md) for implementation history.*
