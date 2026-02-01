---
name: deliverable-review
description: Review AIKnowSys deliverables (skills, stack templates, documentation) using Context7 MCP for current framework documentation. Use for monthly quality reviews, pre-release validation, or when frameworks release major versions.
---

# Deliverable Review with Context7

Use this skill to validate AIKnowSys deliverables against current framework documentation using Context7 MCP.

## When to Use This Skill

**Trigger conditions:**
- Monthly deliverable review cycle
- Before major releases (v0.x.0, v1.0.0)
- After framework major version releases (Next.js 15, Vue 4, etc.)
- User reports outdated patterns or examples
- Adding new stack templates or skills

**Prerequisites:**
- Context7 MCP configured in Claude Desktop or Cursor
- Access to `.github/skills/` and `templates/stacks/`

## Workflow

### Step 1: Check Context7 Availability

**Before starting,** verify Context7 is configured:

```javascript
// AI should detect Context7 by checking:
// - Environment variables (VSCODE_GIT_ASKPASS_NODE, etc.)
// - Tool availability (can query Context7)
// - User confirmation ("Do you have Context7 configured?")
```

**If Context7 not available:**
- Skip to manual review (check framework changelogs)
- Recommend Context7 setup for better validation

### Step 2: Skills Review

**For each universal skill in `.github/skills/`:**

Use this prompt template with Context7:

```
Review the [SKILL_NAME] skill against current best practices using Context7.

Skill location: .github/skills/[SKILL_NAME]/SKILL.md

Check:
1. Are framework/tool references current?
2. Have any APIs or commands changed?
3. Are code examples still valid?
4. Any new patterns or best practices to add?
5. Are version numbers accurate?

Use Context7 to query relevant documentation:
- For testing skills: npm, pytest, vitest docs
- For framework skills: Next.js, Vue, React docs
- For tooling skills: git, npm, package managers

Report findings in this format:
- ✅ Current (no changes needed)
- ⚠️ Minor update (specific change)
- 🔴 Major update (breaking change)
```

**Example Context7 queries:**

```
# For tdd-workflow skill
Query Context7 for /npm/docs: "npm test runner best practices"
Query Context7 for /vitest-dev/vitest: "Vitest configuration and usage"

# For dependency-updates skill
Query Context7 for /npm/docs: "npm audit and outdated commands"
Query Context7 for /python/pip: "pip dependency management"
```

### Step 3: Stack Templates Review

**For each stack template in `templates/stacks/`:**

Use this prompt template:

```
Review the [STACK_NAME] template against [FRAMEWORK] v[VERSION] using Context7.

Template location: templates/stacks/[STACK_NAME]/CODEBASE_ESSENTIALS.md

Check:
1. Have core patterns become obsolete?
2. Are there new best practices we should add?
3. Do code examples work with current version?
4. Any breaking changes in this framework version?
5. Are imports and APIs still valid?

Query Context7 for [LIBRARY_ID]:
- Topic: [Specific pattern to validate]

Examples:
- /vercel/next.js/v15.1.11 for Next.js templates
- /vuejs/core/v3.6.0 for Vue templates
- /fastapi/fastapi for FastAPI templates

Report specific line numbers for any issues found.
```

**Stack-specific Context7 queries:**

```
# Next.js template
Query Context7 for /vercel/next.js/v15.1.11: "App Router middleware patterns"
Query Context7 for /vercel/next.js/v15.1.11: "async headers and cookies"
Query Context7 for /vercel/next.js/v15.1.11: "server actions best practices"

# Vue template
Query Context7 for /vuejs/core/v3.6.0: "Composition API patterns"
Query Context7 for /vuejs/core/v3.6.0: "reactivity fundamentals"
Query Context7 for /vuejs/core/v3.6.0: "script setup syntax"

# FastAPI template
Query Context7 for /fastapi/fastapi: "Pydantic v2 validation"
Query Context7 for /fastapi/fastapi: "async database patterns"
Query Context7 for /fastapi/fastapi: "dependency injection"

# Express template
Query Context7 for /expressjs/express: "middleware patterns"
Query Context7 for /expressjs/express: "error handling best practices"
```

### Step 4: Documentation Review

**For main documentation files:**

```
Review [DOCUMENTATION_FILE] for outdated information.

Check:
1. Are version numbers current?
2. Do external links still work?
3. Are CLI examples accurate?
4. Any new features to document?
5. Are installation instructions up-to-date?

Use Context7 for external tool references:
- npm commands and syntax
- git workflow patterns
- VS Code extension APIs

Report any stale content with specific line numbers.
```

**Documentation-specific queries:**

```
# For README.md, SETUP_GUIDE.md
Query Context7 for /npm/docs: "package.json scripts best practices"
Query Context7 for /git/docs: "git hooks setup"

# For VSCode hooks guide
Query Context7 for /microsoft/vscode: "extension API for hooks"
```

### Step 5: Generate Review Report

**Compile findings into structured report:**

```markdown
## Deliverables Review - [Month Year]

**Date:** [YYYY-MM-DD]
**Context7 Version:** [from config]

### Skills Reviewed (X/7)
- ✅ code-refactoring - Current
- ⚠️ dependency-updates - Updated npm audit syntax (line 45)
- 🔴 tdd-workflow - Breaking change in test runner API (line 120-135)

### Stacks Reviewed (X/6)
- ⚠️ nextjs - Updated async headers/cookies (added section at line 230)
- ✅ vue-vite - Current
- 🔴 fastapi - Pydantic v2 migration needed (affects lines 150-200)

### Documentation Reviewed (X/5)
- ✅ README.md - Current
- ⚠️ SETUP_GUIDE.md - Updated npm version requirement (line 12)

### Changes Made
- [List specific files and changes]

### Key Learnings
- [Framework insights discovered during review]

### Recommendations
- [Suggested improvements for next review]
```

## AI Prompt Templates

### Template 1: Comprehensive Skill Validation

```
I need to validate our [SKILL_NAME] skill against current best practices.

Context7 Setup:
- Available: [Yes/No]
- Library to query: [LIBRARY_ID]

Task:
1. Read .github/skills/[SKILL_NAME]/SKILL.md
2. Query Context7 for [LIBRARY_ID]: "[specific topic]"
3. Compare skill content with Context7 results
4. Identify:
   - Outdated patterns (with line numbers)
   - Missing best practices
   - Deprecated APIs or commands
   - Version mismatches

Output format:
- ✅ Current sections (list)
- ⚠️ Minor updates needed (section, line, change)
- 🔴 Major updates needed (section, line, reasoning)
```

### Template 2: Stack Template Deep Dive

```
I need to deep-dive validate our [STACK_NAME] template.

Framework: [FRAMEWORK] v[VERSION]
Template: templates/stacks/[STACK_NAME]/CODEBASE_ESSENTIALS.md

Context7 queries needed:
1. Query /[LIBRARY_ID]: "core patterns for [use case]"
2. Query /[LIBRARY_ID]: "breaking changes in v[VERSION]"
3. Query /[LIBRARY_ID]: "best practices for [feature]"

For each pattern in the template:
1. Validate against Context7 results
2. Check if imports/APIs still work
3. Verify examples are idiomatic
4. Note any deprecation warnings

Provide specific file locations and suggested changes.
```

### Template 3: Quick Validation Check

```
Quick validation check for [FILE_NAME]:

1. Read file content
2. Extract framework/tool references
3. Query Context7 for each reference
4. Report: Current ✅ or Needs Update ⚠️

Format:
- Reference: [name/version]
- Status: [✅/⚠️]
- Action: [none/update to X/rewrite section]
```

## Context7 Library ID Reference

**Common libraries for AIKnowSys deliverables:**

| Framework/Tool | Library ID | Use For |
|----------------|-----------|---------|
| Next.js | `/vercel/next.js` or `/vercel/next.js/v15.x` | Next.js templates, React patterns |
| Vue | `/vuejs/core` | Vue templates, Composition API |
| React | `/facebook/react` | React-specific skills |
| Express | `/expressjs/express` | Express API templates |
| FastAPI | `/fastapi/fastapi` | FastAPI templates, Pydantic |
| Vite | `/vitejs/vite` | Build tool patterns |
| Vitest | `/vitest-dev/vitest` | Testing patterns |
| npm | `/npm/docs` | Package management |
| Supabase | `/supabase/supabase` | Database patterns |
| Tailwind | `/tailwindlabs/tailwindcss` | CSS patterns |

**Finding library IDs:**
```
Ask AI: "Query Context7 to resolve library ID for [framework name]"
```

## Common Validation Patterns

### Pattern 1: Version Compatibility Check

```
Check if our [FRAMEWORK] template works with v[VERSION]:

1. Query Context7 for /[LIBRARY_ID]/v[VERSION]: "breaking changes"
2. Compare breaking changes with template patterns
3. Test each pattern mentioned in breaking changes
4. Update template if incompatible
```

### Pattern 2: API Deprecation Check

```
Check for deprecated APIs in [FILE]:

1. Extract all API calls from file
2. For each API: Query Context7 for /[LIBRARY_ID]: "[API name] deprecation"
3. If deprecated, find replacement API
4. Update file with modern API + comment explaining change
```

### Pattern 3: Best Practice Alignment

```
Align [PATTERN] with current best practices:

1. Query Context7 for /[LIBRARY_ID]: "[pattern] best practices"
2. Compare our implementation with Context7 results
3. If divergence found:
   - Evaluate: Is our way still valid?
   - If outdated: Update to current best practice
   - If intentional: Add comment explaining why
```

## Tips for Effective Reviews

### DO:
- ✅ Query Context7 with specific, focused questions
- ✅ Include version numbers when available
- ✅ Compare patterns, not just syntax
- ✅ Document why changes are needed
- ✅ Test updated patterns when possible

### DON'T:
- ❌ Trust Context7 blindly (verify critical changes)
- ❌ Make changes without understanding the reason
- ❌ Skip validation after updates
- ❌ Forget to update related files (skills + templates often linked)

## Troubleshooting

**Context7 not responding:**
- Check MCP server configuration
- Restart AI client (Claude Desktop/Cursor)
- Verify library ID is correct (use resolve-library-id first)

**Conflicting information:**
- Query multiple sections of same documentation
- Check official migration guides
- Cross-reference with framework changelog

**Uncertain about change:**
- Create test project with new pattern
- Ask for code review from community
- Document uncertainty in review notes

---

## Related Resources

- [Context7 Review Checklist](../../docs/context7-review-checklist.md) - Step-by-step process
- [PLAN_deliverables_review.md](../../.aiknowsys/PLAN_deliverables_review.md) - Example execution
- [Context7 MCP Documentation](https://github.com/context-7/context7) - Setup guide

---

*Part of AIKnowSys Context7 integration. Use for maintaining quality as frameworks evolve.*
