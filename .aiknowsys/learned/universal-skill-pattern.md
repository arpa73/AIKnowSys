# Universal Skill Pattern

**Type:** skill-creation-pattern  
**Created:** 2026-02-03  
**Discovered During:** Skill Audit Cleanup - Universal Rewrites

## Trigger Words
- "make skill universal"
- "framework-agnostic skill"
- "multi-language examples"
- "rewrite for all languages"
- "tech-stack independent"

## Context

When refactoring existing project-specific skills or creating new universal skills, follow this pattern to maximize reusability across different technology stacks.

**Example Scenario:** code-refactoring skill had 425 uses in 3 days, but was Django/Vue-specific. Rewriting to universal refactoring-workflow made it usable for Python/FastAPI, JavaScript/React, Rust/Actix, Go, etc.

## Pattern

### 1. Identify Core Workflow (Language-Agnostic)

Extract the **fundamental process** that works regardless of technology:

- ❌ "Update Django model field"
- ✅ "Modify data model attribute"

- ❌ "Refactor Vue component props"
- ✅ "Extract function parameters"

- ❌ "Update package.json dependencies"
- ✅ "Update project dependencies"

**Principle:** Focus on WHAT (the workflow) not HOW (the tool).

### 2. Provide Multi-Language Examples

**Minimum:** 3 languages covering different paradigms
- **Interpreted + popular:** Python, JavaScript/TypeScript
- **Compiled + modern:** Rust, Go
- **Optional extras:** Ruby, Java, C#, PHP

**Example structure:**
```markdown
## Extract Function

### TypeScript
[code example]

### Python
[code example]

### Rust
[code example]

### Go
[code example]
```

**Why this works:**
- Developers recognize patterns in their preferred language
- Shows the workflow is truly universal
- Increases skill adoption rate

### 3. Use Generic Terminology

**Framework-specific → Universal mapping:**

| Avoid (Specific) | Use (Generic) |
|------------------|---------------|
| Django model | Backend model, Data model |
| Vue component | UI component, Frontend component |
| pyproject.toml | Dependency manifest |
| npm install | Package installation |
| pytest | Test runner |
| Vitest | Test framework |

### 4. Test-Driven Validation (Universal)

Test workflows work across ALL languages:

**Universal pattern:**
```markdown
1. Run tests BEFORE refactoring
2. Make ONE incremental change
3. Run tests AFTER change
4. Tests must pass
5. Commit if green
6. Repeat
```

**Language-specific commands:**
- TypeScript: `npm test`
- Python: `pytest` or `python -m unittest`
- Rust: `cargo test`
- Go: `go test ./...`
- Ruby: `bundle exec rspec`

**Key:** The WORKFLOW is identical, only commands differ.

### 5. Structure Template

```markdown
# [Skill Name]

## When to Use This Skill
[Framework-agnostic scenarios]

## Core Principles
[Language-independent concepts]

## Prerequisites
[Universal requirements]

## Workflow

### Step 1: [Action]
[Generic description]

**Examples:**

#### TypeScript
[Code example]

#### Python
[Code example]

#### Rust
[Code example]

### Step 2: [Next Action]
[Continue pattern...]

## Common Scenarios
[Framework-agnostic use cases]

## Troubleshooting
[Universal debugging strategies]

## Related Skills
[Cross-references]
```

## Examples from Skill Audit

### refactoring-workflow (674 lines)

**Original:** code-refactoring (Django/Vue-specific, 88 lines)
**Rewritten:** refactoring-workflow (framework-agnostic, 674 lines)

**Key improvements:**
- Extract function examples: TypeScript, Python, Rust, Go, C#
- Test-driven refactoring workflow (universal)
- Incremental change pattern (works for any codebase)
- Emergency rollback procedures (git-based, language-agnostic)

**Usage impact:** Preserved 425 uses while expanding to ALL languages

### ai-friendly-documentation (626 lines)

**Original:** documentation-management (gnwebsite-specific, 112 lines)
**Rewritten:** ai-friendly-documentation (framework-agnostic, 626 lines)

**Key improvements:**
- RAG principles (Retrieval-Augmented Generation) explained
- Self-contained sections pattern (works for Python, JS, Rust docs)
- Changelog archiving (language-agnostic file size trigger)
- Semantic structure (applies to README, API docs, guides in any language)

**Examples:** Python docstrings, JSDoc, Rust doc comments, Go doc comments

### dependency-management (483 lines)

**Original:** dependency-updates (npm/pip-specific, 95 lines)
**Rewritten:** dependency-management (framework-agnostic, 483 lines)

**Key improvements:**
- Security-first approach (CVE scanning, not tool-specific)
- Incremental update strategy (prod → dev → tooling)
- Semantic versioning risk assessment (patch/minor/major)
- Examples: npm, pip, cargo, go mod, bundler, composer

**Universal workflow:** Check → Update → Test → Rollback (same for ALL package managers)

## Benefits

1. **Higher Reuse Value**
   - 425 uses of code-refactoring proves demand exists
   - Multi-language examples = works for more projects
   - Framework-agnostic = longer shelf life

2. **Easier Onboarding**
   - Developers recognize familiar patterns
   - No mental translation from Django to FastAPI needed
   - Examples in their language = instant understanding

3. **Sustainable Maintenance**
   - Less skill fragmentation (1 universal vs 5 framework-specific)
   - Updates apply to all users
   - No need to maintain Django, Vue, React, Angular versions separately

4. **Broader Adoption**
   - AIKnowSys becomes polyglot-friendly
   - Not locked to specific tech stack
   - Works for greenfield and legacy projects

## Anti-Patterns

**❌ Don't:**
- Assume specific build tools (Vite, Webpack, etc.)
- Reference framework-specific file structures (pyproject.toml only)
- Use library-specific terminology without explanation
- Provide only one language example
- Mix framework-specific and universal content

**✅ Do:**
- Explain core concepts in plain language
- Show commands for 3+ package managers
- Use "backend/frontend" instead of "Django/Vue"
- Provide minimal working examples
- Keep examples focused on the pattern, not the framework

## Validation Checklist

Before publishing a universal skill:

- [ ] **No framework assumptions** in descriptions
- [ ] **3+ language examples** provided
- [ ] **Generic terminology** used throughout
- [ ] **Test workflow** applicable to any language
- [ ] **Common scenarios** don't reference specific frameworks
- [ ] **Troubleshooting** covers language-agnostic issues
- [ ] **Related skills** cross-referenced

## Related Patterns

- **skill-creator** - How to create skills following VS Code Agent Skills format
- **ai-friendly-documentation** - RAG principles for skill content
- **feature-implementation** - Universal feature planning (not tech-specific)

## Metrics

**Skill Audit Results:**
- 3 skills rewritten to universal
- 674 + 626 + 483 = 1,783 total lines created
- 425 uses preserved (code-refactoring)
- 0 framework-specific references in final skills
- 594 tests passing (validation successful)

**Key Learning:** High-value patterns transcend tech stacks. Usage data (skill-usage.json) drives preservation decisions.

---

*Part of AIKnowSys learned patterns. Created during v0.9.0 skill audit cleanup.*
