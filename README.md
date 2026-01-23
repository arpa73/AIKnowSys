# Knowledge System Template

**AI-Powered Development Workflow for Consistent, High-Quality Code**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A battle-tested knowledge management system that enables AI-assisted development while maintaining architectural consistency and preventing regressions. Originally developed for production use in the [gnwebsite project](https://github.com/arpa73/gnwebsite), now extracted as a reusable template for any tech stack.

---

## What Is This?

A structured workflow system consisting of:

1. **CODEBASE_ESSENTIALS.md** - Single source of truth for patterns, conventions, and invariants
2. **Custom Agents** (Developer + Architect) - Automated code review enforcing KISS/DRY/SOLID/YAGNI
3. **Skills System** - Domain-specific how-to guides for common tasks
4. **Changelog** - Session-by-session validation and learning history
5. **Validation Matrix** - Mandatory test running before completion

**Result:** AI assistants that understand your codebase, follow your patterns, and catch issues before production.

---

## Why Use This?

### Real-World Impact

From production use in gnwebsite:

✅ **Prevented pattern drift** - Caught MediaAsset using two different URL generation methods  
✅ **Comprehensive testing** - Logger utility got 16 tests because ESSENTIALS mandates testing  
✅ **Caught regressions** - Mailerlite integration tests caught 8 production bugs  
✅ **Consistent refactoring** - Test-driven refactoring prevented behavior changes  
✅ **Fast onboarding** - New AI sessions start productive immediately  

### Before vs After

| Without Knowledge System | With Knowledge System |
|-------------------------|----------------------|
| AI suggests inconsistent patterns | AI follows documented standards |
| "Quick fixes" create technical debt | Process ensures quality every time |
| Validation is manual/forgotten | Validation is automatic/mandatory |
| Patterns exist in tribal knowledge | Patterns documented and enforced |
| Each session restarts context | Historical context preserved |

---

## Quick Start

### Install via npm (Recommended)

```bash
# For new projects - interactive setup
npx aiknowsys init

# For existing projects - auto-detect and migrate
npx aiknowsys migrate

# Or install globally
npm install -g aiknowsys
aiknowsys init
```

**Available commands:**

| Command | Description |
|---------|-------------|
| `npx aiknowsys init` | Initialize for a new project |
| `npx aiknowsys migrate` | Full migration for existing projects |
| `npx aiknowsys scan` | Scan codebase and generate draft ESSENTIALS |
| `npx aiknowsys install-agents` | Install Developer + Architect agents |
| `npx aiknowsys install-skills` | Install universal skills |

### Alternative: Manual Setup

<details>
<summary>Click to expand manual setup instructions</summary>

#### For New Projects

```bash
# Clone the template
git clone https://github.com/YOUR_ORG/knowledge-system-template.git
cd knowledge-system-template

# Run interactive setup
./scripts/setup.sh

# Follow prompts to customize for your tech stack
# Files will be generated with your configuration
```

#### For Existing Projects

```bash
# Clone into your project
git clone https://github.com/YOUR_ORG/knowledge-system-template.git temp-template
cp -r temp-template/scripts ./
cp -r temp-template/templates ./

# Run migration workflow
./scripts/migrate-existing.sh

# Scanner will:
# 1. Detect your tech stack automatically
# 2. Generate draft CODEBASE_ESSENTIALS.md (70% complete)
# 3. Install custom agents
# 4. Set up universal skills
# 5. Initialize changelog

# Complete TODO sections in CODEBASE_ESSENTIALS.md
# Start using: @Developer <your request>
```

</details>

---

## Core Components

### 1. CODEBASE_ESSENTIALS.md

**Purpose:** Single-source reference for architecture, patterns, and critical invariants.

**Contains:**
- Technology stack snapshot
- Validation commands (tests, type checking, linting)
- Core patterns (how you do auth, API calls, state management)
- Critical invariants (rules that must NEVER be violated)
- Common gotchas (things that trip up new contributors)

**See examples:**
- [Python/Django API](examples/python-django/CODEBASE_ESSENTIALS.md) - Django REST Framework patterns
- [TypeScript/Vue SPA](examples/typescript-vue/CODEBASE_ESSENTIALS.md) - Vue 3 Composition API patterns
- [Rust/Actix Web API](examples/rust-actix/CODEBASE_ESSENTIALS.md) - Type-safe Rust patterns

**Why it matters:** AI reads this at session start, ensuring all suggestions align with your architecture.

### 2. Custom Agents (Developer + Architect)

**Purpose:** Automated quality gate enforcing documented patterns.

**Workflow:**
```
User → @Developer → Implements feature → Auto-handoff → @SeniorArchitect → Reviews against ESSENTIALS → ✅ Approve or 🔄 Refactor
```

**What Architect checks:**
- KISS (Keep It Simple) - No unnecessary complexity
- DRY (Don't Repeat Yourself) - Proper abstraction
- SOLID - Single responsibility, dependency inversion
- YAGNI (You Ain't Gonna Need It) - No speculative features
- CODEBASE_ESSENTIALS.md compliance

**Result:** Instant feedback loop (seconds vs hours), consistent enforcement.

### 3. Skills System

**Purpose:** Step-by-step workflows for common tasks.

**Included universal skills:**
- `dependency-updates` - Safe upgrade procedures
- `documentation-management` - Changelog archiving, AI-friendly writing
- `code-refactoring` - Test-driven refactoring patterns
- `testing-best-practices` - Framework-agnostic testing guide
- `skill-creator` - How to create new skills

**Custom skills you can add:**
- Feature implementation workflows
- Deployment procedures
- Database migration patterns
- Security review checklists

### 4. Validation Matrix

**Purpose:** Ensure all changes pass tests before claiming completion.

**Example:**
```markdown
| Changed | Commands | Required |
|---------|----------|----------|
| Backend | pytest | ✅ MANDATORY |
| Frontend | npm run type-check | ✅ MANDATORY |
| Frontend Logic | npm run test:run | ✅ MANDATORY |
```

**Rule:** Never say "done" until validation passes.

### 5. Session Changelog

**Purpose:** Historical context prevents repeating mistakes.

**Entry format:**
```markdown
## Session: Logger Utility Implementation (Jan 18, 2026)

**Goal**: Add structured logging with type safety

**Changes**:
- [src/utils/logger.ts](src/utils/logger.ts#L1-L50): Created logger
- [tests/logger.test.ts](tests/logger.test.ts): Added 16 tests

**Validation**:
- ✅ All 456 tests passed
- ✅ TypeScript: No errors

**Key Learning**: Logger needs environment detection for test mocking
```

---

## Production-Ready Examples

The template includes **7 comprehensive examples** showing real patterns across different ecosystems:

### Backend Examples

#### Python/Django REST API

**Stack:** Django 4.2 + DRF + PostgreSQL + pytest + Docker

**Key patterns:**
- ViewSet + Serializer + Router (DRF)
- factory-boy for test data generation
- TimestampedModel abstract base class
- SQLAlchemy migrations
- Environment configuration with django-environ

**What you'll learn:**
- How to structure Django REST API patterns
- Comprehensive pytest testing with factories
- N+1 query prevention with `select_related`
- Production deployment checklist

[→ View Django Example](examples/python-django/CODEBASE_ESSENTIALS.md)

#### Python/FastAPI

**Stack:** FastAPI 0.108 + SQLAlchemy 2.0 + Pydantic + Alembic + PostgreSQL

**Key patterns:**
- Router + Pydantic schemas + dependency injection
- Async SQLAlchemy with asyncpg
- JWT authentication with python-jose
- Alembic migrations
- pytest-asyncio testing

**What you'll learn:**
- FastAPI async/await patterns
- Type-safe async database access
- Pydantic validation + OpenAPI docs
- Common gotchas (mixing sync/async, N+1 queries)

[→ View FastAPI Example](examples/python-fastapi/CODEBASE_ESSENTIALS.md)

#### Node.js/Express + TypeScript

**Stack:** Express 4.18 + TypeScript + Prisma + PostgreSQL + Jest

**Key patterns:**
- Router + Controller + Service layer
- Zod validation + custom error handling
- JWT authentication with passport
- Prisma ORM with migrations
- Supertest for API testing

**What you'll learn:**
- Express TypeScript setup
- Service layer separation
- Type-safe middleware
- Common gotchas (async errors, integer parsing)

[→ View Express Example](examples/nodejs-express/CODEBASE_ESSENTIALS.md)

#### Rust/Actix Web API

**Stack:** Actix Web 4.4 + SQLx + PostgreSQL + Tokio + Serde

**Key patterns:**
- Handler + Extractor + Responder
- Custom error types with ResponseError trait
- SQLx compile-time query verification
- Integration tests with test database
- Async error handling with Result types

**What you'll learn:**
- Type-safe Rust web API development
- Database migrations with SQLx CLI
- Production optimization (LTO, code-gen-units)
- Common gotchas (lifetime errors, async runtime conflicts)

[→ View Rust Example](examples/rust-actix/CODEBASE_ESSENTIALS.md)

### Frontend Examples

#### TypeScript/React + Vite

**Stack:** React 18.2 + TypeScript + Vite + Zustand + TanStack Query + Tailwind

**Key patterns:**
- Functional components + hooks + custom hooks
- Zustand for client state, TanStack Query for server state
- React Hook Form + Zod validation
- Testing Library + user-event
- Type-safe routing with React Router

**What you'll learn:**
- Modern React patterns (hooks, composition)
- State management (Zustand vs Redux)
- Form handling best practices
- Common gotchas (infinite re-renders, missing dependencies)

[→ View React Example](examples/typescript-react/CODEBASE_ESSENTIALS.md)

#### TypeScript/Vue SPA

**Stack:** Vue 3 Composition API + TypeScript + Pinia + Vite + Vitest + Tailwind

**Key patterns:**
- Script setup + typed props + composables
- Pinia stores for state management
- Typed API client integration
- Router guards for authentication
- Component testing with @vue/test-utils

**What you'll learn:**
- Modern Vue 3 Composition API patterns
- Full TypeScript type safety
- Common gotchas (reactive destructuring, Vitest hanging)
- Why Pinia over Vuex, Vite over Webpack

[→ View Vue Example](examples/typescript-vue/CODEBASE_ESSENTIALS.md)

### Fullstack Examples

#### TypeScript/Next.js 14

**Stack:** Next.js 14 App Router + TypeScript + Prisma + NextAuth.js + PostgreSQL

**Key patterns:**
- Server Components (default) + Client Components (opt-in)
- Server Actions for mutations (no API routes)
- Prisma ORM with type-safe queries
- NextAuth.js OAuth + sessions
- E2E testing with Playwright

**What you'll learn:**
- Next.js App Router paradigm (Server vs Client)
- Server Actions for type-safe mutations
- Prisma schema + migrations
- Common gotchas (hydration mismatch, missing revalidation)

[→ View Next.js Example](examples/typescript-nextjs/CODEBASE_ESSENTIALS.md)

[→ View Rust Example](examples/rust-actix/CODEBASE_ESSENTIALS.md)

---

## How It Works

### The Workflow (Read → Plan → Implement → Validate → Document)

#### 1. START: Read Context
```
At session start, AI reads:
- CODEBASE_ESSENTIALS.md (patterns)
- Relevant skill for the task
- Recent changelog (history)
```

#### 2. PLAN: Check Skills
```
Trigger words map to skills:
"refactor" → code-refactoring skill
"update dependencies" → dependency-updates skill
"add feature" → feature-implementation skill
```

#### 3. IMPLEMENT: Code + Tests
```
Follow documented patterns
Write tests alongside code
Use project conventions
```

#### 4. VALIDATE: Run Tests
```
Run validation matrix commands
All tests must pass
No errors allowed
```

#### 5. DOCUMENT: Update Changelog
```
Add session entry
Update ESSENTIALS if patterns changed
Link to specific lines
```

#### 6. CONFIRM: Only End After Validation
```
Report what was built/fixed
Report test results
Confirm docs updated
```

---

## Installation Options

### Option 1: Interactive Setup (New Projects)

```bash
./scripts/setup.sh
```

**Prompts for:**
- Primary language (TypeScript/Python/Rust/Go)
- Framework (Vue/React/Django/FastAPI/etc)
- Testing tools (Vitest/Jest/pytest/cargo test)
- Package manager (npm/pip/cargo/go mod)

**Generates:**
- CODEBASE_ESSENTIALS.md with validation commands
- AGENTS.md with workflow instructions
- Custom agents configured for your stack
- Universal skills installed

### Option 2: Codebase Scanner (Existing Projects)

```bash
./scripts/migrate-existing.sh
```

**Automatically detects:**
- Tech stack from package files
- Test commands from package.json/Makefile/CI
- Project structure
- Key dependencies

**Generates:**
- Draft CODEBASE_ESSENTIALS.md (70% complete)
- TODO sections for manual patterns
- Validation matrix
- Changelog initialized

**Time saved:** ~3-4 hours of manual documentation

### Option 3: Manual Setup

```bash
# Copy templates
cp templates/CODEBASE_ESSENTIALS.template.md CODEBASE_ESSENTIALS.md
cp templates/AGENTS.template.md AGENTS.md
cp -r templates/agents/ .github/agents/

# Customize for your project
# Fill in {{PLACEHOLDERS}}
# Add your patterns and conventions
```

---

## Examples

### Example Projects

Included in `examples/` directory:

- **python-django/** - Backend API with PostgreSQL
- **typescript-react/** - Frontend SPA with Vite
- **rust-actix/** - Systems programming example

Each example shows:
- Completed CODEBASE_ESSENTIALS.md
- Custom skills for that stack
- Validation commands
- Real patterns from production code

---

## Customization Guide

### Adapting for Your Stack

**1. Update Validation Commands**

Edit CODEBASE_ESSENTIALS.md:
```markdown
**Validation Commands:**
```bash
# Your test framework
cargo test                    # Rust
go test ./...                 # Go
mvn test                      # Java/Maven
bundle exec rspec             # Ruby/RSpec
```
```

**2. Customize Agent Review Criteria**

Edit `.github/agents/architect.agent.md`:
```markdown
### Project-Specific Rules:
- All database queries must use ORM
- API responses must match OpenAPI schema
- Components must be accessible (WCAG AA)
- Errors must use structured logging
```

**3. Create Custom Skills**

Use skill-creator skill:
```bash
@Developer create a skill for our deployment workflow
```

Or manually:
```bash
cp .github/skills/_skill-template .github/skills/my-workflow
# Edit SKILL.md with your steps
```

**4. Add Your Patterns**

Update CODEBASE_ESSENTIALS.md:
```markdown
## Authentication Pattern

**Always use:** JWT tokens in HttpOnly cookies

**Example:**
```typescript
// ✅ Correct
const token = req.cookies.access_token

// ❌ Wrong
const token = req.headers.authorization
```
```

---

## OpenSpec Integration (Recommended)

**For teams and major features, we recommend using OpenSpec for spec-driven development.**

### What is OpenSpec?

OpenSpec is a specification-driven development tool that helps manage:
- Breaking changes and API contracts
- Architecture decisions with proposals
- Feature planning with structured tasks
- Change tracking and archiving

### How it integrates with Knowledge System

1. **During `init`:** You'll be asked if you want to use OpenSpec - if yes, it's **automatically installed**
2. **During `scan`:** OpenSpec directories are automatically detected
3. **In templates:** CODEBASE_ESSENTIALS.md includes an OpenSpec section
4. **In skills:** The feature-implementation skill covers OpenSpec workflows

### When to use OpenSpec proposals

| Change Type | Create Proposal? |
|-------------|------------------|
| New features or capabilities | ✅ Yes |
| Breaking changes (API, schema) | ✅ Yes |
| Architecture changes | ✅ Yes |
| Bug fixes, typos, formatting | ❌ No |
| Non-breaking dependency updates | ❌ No |

### Quick Start with OpenSpec

```bash
# Install OpenSpec CLI
npm install -g openspec

# Initialize in your project
openspec init

# Create a proposal for a new feature
openspec create add-user-profiles

# Validate before implementing
openspec validate add-user-profiles --strict

# After deployment, archive the change
openspec archive add-user-profiles --yes
```

**Learn more:** [OpenSpec Documentation](https://github.com/your-org/openspec)

---

## Philosophy

### Why This Approach Works

**1. Single Source of Truth**
- CODEBASE_ESSENTIALS.md prevents pattern drift
- One place to update when patterns change
- AI and humans read the same reference

**2. Automated Enforcement**
- Custom agents enforce patterns automatically
- Instant feedback loop
- Consistent standards across all changes

**3. Knowledge Preservation**
- Changelog captures what changed and why
- Patterns documented as they're discovered
- Historical context prevents repeating mistakes

**4. Gradual Adoption**
- Start with scanner-generated draft
- Add patterns as you discover them
- System grows with your project

**5. Framework-Agnostic**
- Core workflow works for any stack
- Template variables adapt to your tools
- Universal skills apply everywhere

---

## FAQ

**Q: Does this replace human code review?**  
A: No, it complements it. Agents handle mechanical checks (style, patterns, DRY), freeing humans to focus on architecture and business logic.

**Q: Will this slow down development?**  
A: Initially adds ~10 minutes per feature for documentation. Saves hours debugging pattern inconsistencies later. Net positive after first week.

**Q: What if my project uses multiple languages?**  
A: Create separate validation commands per language. Example: `pytest` for Python backend, `npm test` for TypeScript frontend.

**Q: Can I use this without AI assistants?**  
A: Yes! The documentation and workflow benefit human developers too. Think of it as "docs that AI can also read."

**Q: How do I update the system as my project evolves?**  
A: Update CODEBASE_ESSENTIALS.md when patterns change. Agents automatically enforce the updated patterns. Add changelog entry documenting the evolution.

**Q: What if validation fails?**  
A: Don't merge! Fix the issues, re-run validation, update changelog with what broke and how you fixed it. This prevents regressions.

---

## Contributing

We welcome contributions!

**Areas for improvement:**
- Additional language support (Java, C#, PHP, etc.)
- Framework-specific examples
- CI/CD integration guides
- VS Code extension for scaffolding
- Skill marketplace/discovery

**To contribute:**
1. Fork the repository
2. Create feature branch
3. Follow the knowledge system workflow (dogfooding!)
4. Submit PR with changelog entry

---

## License

MIT License - See [LICENSE](LICENSE) for details.

**TL;DR:** Free to use, modify, distribute. Attribution appreciated but not required.

---

## Credits

Originally developed for [gnwebsite](https://github.com/arpa73/gnwebsite), a fullstack Django/Vue project.

**Lessons learned from:**
- 20+ AI-assisted development sessions
- 450+ tests written using the system
- Multiple refactorings without regressions
- Production deployment validation

**Built with:**
- Markdown for maximum portability
- Bash scripts for zero dependencies
- Templates for easy customization
- Real production patterns

---

## Support

**Documentation:**
- [Customization Guide](docs/customization-guide.md) - Adapt for your tech stack
- [Migration Guide](docs/migration-guide.md) - Add to existing projects
- [Philosophy](docs/philosophy.md) - Why this approach works

**Examples:**
- [Python/Django](examples/python-django/) - REST API patterns
- [TypeScript/Vue](examples/typescript-vue/) - SPA patterns
- [Rust/Actix](examples/rust-actix/) - Type-safe web API patterns

**Questions?**
- Open an issue
- Check examples/ directory for your stack
- Read docs/philosophy.md for design rationale

---

**Start building better code with AI assistants that actually understand your codebase.** 🚀
