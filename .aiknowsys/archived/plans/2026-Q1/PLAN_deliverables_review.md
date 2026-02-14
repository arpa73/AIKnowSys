# Implementation Plan: Codebase Deliverables Review & Update

**Status:** 📋 PLANNED  
**Created:** 2026-02-01  
**Goal:** Review and update all shipped skills, stack templates, and documentation using Context7

---

## Problem Statement

AIKnowSys ships universal skills, stack templates, and documentation to users. These deliverables reference specific frameworks, libraries, and APIs that may become outdated as technologies evolve.

**Current deliverables:**

**Universal Skills (6):**
- `code-refactoring` - Safe refactoring patterns
- `dependency-updates` - Safe dependency upgrade workflow
- `documentation-management` - Doc organization and archiving
- `skill-creator` - How to create new skills
- `tdd-workflow` - Test-driven development
- `validation-troubleshooting` - Debug validation failures

**Stack Templates (6):**
- `nextjs` - Next.js app router
- `nextjs-api` - Next.js API routes
- `vue-vite` - Vue 3 + Vite
- `vue-express` - Vue + Express fullstack
- `express-api` - Express REST API
- `fastapi` - Python FastAPI

**Documentation:**
- `README.md` - Main project docs
- `SETUP_GUIDE.md` - Installation guide
- `CONTRIBUTING.md` - Contributor guide
- `docs/` - All guides and references

---

## Goal

Use Context7 to:
1. **Validate current accuracy** - Check if skills/stacks reference current APIs
2. **Identify drift** - Find outdated patterns or deprecated methods
3. **Update deliverables** - Bring everything to current best practices
4. **Establish review cadence** - Quarterly review process

---

## Requirements

**Functional:**
- All 6 universal skills reviewed for accuracy
- All 6 stack templates validated against current framework versions
- Documentation references checked (framework versions, install commands)
- Changes tracked with clear rationale

**Non-Functional:**
- Use Context7 via AI assistant (manual workflow, not automated)
- Document what was checked and why changes were made
- Preserve backward compatibility where possible
- Note breaking changes explicitly

---

## Implementation Steps

### Phase 1: Skills Review (Use Context7)

**For each skill:**
1. **Extract library references** - Identify frameworks/tools mentioned
2. **Query Context7** - Get current best practices for those libraries
3. **Compare and validate** - Check if skill content is current
4. **Update if needed** - Fix outdated patterns, add new best practices
5. **Document changes** - Note what changed and why

**Skills to review:**

#### Skill 1: code-refactoring
- **Extract refs:** Generic (no specific framework)
- **Validation:** Check if refactoring patterns still apply
- **Likely status:** ✅ Framework-agnostic, probably current

#### Skill 2: dependency-updates
- **Extract refs:** npm, pip, package managers
- **Validation:** Check if upgrade commands still work (npm audit, etc.)
- **Likely status:** ⚠️ May need updates for newer npm/pip features

#### Skill 3: documentation-management
- **Extract refs:** Generic documentation patterns
- **Validation:** Verify archiving strategies still make sense
- **Likely status:** ✅ Probably current

#### Skill 4: skill-creator
- **Extract refs:** AIKnowSys-specific
- **Validation:** Check against current skill format
- **Likely status:** ✅ Internal reference, should be current

#### Skill 5: tdd-workflow
- **Extract refs:** Node.js test runner, testing frameworks
- **Validation:** Check if TDD patterns match current test tools
- **Likely status:** ⚠️ May reference older testing approaches

#### Skill 6: validation-troubleshooting
- **Extract refs:** Generic debugging
- **Validation:** Check if troubleshooting steps still apply
- **Likely status:** ✅ Probably current

---

### Phase 2: Stack Templates Review (Use Context7)

**For each stack:**
1. **Identify framework version** - What version does template assume?
2. **Query Context7 for latest** - Get current framework docs
3. **Compare scaffolding** - Does our template match current conventions?
4. **Update template** - Modernize to current best practices
5. **Test template** - Run `init --stack <name>` and verify it works

**Stacks to review:**

#### Stack 1: nextjs
- **Framework:** Next.js (App Router)
- **Context7 query:** `/vercel/next.js` - Latest app router patterns
- **Check:**
  - Is metadata API current?
  - Are server components used correctly?
  - Is middleware pattern up-to-date?
- **Likely status:** ⚠️ Next.js evolves rapidly

#### Stack 2: nextjs-api
- **Framework:** Next.js (API Routes)
- **Context7 query:** `/vercel/next.js` - Route handlers vs API routes
- **Check:**
  - Should we use route handlers instead of API routes?
  - Is API middleware current?
- **Likely status:** ⚠️ API routes → route handlers migration

#### Stack 3: vue-vite
- **Framework:** Vue 3 + Vite
- **Context7 query:** `/vuejs/core`, `/vitejs/vite`
- **Check:**
  - Is Composition API usage current?
  - Are Vite config patterns up-to-date?
- **Likely status:** ⚠️ Vue 3.5+ may have new patterns

#### Stack 4: vue-express
- **Framework:** Vue 3 + Express
- **Context7 query:** `/vuejs/core`, `/expressjs/express`
- **Check:**
  - Fullstack integration patterns
  - CORS and middleware setup
- **Likely status:** ⚠️ May need updates

#### Stack 5: express-api
- **Framework:** Express
- **Context7 query:** `/expressjs/express`
- **Check:**
  - Router patterns
  - Error handling middleware
- **Likely status:** ✅ Express is stable

#### Stack 6: fastapi
- **Framework:** Python FastAPI
- **Context7 query:** Find FastAPI in Context7
- **Check:**
  - Async patterns
  - Dependency injection
- **Likely status:** ⚠️ FastAPI evolving

---

### Phase 3: Documentation Review

#### 3.1 README.md
- **Check:** Installation commands, framework versions mentioned
- **Query Context7:** Verify npm/npx patterns are current

#### 3.2 SETUP_GUIDE.md
- **Check:** Git hooks setup, VSCode configuration
- **Query Context7:** Verify Node.js version recommendations

#### 3.3 CONTRIBUTING.md
- **Check:** Development workflow, testing commands
- **Validate:** npm scripts still match best practices

#### 3.4 docs/ guides
- **Check:** All technical references in guides
- **Validate:** Links to external docs still valid

---

### Phase 4: Establish Review Cadence

**Create review workflow:**

1. **Quarterly review** - Every 3 months, repeat validation
2. **GitHub issue template** - Track review cycles
3. **Review checklist** - Step-by-step process
4. **AI prompts** - Pre-written Context7 queries for next review

**Deliverables:**
- `docs/deliverable-review-process.md` - How to conduct reviews
- `.github/ISSUE_TEMPLATE/quarterly-review.md` - Issue template
- `.github/skills/deliverable-review/SKILL.md` - AI skill for review process

---

## Review Methodology (Using Context7)

**Step-by-step for each deliverable:**

```markdown
### Review Template

**Deliverable:** [skill/stack/doc name]
**Date:** [review date]
**Reviewer:** [AI + human]

**1. Extract Library References**
- Run: lib/context7/extractLibraryReferences()
- Found: [list of frameworks/libraries]

**2. Query Context7**
For each library:
- Library ID: [e.g., /vercel/next.js]
- Query: "Current best practices for [topic]"
- Version checked: [e.g., v15]

**3. Validation Results**
- ✅ Current: [what's still accurate]
- ⚠️ Outdated: [what needs updating]
- 🆕 Missing: [new patterns to add]

**4. Changes Made**
- [File path]: [what changed and why]
- [File path]: [what changed and why]

**5. Testing**
- [How changes were validated]

**6. Notes for Next Review**
- [Anything to watch for next quarter]
```

---

## Testing Strategy

**For skills:**
- Read skill content carefully
- Verify examples still make sense
- Check trigger words are appropriate

**For stack templates:**
- Run `npx aiknowsys init --stack <name>`
- Verify generated project structure
- Check if CODEBASE_ESSENTIALS makes sense
- Optionally: Create small app to verify it works

**For docs:**
- Read through entire document
- Click all links (verify not broken)
- Test installation commands
- Verify examples are accurate

---

## Success Criteria

- [ ] All 6 skills reviewed and updated
- [ ] All 6 stack templates validated and modernized
- [ ] Documentation references checked and updated
- [ ] Review process documented for future cycles
- [ ] GitHub issue template created
- [ ] AI review skill created
- [ ] First quarterly review complete
- [ ] Changelog updated with changes and rationale

---

## Timeline Estimate

**Phase 1 (Skills Review):**
- 6 skills × 1-2 hours = 6-12 hours
- Using Context7 for validation
- Documenting changes

**Phase 2 (Stack Templates):**
- 6 stacks × 2-3 hours = 12-18 hours
- Context7 queries for latest patterns
- Testing each template

**Phase 3 (Documentation):**
- 4-6 hours for all docs
- Link checking
- Reference validation

**Phase 4 (Process Documentation):**
- 2-4 hours
- Templates and checklists

**Total estimated effort: 24-40 hours**

Can be done incrementally:
- Week 1-2: Skills (6-12 hours)
- Week 3-4: Stacks (12-18 hours)  
- Week 5: Docs (4-6 hours)
- Week 6: Process (2-4 hours)

---

## Risks & Mitigations

### Risk 1: Breaking Changes
**Impact:** Updated templates break existing user projects  
**Mitigation:**
- Note breaking changes explicitly
- Provide migration guide if needed
- Version bump if necessary (v0.9.0 → v1.0.0)

### Risk 2: Context7 Unavailable
**Impact:** Can't validate against current APIs  
**Mitigation:**
- Manual review against official docs
- Use browser to check framework homepages
- Defer if Context7 truly needed

### Risk 3: Scope Creep
**Impact:** Review turns into major rewrite  
**Mitigation:**
- Focus on accuracy, not new features
- Flag major changes for separate plan
- Time-box each deliverable review

---

## Notes for Developer

**Review philosophy:**
- **Accuracy over perfection** - Fix outdated info, don't rewrite everything
- **Preserve patterns** - Keep existing structure unless it's wrong
- **Document rationale** - Explain why changes were made
- **Test changes** - Verify templates still work after updates

**Using Context7:**
- Query specific library IDs (e.g., `/vercel/next.js`)
- Ask for "current best practices for [topic]"
- Compare Context7 response with our content
- Note version-specific differences

**Changelog entries:**
```markdown
## Deliverables Review (Feb 2026)

**Skills updated:**
- dependency-updates: Updated npm audit commands for npm 10+
- tdd-workflow: Added Vitest patterns alongside Node.js test runner

**Stacks updated:**
- nextjs: Updated to App Router conventions (Next.js 15)
- nextjs-api: Migrated API routes → route handlers pattern
- vue-vite: Updated to Vue 3.5 Composition API patterns

**Documentation:**
- README: Updated Node.js version requirement (20+)
- SETUP_GUIDE: Added Context7 integration section

**Validation:** All changes validated with Context7 MCP
```

---

## Related Plans

- [Context7 Integration](PLAN_context7_integration.md) - Foundation for this review
- [Context7 Future Enhancements](PLAN_context7_future.md) - Automation possibilities

---

*Use Context7 to keep delivered content current and accurate.*
