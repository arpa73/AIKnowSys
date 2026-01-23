# GitHub Copilot Agent Skills

This directory contains custom Agent Skills for the gnwebsite project. Skills are specialized capabilities that GitHub Copilot loads on-demand when relevant to your request.

## What are Agent Skills?

Agent Skills are folders containing instructions, scripts, and resources that teach Copilot specialized workflows. Unlike custom instructions that always apply, skills load only when needed, keeping your context efficient.

**Key benefits:**
- 🎯 **Specialized**: Domain-specific knowledge for complex tasks
- 🔄 **Reusable**: Create once, use automatically across conversations
- 📦 **Portable**: Works in VS Code, Copilot CLI, and Copilot coding agent
- ⚡ **Efficient**: Progressive loading - only relevant content loads

## Enable Skills in VS Code

⚠️ Skills are currently in preview. Enable them:

1. Open VS Code Settings (`Cmd/Ctrl + ,`)
2. Search for: `chat.useAgentSkills`
3. Check the box to enable

Or add to `settings.json`:
```json
{
  "chat.useAgentSkills": true
}
```

## Available Skills

### 🛠️ skill-creator
**Purpose**: Create new skills from project guides and documentation

**Use when:**
- "Create a skill for [topic]"
- "Turn this guide into a skill"
- "Make a reusable skill from [documentation]"

**What it does:**
Helps convert existing guides from `docs/` into portable Agent Skills following VS Code standards. Includes templates, naming conventions, and quality guidelines.

### 🔧 code-refactoring
**Purpose**: Safe code refactoring workflow for gnwebsite project

**Use when:**
- "Refactor this component"
- "Clean up this code"
- "Remove duplication"
- "Simplify this function"

### 🎨 frontend-component-refactoring
**Purpose**: Refactor Vue frontend following KISS/DRY principles with component architecture

**Use when:**
- "Too much HTML/CSS duplication"
- "Inconsistent UI/UX across pages"
- "Create more Vue components"
- "Separate public and admin themes"
- "Apply KISS/DRY to frontend"
- "Design system consistency"

**What it does:**
Systematic guide for eliminating duplication and establishing consistent UX through proper component organization (Base/Public/Admin), theme separation, and CSS variable usage. Addresses code maintenance and reusability.

**What it does:**
Guides test-driven refactoring with incremental changes, extract function/composable patterns, and rollback procedures. Ensures refactoring preserves behavior while improving code quality.

### ✅ developer-checklist
**Purpose**: Pre-commit and pre-push validation checklist

**Use when:**
- "What should I check before committing?"
- "Pre-commit checklist"
- "Before creating a PR"
- Implementing features or writing tests

**What it does:**
Ensures backend Django tests pass, frontend Vitest tests pass, TypeScript validates, and code follows project patterns. Includes API contract alignment and test troubleshooting.

### 🚀 feature-implementation
**Purpose**: Step-by-step guide for implementing new features

**Use when:**
- "Create a new feature"
- "Add a new model/endpoint"
- "Implement an API"
- "Add UI component"

**What it does:**
Covers API-first development, OpenAPI schema sync, test-driven workflow, and when to create OpenSpec proposals vs direct implementation. Ensures proper backend→frontend workflow.

### 📦 dependency-updates
**Purpose**: Safe dependency update workflow for backend and frontend

**Use when:**
- "Update dependencies"
- "Upgrade packages"
- "Fix vulnerabilities"
- "Check for security updates"

**What it does:**
Covers backend Python (pyproject.toml) and frontend npm packages, vulnerability audits, testing requirements, and rollback procedures. Ensures updates maintain compatibility and don't break functionality.

### 📚 documentation-management
**Purpose**: Maintain AI-optimized documentation and organize codebase history

**Use when:**
- "Update documentation"
- "Organize the changelog"
- "Archive old sessions"
- "Make docs more readable for AI"
- Changelog exceeds 1500 lines

**What it does:**
Covers changelog archiving, AI-friendly writing patterns (from kapa.ai best practices), semantic structure, self-contained sections, and knowledge retrieval optimization. Ensures documentation stays readable and discoverable for both humans and AI systems.

## How Skills Work

Skills use **progressive disclosure** with 3 levels:

1. **Discovery**: Copilot always knows skill names and descriptions (lightweight)
2. **Instructions**: Body loads when description matches your request
3. **Resources**: Additional files load only when referenced

This means you can have many skills without consuming context!

## Skill Structure

```
.github/skills/
├── skill-name/
│   ├── SKILL.md          # Required: metadata + instructions
│   ├── template.md       # Optional: example templates
│   ├── scripts/          # Optional: helper scripts
│   └── examples/         # Optional: example files
```

### SKILL.md Format

```markdown
---
name: skill-name
description: What it does and when to use it (max 1024 chars)
---

# Skill Title

Detailed instructions, examples, and guidelines...
```

## Creating New Skills

Use the `skill-creator` skill:

1. In Copilot Chat: "Create a skill for the testing strategy guide"
2. Copilot will use skill-creator to convert guides into skills
3. Review and customize the generated skill

Or manually:
1. Create directory: `.github/skills/your-skill-name/`
2. Create `SKILL.md` with frontmatter + body
3. Add supporting files if needed
4. Reference from: [template](./skill-creator/template.md)

## Skill Naming Conventions

- **Lowercase with hyphens**: `testing-strategy`, not `Testing_Strategy`
- **Specific, not generic**: `django-api-development`, not `backend`
- **Domain-included**: `frontend-testing`, not just `testing`
- **Max 64 characters**

## Description Best Practices

✅ **Good** (specific capabilities + use cases):
```
description: Guide Django REST Framework API development following project patterns. Use when creating views, serializers, viewsets, or implementing filters, pagination, authentication. Includes testing requirements and common pitfalls.
```

❌ **Bad** (too vague):
```
description: Helps with backend development
```

## Skill Ideas from Our Guides

Convert these guides into skills:

- [ ] `docs/guides/TESTING_STRATEGY.md` → `testing-strategy`
- [ ] `docs/guides/DEVELOPER_CHECKLIST.md` → `pre-commit-checklist`
- [ ] `docs/patterns/NEW_FEATURE_GUIDE.md` → `feature-implementation`
- [ ] `docs/guides/API_DEVELOPMENT.md` → `api-development` (if exists)
- [ ] `CODEBASE_ESSENTIALS.md` → `codebase-patterns`
- [ ] `docs/deployment/` → `deployment-guide`

## Sharing Skills

Skills follow the [agentskills.io](https://agentskills.io/) open standard, making them portable across:
- GitHub Copilot in VS Code
- GitHub Copilot CLI
- GitHub Copilot coding agent
- Other skills-compatible AI agents

You can share skills with the community:
- [github/awesome-copilot](https://github.com/github/awesome-copilot)
- [anthropics/skills](https://github.com/anthropics/skills)

## Troubleshooting

**Skill not loading?**
- Check description is specific about use cases
- Verify `chat.useAgentSkills` is enabled
- Restart VS Code after creating new skills

**Wrong skill loading?**
- Make descriptions more specific
- Use clear trigger phrases in description
- Avoid overlap between skill descriptions

**Skill format errors?**
- Ensure YAML frontmatter is valid
- Check `name` is lowercase with hyphens
- Verify `description` is under 1024 chars

## Resources

- [VS Code Agent Skills Docs](https://code.visualstudio.com/docs/copilot/customization/agent-skills)
- [Agent Skills Standard](https://agentskills.io/)
- [Example Skills](https://github.com/anthropics/skills)
- [Awesome Copilot](https://github.com/github/awesome-copilot)

---

**Pro tip**: Start by using `skill-creator` to convert your most-used guides into skills!
