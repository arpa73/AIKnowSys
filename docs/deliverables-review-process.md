# Deliverables Review: Process Documentation (February 2026)

**Date:** February 1, 2026  
**Reviewer:** @Developer  
**Phase:** 4 of 4 (Review Process Establishment)

---

## Purpose

Establish a **quarterly review process** to keep AIKnowSys deliverables current with evolving frameworks and best practices.

---

## Review Schedule

**Frequency:** Quarterly (every 3 months)  
**Timing:** Beginning of quarter (January, April, July, October)  
**Duration:** 1-2 sessions with Context7

---

## Review Process Workflow

### Step 1: Plan Creation

Create review plan in `.aiknowsys/reviews/YYYY-MM-DD-quarterly-review.md`:

```markdown
# Quarterly Review: Q[1-4] YYYY

**Date:** YYYY-MM-DD  
**Reviewer:** @Developer

## Scope

- [ ] Universal skills (6 skills)
- [ ] Stack templates (6 templates)
- [ ] Documentation (5 main docs)

## Context7 Queries

### Skills Review
- npm: Query npm best practices
- pytest: Query pytest current patterns  
- TDD: Query test-driven development workflows

### Stacks Review
- Next.js: Query `/vercel/next.js` for latest version
- Vue: Query `/vuejs/core` for latest version
- FastAPI: Query `/websites/fastapi_tiangolo`

### Documentation Review
- Check version references
- Validate installation commands
- Verify examples match current tools
```

### Step 2: Execute Reviews

**For each deliverable:**

1. **Resolve library ID** (if needed):
   ```
   @mcp_context7_resolve-library-id
   libraryName: "next.js"
   query: "Next.js web framework patterns"
   ```

2. **Query current documentation**:
   ```
   @mcp_context7_query-docs
   libraryId: "/vercel/next.js"
   query: "Next.js 15 server components async patterns"
   ```

3. **Compare with our deliverable**:
   - Read skill/template/doc file
   - Compare patterns with Context7 response
   - Note discrepancies

4. **Document findings**:
   - ✅ Current (no changes)
   - ⚠️ Minor update (add note/example)
   - ❌ Outdated (requires refactor)

### Step 3: Apply Updates

**For each finding:**

- **Current**: Mark as validated, move on
- **Minor update**: Make inline edits, document in review
- **Outdated**: Create GitHub issue for major refactor

### Step 4: Create Review Summary

Document in `.aiknowsys/reviews/YYYY-MM-DD-review-summary.md`:

```markdown
# Quarterly Review Summary: Q[1-4] YYYY

## Results

**Skills:** 6/6 reviewed
- ✅ Current: 5
- ⚠️ Minor updates: 1 (dependency-updates - new npm flag)
- ❌ Outdated: 0

**Stacks:** 6/6 reviewed
- ✅ Current: 5
- ⚠️ Minor updates: 1 (nextjs - async APIs)
- ❌ Outdated: 0

**Documentation:** 5/5 reviewed
- ✅ Current: 5
- ⚠️ Minor improvements: 2 (version requirements)
- ❌ Outdated: 0

## Actions Taken

- Updated nextjs template (async headers/cookies)
- All other deliverables validated as current

## Next Review

**Scheduled:** [Next quarter start date]
```

---

## GitHub Issue Template (For Major Updates)

When a deliverable needs significant work, create an issue:

```markdown
**Title:** [Skill/Stack/Doc] needs update for [Framework] [Version]

**Description:**
Context7 shows that [framework/library] has changed significantly.

**Current state:**
- Our template/skill references [old pattern]
- Uses [framework] version [X.Y.Z]

**Context7 findings:**
- Latest version is [A.B.C]
- Breaking changes: [list]
- New recommended patterns: [list]

**Required changes:**
- [ ] Update version reference in template
- [ ] Replace [old pattern] with [new pattern]
- [ ] Add/remove sections as needed
- [ ] Validate with Context7

**Reference:**
- Context7 library ID: `/org/project`
- Review document: `.aiknowsys/reviews/YYYY-MM-DD-review.md`

**Labels:** deliverables-review, [stack/skill/docs]
```

---

## AI Agent Prompts

### Prompt 1: Start Quarterly Review

```
Context: I'm doing our quarterly AIKnowSys deliverables review.

Action: Please help me review our deliverables against current framework versions using Context7.

1. Read the review plan: .aiknowsys/PLAN_deliverables_review.md
2. Create today's review document: .aiknowsys/reviews/YYYY-MM-DD-quarterly-review.md
3. Start with Phase 1 (Skills):
   - For each skill, query Context7 for current best practices
   - Compare with our skill documentation
   - Document findings (✅ Current / ⚠️ Minor / ❌ Outdated)

Let's begin with skills validation.
```

### Prompt 2: Continue with Stacks

```
Context: Skills review complete. Moving to stack templates.

Action: Review all 6 stack templates against current framework docs.

1. For each template, identify framework version
2. Query Context7 for latest framework patterns
3. Compare template CODEBASE_ESSENTIALS.md with Context7
4. Document findings and make inline updates if minor

Let's proceed with stack validation.
```

### Prompt 3: Finish with Documentation

```
Context: Skills and stacks validated. Final phase: documentation.

Action: Review main documentation files for outdated references.

1. Check README.md, SETUP_GUIDE.md, CONTRIBUTING.md
2. Verify installation commands are current
3. Check version requirements mentioned
4. Validate examples match current tools

Let's complete the documentation review.
```

### Prompt 4: Create Review Summary

```
Context: All 3 phases complete.

Action: Create review summary document.

1. Summarize findings from all phases
2. List actions taken (updates applied)
3. Identify any major refactors needed (create issues)
4. Schedule next quarterly review date

Create: .aiknowsys/reviews/YYYY-MM-DD-review-summary.md
```

---

## Success Criteria

A successful quarterly review:

✅ **All deliverables validated** - Every skill, stack, and doc checked  
✅ **Context7 used extensively** - Framework patterns verified against live docs  
✅ **Minor updates applied** - Inline fixes made during review  
✅ **Major issues tracked** - GitHub issues created for big refactors  
✅ **Review documented** - Findings captured in review files  
✅ **Next review scheduled** - Calendar reminder set

---

## Review Maintenance

### Review File Retention

- **Keep:** Current quarter + previous quarter reviews
- **Archive:** Reviews older than 6 months → `.aiknowsys/reviews/archive/`
- **Delete:** Never (historical record)

### When to Trigger Ad-hoc Review

Outside of quarterly schedule, trigger review if:

- **Major framework release** (Next.js 16, Vue 4, etc.)
- **Breaking library changes** (npm 11, pytest 10, etc.)
- **User reports outdated pattern** (GitHub issue)
- **Context7 update** (new library coverage)

---

## Integration with Existing Workflow

This review process integrates with:

1. **Session Hooks** - `session-start.js` already detects Context7 availability
2. **CHANGELOG** - Review findings can be added to CODEBASE_CHANGELOG.md
3. **CURRENT_PLAN.md** - Create review plan as active plan during review
4. **Skills** - Use dependency-updates skill pattern (Context7 reminder)

---

## Example: First Quarterly Review (February 2026)

**What we just did:**

✅ **Phase 1:** Validated 6 universal skills with Context7  
✅ **Phase 2:** Validated 6 stack templates (updated Next.js async APIs)  
✅ **Phase 3:** Validated 5 documentation files  
✅ **Phase 4:** Created this process document

**Outcome:**
- All deliverables current or updated
- Next review: May 2026 (Q2)
- Process documented for repeatability

---

## Next Steps

1. ✅ Create review process document (this file)
2. [ ] Add calendar reminder for Q2 2026 review (May 1)
3. [ ] Update ROADMAP.md with quarterly review cadence
4. [ ] Optional: Create GitHub workflow to remind about reviews

---

*This establishes a sustainable process to keep AIKnowSys deliverables current.*
