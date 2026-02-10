---
id: "PLAN_git_hooks_improvement_yaml_validation_mcp_messaging"
title: "Git Hooks Improvement - YAML Validation & MCP Messaging"
status: "PAUSED"
author: "arno-paffen"
created: "2026-02-09"
topics: ["git", "hooks", "yaml", "validation", "mcp"]
---

# Implementation Plan: Git Hooks Improvement - YAML Validation & MCP Messaging

**Status:** 📋 PLANNED  
**Created:** 2026-02-09  
**Author:** arno-paffen

---


## Progress

## 🎯 Goal

Improve git pre-commit hooks to validate YAML in both session AND plan files, show MCP-first messaging, and decide on blocking policy.

## Overview

**Current State:**
- ✅ TDD compliance check works (lib/ → test/ changes)
- ✅ Session YAML validation works (non-blocking)
- ❌ Plan YAML validation missing (despite comment claiming it)
- ❌ Shows CLI commands in error messages (not MCP tools)
- ⚠️ Non-blocking (warns but doesn't prevent commits)

**Target State:**
- ✅ Session AND plan YAML validation
- ✅ MCP-first messaging (shows MCP tools, CLI as fallback)
- ✅ Clear blocking policy (configurable or hardcoded)
- ✅ Consistent with MCP-first documentation updates

## Requirements

**Must Have:**
- Validate YAML frontmatter in PLAN_*.md files
- Show MCP tools in recommendations (with CLI fallback)
- Consistent field validation (plan vs session)
- Clear error messages (what's wrong, how to fix)

**Should Have:**
- Configurable blocking policy (env var or git config)
- Validate plan-specific fields (status, author, created date)
- Check context-index.json updates (for both sessions and plans)
- Fast execution (<500ms for validation)

**Nice to Have:**
- Validate file naming conventions (PLAN_lowercase_with_underscores.md)
- Check active plan pointer consistency
- Suggest mutation commands based on file type

## Current Implementation Analysis

**File:** .git/hooks/pre-commit (148 lines)

### What Works Well

**Lines 1-66: TDD Compliance Check**
```bash
LIB_STAGED=$(git diff --cached --name-only | grep "^lib/" || true)
if [ -n "$LIB_STAGED" ]; then
    TEST_STAGED=$(git diff --cached --name-only | grep "^test/" || true)
    if [ -z "$TEST_STAGED" ]; then
        # Interactive prompt: Continue anyway?
    fi
fi
```
- ✅ Detects lib/ changes
- ✅ Checks for corresponding test/ changes
- ✅ Interactive override option
- ✅ Educational messaging (explains RED-GREEN-REFACTOR)

**Lines 70-110: Session YAML Validation**
```bash
SESSION_FILES=$(git diff --cached --name-only | grep "^\.aiknowsys/sessions/.*\.md$" || true)
for file in $SESSION_FILES; do
    # Check frontmatter exists
    head -1 "$file" | grep -q "^---$"
    
    # Validate required fields
    grep -q "^date:"
    grep -q "^topics:"
done
```
- ✅ Pattern matching works
- ✅ Basic YAML structure check
- ✅ Required field validation
- ⚠️ Non-blocking (warns only)

### What's Missing

**No Plan File Validation**
```bash
# Comment says "session/plan files" but this doesn't exist:
PLAN_FILES=$(git diff --cached --name-only | grep "^\.aiknowsys/PLAN_.*\.md$" || true)
# ❌ Not implemented!
```

**CLI-First Messaging (Lines 125-128)**
```bash
echo "   → Use: npx aiknowsys update-session (ensures atomic updates)"
echo "   → Or run: npx aiknowsys rebuild-index (manual index update)"
# ❌ Should show MCP tools first!
```

**Plan-Specific Fields Not Validated**
- Missing: `status:` (PLANNED, ACTIVE, etc.)
- Missing: `author:` (username validation)
- Missing: `created:` (date format)
- Missing: `id:` (matches filename)

## Implementation Steps

### Phase 1: Add Plan File Validation (45 min)

**File:** .git/hooks/pre-commit

**Add after session validation (line 148):**

```bash
# === Plan File YAML Validation ===
echo "🔍 Checking YAML frontmatter in plan files..."

PLAN_FILES=$(git diff --cached --name-only | grep "^\.aiknowsys/PLAN_.*\.md$" || true)

if [ -n "$PLAN_FILES" ]; then
    PLAN_ERRORS=0
    
    echo "📝 Validating plan files:"
    
    for file in $PLAN_FILES; do
        # Skip deleted files
        if [ ! -f "$file" ]; then
            echo "   ⏭️  Skipped $file (deleted)"
            continue
        fi
        
        # Check for YAML frontmatter
        if ! head -1 "$file" | grep -q "^---$"; then
            echo "   ❌ $file - Missing YAML frontmatter"
            PLAN_ERRORS=$((PLAN_ERRORS + 1))
            continue
        fi
        
        # Extract YAML block
        YAML_BLOCK=$(sed -n '/^---$/,/^---$/p' "$file" | sed '1d;$d')
        
        # Validate required plan fields
        MISSING_FIELDS=""
        
        if ! echo "$YAML_BLOCK" | grep -q "^id:"; then
            MISSING_FIELDS="${MISSING_FIELDS}id, "
        fi
        
        if ! echo "$YAML_BLOCK" | grep -q "^title:"; then
            MISSING_FIELDS="${MISSING_FIELDS}title, "
        fi
        
        if ! echo "$YAML_BLOCK" | grep -q "^status:"; then
            MISSING_FIELDS="${MISSING_FIELDS}status, "
        fi
        
        if ! echo "$YAML_BLOCK" | grep -q "^author:"; then
            MISSING_FIELDS="${MISSING_FIELDS}author, "
        fi
        
        if ! echo "$YAML_BLOCK" | grep -q "^created:"; then
            MISSING_FIELDS="${MISSING_FIELDS}created, "
        fi
        
        if ! echo "$YAML_BLOCK" | grep -q "^topics:"; then
            MISSING_FIELDS="${MISSING_FIELDS}topics"
        fi
        
        if [ -n "$MISSING_FIELDS" ]; then
            echo "   ⚠️  $file - Missing fields: ${MISSING_FIELDS%, }"
            PLAN_ERRORS=$((PLAN_ERRORS + 1))
        else
            # Validate status value
            STATUS=$(echo "$YAML_BLOCK" | grep "^status:" | cut -d'"' -f2)
            if [[ ! "$STATUS" =~ ^(PLANNED|ACTIVE|PAUSED|COMPLETE|CANCELLED)$ ]]; then
                echo "   ⚠️  $file - Invalid status: $STATUS"
                echo "      Valid: PLANNED, ACTIVE, PAUSED, COMPLETE, CANCELLED"
                PLAN_ERRORS=$((PLAN_ERRORS + 1))
            else
                echo "   ✅ $file - Valid YAML frontmatter"
            fi
        fi
    done
    
    if [ $PLAN_ERRORS -gt 0 ]; then
        echo ""
        echo "⚠️  Found $PLAN_ERRORS plan YAML validation error(s)"
        echo ""
        echo "💡 How to fix:"
        echo "   MCP tools (preferred - 10x faster, validated):"
        echo "   → Use: mcp_aiknowsys_create_plan({ title: '...', topics: [...] })"
        echo "   → Use: mcp_aiknowsys_update_plan({ planId: '...', status: 'ACTIVE' })"
        echo ""
        echo "   CLI fallback (if MCP unavailable):"
        echo "   → npx aiknowsys create-plan --title '...'"
        echo "   → npx aiknowsys update-plan PLAN_xyz --set-status ACTIVE"
        echo ""
        echo "Proceeding anyway (warning only, not blocking)"
        echo ""
    fi
else
    echo "ℹ️  No plan files changed"
fi

echo ""
```

**Validation:**
1. Create test plan with missing fields
2. Try to commit - should see validation errors
3. Verify error messages show MCP tools first

**Risk:** Medium - bash string parsing fragile  
**Mitigation:** Test with various YAML formats

---

### Phase 2: Update Messaging to MCP-First (20 min)

**File:** .git/hooks/pre-commit (lines 125-128)

**Current (WRONG):**
```bash
echo "💡 How to fix:"
echo "   → Use: npx aiknowsys update-session (ensures atomic updates)"
echo "   → Or run: npx aiknowsys rebuild-index (manual index update)"
```

**New (MCP-FIRST):**
```bash
echo "💡 How to fix:"
echo "   MCP tools (preferred - 10x faster, validated):"
echo "   → mcp_aiknowsys_update_session({ operation: 'append', content: '...' })"
echo "   → mcp_aiknowsys_create_session({ title: '...', topics: [...] })"
echo ""
echo "   CLI fallback (if MCP unavailable):"
echo "   → npx aiknowsys update-session --append '...'"
echo "   → npx aiknowsys rebuild-index"
```

**Also update YAML template recommendation:**
```bash
echo "YAML frontmatter template (or use mutation commands above):"
echo "---"
echo "date: YYYY-MM-DD"
echo "title: Session Title"
echo "topics: []"
echo "status: in-progress"
echo "---"
```

**Validation:**
- Trigger session validation error
- Check error message shows MCP first

---

### Phase 3: Decide Blocking Policy (30 min)

**Current:** Non-blocking (warns, allows commit)

**Options:**

**Option A: Always Block (Strict)**
```bash
if [ $YAML_ERRORS -gt 0 ] || [ $PLAN_ERRORS -gt 0 ]; then
    echo "❌ Commit blocked due to YAML validation errors"
    echo "Fix errors above and try again"
    exit 1
fi
```
- ✅ Enforces quality
- ❌ Might frustrate in emergencies
- ❌ Blocks experimental work

**Option B: Configurable (Recommended)**
```bash
# Check git config for blocking policy
BLOCK_ON_YAML=$(git config --get hooks.blockOnYaml || echo "false")

if [ "$BLOCK_ON_YAML" = "true" ] && [ $YAML_ERRORS -gt 0 ]; then
    echo "❌ Commit blocked (git config hooks.blockOnYaml = true)"
    exit 1
elif [ $YAML_ERRORS -gt 0 ]; then
    echo "⚠️  Proceeding with warnings (set git config hooks.blockOnYaml true to block)"
fi
```

Enable blocking:
```bash
git config hooks.blockOnYaml true
```

- ✅ Flexible (warn by default, block if configured)
- ✅ Team can decide policy
- ✅ Emergency bypass available

**Option C: Environment Variable**
```bash
if [ "${AIKNOWSYS_BLOCK_YAML:-false}" = "true" ] && [ $YAML_ERRORS -gt 0 ]; then
    echo "❌ Commit blocked (AIKNOWSYS_BLOCK_YAML=true)"
    exit 1
fi
```

**Recommendation:** Option B (git config)
- Persistent per-repo setting
- Discoverable with `git config --list`
- Standard git pattern

**Implementation:**
1. Add blocking check after validation
2. Update README with git config option
3. Document in SETUP_GUIDE.md

---

### Phase 4: Add Index Update Check (15 min)

**Current:** Only checks for sessions

**Improve:**
```bash
# Check if context index was updated
INDEX_UPDATED=$(git diff --cached --name-only | grep "^\.aiknowsys/context-index\.json$" || true)

SESSION_OR_PLAN_CHANGED=false
if [ -n "$SESSION_FILES" ] || [ -n "$PLAN_FILES" ]; then
    SESSION_OR_PLAN_CHANGED=true
fi

if [ "$SESSION_OR_PLAN_CHANGED" = "true" ] && [ -z "$INDEX_UPDATED" ]; then
    echo ""
    echo "⚠️  WARNING: Session/plan files changed but context-index.json not updated"
    echo ""
    echo "💡 This might indicate manual editing instead of mutation commands"
    echo ""
    echo "   MCP tools (auto-update index):"
    echo "   → mcp_aiknowsys_update_session(...)"
    echo "   → mcp_aiknowsys_create_plan(...)"
    echo ""
    echo "   Manual index rebuild:"
    echo "   → npx aiknowsys rebuild-index"
    echo ""
fi
```

**Why:** Mutation commands auto-rebuild index, manual edits don't

---

### Phase 5: Documentation Updates (20 min)

**Files:** README.md, SETUP_GUIDE.md, .github/hooks/README.md (create)

**README.md section:**
```markdown
## Git Hooks

Pre-commit hooks validate:
- TDD compliance (lib/ changes require test/ changes)
- YAML frontmatter (session and plan files)
- Context index updates

**Configure blocking behavior:**
\`\`\`bash
git config hooks.blockOnYaml true  # Block commits with YAML errors
git config hooks.blockOnYaml false # Warn only (default)
\`\`\`

**Prefer mutation commands** (auto-validated):
- MCP: \`mcp_aiknowsys_create_plan({ title: '...' })\`
- CLI: \`npx aiknowsys create-plan --title '...'\`
```

**Create .github/hooks/README.md:**
- Explain each hook's purpose
- Installation instructions
- Configuration options
- Troubleshooting

---

## Testing Strategy

**Test Cases:**

1. **Session YAML validation:**
   - Missing frontmatter → should warn
   - Missing date field → should warn
   - Missing topics field → should warn
   - Valid frontmatter → should pass

2. **Plan YAML validation:**
   - Missing frontmatter → should warn
   - Missing id/title/status → should warn
   - Invalid status value → should warn
   - Valid plan frontmatter → should pass

3. **Blocking policy:**
   - Default (false) → warns but allows commit
   - Configured (true) → blocks commit
   - Override with --no-verify → bypasses hook

4. **MCP messaging:**
   - Error messages show MCP tools first
   - CLI shown as fallback
   - Clear performance benefits noted

5. **Index update check:**
   - Session changed, index not staged → warn
   - Plan changed, index not staged → warn
   - Index staged → no warning

**Manual Testing:**
```bash
# Test session validation
echo "# Test Session" > .aiknowsys/sessions/test.md
git add .aiknowsys/sessions/test.md
git commit -m "Test" # Should warn about missing YAML

# Test plan validation
echo "# Test Plan" > .aiknowsys/PLAN_test.md
git add .aiknowsys/PLAN_test.md
git commit -m "Test" # Should warn about missing YAML

# Test blocking
git config hooks.blockOnYaml true
git commit -m "Test" # Should block

# Bypass hook
git commit --no-verify -m "Emergency fix"
```

---

## Risks & Mitigations

**Risk 1: Bash String Parsing Fragility**
- **Likelihood:** Medium (YAML can have complex formats)
- **Impact:** Medium (false positives/negatives)
- **Mitigation:** Test with various YAML formats, document edge cases

**Risk 2: Blocking Prevents Emergency Commits**
- **Likelihood:** Low
- **Impact:** High (blocks critical fixes)
- **Mitigation:** `--no-verify` flag always available, default to warn-only

**Risk 3: Performance Impact**
- **Likelihood:** Low (validation is fast)
- **Impact:** Low (adds ~100ms to commits)
- **Mitigation:** Target <500ms total hook time

**Risk 4: Git Config Not Set**
- **Likelihood:** High (users won't know about it)
- **Impact:** Low (defaults to warn-only)
- **Mitigation:** Document in setup guide, mention in errors

## Success Criteria

- [ ] Plan files validated (frontmatter, required fields, status values)
- [ ] Error messages show MCP tools first, CLI as fallback
- [ ] Git config blocking policy works (true/false)
- [ ] Index update check covers sessions AND plans
- [ ] Documentation updated (README, SETUP_GUIDE, hooks README)
- [ ] All test cases pass
- [ ] Hook execution time <500ms
- [ ] MCP-first messaging matches AGENTS.md updates

## Timeline

| Phase | Time | Description |
|-------|------|-------------|
| Phase 1 | 45 min | Add plan YAML validation |
| Phase 2 | 20 min | Update to MCP-first messaging |
| Phase 3 | 30 min | Implement blocking policy |
| Phase 4 | 15 min | Improve index update check |
| Phase 5 | 20 min | Documentation updates |
| Testing | 30 min | Manual validation |
| **Total** | **2h 40m** | Active development |

## Dependencies

- PLAN_mcp_first_documentation_updates should be complete first
- Ensures consistent MCP-first messaging across all touch points
- Git hooks inherit messaging patterns from AGENTS.md

## Notes for Developer

**Before starting:**
- Read current .git/hooks/pre-commit
- Test hook behavior with sample commits
- Understand TDD check (don't break it)

**Testing pattern:**
1. Create invalid file
2. Stage and try to commit
3. Verify error messages
4. Fix and retry
5. Confirm passes

**Blocking policy decision:**
- Default: warn-only (non-breaking)
- Users opt-in to strict mode
- Document both approaches


## 🎯 Goal

[Describe the objective of this plan]

## Requirements

[List functional and non-functional requirements]

## Implementation Steps

### Step 1: [Step Name]
**Time:** [Estimate]  
**Files:** [Files to modify/create]

**Action:** [What to do]

### Step 2: [Step Name]
**Time:** [Estimate]  
**Files:** [Files to modify/create]

**Action:** [What to do]

## Testing & Validation

[How to verify the work is complete]

## Risks

[Potential issues and mitigation strategies]
