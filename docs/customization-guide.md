# Customization Guide - Adapting the Knowledge System

**Purpose:** Step-by-step instructions for customizing the knowledge system template for your specific project, tech stack, and workflow.

---

## Overview: What Needs Customization

The knowledge system template includes **placeholders** that you must fill in based on your project:

| Component | What to Customize | Effort |
|-----------|-------------------|--------|
| **CODEBASE_ESSENTIALS** | Tech stack, validation commands, patterns | High (2-4 hours) |
| **AGENTS.md** | Validation matrix, skill mapping | Medium (1-2 hours) |
| **Skills** | Package manager, test framework, syntax | Low (30 min/skill) |
| **Custom Agents** | Project name, paths | Low (15 min) |
| **Examples** | Optional - use as reference | None |

---

## Before You Start

### Prerequisites

- [ ] Project repository exists (even if empty)
- [ ] Tech stack decided (language, framework, database)
- [ ] Basic development environment set up
- [ ] Git initialized

### Decision Points

**1. Starting from scratch or migrating existing project?**
- **New project:** Use `scripts/setup.sh` (interactive prompts)
- **Existing project:** Use `scripts/migrate-existing.sh` (auto-detection)

**2. What's your primary tech stack?**
- Determines which validation commands to use
- Affects skill customization (npm vs pip vs cargo)
- Influences example patterns to follow

**3. What's your team size?**
- Solo: Simpler workflow, fewer skills needed
- Team: More emphasis on consistency, detailed patterns
- Open source: Extra focus on contributor onboarding

---

## Installation: Two Paths

### Path A: New Project (Interactive Setup)

**When to use:** Starting a greenfield project.

```bash
# 1. Clone or download aiknowsys
git clone https://github.com/your-org/aiknowsys.git

# 2. Copy template files to your project
cp -r aiknowsys/templates/* /path/to/your/project/
cp -r aiknowsys/scripts /path/to/your/project/
cp -r aiknowsys/.github /path/to/your/project/

# 3. Run interactive setup
cd /path/to/your/project
bash scripts/setup.sh
```

**What setup.sh does:**
1. Detects existing code (if any)
2. Prompts for language (TypeScript/Python/Rust/Go/Other)
3. Prompts for framework (Vue/React/Django/Actix/etc.)
4. Prompts for test framework (Vitest/Jest/pytest/etc.)
5. Generates customized CODEBASE_ESSENTIALS.md
6. Generates customized AGENTS.md
7. Installs custom agents (Developer + Architect)
8. Installs universal skills
9. Customizes skills for your package manager

**Output:**
- `CODEBASE_ESSENTIALS.md` (ready to fill in patterns)
- `AGENTS.md` (workflow configured)
- `CODEBASE_CHANGELOG.md` (session template)
- `.github/agents/` (custom agents installed)
- `.github/skills/` (universal skills + customized dependency-updates)

### Path B: Existing Project (Scanner + Migration)

**When to use:** Adding knowledge system to established codebase.

```bash
# 1. Clone or download aiknowsys
git clone https://github.com/your-org/aiknowsys.git

# 2. Copy files to your project
cp -r aiknowsys/scripts /path/to/your/project/
cp -r aiknowsys/templates /path/to/your/project/

# 3. Run migration workflow
cd /path/to/your/project
bash scripts/migrate-existing.sh
```

**What migrate-existing.sh does:**
1. Scans your codebase (`package.json`, `pyproject.toml`, etc.)
2. Detects tech stack automatically
3. Discovers test commands from package.json/Makefile/CI
4. Generates **CODEBASE_ESSENTIALS.draft.md** (70% complete)
5. Prompts you to fill in missing sections
6. Installs agents and skills once confirmed

**Output:**
- `CODEBASE_ESSENTIALS.draft.md` (review and complete)
- `AGENTS.md` (workflow configured)
- `.github/agents/` (custom agents)
- `.github/skills/` (universal skills)
- Manual TODOs for patterns/invariants/gotchas

---

## Customization: Step-by-Step

### 1. CODEBASE_ESSENTIALS.md

This is your project's constitution. Fill in these sections:

#### A. Technology Stack

**Template:**
```markdown
## Technology Stack

**Frontend:**
- {{FRONTEND_FRAMEWORK}} {{VERSION}}
- {{LANGUAGE}} (strict mode)
- {{STYLING}} {{VERSION}}

**Backend:**
- {{BACKEND_FRAMEWORK}} {{VERSION}}
- {{LANGUAGE}} {{VERSION}}
- {{DATABASE}} {{VERSION}}
```

**Example (Django + Vue):**
```markdown
## Technology Stack

**Frontend:**
- Vue 3.4 (Composition API)
- TypeScript 5.3 (strict mode)
- Tailwind CSS 3.4

**Backend:**
- Django 4.2
- Python 3.11
- PostgreSQL 15
```

**Example (Rust):**
```markdown
## Technology Stack

**Backend:**
- Rust 1.75 (stable)
- Actix Web 4.4
- SQLx 0.7
- PostgreSQL 15
```

#### B. Validation Matrix

**Template:**
```markdown
## Validation Matrix

| Changed | Command | Expected Result |
|---------|---------|-----------------|
| {{FILE_TYPE}} | {{TEST_COMMAND}} | {{EXPECTED_OUTPUT}} |
| {{FILE_TYPE}} | {{LINT_COMMAND}} | {{EXPECTED_OUTPUT}} |
| {{FILE_TYPE}} | {{TYPE_CHECK_COMMAND}} | {{EXPECTED_OUTPUT}} |
```

**How to fill in:**

1. **Identify file types you change:**
   - Backend code (Python, Rust, Go)
   - Frontend code (TypeScript, JavaScript)
   - Database schemas (migrations)
   - Configuration files

2. **Find validation commands:**
   ```bash
   # Check package.json "scripts" section
   cat package.json | grep -A 5 '"scripts"'
   
   # Check Makefile
   grep "^test:" Makefile
   
   # Check CI config
   cat .github/workflows/*.yml | grep "run:"
   ```

3. **Test each command:**
   ```bash
   # Run command and note exact output
   npm run test:run
   # Expected: "X tests passed"
   
   cargo clippy -- -D warnings
   # Expected: "0 warnings"
   ```

**Example (Vue + Django):**
```markdown
## Validation Matrix

| Changed | Command | Expected Result |
|---------|---------|-----------------|
| **TypeScript** | `npm run type-check` | No errors |
| **Frontend Tests** | `npm run test:run` | All tests pass |
| **Backend Python** | `docker-compose exec backend pytest -x` | All tests pass |
| **Database** | `python manage.py migrate --check` | No unapplied migrations |
```

#### C. Core Patterns

**What to document:**
- How you structure components/modules
- How you handle authentication
- How you make API calls
- How you process images/files
- How you manage state

**Template:**
```markdown
## Core Patterns

### 1. {{PATTERN_NAME}}

**Pattern: {{SHORT_DESCRIPTION}}**

```{{LANGUAGE}}
{{CODE_EXAMPLE}}
```

**Why:**
- {{REASON_1}}
- {{REASON_2}}
- {{REASON_3}}
```

**Example (Vue Components):**
```markdown
## Core Patterns

### 1. Component Structure

**Pattern: Script Setup + Typed Props + Composables**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { Article } from '@/types'

interface Props {
  article: Article
}

const props = defineProps<Props>()
const title = computed(() => props.article.title)
</script>
```

**Why:**
- Script setup reduces boilerplate
- TypeScript provides compile-time safety
- Composables enable code reuse
```

**Pro tip:** Copy patterns from `examples/` that match your stack.

#### D. Critical Invariants

**What goes here:** Rules that MUST NEVER be violated.

**Template:**
```markdown
## Critical Invariants

### NEVER Violate These Rules

1. **{{INVARIANT_DESCRIPTION}}**
   ```{{LANGUAGE}}
   // ❌ BAD
   {{BAD_EXAMPLE}}
   
   // ✅ GOOD
   {{GOOD_EXAMPLE}}
   ```

2. **{{NEXT_INVARIANT}}**
   ...
```

**Example (Security):**
```markdown
## Critical Invariants

### NEVER Violate These Rules

1. **Never commit secrets to version control**
   ```bash
   # ❌ BAD
   DATABASE_URL=postgresql://user:password@localhost/db
   
   # ✅ GOOD - use .env file
   DATABASE_URL=${DATABASE_URL}  # From environment
   ```
   
   Add `.env` to `.gitignore`!

2. **Always validate permissions before mutations**
   ```python
   # ❌ BAD
   def delete_article(request, id):
       Article.objects.get(id=id).delete()
   
   # ✅ GOOD
   @permission_classes([IsAuthenticated])
   def delete_article(request, id):
       article = get_object_or_404(Article, id=id)
       if article.author != request.user:
           raise PermissionDenied
       article.delete()
   ```
```

**How to identify invariants:**
- What causes production bugs when violated?
- What security rules must always hold?
- What causes data corruption if wrong?

#### E. Common Gotchas

**What goes here:** Things that trip people up.

**Template:**
```markdown
## Common Gotchas

### 1. {{GOTCHA_TITLE}}

**Problem:** {{DESCRIPTION}}

**Solution:**
```{{LANGUAGE}}
{{FIX_CODE}}
```

**Why:** {{EXPLANATION}}
```

**Example (Testing):**
```markdown
## Common Gotchas

### 1. Vitest Hangs in CI

**Problem:** `npm test` hangs indefinitely in CI/CD pipelines.

**Solution:**
```json
// package.json
{
  "scripts": {
    "test": "vitest",           // For watch mode in dev
    "test:run": "vitest run"    // For CI/one-time runs
  }
}
```

Always use `npm run test:run` in scripts and CI.

**Why:** Vitest defaults to watch mode, which waits for file changes.
```

**How to identify gotchas:**
- Check Slack/Discord for repeated questions
- Review PR comments for common mistakes
- Ask: "What confused me when I started?"

### 2. AGENTS.md

This defines the AI workflow. Two sections need customization:

#### A. Validation Matrix Reference

Replace placeholders with your actual commands:

```markdown
**Validation Matrix (ALWAYS run after changes):**

| Changed | Command | Expected |
|---------|---------|----------|
| {{FILE_TYPE}} | {{COMMAND}} | {{EXPECTED}} |
```

**Example:**
```markdown
**Validation Matrix (ALWAYS run after changes):**

| Changed | Command | Expected |
|---------|---------|----------|
| **TypeScript** | `npm run type-check` | No errors |
| **Tests** | `npm run test:run` | All pass |
```

#### B. Skill Mapping

Map trigger words to your skills:

```markdown
| Trigger Words | Skill to Read | Why |
|---------------|---------------|-----|
| "{{TRIGGER}}" | `@/.github/skills/{{SKILL}}/SKILL.md` | {{REASON}} |
```

**Example:**
```markdown
| Trigger Words | Skill to Read | Why |
|---------------|---------------|-----|
| "add feature", "new endpoint" | `@/.github/skills/feature-implementation/SKILL.md` | Backend→frontend workflow |
| "refactor", "clean up" | `@/.github/skills/code-refactoring/SKILL.md` | Test-driven refactoring |
| "update dependencies" | `@/.github/skills/dependency-updates/SKILL.md` | Safe upgrade procedures |
```

### 3. Skills Customization

Universal skills need minor tweaks for your stack:

#### dependency-updates/SKILL.md

**What to replace:**

```markdown
## Update Command
{{PACKAGE_MANAGER}} update {{PACKAGE_NAME}}

## Lock File
{{LOCK_FILE_NAME}}

## Vulnerability Check
{{VULNERABILITY_SCAN_COMMAND}}
```

**Examples by stack:**

**npm (JavaScript/TypeScript):**
```markdown
## Update Command
npm update <package-name>

## Lock File
package-lock.json

## Vulnerability Check
npm audit
```

**pip (Python):**
```markdown
## Update Command
pip install --upgrade <package-name>

## Lock File
requirements.txt (regenerate with pip freeze > requirements.txt)

## Vulnerability Check
pip-audit
```

**cargo (Rust):**
```markdown
## Update Command
cargo update <package-name>

## Lock File
Cargo.lock

## Vulnerability Check
cargo audit
```

#### Other Skills

- **documentation-management:** No customization needed (language-agnostic)
- **code-refactoring:** Update code examples to match your language syntax
- **skill-creator:** No customization needed

### 4. Custom Agents

Minimal customization required:

#### developer.agent.md

Replace `{{PROJECT_NAME}}` and `{{ESSENTIALS_PATH}}`:

```chatagent
---
name: Developer
description: Writes code for {{PROJECT_NAME}}
handoffs:
  - label: "Send to Architect"
    agent: SeniorArchitect
    prompt: "Please review changes against CODEBASE_ESSENTIALS.md"
    send: true
---
```

**Example:**
```chatagent
---
name: Developer
description: Writes code for my-awesome-app
handoffs:
  - label: "Send to Architect"
    agent: SeniorArchitect
    prompt: "Please review changes against CODEBASE_ESSENTIALS.md"
    send: true
---
```

#### architect.agent.md

Replace `{{ESSENTIALS_PATH}}`:

```markdown
You enforce: KISS, DRY, SOLID, YAGNI principles from {{ESSENTIALS_PATH}}
```

**Example:**
```markdown
You enforce: KISS, DRY, SOLID, YAGNI principles from CODEBASE_ESSENTIALS.md
```

---

## Stack-Specific Guides

### For Python/Django Projects

**Required patterns to document:**
- ViewSet + Serializer + Router (DRF)
- Model design (timestamps, ForeignKey patterns)
- Test factories (factory-boy)
- Migration workflow
- Environment configuration (django-environ)

**Example to reference:** `examples/python-django/CODEBASE_ESSENTIALS.md`

**Skills to add:**
- `database-migrations` - SQLAlchemy/Django migration workflow
- `api-testing` - pytest + DRF test client patterns

### For TypeScript/Vue Projects

**Required patterns to document:**
- Component structure (script setup, typed props)
- Composables for reusable logic
- Pinia stores for state management
- API client integration
- Router guards for auth

**Example to reference:** `examples/typescript-vue/CODEBASE_ESSENTIALS.md`

**Skills to add:**
- `component-development` - Vue Composition API patterns
- `state-management` - Pinia store creation
- `api-integration` - Typed API client usage

### For Rust/Actix Projects

**Required patterns to document:**
- Handler + Extractor + Responder
- Custom error types (ResponseError trait)
- SQLx migrations
- Test modules (#[cfg(test)])
- Async patterns (tokio)

**Example to reference:** `examples/rust-actix/CODEBASE_ESSENTIALS.md`

**Skills to add:**
- `endpoint-implementation` - Actix handler patterns
- `database-migrations` - SQLx CLI workflow
- `error-handling` - Error enum design

### For Other Stacks

**General approach:**
1. Start with validation matrix (language-specific test commands)
2. Document top 3 patterns causing confusion
3. Add invariants from production bugs
4. Capture gotchas from onboarding pain points
5. Create skills for repeated workflows

---

## Testing Your Customization

### Validation Checklist

After customization, verify:

- [ ] All validation commands actually run
- [ ] Expected outputs match reality
- [ ] Code examples compile/run
- [ ] Skills reference correct package manager
- [ ] Custom agents mention correct file paths
- [ ] Links in AGENTS.md point to existing skills

### Test Run

**Simulate a real session:**

```bash
# 1. Create a feature branch
git checkout -b test-knowledge-system

# 2. Make a small change (e.g., add function)
echo "export function test() { return 42 }" > src/test.ts

# 3. Follow AGENTS.md workflow
# - Read CODEBASE_ESSENTIALS.md
# - Run validation commands
# - Update CODEBASE_CHANGELOG.md

# 4. Verify all commands work
npm run type-check   # Or your equivalent
npm run test:run
npm run lint

# 5. If everything passes, merge
git checkout main
git branch -D test-knowledge-system
```

**Expected outcome:**
- ✅ All validation commands run without errors
- ✅ You know where to find each pattern
- ✅ Workflow feels natural, not forced

---

## Maintenance: Keeping It Current

### Monthly Review

**Check these items:**

- [ ] Are validation commands still accurate?
- [ ] Have new patterns emerged? (add to ESSENTIALS)
- [ ] Have old patterns been deprecated? (remove/archive)
- [ ] Are skills being used? (if not, remove or clarify)
- [ ] Is changelog exceeding 1500 lines? (archive to docs/changelog/)

### When to Update

**Always update for:**
- ✅ New validation commands (CI changes)
- ✅ Critical invariants (security, data integrity)
- ✅ Adopted patterns (team consensus)

**Sometimes update for:**
- ⚠️ Version bumps (major framework upgrades)
- ⚠️ Refactored patterns (migration path documented)
- ⚠️ Fixed gotchas (mark as resolved)

**Never update for:**
- ❌ Temporary workarounds (fix root cause instead)
- ❌ Personal preferences (team decides)
- ❌ Aspirational patterns (only document what IS used)

### Evolution Strategy

**Good evolution:**
```
Week 1: Basic ESSENTIALS with validation matrix
Week 2-4: Add patterns as questions arise
Month 2: First skill created for repeated workflow
Month 3: Patterns stabilize, fewer updates needed
Month 6: System mostly self-maintaining
```

**Bad evolution:**
```
Day 1: Try to document everything
Day 2: Overwhelmed, abandon documentation
Day 30: Knowledge system ignored
```

**Key:** Start small, grow organically.

---

## Common Customization Mistakes

### ❌ Mistake 1: Over-Documenting

**Problem:** Trying to document every detail.

**Example:**
```markdown
## How to Write a For Loop

In TypeScript, for loops work like this:
```typescript
for (let i = 0; i < 10; i++) {
  console.log(i)
}
```
```

**Why it's wrong:** Developers know language basics. Don't document what's googleable.

**Fix:** Only document project-specific patterns.

### ❌ Mistake 2: Vague Validation Commands

**Problem:** Generic instructions instead of exact commands.

**Example:**
```markdown
| Changed | Command | Expected |
|---------|---------|----------|
| Code | Run tests | They pass |
```

**Why it's wrong:** "Run tests" could mean many things. Causes ambiguity.

**Fix:** Exact commands with flags.
```markdown
| Changed | Command | Expected |
|---------|---------|----------|
| TypeScript | `npm run test:run` | "X tests passed, 0 failed" |
```

### ❌ Mistake 3: Future-Oriented Patterns

**Problem:** Documenting aspirational patterns, not actual ones.

**Example:**
```markdown
## Core Patterns

### Microservices Architecture (FUTURE)

We plan to split into microservices using...
```

**Why it's wrong:** Documents what SHOULD BE, not what IS. Causes confusion.

**Fix:** Only document actually-used patterns. Create OpenSpec proposal for future changes.

### ❌ Mistake 4: Skipping Examples

**Problem:** Abstract descriptions without code.

**Example:**
```markdown
## API Integration

We use a typed client pattern for API calls. Always ensure proper error handling and type safety.
```

**Why it's wrong:** No concrete guidance. Developers don't know what "typed client pattern" means.

**Fix:** Include code example.
```markdown
## API Integration

**Pattern: Composable with Typed API Client**

```typescript
import { useApiClient } from '@/composables'

const { articlesApi } = useApiClient()
const articles = await articlesApi.articlesList()
```
```

---

## Getting Help

### Resources

- **Examples:** See `examples/` for production-ready patterns
- **Philosophy:** Read `docs/philosophy.md` for design rationale
- **Migration:** See `docs/migration-guide.md` for existing projects

### Community

- **Issues:** Report bugs or request features
- **Discussions:** Ask questions or share customizations
- **PRs:** Contribute improvements to templates/skills

---

## Customization Checklist

Before considering your setup complete:

### Core Files
- [ ] CODEBASE_ESSENTIALS.md filled in (tech stack, validation, patterns)
- [ ] AGENTS.md updated (validation matrix, skill mapping)
- [ ] CODEBASE_CHANGELOG.md has template and first entry
- [ ] README.md describes your project setup

### Skills
- [ ] dependency-updates customized for package manager
- [ ] At least 1 project-specific skill created
- [ ] Skills referenced in AGENTS.md skill mapping

### Agents
- [ ] developer.agent.md references correct paths
- [ ] architect.agent.md references CODEBASE_ESSENTIALS.md
- [ ] Handoff workflow tested

### Validation
- [ ] All validation commands actually run
- [ ] Expected outputs documented and verified
- [ ] Test run completed successfully

### Documentation
- [ ] Examples match your actual codebase
- [ ] Code samples compile/run
- [ ] Links point to existing files
- [ ] No placeholder {{VARIABLES}} remain

---

*Customization should take 2-6 hours depending on project complexity. Start minimal, evolve organically.*
