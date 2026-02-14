# Context7 Review Checklist

**Purpose:** Monthly deliverable review using Context7 MCP for current documentation  
**Frequency:** Monthly (or before releases)  
**Duration:** ~2-3 hours  
**Prerequisites:** Context7 MCP configured in Claude Desktop or Cursor

---

## Overview

This checklist guides maintainers through using AI + Context7 to validate that AIKnowSys deliverables (skills, stack templates, documentation) remain current with latest framework versions.

**Why Context7?**
- Queries up-to-date documentation directly from official sources
- Validates against current APIs (not stale examples)
- Detects breaking changes and deprecations
- Provides authoritative framework references

---

## Preparation

### 1. Verify Context7 Availability

**Check your AI client has Context7 configured:**
```bash
# Claude Desktop: Check ~/Library/Application Support/Claude/claude_desktop_config.json
# Cursor: Check config in User > globalStorage > cursor-ai.cursor-mcp

# Look for "context7" server configuration
```

**If not configured:** See [Context7 MCP documentation](https://github.com/context-7/context7) for setup.

### 2. Create Review Issue

**Create a GitHub issue** to track this review cycle:
- Use template: `.github/ISSUE_TEMPLATE/deliverable-review.md`
- Title: "Deliverables Review - [Month Year]"
- Assign to yourself
- Label: "documentation", "maintenance"

---

## Phase 1: Universal Skills Review (~45 minutes)

**Location:** `.github/skills/`

### Review Process

For each universal skill:

1. **Open skill file** in editor
2. **Ask AI to validate** using Context7:
   ```
   Review this skill file against current best practices using Context7.
   
   Check:
   - Are framework references current?
   - Have any APIs changed?
   - Are examples still valid?
   - Any new patterns we should add?
   
   Use Context7 to query:
   - npm best practices (if testing skill)
   - pytest documentation (if testing skill)
   - Framework-specific docs as needed
   ```

3. **Document findings** in review issue
4. **Update skill** if changes needed
5. **Mark complete** in checklist

### Skills to Review

- [ ] `code-refactoring/` - Test-driven refactoring patterns
- [ ] `dependency-updates/` - Safe upgrade procedures
- [ ] `documentation-management/` - Changelog organization
- [ ] `feature-implementation/` - Feature planning workflow
- [ ] `skill-creator/` - Skill creation guide
- [ ] `tdd-workflow/` - Test-driven development
- [ ] `validation-troubleshooting/` - Testing/build failures

**Expected outcome:** Skills validated against current framework docs

---

## Phase 2: Stack Templates Review (~60 minutes)

**Location:** `templates/stacks/`

### Review Process

For each stack template:

1. **Identify framework version** in CODEBASE_ESSENTIALS.md
2. **Ask AI to validate** with Context7:
   ```
   Review this Next.js stack template against Next.js v15.1.11 using Context7.
   
   Check:
   - Have any patterns become obsolete?
   - Are there new best practices we should add?
   - Do code examples still work?
   - Any breaking changes in this version?
   
   Query Context7 for /vercel/next.js/v15.1.11
   ```

3. **Test critical patterns** if possible (create test project)
4. **Document findings** in review issue
5. **Update template** if needed

### Stacks to Review

- [ ] `nextjs/` - Next.js App Router → Query: `/vercel/next.js/v15.x`
- [ ] `vue-vite/` - Vue 3 Composition API → Query: `/vuejs/core/v3.x`
- [ ] `express-api/` - Express REST API → Query: `/expressjs/express`
- [ ] `fastapi/` - FastAPI + Pydantic → Query: `/fastapi/fastapi`
- [ ] `nextjs-api/` - Next.js API Routes → Query: `/vercel/next.js`
- [ ] `vue-express/` - Vue + Express fullstack → Query both

**Expected outcome:** Templates validated, breaking changes documented

---

## Phase 3: Documentation Review (~30 minutes)

**Location:** `docs/`, `README.md`, `SETUP_GUIDE.md`, etc.

### Review Process

1. **Ask AI to check for staleness:**
   ```
   Review our main documentation files for outdated information.
   
   Check:
   - Are version numbers current?
   - Do external links still work?
   - Are CLI examples accurate?
   - Any new features to document?
   
   Use Context7 if referencing external tools (npm, git, etc.)
   ```

2. **Test example commands** from documentation
3. **Update version references** if needed
4. **Fix broken links**

### Docs to Review

- [ ] `README.md` - Project overview and quick start
- [ ] `SETUP_GUIDE.md` - Installation and configuration
- [ ] `CONTRIBUTING.md` - Contribution guidelines
- [ ] `docs/vscode-hooks-guide.md` - VSCode hooks documentation
- [ ] `docs/advanced-workflows.md` - Advanced usage patterns

**Expected outcome:** Documentation current and accurate

---

## Phase 4: Create Review Report (~15 minutes)

**In the GitHub issue:**

### Summary Template

```markdown
## Deliverables Review - [Month Year]

**Date:** YYYY-MM-DD  
**Reviewer:** @username  
**Context7 Version:** [check your config]

### Skills Reviewed (X/7)
- ✅ code-refactoring - Current
- ⚠️ dependency-updates - Updated npm audit docs
- ✅ documentation-management - Current
- ...

### Stacks Reviewed (X/6)
- ⚠️ nextjs - Updated for Next.js 15 async APIs
- ✅ vue-vite - Current
- ...

### Documentation Reviewed (X/5)
- ✅ README.md - Current
- ✅ SETUP_GUIDE.md - Current
- ...

### Changes Made
- [nextjs template] Added async headers/cookies section
- [dependency-updates skill] Updated npm audit examples
- [README.md] Updated version to 0.8.0

### Key Learnings
- Next.js 15 requires async access to headers/cookies
- npm audit now has JSON output format
- Context7 /vercel/next.js library ID was helpful

### Next Review
Scheduled for: [Next month]
```

---

## Phase 5: Update Review Process (~10 minutes)

**Meta-review:** Improve this checklist based on experience

1. **What worked well?**
2. **What was unclear?**
3. **What could be automated?**
4. **Update this checklist** with improvements

---

## Tips for Effective Reviews

### Context7 Query Patterns

**Good queries:**
```
Query Context7 for /vercel/next.js: "middleware patterns in Next.js 15"
Query Context7 for /fastapi/fastapi: "Pydantic v2 validation examples"
Query Context7 for /vuejs/core: "Composition API best practices"
```

**Poor queries:**
```
"How do I use Next.js?" (too broad)
"Is this code correct?" (without framework context)
```

### When to Update vs Document

**Update immediately if:**
- Breaking change affects existing code
- Security vulnerability found
- API is deprecated

**Document for later if:**
- Minor improvement opportunity
- New feature to consider adding
- Potential refactoring

### Context7 Library IDs Reference

| Framework | Library ID | Notes |
|-----------|-----------|-------|
| Next.js | `/vercel/next.js` or `/vercel/next.js/v15.x` | Specify version when possible |
| Vue | `/vuejs/core` | Composition API is latest |
| React | `/facebook/react` | For React-specific skills |
| Express | `/expressjs/express` | Stable, infrequent changes |
| FastAPI | `/fastapi/fastapi` | Check Pydantic version too |
| Supabase | `/supabase/supabase` | For database patterns |
| Vite | `/vitejs/vite` | Build tool patterns |

---

## Automation Notes (Future)

**If this process becomes tedious,** consider implementing the Context7 plugin (Option B in PLAN_context7_future.md).

**Plugin would automate:**
- Querying Context7 for each deliverable
- Comparing current patterns vs latest docs
- Generating diff reports
- Suggesting updates

**For now:** Manual review ensures maintainer judgment and learning.

---

## Related Resources

- [PLAN_deliverables_review.md](../.aiknowsys/PLAN_deliverables_review.md) - Example review execution
- [.github/skills/deliverable-review/SKILL.md](.github/skills/deliverable-review/SKILL.md) - AI prompts for reviews
- [.github/ISSUE_TEMPLATE/deliverable-review.md](.github/ISSUE_TEMPLATE/deliverable-review.md) - Issue template

---

*Part of AIKnowSys Context7 integration. See [PLAN_context7_future.md](../.aiknowsys/PLAN_context7_future.md) for implementation plan.*
