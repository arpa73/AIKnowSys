---
title: "Fix MCP Mutation Tools CLI Option Bug"
status: "COMPLETE"
priority: "high"
created: "2026-02-13"
author: "Planner"
topics: ["mcp-tools", "bug-fix", "cli", "mutation-tools"]
completed: "2026-02-13"
---

# PLAN: Fix MCP Mutation Tools CLI Option Bug

**Status:** 🎯 ACTIVE  
**Priority:** 🔴 HIGH (blocks MCP mutation tools usage)  
**Created:** 2026-02-13  
**Estimated:** 1 hour

---

## 🐛 Problem Statement

**MCP mutation tool `mcp_aiknowsys_append_to_session` fails with:**
```
Error appending to session: Command failed: npx aiknowsys update-session --appendSection ...
error: unknown option '--appendSection'
```

**Root Cause Analysis:**

1. **File:** `mcp-server/src/tools/split-mutations.ts` line 348
2. **Bug:** Calls `--appendSection` (camelCase) instead of `--append-section` (dash-case)
3. **Why it fails:** Commander.js expects dash-case on command line, not camelCase

**Evidence:**
- CLI help shows: `--appendSection <title>` (this is the DISPLAY, not the actual flag)
- Commander.js convention: Option flags use dashes (`--append-section`)
- Option names in code use camelCase (`options.appendSection`)
- Same bug affects: `--prependSection`, `--insertAfter`, `--insertBefore`, `--addTopic`, `--addFile`, `--setStatus`

**Impact:**
- ❌ All MCP session mutation tools broken (`append_to_session`, `prepend_to_session`, `insert_after_section`, `insert_before_section`)
- ❌ Some plan mutation tools may be affected
- ❌ Metadata mutation tools affected (`update_session_metadata`, `update_plan_metadata`)
- ✅ Workaround: Use `replace_string_in_file` (manual editing)

---

## 💡 Solution Design

**Fix Commander.js option definitions to use dash-case:**

```javascript
// BEFORE (WRONG):
.option('--appendSection <title>', 'Append markdown section header...')

// AFTER (CORRECT):
.option('--append-section <title>', 'Append markdown section header...')
```

**Commander.js will:**
- Accept `--append-section` on command line ✅
- Store value in `options.appendSection` (auto-converted to camelCase) ✅
- No code changes needed in `lib/commands/*.ts` ✅

**Affected options:**
- `--appendSection` → `--append-section`
- `--prependSection` → `--prepend-section`
- `--appendFile` → `--append-file`
- `--insertAfter` → `--insert-after`
- `--insertBefore` → `--insert-before`
- `--addTopic` → `--add-topic`
- `--addFile` → `--add-file`
- `--setStatus` → `--set-status`

---

## 📋 Implementation Plan

### Phase 1: Fix CLI Options (20 min)

**File:** `bin/cli.js`

**Step 1.1: Update `update-session` command (10 min)**

Replace:
```javascript
.option('--addTopic <topic>', 'Add topic to session')
.option('--addFile <file>', 'Add file to session')
.option('--setStatus <status>', 'Set status: in-progress, complete, abandoned')
.option('--appendSection <title>', 'Append markdown section header (e.g., "## Notes")')
.option('--appendFile <path>', 'Append content from markdown file')
.option('--prependSection <title>', 'Prepend section at beginning (after frontmatter)')
.option('--insertAfter <pattern>', 'Insert section after matching LITERAL string (not regex)')
.option('--insertBefore <pattern>', 'Insert section before matching LITERAL string (not regex)')
```

With:
```javascript
.option('--add-topic <topic>', 'Add topic to session')
.option('--add-file <file>', 'Add file to session')
.option('--set-status <status>', 'Set status: in-progress, complete, abandoned')
.option('--append-section <title>', 'Append markdown section header (e.g., "## Notes")')
.option('--append-file <path>', 'Append content from markdown file')
.option('--prepend-section <title>', 'Prepend section at beginning (after frontmatter)')
.option('--insert-after <pattern>', 'Insert section after matching LITERAL string (not regex)')
.option('--insert-before <pattern>', 'Insert section before matching LITERAL string (not regex)')
```

**Step 1.2: Update other commands (5 min)**

Check all commands for camelCase options:
- `create-session`: `--topics` (already correct)
- `create-plan`: `--topics` (already correct)
- `update-plan`: Any camelCase options?

**Step 1.3: Update documentation strings (5 min)**

Update help text to show correct dash-case examples

---

### Phase 2: Update MCP Tools (15 min)

**File:** `mcp-server/src/tools/split-mutations.ts`

**Step 2.1: Update `appendToSession` (line 348)**

Change:
```typescript
args.push('--appendSection', validated.section);
```

To:
```typescript
args.push('--append-section', validated.section);
```

**Step 2.2: Update `prependToSession` (line 384)**

Change:
```typescript
args.push('--prependSection', validated.section);
```

To:
```typescript
args.push('--prepend-section', validated.section);
```

**Step 2.3: Update `insertAfterSection` (line 418)**

Change:
```typescript
args.push('--insertAfter', validated.pattern);
args.push('--appendSection', validated.section);
```

To:
```typescript
args.push('--insert-after', validated.pattern);
args.push('--append-section', validated.section);
```

**Step 2.4: Update `insertBeforeSection` (line 454)**

Change:
```typescript
args.push('--insertBefore', validated.pattern);
args.push('--appendSection', validated.section);
```

To:
```typescript
args.push('--insert-before', validated.pattern);
args.push('--append-section', validated.section);
```

**Step 2.5: Update `updateSessionMetadata` (check for `--addTopic`, `--addFile`, `--setStatus`)**

Update all camelCase option flags

---

### Phase 3: Test CLI Changes (15 min)

**Manual testing:**

```bash
# Test 1: append-section
npx aiknowsys update-session --append-section "## Test Section" --content "Test content"

# Test 2: prepend-section
npx aiknowsys update-session --prepend-section "## Prepend Test" --content "Prepended"

# Test 3: insert-after
npx aiknowsys update-session --insert-after "## Day 10" --append-section "## Test" --content "Content"

# Test 4: add-topic
npx aiknowsys update-session --add-topic "test-topic"

# Test 5: Verify help still works
npx aiknowsys update-session --help
```

**Verify:**
- [ ] No "unknown option" errors
- [ ] Commands execute successfully
- [ ] Session file updated correctly
- [ ] Help text shows dash-case options

---

### Phase 4: Test MCP Tools (10 min)

**Test in VS Code MCP client:**

```typescript
// Test 1: append_to_session
mcp_aiknowsys_append_to_session({
  section: "## MCP Test Section",
  content: "Test content from MCP"
})

// Result: Should succeed ✅
```

**Verify:**
- [ ] MCP tool succeeds (no error)
- [ ] Session file updated
- [ ] Section appears in correct location
- [ ] Content matches input

---

## ⏱️ Timeline

| Phase | Time | Status |
|-------|------|--------|
| Phase 1: Fix CLI | 20m | 📋 PLANNED |
| Phase 2: Fix MCP tools | 15m | 📋 PLANNED |
| Phase 3: Test CLI | 15m | 📋 PLANNED |
| Phase 4: Test MCP | 10m | 📋 PLANNED |
| **Total** | **1h** | **📋 PLANNED** |

---

## ✅ Success Criteria

- [ ] CLI accepts `--append-section` (not `--appendSection`)
- [ ] All 8 affected options fixed (dash-case)
- [ ] MCP tools call correct dash-case options
- [ ] Manual CLI testing passes (5 tests)
- [ ] MCP integration test passes (`append_to_session`)
- [ ] No regression in existing functionality
- [ ] Help text updated to show correct format

---

## 📝 Notes for Developer

**Why this bug happened:**
- Commander.js documentation sometimes shows camelCase in examples
- The option NAME (in code) is camelCase, but OPTION FLAG (on CLI) is dash-case
- Easy to confuse the two

**Commander.js behavior:**
```javascript
.option('--append-section <value>')  // CLI flag (dash-case)
→ stored in options.appendSection    // Code property (camelCase)
```

**Breaking change check:**
- ✅ No breaking change - this fixes broken functionality
- ✅ No users currently using MCP mutation tools (they're broken)
- ✅ CLI may have users using camelCase (but that never worked)
- Consider: Add deprecation warning for camelCase usage?

**TDD approach:**
1. Add test that calls CLI with dash-case options
2. Test should fail (options not recognized)
3. Fix CLI options to dash-case
4. Test should pass

---

## 🔄 Related Work

**Blocked work:**
- ✅ Session file already updated manually (workaround complete)
- ⏸️ `PLAN_mcp_query_token_optimization.md` implementation (can proceed with manual edits)

**Follow-up work:**
- Add integration tests for all MCP mutation tools
- Consider refactoring MCP tools to use core functions directly (Phase 2)
- Document Commander.js conventions in contributing guide

---

*Part of Phase 1 MCP tools completion. Discovered during Day 10 testing.*
