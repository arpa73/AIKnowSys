# Implementation Plan: Skill Audit & Cleanup

**Status:** 📋 PLANNED  
**Created:** 2026-02-02  
**Goal:** Remove gnwebsite-inherited skills, keep only AIKnowSys-relevant ones

---

## Overview

During skill review, we discovered that several skills were inherited from the parent project (gnwebsite - a Django/Vue fullstack web app). These skills are specific to one tech stack and don't align with **AIKnowSys's philosophy as a framework-agnostic knowledge system template**.

**AIKnowSys Philosophy:**
AIKnowSys is a **portable template system** for AI-assisted development that can be applied to ANY project type:
- Node.js, Python, Rust, Go projects
- Web apps, CLI tools, libraries, APIs
- Frontend, backend, fullstack, embedded systems

**Problem:**
- 14 total skills in `.github/skills/`
- Many are gnwebsite-specific (Django, Vue, frontend/backend, filters, API contracts)
- Violates framework-agnostic philosophy
- Limits portability (skills only useful for Django/Vue projects)
- Adds cognitive load (users see irrelevant skills for their stack)
- Confuses AIKnowSys's purpose (template system vs. web framework guide)

**Solution:**
- Audit all 14 skills against AIKnowSys philosophy
- Keep: Universal workflows (applicable to ANY project) + AIKnowSys system features
- Remove: Tech-stack-specific skills (Django, Vue, React, etc.)
- Update skill registration in code
- Update documentation

---

## Requirements

### Functional Requirements
1. Identify skills relevant to AIKnowSys (Node.js CLI tool development)
2. Remove gnwebsite-inherited skills (web app development)
3. Update skill registration code to match remaining skills
4. Ensure AGENTS.md accurately reflects available skills
5. Preserve skill-creator for future skill development

### Non-Functional Requirements
- No breaking changes (skills are optional features)
- Clear audit trail in changelog
- Documentation updated simultaneously
- Tests passing after removal

---

## Skill Classification Framework

### ✅ KEEP: Philosophy-Aligned Skills

**Criteria:**
- **Universal workflows** - Applicable to ANY project type (Node.js, Python, Rust, web, CLI, etc.)
- **Framework-agnostic best practices** - Not tied to specific tech stacks
- **AIKnowSys system features** - How to use the knowledge system itself
- **Portable knowledge** - Useful whether building a web app, CLI tool, library, or embedded system

**Examples:**
- `tdd-workflow` - Universal testing practice (works in any language)
- `dependency-updates` - Universal package management (npm, pip, cargo, etc.)
- `documentation-management` - Universal docs workflow (any project needs docs)
- `skill-creator` - AIKnowSys system feature (creates new skills)
- `context7-usage` - AIKnowSys system feature (MCP integration)
- `code-refactoring` - Universal technique (applicable to any codebase)

### ❌ REMOVE: Tech-Stack-Specific Skills

**Criteria:**
- Tied to specific frameworks (Django, Vue, React, Angular, etc.)
- Assumes specific tech stack (Python/Django backend, Vue frontend, etc.)
- Web-app-only patterns (not applicable to CLI tools, libraries, etc.)
- Violates framework-agnostic philosophy

**Examples:**
- `developer-checklist` - "gnwebsite fullstack project" (Django/Vue/Vitest specific)
- `frontend-component-refactoring` - Vue/Tailwind specific (not universal)
- Anything mentioning Django, Vue, Vitest, API filters, backend models, Tailwind CSS

---

## Architecture Changes

### Files to Modify

1. **Delete Skill Directories**
   - `.github/skills/developer-checklist/` (gnwebsite-specific)
   - `.github/skills/frontend-component-refactoring/` (Vue/Tailwind-specific)
   - Any other gnwebsite-inherited skills found during audit

2. **Update Skill Registration**
   - `lib/commands/install-skills.js` - Remove deleted skills from installation
   - `AGENTS.md` - Update skills list to match reality

3. **Update Documentation**
   - `README.md` - Skills section (if exists)
   - `CODEBASE_CHANGELOG.md` - Document audit results

---

## Implementation Steps

### Phase 1: Audit & Classification (15-20 min)

**Goal:** Complete inventory of all skills with keep/remove decisions

#### Step 1: Create Skill Inventory
- **Action:** List all 14 skills in `.github/skills/` with metadata
- **Output:** Markdown table with columns:
  - Skill name
  - Description (from frontmatter)
  - Category (Universal / AIKnowSys-specific / gnwebsite-specific)
  - Decision (KEEP / REMOVE)
  - Reason
- **Dependencies:** None
- **Risk:** Low - read-only analysis

#### Step 2: Review Each Skill Against Framework
- **Action:** Read first 50 lines of each SKILL.md
- **Check for:**
  - gnwebsite mentions in description
  - Django/Python backend references
  - Vue/Vitest/Tailwind frontend references
  - API contract/filter/model references
  - Universal workflow patterns (testing, docs, deps)
- **Dependencies:** Step 1 complete
- **Risk:** Low - classification exercise

#### Step 3: Get User Approval on Classification
- **Action:** Present inventory table to user for review
- **Why:** User knows project scope better than AI
- **Dependencies:** Step 2 complete
- **Risk:** Low - decision checkpoint

---

### Phase 2: Removal & Code Updates (20-30 min)

**Goal:** Clean up gnwebsite-specific skills and update code

#### Step 4: Delete Skill Directories
- **Action:** Remove each skill marked for deletion
- **Files:** `rm -rf .github/skills/<skill-name>/`
- **TDD:** No tests needed (file deletion)
- **Dependencies:** Step 3 approved
- **Risk:** Low - skills are isolated directories

#### Step 5: Update Skill Registration Code
- **Action:** Modify `lib/commands/install-skills.js`
- **Changes:**
  - Remove deleted skills from UNIVERSAL_SKILLS array
  - Remove deleted skills from skill mapping
  - Ensure remaining skills still install correctly
- **TDD:** Existing install-skills tests should pass
- **Dependencies:** Step 4 complete
- **Risk:** Medium - affects skill installation logic

#### Step 6: Update AGENTS.md Skills List
- **Action:** Modify AGENTS.md skills section
- **Changes:**
  - Remove deleted skills from `<skills>` block
  - Update skill count in documentation
  - Verify remaining skill descriptions match current state
- **Dependencies:** Step 5 complete
- **Risk:** Low - documentation update

---

### Phase 3: Testing & Validation (15-20 min)

**Goal:** Ensure no regressions from skill removal

#### Step 7: Run Full Test Suite
- **Action:** `npm test`
- **Expected:** All tests passing
- **If failures:**
  - Check if tests reference deleted skills
  - Update or remove those tests
- **Dependencies:** Step 6 complete
- **Risk:** Low - skills are optional features

#### Step 8: Manual Validation
- **Action:** Test skill installation workflow
- **Commands:**
  ```bash
  # Test in temporary directory
  mkdir /tmp/test-skills
  cd /tmp/test-skills
  npx aiknowsys init
  # Select "Install optional skills" when prompted
  # Verify only remaining skills appear
  # Check skills/ directory has correct skills
  ```
- **Dependencies:** Step 7 passing
- **Risk:** Low - E2E validation

#### Step 9: Verify AGENTS.md Accuracy
- **Action:** Check that `<skills>` block matches actual skills
- **Method:**
  ```bash
  # Compare skills in AGENTS.md vs actual files
  ls .github/skills/ -1
  grep "<name>" AGENTS.md | wc -l
  ```
- **Dependencies:** Step 8 complete
- **Risk:** Low - verification step

---

### Phase 4: Documentation & Cleanup (10-15 min)

**Goal:** Document changes and complete the audit

#### Step 10: Update CODEBASE_CHANGELOG.md
- **Action:** Add session entry documenting skill audit
- **Include:**
  - Audit trigger (user noticed gnwebsite inheritance)
  - Skills removed (list with reasons)
  - Skills kept (list with justification)
  - Files modified (code + docs)
  - Validation results
- **Dependencies:** Step 9 complete
- **Risk:** Low - documentation

#### Step 11: Git Commit
- **Action:** Commit all changes with comprehensive message
- **Message format:**
  ```
  chore(skills): Audit and remove gnwebsite-inherited skills
  
  PROBLEM:
  - 14 skills in .github/skills/, many inherited from parent project
  - gnwebsite-specific skills (Django/Vue web app) don't fit AIKnowSys
  - AIKnowSys is a Node.js CLI tool, not a web framework
  
  SOLUTION:
  - Audited all skills against AIKnowSys scope
  - Removed: [list skills removed]
  - Kept: [list skills kept]
  
  CHANGES:
  - .github/skills/: Removed X directories
  - lib/commands/install-skills.js: Updated skill arrays
  - AGENTS.md: Updated skills list
  - CODEBASE_CHANGELOG.md: Documented audit
  
  VALIDATION:
  - Tests: X/X passing
  - Manual: Verified skill installation
  - Docs: AGENTS.md matches reality
  ```
- **Dependencies:** Step 10 complete
- **Risk:** Low - final commit

---

## Testing Strategy

### Automated Tests

**Existing tests should pass:**
- `test/install-skills.test.js` - Skill installation logic
- `test/cli.test.js` - CLI integration
- Full test suite: `npm test`

**No new tests needed:**
- File deletion doesn't require tests
- Existing tests validate skill installation
- Documentation changes don't need tests

### Manual Validation

**Test skill installation:**
1. Create temporary directory
2. Run `npx aiknowsys init`
3. Select "Install optional skills"
4. Verify only AIKnowSys-relevant skills appear
5. Check `.github/skills/` has correct directories
6. Verify no errors during installation

**Test skill discovery:**
1. Open AGENTS.md
2. Check `<skills>` block
3. Verify each listed skill exists in `.github/skills/`
4. Count matches: `ls .github/skills/ -1 | wc -l` vs `grep "<name>" AGENTS.md | wc -l`

---

## Risks & Mitigations

### Risk 1: Accidentally Remove Universal Skill
**Likelihood:** Medium  
**Impact:** Medium (users lose useful workflow guidance)  
**Mitigation:**
- User reviews clframework-agnostic (universal patterns)
- Ask: "Would this skill help a Rust CLI developer? A Python library author?"
- If yes → keep (universal); if no → remove (tech-specificn
- Keep skills if there's any doubt (universal patterns)
- Can restore from git history if needed

### Risk 2: Skill Registration Code Breaks
**Likelihood:** Low  
**Impact:** Medium (skill installation fails)  
**Mitigation:**
- Tests validate skill installation logic
- Manual E2E test in Phase 3
- Clear error messages if skill not found

### Risk 3: Documentation Drift
**Likelihood:** Low  
**Impact:** Low (confusing but not breaking)  
**Mitigation:**
- Update AGENTS.md in same commit as deletion
- Validation step compares docs to reality
- Automated check in Phase 3

---

## Success Criteria

- [ ] All skills classified (KEEP vs REMOVE) with justification
- [ ] User approved classification before deletion
- [ ] gnwebsite-specific skills removed from `.github/skills/`
- [ ] `lib/commands/install-skills.js` updated (no deleted skills)
- [ ] AGENTS.md `<skills>` block matches actual skills
- [ ] All tests passing (no regressions)
- [ ] Manual validation: skill installation works correctly
- [ ] CODEBASE_CHANGELOG.md documents audit results
- [ ] Changes committed with comprehensive message
- [ ] Only AIKnowSys-relevant skills remain

---

## Expected Skill Inventory (Initial Analysis)

**Note:** This is preliminary classification. Step 3 requires user approval.

### ✅ KEEP (Framework-Agnostic / System Features)

1. **tdd-workflow** - Universal TDD (works in any language: JS, Python, Rust, etc.)
2. **dependency-updates** - Universal package management (npm, pip, cargo, go mod, etc.)
3. **documentation-management** - Universal docs workflow (any project needs docs)
4. **code-refactoring** - Universal refactoring patterns (language-agnostic principles)
5. **validation-troubleshooting** - Universal debugging (test failures, builds in any stack)
6. **skill-creator** - AIKnowSys system feature (how to create skills)
7. **context7-usage** - AIKnowSys system feature (MCP integration guide)
8. **feature-implementation** - Universal workflow (step-by-step planning, any language)

**Philosophy Check:** All 8 skills above would be useful for:
- ✅ Rust CLI developer using AIKnowSys
- ✅ Python library author using AIKnowSys
- ✅ Go microservice team using AIKnowSys
- ✅ React/Vue web developer using AIKnowSys

### ❌ LIKELY REMOVE (Tech-Stack-Specific)

1. **developer-checklist** - "gnwebsite fullstack project" (Django/Vue/Vitest specific)
2. **frontend-component-refactoring** - Vue/Tailwind specific (not framework-agnostic)

**Philosophy Check:** These 2 skills would NOT be useful for:
- ❌ Rust CLI developer (no Vue, no Django, no frontend)
- ❌ Python data science library (no Vue components, no Django filters)
- ❌ Go microservice (backend only, no Vue/Tailwind)

### ❌ REMOVE (Maintainer-Only, Not User-Facing)

1. **deliverable-review** - Internal maintainer tool for auditing AIKnowSys deliverables (skills/stacks/docs)
   - Used by maintainers to review AIKnowSys quality
   - Not applicable to user projects
   - Should not be distributed as a deliverable itself

**Reason:** Meta-skill for maintaining AIKnowSys, not for users implementing their projects

### ❓ NEEDS REVIEW (Borderline cases)

1. **skill-validation** - Check if AIKnowSys system feature or tech-specific
2. **_skill-template** - Template directory, check if still used

---

## Notes for Developer
Understand AIKnowSys philosophy: **framework-agnostic template system**
- Review gnwebsite context (parent project was Django/Vue web app)
- Understand skill format (VS Code Agent Skills standard)

**During implementation:**
- Get user approval on classification before deleting (Step 3)
- Keep skills if framework-agnostic (better to keep universal patterns)
- Ask: "Is this skill useful for Python/Rust/Go developers?" If yes → keep
- Test skill installation manually (not just automated tests)
- Update docs simultaneously with code changes

**Philosophy Test (for borderline skills):**
Ask: "Would this skill help developers using AIKnowSys on a..."
- Rust CLI tool? ✅ Keep if yes
- Python data science library? ✅ Keep if yes
- Go microservice? ✅ Keep if yes
- React/Vue web app? ⚠️ Only if ALSO useful for non-web projects

**Key insight:**
AIKnowSys distributes **workflow templates** (AGENTS.md, skills, hooks) for ANY project type. Skills should be:
- **Universal workflows** - Testing, docs, dependencies, refactoring (any language/stack)
- **AIKnowSys system features** - skill-creator, context7-usage, deliverable-review (how to use the system)
- **NOT tech-specific** - No Django, Vue, React, Tailwind, Vitest, etc.

**Examples:**
- ✅ "TDD workflow" - Universal (works for Rust, Python, JavaScript, etc.)
- ✅ "Dependency updates" - Universal (npm, pip, cargo, go mod, etc.)
- ❌ "Django filter implementation" - Tech-specific (only Django projects)
- ❌ "Vue component refactoring" - Tech-specific (only Vue projects
- AIKnowSys-specific features (skill-creator, context7-usage, deliverable-review)
- NOT tied to specific frameworks (no Django, Vue, React, etc.)

---

## Estimated Time

**Total:** ~60-85 minutes

| Phase | Time | Complexity |
|-------|------|------------|
| Phase 1: Audit (Steps 1-3) | 15-20 min | Low |
| Phase 2: Removal (Steps 4-6) | 20-30 min | Medium |
| Phase 3: Validation (Steps 7-9) | 15-20 min | Low |
| Phase 4: Documentation (Steps 10-11) | 10-15 min | Low |

**Parallelization:** None - must be sequential (delete → update → test → document)

---

## Future Enhancements (Out of Scope)

1. **Skill Discovery Command**
   - `npx aiknowsys list-skills` - Show installed skills
   - Helpful for users browsing capabilities

2. **Skill Validation Tool**
   - Check skill frontmatter format
   - Verify AGENTS.md matches reality
   - Part of `npx aiknowsys check` command

3. **Skill Categories in AGENTS.md**
   - Group by: Universal / AIKnowSys-specific / Optional
   - Helps users understand skill purpose

4. **Auto-generate Skills Section**
   - Read `.github/skills/` directory
   - Generate `<skills>` block programmatically
   - Prevents docs drift

---

*This plan ensures AIKnowSys skills remain focused on universal workflows and CLI tool development, removing gnwebsite web app inheritance.*
