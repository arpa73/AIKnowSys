---
id: "PLAN_template_sync_mcp_tools"
title: "Template Sync: Add MCP Tools Documentation"
status: "PLANNED"
author: "arno-paffen"
created: "2026-02-13"
priority: "medium"
topics: ["templates", "deliverables", "mcp-tools", "documentation"]
---

# Implementation Plan: Template Sync - MCP Tools Documentation

**Status:** 📋 PLANNED  
**Created:** 2026-02-13  
**Author:** arno-paffen  
**Priority:** Medium  
**Estimated Time:** 2-3 hours

---

## 🎯 Goal

**Sync template files with main CODEBASE_ESSENTIALS.md to include complete MCP tools documentation**

**Why:** Critical Invariant #8 (Deliverables Consistency) requires templates to match non-template equivalents. Users running `aiknowsys init` should get the same MCP tools documentation as the maintainer.

**Current Gap:**
- Main CODEBASE_ESSENTIALS.md: 479 lines (includes Section 9: MCP Tools - 10 mutation tools + 5 SQLite tools)
- Templates: 199-234 lines (missing Section 9 entirely)

**Affected Files:**
- templates/stacks/nextjs/CODEBASE_ESSENTIALS.md
- templates/stacks/nextjs-api/CODEBASE_ESSENTIALS.md  
- templates/stacks/express-api/CODEBASE_ESSENTIALS.md

---

## Requirements

**Functional:**
- All 3 stack templates include Section 9: MCP Tools
- Section 9 documents all 15 MCP tools (10 mutation + 5 SQLite)
- Code examples match main ESSENTIALS format
- MCP vs CLI comparison table included
- Setup instructions reference mcp-server/SETUP.md

**Non-Functional:**
- Templates remain under 350 lines (readability)
- No {{PLACEHOLDERS}} introduced (templates are filled examples)
- Preserve existing stack-specific sections
- Pass `npx aiknowsys validate-deliverables`

**Related Invariants:**
- #4: Template Preservation (requires plan, TDD, review, validation)
- #5: Template Structure Integrity (preserve section headings)
- #8: Deliverables Consistency (templates match non-templates)

---

## Implementation Steps

### Step 1: Extract MCP Tools Section
**Time:** 15 min  
**Files:** CODEBASE_ESSENTIALS.md

**Action:**
1. Read Section 9 from main CODEBASE_ESSENTIALS.md (lines ~240-380)
2. Identify what's generic (applies to all stacks) vs specific (aiknowsys project only)
3. Create reusable template snippet for Section 9
4. Remove aiknowsys-specific references (if any)

### Step 2: Write Validation Tests (TDD - RED Phase)
**Time:** 30 min  
**Files:** test/commands/validate-deliverables.test.ts

**Action:**
1. Add test: "templates include Section 9: MCP Tools"
2. Add test: "templates document all 10 mutation tools"
3. Add test: "templates document SQLite tools (if Phase 1 complete)"
4. Run tests - should FAIL (RED phase)

### Step 3: Update Templates (GREEN Phase)
**Time:** 45 min  
**Files:** 
- templates/stacks/nextjs/CODEBASE_ESSENTIALS.md
- templates/stacks/nextjs-api/CODEBASE_ESSENTIALS.md
- templates/stacks/express-api/CODEBASE_ESSENTIALS.md

**Action:**
1. Add Section 9 after existing sections
2. Include all 10 mutation tools with examples
3. Include SQLite tools section (Phase 1)
4. Add MCP vs CLI comparison table
5. Update section numbering if needed (shift subsequent sections)
6. Preserve stack-specific content in other sections

### Step 4: Validate & Refactor
**Time:** 30 min  
**Files:** All template files

**Action:**
1. Run `npx aiknowsys validate-deliverables` - should PASS (GREEN phase)
2. Check line counts (target <350 lines per template)
3. Verify no broken links or references
4. Test template generation: `aiknowsys init` in temp directory
5. Refactor for clarity if needed (REFACTOR phase)

### Step 5: Documentation
**Time:** 15 min  
**Files:** 
- CODEBASE_CHANGELOG.md
- docs/migration-guide.md (if needed)

**Action:**
1. Add entry to CHANGELOG: "Updated templates with MCP tools documentation"
2. Note: No user migration needed (new inits get updated templates automatically)
3. Update session file with completion notes

---

## Testing & Validation

**Automated:**
```bash
npm test test/commands/validate-deliverables.test.ts  # Tests pass
npx aiknowsys validate-deliverables  # All checks pass
```

**Manual:**
```bash
# Test template generation
cd /tmp
mkdir test-init && cd test-init
npx aiknowsys init
# Verify generated CODEBASE_ESSENTIALS.md includes Section 9
grep "## 9. MCP Tools" CODEBASE_ESSENTIALS.md
grep "mcp_aiknowsys_create_session" CODEBASE_ESSENTIALS.md
```

**Success Criteria:**
- ✅ All 3 templates include Section 9
- ✅ `validate-deliverables` passes
- ✅ Tests written FIRST (TDD compliance)
- ✅ Line counts reasonable (<350 lines)
- ✅ No regressions in existing validation

---

## Risks & Mitigation

**Risk 1: Template bloat (>400 lines)**
- Mitigation: Compress examples, link to external docs where appropriate
- Fallback: Create separate "MCP_TOOLS.md" referenced from ESSENTIALS

**Risk 2: Breaking existing template consumers**
- Mitigation: Templates are additive (only add Section 9, don't change existing)
- Validation: Test `aiknowsys init` before committing

**Risk 3: Maintenance burden (3 templates to keep in sync)**
- Mitigation: Section 9 content should be identical across all templates
- Future: Consider template composition (shared sections)

---

## Dependencies

**Blocked by:** Phase 1 Week 3 completion (Day 11 done ✅)  
**Blocks:** v0.11.0 release (deliverables must be consistent)  
**Related:** Phase 1 SQLite tools (Section 9 includes SQLite docs)

---

## Notes

**Why not now?**
- Phase 1 Week 3 Days 10-11 in progress (MCP testing + docs)
- Template sync is deliverables work (proper workflow required)
- Better to complete Phase 1 core, then sync templates as cleanup

**Post-Implementation:**
- Consider automating template sync (script to propagate Section 9)
- Add pre-commit hook to validate templates changed with tests
- Document template maintenance workflow in learned patterns
