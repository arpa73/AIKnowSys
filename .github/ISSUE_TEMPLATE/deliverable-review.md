---
name: Deliverable Review
about: Monthly quality review of AIKnowSys deliverables (skills, stacks, docs)
title: '[REVIEW] Deliverables Review - [Month Year]'
labels: ['review', 'quality', 'documentation']
assignees: ''
---

## Review Details

**Review Date:** YYYY-MM-DD  
**Review Type:** [ ] Monthly | [ ] Pre-release | [ ] Framework update  
**Context7 Available:** [ ] Yes | [ ] No  
**Reviewer:** @username

---

## Skills Review (X/7)

**Universal skills in `.github/skills/`:**

- [ ] **code-refactoring**
  - Status: [ ] ✅ Current | [ ] ⚠️ Minor update | [ ] 🔴 Major update
  - Notes: 
  - Context7 query: _If applicable_

- [ ] **dependency-updates**
  - Status: [ ] ✅ Current | [ ] ⚠️ Minor update | [ ] 🔴 Major update
  - Notes: 
  - Context7 query: _npm audit, pip best practices_

- [ ] **documentation-management**
  - Status: [ ] ✅ Current | [ ] ⚠️ Minor update | [ ] 🔴 Major update
  - Notes: 
  - Context7 query: _Markdown conventions, archiving strategies_

- [ ] **skill-creator**
  - Status: [ ] ✅ Current | [ ] ⚠️ Minor update | [ ] 🔴 Major update
  - Notes: 
  - Context7 query: _VS Code skill format updates_

- [ ] **tdd-workflow**
  - Status: [ ] ✅ Current | [ ] ⚠️ Minor update | [ ] 🔴 Major update
  - Notes: 
  - Context7 query: _Vitest, Jest, pytest patterns_

- [ ] **validation-troubleshooting**
  - Status: [ ] ✅ Current | [ ] ⚠️ Minor update | [ ] 🔴 Major update
  - Notes: 
  - Context7 query: _Test debugging, build errors_

- [ ] **deliverable-review** (this skill)
  - Status: [ ] ✅ Current | [ ] ⚠️ Minor update | [ ] 🔴 Major update
  - Notes: 
  - Context7 query: _Documentation validation patterns_

---

## Stack Templates Review (X/6)

**Templates in `templates/stacks/`:**

- [ ] **nextjs** (Next.js App Router)
  - Framework version: v____
  - Status: [ ] ✅ Current | [ ] ⚠️ Minor update | [ ] 🔴 Major update
  - Notes: 
  - Context7 query: `/vercel/next.js/v____` - _App Router patterns, async APIs_

- [ ] **nextjs-api** (Next.js Pages Router + API)
  - Framework version: v____
  - Status: [ ] ✅ Current | [ ] ⚠️ Minor update | [ ] 🔴 Major update
  - Notes: 
  - Context7 query: `/vercel/next.js/v____` - _Pages Router, API routes_

- [ ] **vue-vite** (Vue 3 SPA)
  - Framework version: Vue v____, Vite v____
  - Status: [ ] ✅ Current | [ ] ⚠️ Minor update | [ ] 🔴 Major update
  - Notes: 
  - Context7 query: `/vuejs/core/v____` - _Composition API, reactivity_

- [ ] **vue-express** (Vue 3 + Express fullstack)
  - Framework version: Vue v____, Express v____
  - Status: [ ] ✅ Current | [ ] ⚠️ Minor update | [ ] 🔴 Major update
  - Notes: 
  - Context7 query: `/vuejs/core` + `/expressjs/express` - _SSR patterns, middleware_

- [ ] **express-api** (Express REST API)
  - Framework version: v____
  - Status: [ ] ✅ Current | [ ] ⚠️ Minor update | [ ] 🔴 Major update
  - Notes: 
  - Context7 query: `/expressjs/express` - _Middleware, error handling_

- [ ] **fastapi** (FastAPI Python backend)
  - Framework version: v____
  - Status: [ ] ✅ Current | [ ] ⚠️ Minor update | [ ] 🔴 Major update
  - Notes: 
  - Context7 query: `/fastapi/fastapi` - _Pydantic v2, async patterns_

---

## Documentation Review (X/5)

**Main documentation files:**

- [ ] **README.md**
  - Status: [ ] ✅ Current | [ ] ⚠️ Minor update | [ ] 🔴 Major update
  - Notes: _Features list, installation steps, examples_
  - Issues: _Broken links, outdated versions, missing features_

- [ ] **SETUP_GUIDE.md**
  - Status: [ ] ✅ Current | [ ] ⚠️ Minor update | [ ] 🔴 Major update
  - Notes: _Installation commands, prerequisites_
  - Issues: _npm version, Node.js version, git hooks setup_

- [ ] **CONTRIBUTING.md**
  - Status: [ ] ✅ Current | [ ] ⚠️ Minor update | [ ] 🔴 Major update
  - Notes: _Workflow guidance, code standards_
  - Issues: _Test commands, commit conventions_

- [ ] **CODEBASE_ESSENTIALS.md**
  - Status: [ ] ✅ Current | [ ] ⚠️ Minor update | [ ] 🔴 Major update
  - Notes: _Validation matrix, patterns, invariants_
  - Issues: _CLI commands, test setup, dependencies_

- [ ] **ROADMAP.md**
  - Status: [ ] ✅ Current | [ ] ⚠️ Minor update | [ ] 🔴 Major update
  - Notes: _Feature tracking, milestones_
  - Issues: _Completed features, new priorities_

---

## Changes Made

### Updated Files
_List files changed during this review:_

- [ ] `.github/skills/[skill-name]/SKILL.md` - _Description of changes_
- [ ] `templates/stacks/[stack-name]/CODEBASE_ESSENTIALS.md` - _Description of changes_
- [ ] `[documentation-file].md` - _Description of changes_

### Commits
_Link to commits made during review:_

- Commit: `abc123f` - Description
- Commit: `def456g` - Description

---

## Key Learnings

### Framework Insights
_Discoveries from Context7 queries:_

- **[Framework Name]:** [Insight about new patterns, deprecations, best practices]
- **[Framework Name]:** [Insight]

### Pattern Evolution
_How our patterns compare to current best practices:_

- **Pattern:** [Name] - Status: [Aligned/Needs update/Intentionally different]
  - Reasoning: [Why we keep or change it]

### Maintenance Recommendations
_Improvements for future reviews:_

- [ ] **Recommendation:** [Description]
  - Priority: [ ] High | [ ] Medium | [ ] Low
  - Effort: [ ] Quick (<1hr) | [ ] Moderate (1-4hrs) | [ ] Large (>4hrs)

---

## Validation

### Tests Run
- [ ] `npm test` - All tests passing
- [ ] `npm run lint` - No linting errors
- [ ] `npm run test:coverage` - Coverage ≥ 80%

### Manual Verification
- [ ] CLI commands work as documented
- [ ] Examples are accurate and runnable
- [ ] Links are valid (no 404s)
- [ ] Version numbers match package.json

---

## Sign-off

**Review Complete:** [ ] Yes | [ ] Partially (see notes)  
**Follow-up Issues:** _Link to any issues created_  
**Next Review:** YYYY-MM-DD (or milestone: v____)

---

## Review Artifacts

**Review report location:** `.aiknowsys/reviews/YYYY-MM-DD-[type]-review.md`  
**Session notes:** `.aiknowsys/sessions/YYYY-MM-DD-session.md` (if applicable)

**Context7 library IDs used:**
- `/vercel/next.js/v____`
- `/vuejs/core/v____`
- `/fastapi/fastapi`
- `/expressjs/express`
- _Others: ___________________

---

**Related:**
- [Context7 Review Checklist](../../docs/context7-review-checklist.md)
- [Deliverable Review Skill](../.github/skills/deliverable-review/SKILL.md)
- [Previous Review](_link to previous issue_)
