---
id: "PLAN_update_documentation_shell_wrapper_references"
title: "Update Documentation: Shell Wrapper References"
status: "COMPLETE"
author: "arno-paffen"
created: "2026-02-08"
started: "2026-02-08"
completed: "2026-02-08"
---

# Implementation Plan: Update Documentation: Shell Wrapper References

**Status:** 📋 PLANNED  
**Created:** 2026-02-08  
**Author:** arno-paffen

---


## Progress

**2026-02-08:** 

## Overview

Documentation currently references old hook format (`node .github/hooks/hook.js`) instead of new shell wrapper format (`.github/hooks/hook.sh`). This causes confusion for users and incorrect hooks.json in new projects.

**Impact:** High - affects all new AIKnowSys installations and user understanding

## Requirements

**Functional:**
- All hooks.json examples use shell wrapper format (.sh / .ps1)
- Testing examples distinguish between manual testing (node hook.js) vs VSCode execution (.sh)
- Documentation accurately reflects v0.11.0+ shell wrapper architecture

**Non-functional:**
- Maintain backward compatibility notes (explain why old format existed)
- Keep historical plans unchanged (they document discovery journey)

## Files to Update

### CRITICAL (User-Facing)

**1. templates/hooks/hooks.json** (HIGHEST PRIORITY)
- **Why:** New projects copy this file - must be correct!
- **Changes:** 26 lines needing update (13 hooks × 2 platforms)
- **Pattern:** `"bash": "node .github/hooks/X.js"` → `"bash": ".github/hooks/X.sh"`
- **Pattern:** `"powershell": "node .github/hooks/X.js"` → `"powershell": ".github/hooks/X.ps1"`

**2. docs/vscode-hooks-guide.md** (HIGH PRIORITY)
- **Why:** Main reference documentation users read
- **Changes:** ~30 references across multiple sections
- **Sections affected:**
  - Shell Wrapper Architecture (line 56-57) - "before" example
  - hooks.json Structure (lines 619-705) - full example needs update
  - Customization examples (lines 735, 748-749, 772-773)
  - Troubleshooting (line 827) - testing examples
  - Custom hooks (line 881, 1086) - examples

**3. .aiknowsys/learned/hook-troubleshooting.md** (MEDIUM PRIORITY)
- **Why:** Troubleshooting guide users reference when hooks fail
- **Changes:** ~10 references
- **Sections affected:**
  - Manual testing examples (lines 84-86, 186, 243, 283, 307, 310)
  - "Current (Wrong)" example (lines 102-103) - already marked wrong, but should show correct format

### DO NOT MODIFY (Historical Record)

**Skip these files:**
- `.aiknowsys/PLAN_deliverables_sync_hooks.md` - Historical testing commands
- `.aiknowsys/PLAN_hook_shell_wrappers.md` - Shows before→after correctly
- `.aiknowsys/archived/plans/**` - Historical archive (45+ references)
- `.aiknowsys/HOOKS_RECOMMENDATIONS.md` - Old recommendations file
- `scripts/update-hooks-config.js` line 4 - Comment explaining conversion

## Implementation Steps


**File:** templates/hooks/hooks.json

1. **Update all hook references** (26 replacements)
   - **Pattern search:** `"bash": "node .github/hooks/`
   - **Replace with:** `"bash": ".github/hooks/`
   - **And change extension:** .js/.cjs/.mjs → .sh
   
2. **Update PowerShell references** (26 replacements)
   - **Pattern search:** `"powershell": "node .github/hooks/`
   - **Replace with:** `"powershell": ".github/hooks/`
   - **And change extension:** .js/.cjs/.mjs → .ps1

3. **Validate template**
   - Run: `npx aiknowsys validate-deliverables`
   - Ensure no broken {{VARIABLE}} refs
   - Compare with actual .github/hooks/hooks.json (should match)

### Phase 2: Main Documentation Update

**File:** docs/vscode-hooks-guide.md

**Section 1: hooks.json Structure Example (lines 619-710)**
- Full hooks.json example showing all lifecycles
- Update all 26 hook references
- Pattern: Same as Phase 1

**Section 2: Customization Examples**
- Line 735: Disable hook example (commented out)
- Lines 748-749: Timeout adjustment example
- Lines 772-773: Custom hook example
- Update to use .sh/.ps1 format

**Section 3: Testing Examples (line 827)**
- Keep this as-is: Shows "NOT: 'node .github/hooks/hook-name.js'"
- This correctly warns against old format

**Section 4: Custom Hooks Guide (lines 881, 1086)**
- Update slow-hook.cjs example (line 881)
- Update testing example (line 1086)
- Pattern: Same as Phase 1

**Decision: Manual Testing Examples**
- Line 206: `node .github/hooks/session-start.js` - KEEP
- Line 818: `node .github/hooks/session-start.js` - KEEP
- **Why:** These show manual Node.js testing (valid use case)
- **Context:** Section explains testing wrappers vs testing Node.js directly

### Phase 3: Troubleshooting Guide Update

**File:** .aiknowsys/learned/hook-troubleshooting.md

**Manual Testing Examples (KEEP Node.js format):**
- Lines 84-86: Testing individual hooks
- Line 186: Direct Node.js testing
- Line 243: Session start testing
- Line 283: JSON piping example
- Lines 307, 310: New hook testing

**Why keep these?** They demonstrate manual testing (bypassing wrappers to test Node.js logic)

**VSCode Configuration Examples (UPDATE):**
- Lines 102-103: "Current (Wrong)" example
- **Change:** Show correct .sh/.ps1 format as "Current (Correct)"
- **Add:** Note about v0.11.0+ shell wrapper requirement

## Testing Strategy

### After Each File Update:

**1. Validate Deliverables (templates/ only)**
```bash
npx aiknowsys validate-deliverables
```

**2. Check Links (documentation)**
```bash
# Verify no broken markdown links
grep -n ".github/hooks" docs/vscode-hooks-guide.md | grep -E "\[.*\]\(" 
```

**3. Pattern Verification**
```bash
# Should find ZERO matches after update
grep -r '"bash": "node .github/hooks/' templates/
grep -r '"powershell": "node .github/hooks/' templates/
```

**4. Compare with Actual Config**
```bash
# Templates should match actual implementation
diff templates/hooks/hooks.json .github/hooks/hooks.json
# Only differences should be comments/formatting
```

## Success Criteria

- [ ] templates/hooks/hooks.json uses .sh/.ps1 format (0 node references)
- [ ] docs/vscode-hooks-guide.md hooks.json examples updated (~26 changes)
- [ ] Manual testing examples preserved (node hook.js for direct testing)
- [ ] Deliverable validation passes
- [ ] New projects get correct hooks.json from start
- [ ] Documentation matches v0.11.0+ architecture

## Risks & Mitigations

**Risk 1: Break existing projects**
- **Mitigation:** Only update templates/ and docs/, not actual .github/hooks/hooks.json
- **Why safe:** Existing projects already updated by update-hooks-config.js script

**Risk 2: Confuse manual testing**
- **Mitigation:** Keep `node .github/hooks/X.js` examples in testing sections
- **Add context:** Explain when to use .sh (VSCode) vs .js (manual testing)

**Risk 3: Deliverables validation fails**
- **Mitigation:** Run validate-deliverables after EACH template change
- **Rollback:** Git checkout if validation fails

## Estimated Time

- Phase 1 (Template): 15 minutes
- Phase 2 (Main Docs): 25 minutes  
- Phase 3 (Troubleshooting): 10 minutes
- Testing & Validation: 10 minutes
- **Total:** ~60 minutes

## Notes for Developer

- Use multi_replace_string_in_file for efficiency (batch similar changes)
- Distinguish between hooks.json examples (update) vs manual testing (keep)
- Run validate-deliverables after EVERY template change
- Compare final template with actual .github/hooks/hooks.json to verify

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
