<!-- 
DELIVERABLE TEMPLATE - DO NOT MODIFY DURING NORMAL DEVELOPMENT

This file is distributed to users via `npx <your-cli> init`.
Template maintenance requires: Plan → Tests → Implementation → Review → Migration Guide

See: ../.github/skills/template-maintenance/ (or similar) for workflow
-->

# {{PROJECT_NAME}} - Codebase Essentials

> **Last Updated:** {{CURRENT_DATE}}  
> **Purpose:** {{PROJECT_PURPOSE}}  
> **Stack:** {{PRIMARY_STACK}}

---

## Knowledge System: Document Roles

This project uses AI-assisted development with structured knowledge files:

```
CODEBASE_ESSENTIALS.md  ←  What the codebase IS (architecture, patterns, rules)
AGENTS.md               ←  How AI should WORK (workflow, validation, skills)
CODEBASE_CHANGELOG.md   ←  What HAPPENED (session history, decisions, learnings)
```

**Skill-Indexed Architecture:**
- **Critical invariants** are ALWAYS loaded (mandatory rules)
- **Detailed workflows** load on-demand from [.github/skills/](.github/skills/)
- **Result:** 70-80% token reduction vs monolithic docs

---

## 1. Technology Snapshot

| Component | Technology |
|-----------|------------|
| Runtime | {{RUNTIME}} |
| Language | {{LANGUAGE}} |
| Framework | {{FRAMEWORK}} |
| Database | {{DATABASE}} |
| ORM | {{ORM}} |
| Test Framework | {{TEST_FRAMEWORK}} |
| Package Manager | {{PACKAGE_MANAGER}} |

**Additional Libraries:**
{{ADDITIONAL_LIBRARIES}}

---

## 2. Validation Matrix

| Command | Purpose | Expected |
|---------|---------|----------|
| `{{TEST_COMMAND}}` | Run tests | All {{TEST_COUNT}}+ tests pass |
| `{{LINT_COMMAND}}` | Lint code | No errors or warnings |
| `{{BUILD_COMMAND}}` | Build/compile | Clean build |
| `{{TYPE_CHECK_COMMAND}}` | Type check | No type errors |
| `{{FORMAT_COMMAND}}` | Format check | No formatting issues |

**Before claiming work complete:**
- [ ] All commands above pass
- [ ] No errors in output
- [ ] Changes tested locally

---

## 3. Project Structure

```
{{PROJECT_NAME}}/
{{PROJECT_STRUCTURE}}
```

**Common Patterns:**
{{COMMON_PATTERNS}}

---

## 4. Critical Invariants (ALWAYS ENFORCED - NOT OPTIONAL)

These 5 rules are MANDATORY. AI agents cannot skip or "think they know" these.

### 1. Test-Driven Development (TDD) - MANDATORY
- **For new features:** Write tests BEFORE implementation (RED → GREEN → REFACTOR)
- **For bugfixes:** Write test that reproduces bug FIRST, then fix
- Follow RED-GREEN-REFACTOR cycle for both features and bugs
- **Exception:** Configuration-only changes (adding properties to const objects)

### 2. Graceful Failures
- Handle missing files/directories gracefully
- Show helpful error messages, not stack traces
- Provide actionable guidance in errors
- Log errors appropriately

### 3. Documentation as Code
- Update docs when code changes
- Keep README.md current with features
- Document architectural decisions
- Maintain changelog with changes

### 4. Code Quality Standards
- Follow language/framework conventions
- Pass all linters and formatters
- Maintain test coverage >80%
- Review code before merging

### 5. Backwards Compatibility
- Use semantic versioning for breaking changes
- Provide deprecation warnings before removal
- Write migration guides for major versions
- Test upgrades work smoothly

---

## 5. Skill Index (Auto-Load on Trigger Detection)

**How this works:**
1. AI agent detects trigger words in user request
2. AI loads relevant skill/workflow from [`.github/skills/`](.github/skills/)
3. AI follows workflow step-by-step (prevents "I thought I knew" failures)

**Why this prevents mistakes:**
- Critical invariants ALWAYS loaded (above section)
- Detailed workflows loaded ON-DEMAND
- 70-80% token reduction vs monolithic documentation

---

### Universal Skills (Framework-Agnostic)

These skills work for ANY project type (Python, JavaScript, Rust, Go, etc.):

#### Development Workflows
- **tdd-workflow** - Test-driven development (RED-GREEN-REFACTOR cycle)
- **refactoring-workflow** - Safe code improvements with tests
- **validation-troubleshooting** - Debug test/build failures

#### Code Quality
- **ai-friendly-documentation** - AI-optimized docs for RAG systems
- **dependency-management** - Safe package upgrades

#### Architecture & Planning
- **feature-implementation** - Structured feature planning

---

### Project-Specific Skills

{{PROJECT_SKILLS}}

**Add your own skills:** Create `.github/skills/<skill-name>/SKILL.md` following the skill-creator pattern.

---

## 6. Quick Reference

### Validation Checklist
```bash
{{TEST_COMMAND}}      # All tests pass
{{LINT_COMMAND}}      # No errors
{{BUILD_COMMAND}}     # Clean build
{{FORMAT_COMMAND}}    # Code formatted
```

### Common Patterns

{{COMMON_PATTERNS_SECTION}}

---

## 7. When to Document Where

**Add to CODEBASE_ESSENTIALS.md when:**
- Core architecture decisions (technology choices)
- Critical invariants (cannot be violated)
- Project structure changes

**Add to .github/skills/ when:**
- Repeatable workflows (testing, deployment, refactoring)
- Multi-step processes requiring guidance
- Patterns that prevent common mistakes

**Add to project changelog when:**
- Features added or removed
- Breaking changes
- Bug fixes
- Performance improvements

---

**Target:** ESSENTIALS <400 lines  
**Full workflows:** Load from [.github/skills/](.github/skills/) on-demand

