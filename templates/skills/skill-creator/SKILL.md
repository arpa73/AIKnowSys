---
name: skill-creator
description: Create new Agent Skills from existing project guides and documentation. Use when the user wants to create a skill, turn documentation into a skill, or make a guide into a reusable capability. Converts guides from docs/ into portable .github/skills/ format following VS Code Agent Skills standard.
---

# Skill Creator - Turn Guides into Agent Skills

This skill helps you create new Agent Skills from existing project documentation, making specialized knowledge reusable and portable across GitHub Copilot, Copilot CLI, and Copilot coding agent.

## When to Use This Skill

Use this skill when:
- User asks to "create a skill" or "make a skill"
- User wants to convert a guide/doc into a reusable capability
- User mentions making documentation more accessible to Copilot
- User wants to teach Copilot a specialized workflow from project docs

## Agent Skills Format

Skills are stored in `.github/skills/<skill-name>/SKILL.md` with this structure:

```markdown
---
name: skill-name
description: What the skill does and when to use it (max 1024 chars)
---

# Skill Title

Detailed instructions, guidelines, and examples...
```

### Required YAML Frontmatter

- **name**: Lowercase, hyphens for spaces, max 64 chars (e.g., `testing-strategy`)
- **description**: Specific about capabilities AND use cases to help Copilot decide when to load the skill (max 1024 chars)

### Body Content Should Include

1. **What** the skill helps accomplish
2. **When** to use the skill (specific triggers)
3. **Step-by-step** procedures
4. **Examples** of input/output
5. **References** to included scripts/resources (if any)

## How to Create a Skill

### Step 1: Identify Source Material

Look for guides in:
- `docs/guides/` - Developer guides and workflows
- `docs/planning/` - Planning documents and decision records
- `docs/patterns/` - Reusable patterns and best practices
- `CODEBASE_ESSENTIALS.md` - Core patterns and invariants
- `CONTRIBUTING.md` - Contribution guidelines
- Project root `.md` files - Key documentation

### Step 2: Extract Key Information

From the source document, identify:
- **Core purpose**: What specialized task does this teach?
- **Trigger phrases**: What would a user say to need this skill?
- **Essential steps**: What are the must-follow procedures?
- **Common pitfalls**: What mistakes should be avoided?
- **Examples**: What are concrete use cases?

### Step 3: Craft the Description

Write a description that includes:
1. What the skill does (capabilities)
2. When to use it (use cases and triggers)
3. Be specific - vague descriptions won't load at the right time

**Good example:**
```
description: Guide Django REST Framework API development following project patterns. Use when creating views, serializers, viewsets, or implementing filters, pagination, authentication. Includes testing requirements and common pitfalls from DEVELOPER_CHECKLIST.md.
```

**Bad example:**
```
description: Helps with backend development
```

### Step 4: Structure the Body

Organize content with clear sections:

```markdown
# Skill Title

Brief overview of what this skill teaches.

## When to Use This Skill

- Specific scenario 1
- Specific scenario 2
- Keywords that trigger this skill

## Core Principles

Key concepts to always follow...

## Step-by-Step Guide

1. First step with details
2. Second step with examples
3. Third step with common mistakes to avoid

## Examples

### Example 1: [Scenario]
```
Code or procedure example
```

### Example 2: [Scenario]
```
Another example
```

## Common Pitfalls

- ❌ Don't do this: explanation
- ✅ Do this instead: explanation

## Related Files

Reference project files when relevant:
- [Pattern documentation](../../../docs/patterns/example.md)
- [Test examples](../../../backend/tests/example.py)

## Checklist

- [ ] Key requirement 1
- [ ] Key requirement 2
```

### Step 5: Create the Skill Directory

1. Create directory: `.github/skills/<skill-name>/`
2. Create file: `SKILL.md` with frontmatter + body
3. Add supporting files if needed (examples, scripts, templates)

## Naming Conventions

### Skill Names (YAML `name` field)
- Use lowercase with hyphens: `testing-strategy`, `api-design`, `frontend-patterns`
- Be specific: `django-api-development` not just `api`
- Include domain: `backend-testing`, `frontend-testing` (not just `testing`)
- Max 64 characters

### Directory Names
Match the skill name: `.github/skills/testing-strategy/`

## Example Transformations

### From Developer Checklist to Skill

**Source**: `docs/guides/DEVELOPER_CHECKLIST.md`
**Skill name**: `pre-commit-checklist`
**Description**: Pre-commit validation checklist for gnwebsite project. Use before committing code, creating PRs, or when user asks about testing requirements. Ensures API tests pass, frontend tests pass, types validate, and code follows project patterns.

### From Testing Guide to Skill

**Source**: `docs/guides/TESTING_STRATEGY.md`
**Skill name**: `testing-strategy`
**Description**: Guide for writing tests in gnwebsite fullstack Django/Vue application. Use when writing tests, debugging test failures, or implementing new features. Covers backend Django tests, frontend Vitest tests, integration tests, and test-driven development workflow.

### From Pattern Doc to Skill

**Source**: `docs/patterns/NEW_FEATURE_GUIDE.md`
**Skill name**: `feature-implementation`
**Description**: Step-by-step guide for implementing new features in gnwebsite. Use when planning features, making API changes, or adding frontend components. Covers API-first development, OpenAPI schema updates, testing requirements, and knowledge system updates.

## Progressive Disclosure

Remember Agent Skills use 3-level loading:
1. **Level 1**: Name + description always loaded (lightweight metadata)
2. **Level 2**: SKILL.md body loaded when description matches request
3. **Level 3**: Supporting files loaded only when referenced

This means:
- Keep descriptions specific so Copilot loads the right skill
- Put detailed instructions in the body
- Reference large examples/scripts as separate files

## Quality Checklist

Before finalizing a skill:

- [ ] Name is lowercase with hyphens, max 64 chars
- [ ] Description is specific about BOTH capabilities AND use cases
- [ ] Description mentions trigger phrases users might say
- [ ] Description is under 1024 characters
- [ ] Body has clear sections with examples
- [ ] References to project files use relative paths
- [ ] Common pitfalls are documented
- [ ] Examples show expected input/output
- [ ] No duplicate content from other skills

## Common Patterns in Our Project

When creating skills for this codebase, note:
- Backend is Django 5.2 + DRF
- Frontend is Vue 3 + TypeScript + Vite
- API uses OpenAPI/Spectacular for schema
- Testing uses pytest (backend) and Vitest (frontend)
- Knowledge system: CODEBASE_ESSENTIALS.md, CODEBASE_CHANGELOG.md
- Guides in: docs/guides/, docs/patterns/, docs/planning/

## Example: Creating a Skill Right Now

If asked to "create a skill for the testing strategy", do this:

1. Read `docs/guides/TESTING_STRATEGY.md`
2. Create `.github/skills/testing-strategy/SKILL.md`:

```markdown
---
name: testing-strategy
description: Guide for writing tests in gnwebsite fullstack Django/Vue application. Use when writing tests, debugging test failures, implementing features, or user asks about testing requirements. Covers Django pytest, Vitest, integration tests, mocking, and test-driven development patterns.
---

# Testing Strategy

This skill teaches the testing patterns and requirements for gnwebsite...

[Extract and structure key content from TESTING_STRATEGY.md]
```

## Anti-Patterns to Avoid

❌ **Don't**:
- Create overly broad skills ("development" or "coding")
- Write vague descriptions ("helps with testing")
- Duplicate content across multiple skills
- Include outdated information from guides
- Reference files that don't exist

✅ **Do**:
- Create focused, specific skills
- Write descriptions with clear triggers
- Extract unique, essential knowledge
- Keep content current with source guides
- Verify all file references work

## Related Resources

- [Agent Skills standard](https://agentskills.io/)
- [VS Code Agent Skills docs](https://code.visualstudio.com/docs/copilot/customization/agent-skills)
- [GitHub awesome-copilot](https://github.com/github/awesome-copilot)
- [Anthropic skills repo](https://github.com/anthropics/skills)
