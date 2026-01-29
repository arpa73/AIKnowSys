# AIKnowSys - Knowledge System Template

**AI-Powered Development Workflow for Consistent, High-Quality Code**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A battle-tested knowledge management system that enables AI-assisted development while maintaining architectural consistency and preventing regressions. Originally developed for production use in the [gnwebsite project](https://github.com/arpa73/gnwebsite), now extracted as a reusable template for any tech stack.

---

## What Is This?

A structured workflow system consisting of:

1. **CODEBASE_ESSENTIALS.md** - Single source of truth for patterns, conventions, and invariants
2. **Custom Agents** (Planner → Developer → Architect) - Three-agent workflow with automated code review enforcing KISS/DRY/SOLID/YAGNI
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
npx  init

# For new projects with pre-built stack template
npx  init --stack nextjs

# For existing projects - auto-detect and migrate
npx  migrate

# Or install globally
npm install -g 
 init
```

**🚀 Pre-built Stack Templates:**

Skip most customization work with production-ready stack templates:

```bash
# List available stacks
npx  init --list-stacks

# Initialize with Next.js stack
npx  init --stack nextjs

# Initialize with Vue + Express full-stack monorepo
npx  init --stack vue-express
```

**Available stacks:**
- `nextjs` - Next.js 15 + App Router + TypeScript + Tailwind + Prisma
- `vue-express` - Vue 3 + Express full-stack monorepo with shared types

Each stack template includes:
- ✅ Pre-filled Technology Snapshot
- ✅ Stack-specific validation matrix with proper commands
- ✅ Core patterns and conventions for the stack
- ✅ Common gotchas and solutions
- ✅ Testing patterns and examples
- ✅ Architecture decisions (why this stack)

**Setup time:** 2-3 minutes (vs 10-15 min interactive, vs 45 min manual)

**Available commands:**

| Command | Description | Auto-installs agents/skills? |
|---------|-------------|------------------------------|
| `npx  init` | Initialize for a new project | ✅ Yes |
| `npx  migrate` | Full migration for existing projects | ✅ Yes |
| `npx  scan` | Scan codebase and generate draft ESSENTIALS | ❌ No (run install-agents after) |
| `npx  update` | Update agents, skills, and workflow to latest version | N/A (updates existing) |
| `npx aiknowsys check` | Validate knowledge system setup and configuration | N/A (validation) |
| `npx aiknowsys sync` | Sync AGENTS.md validation reference with ESSENTIALS.md | N/A (maintenance) |
| `npx aiknowsys audit` | Find common issues and pattern violations | N/A (analysis) |
| `npx aiknowsys install-agents` | Install Planner + Developer + Architect agents | N/A (standalone) |
| `npx aiknowsys install-skills` | Install universal skills | N/A (standalone) |

**🤔 `init` vs `migrate` - Which Should I Use?**

- **`init`** → Recommended for everyone (new OR existing projects)
  - Detects your situation and offers appropriate options
  - For existing projects: choose "🔍 Scan Codebase" → runs migrate workflow
  - More user-friendly with guided choices

- **`migrate`** → Direct path for existing projects only
  - Skips the setup menu, goes straight to scanning
  - Same result as `init` → "Scan Codebase"
  - Use if you prefer fewer prompts

**TL;DR:** Both do the same thing for existing code. `init` with "Scan Codebase" literally calls `migrate` internally. Just use `init` unless you want to skip the setup mode selection.

**💡 AI-Assisted Completion:** When using `init` in AI-guided mode, `migrate`, or `scan`, you'll receive a ready-to-copy prompt that you can paste to your AI assistant (Claude, GPT-4, Copilot Chat, etc.) to automatically complete the TODO sections based on your actual codebase. Manual mode lets you fill sections yourself, but you can always use AI later.

---

### 🎯 Advanced: Custom Essentials Filename

All commands support the `--essentials` (or `-e`) flag to use a custom filename instead of `CODEBASE_ESSENTIALS.md`:

```bash
# Initialize with custom filename
npx aiknowsys init --essentials ARCHITECTURE.md

# All other commands work with the same flag
npx aiknowsys check --essentials ARCHITECTURE.md
npx aiknowsys sync --essentials ARCHITECTURE.md
npx aiknowsys audit --essentials ARCHITECTURE.md
npx aiknowsys update --essentials ARCHITECTURE.md
npx aiknowsys migrate --essentials ARCHITECTURE.md
npx aiknowsys install-agents --essentials ARCHITECTURE.md
```

**Common Use Cases:**

1. **Corporate Naming Standards**
   ```bash
   # Your company requires "ENGINEERING_GUIDE.md"
   npx aiknowsys init --essentials ENGINEERING_GUIDE.md
   ```

2. **Monorepo Organization**
   ```bash
   # Different essentials per package
   cd packages/backend
   npx aiknowsys init --essentials BACKEND_ESSENTIALS.md
   
   cd packages/frontend
   npx aiknowsys init --essentials FRONTEND_ESSENTIALS.md
   ```

3. **Localization**
   ```bash
   # Non-English teams
   npx aiknowsys init --essentials CODEBASE_ESSENTIALS_FR.md
   npx aiknowsys init --essentials コードベース要点.md
   ```

4. **Legacy Project Migration**
   ```bash
   # You already have "CONTRIBUTING.md" or "ARCHITECTURE.md"
   npx aiknowsys init --essentials ARCHITECTURE.md
   ```

**Important Notes:**
- Custom agents will automatically reference your custom filename
- All validation and maintenance commands work seamlessly
- The system defaults to `CODEBASE_ESSENTIALS.md` if flag not provided
- Backwards compatible - existing projects continue working without changes

---

**📋 Template Options:**

- **Minimal Template** (10 sections): For learning projects, prototypes, and simple tools
  ```bash
  npx  init --template minimal
  ```
  Includes: Tech Stack, Validation Matrix, Structure, Patterns, Invariants, Gotchas, Testing, Architecture, Change Management, Workflow

- **Full Template** (13+ sections): For production projects and complex systems (default)
  ```bash
  npx  init --template full  # or just: npx  init
  ```
  Includes all minimal sections + Security, Performance, Accessibility

See [examples/filled-simple-api](examples/filled-simple-api) for a realistic filled example using the minimal template.

**🚀 Enhanced Interactive Setup (Manual Mode):**

Manual mode now asks intelligent questions about your project and automatically fills many placeholders:

- ✅ **Technology Snapshot**: Framework, language, build tool, package manager
- ✅ **Validation Matrix**: Auto-generates test, lint, type-check commands
- ✅ **Tooling Details**: Database, linter, test framework selections
- ✅ **Individual Commands**: {{TEST_CMD}}, {{LINT_CMD}}, {{TYPE_CHECK_CMD}} all filled

**Before**: 50+ placeholders to fill manually
**After**: Only structure and pattern placeholders remain (for AI or human completion)

This significantly reduces setup time while maintaining flexibility for project-specific details.

**🔍 Verification & Maintenance Commands:**

New commands to validate and maintain your knowledge system:

```bash
# Validate your setup
npx  check
# ✓ Checks required files exist
# ✓ Verifies agents and skills installed
# ✓ Detects unfilled placeholders
# ✓ Validates validation matrix

# Fix redundancy (sync validation matrix reference)
npx  sync
# Updates AGENTS.md to reference ESSENTIALS.md (DRY principle)

# Find issues and violations
npx  audit
# ⚠️ Detects validation matrix duplication
# ⚠️ Finds generic placeholder values
# ⚠️ Checks file size bloat
# ℹ️ Suggests improvements
```

**When to use:**
- `check` - Before committing, after setup, or when troubleshooting
- `sync` - After upgrading from old templates with duplicated validation matrix
- `audit` - Periodic health checks, before releases, or when reviewing code quality

---

## 🔍 Enhanced Auto-Detection

The `scan` command has been significantly enhanced to auto-detect and pre-fill more information:

**Now detects 15+ technology categories:**
- ✅ **Database**: PostgreSQL, MySQL, MongoDB, SQLite
- ✅ **ORM**: Prisma, Drizzle, TypeORM, Sequelize, Mongoose
- ✅ **State Management**: Pinia, Redux, Zustand, MobX, Jotai
- ✅ **API Client**: Axios, TanStack Query
- ✅ **Authentication**: NextAuth, Passport, Auth0, Supabase, Firebase
- ✅ **Styling**: Tailwind CSS, Material UI, Styled Components, Emotion, Sass
- ✅ **Code Patterns**: API routes, auth middleware, error handling, validation

**Before:**
```markdown
## 3. Core Patterns

### API Calls
TODO: How do you make API calls?
```

**After:**
```markdown
## 3. Core Patterns

### API Calls
Detected: Axios
TODO: Document standard usage pattern
Example: How do you create API instances? Base URL configuration?
```

**Impact:** Reduces manual setup work by 40-50%, provides context-aware hints for completion.

---

## 📚 Example Templates

**New in v0.3.0:** Completed example templates to guide your setup!

**See:** [`docs/examples/`](docs/examples/)
- **[CODEBASE_ESSENTIALS.example.md](docs/examples/CODEBASE_ESSENTIALS.example.md)** - Fully-filled example (TaskAPI - Express/TypeScript/Prisma)
- **[README.md](docs/examples/README.md)** - How to use examples effectively

**Workflow:**
1. Read example to understand format and level of detail
2. Run `npx  scan` to generate draft for your project
3. Use example as reference while filling TODOs
4. Copy structure, not content (write your own patterns!)

**What makes a good example:**

❌ **Too Generic:**
```markdown
### API Calls
We use axios for API calls.
```

✅ **Specific & Useful:**
```markdown
### API Calls
```typescript
// src/lib/api.ts - All API calls use this instance
import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  timeout: 5000
});

// Usage in components
const tasks = await api.get('/tasks');
```
**Why:** Centralized config, consistent timeout, easy to mock in tests
```

**Based on user feedback:** "Templates can feel overwhelming without seeing a completed example" - this addresses the #1 priority from usability testing.

---

## 🧪 TDD Enforcement System

**New in v0.3.1:** Multi-layered enforcement of Test-Driven Development to prevent "implement first, test later" violations.

### The Problem

Even with TDD documented in `CODEBASE_ESSENTIALS.md` as Critical Invariant #7, it's easy to forget and write implementation before tests (we did this ourselves and caught it!).

### The Solution: 4 Layers of Enforcement

#### Layer 1: Pre-Work Checklist (AGENTS.md)

Every AI session now starts with explicit TDD reminder:

```markdown
**Step 3: Check TDD Requirement**
  - [ ] 🔴 RED: Write failing test FIRST
  - [ ] 🟢 GREEN: Implement minimal code to pass
  - [ ] 🔵 REFACTOR: Clean up while keeping tests green
```

#### Layer 2: TDD Self-Audit (AGENTS.md Step 3½)

Before validation, AI must self-audit:

```markdown
Did you follow RED-GREEN-REFACTOR?
- [ ] Wrote test BEFORE implementation (RED)
- [ ] Saw test fail first
- [ ] Implemented minimal code (GREEN)
- [ ] Refactored while keeping tests green

If NO to any: Document violation in CODEBASE_CHANGELOG.md
```

#### Layer 3: Git Hook (Local Enforcement)

Pre-commit hook checks for test changes:

```bash
# Install git hooks
./scripts/install-git-hooks.sh

# Now when you commit lib/ without test/ changes:
⚠️  WARNING: Staging lib/ changes without test/ changes

Did you follow TDD?
  🔴 RED: Write failing test first
  🟢 GREEN: Implement minimal code to pass
  🔵 REFACTOR: Clean up while keeping tests green

Continue with commit anyway? (y/N)
```

**See:** `.git-hooks/README.md` for hook documentation

#### Layer 4: GitHub Actions (CI Enforcement)

PR checks enforce TDD compliance:

```yaml
# .github/workflows/tdd-compliance.yml
# Fails CI if lib/ changed without test/ changes
```

**See workflow:** [`.github/workflows/tdd-compliance.yml`](.github/workflows/tdd-compliance.yml)

### Skills Integration

**New skill:** `.github/skills/tdd-workflow/SKILL.md`

Complete TDD guide with:
- RED-GREEN-REFACTOR cycle explained
- Step-by-step examples
- Common pitfalls and solutions
- Integration with project workflow

**Trigger words:** "implement", "add feature", "TDD", "test first", "red-green-refactor"

**Enhanced:** `.github/skills/feature-implementation/SKILL.md` now includes Phase 0: TDD Setup (mandatory before implementation)

### Why This Matters

**From our own experience:**

We violated our own TDD requirement during the automation enhancement session (v0.3.0). We implemented scan auto-detection features, THEN wrote tests. This backwards approach:

❌ Lost design benefits of test-first thinking  
❌ Tests became "verification" not "design"  
✅ Still achieved test coverage (28/28 passing)  
✅ Documented violation as lesson learned  

**The lesson:** Even rule creators forget rules when moving fast. Having multiple enforcement layers prevents this.

**Learn more:**
- See [CODEBASE_CHANGELOG.md](CODEBASE_CHANGELOG.md) "Automation Enhancements" session
- Read [.github/skills/tdd-workflow/SKILL.md](.github/skills/tdd-workflow/SKILL.md)
- Review [.git-hooks/README.md](.git-hooks/README.md)



## AI Tool Compatibility

### ✅ Works with ANY AI Tool

These components work with **all AI assistants** (Claude Desktop, ChatGPT, Cursor, Gemini CLI, etc.):

- **`CODEBASE_ESSENTIALS.md`** - Reference this file manually: `@CODEBASE_ESSENTIALS.md`
- **`AGENTS.md`** - Copy/paste workflow instructions to any AI
- **`CODEBASE_CHANGELOG.md`** - Historical context for any AI
- **`.github/skills/`** - Read skills with: `@.github/skills/feature-implementation/SKILL.md`

You can use the core knowledge system with any AI tool by manually referencing these files.

### 🎯 GitHub Copilot-Specific Features

These features **only work in VS Code with GitHub Copilot Chat**:

- **Custom Agents** (`@Developer`, `@SeniorArchitect`) - Automatic agent triggering
- **Auto-handoff workflow** - Developer → Architect review pipeline
- **`.github/agents/`** directory - Auto-loaded by Copilot's Agent Skills feature

**Without Copilot:** You can still follow the Developer → Architect workflow by manually copying prompts to your AI tool. The automation just won't be automatic.

### 🔮 Roadmap: Multi-Tool Support

**Planned for near future:**
- **Claude Desktop MCP Server** - Native agent support for Claude Desktop
- **Cursor integration** - Custom agent support
- **Universal agent format** - Tool-agnostic agent definitions

Stay tuned for updates!

---

### Alternative: Manual Setup

<details>
<summary>Click to expand manual setup instructions</summary>

#### For New Projects

```bash
# Clone the template
git clone https://github.com/YOUR_ORG/.git
cd 

# Run interactive setup
./scripts/setup.sh

# Follow prompts to customize for your tech stack
# Files will be generated with your configuration
```

#### For Existing Projects

```bash
# Clone into your project
git clone https://github.com/YOUR_ORG/.git temp-template
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

### 1. AI Knowledge System (.aiknowsys/)

**Purpose:** Structured memory and continuous learning for AI assistants.

When you run `init`, AIKnowSys creates a `.aiknowsys/` directory that enables AI assistants to maintain context across sessions and accumulate project-specific knowledge over time.

**Directory Structure:**
```
.aiknowsys/
├── sessions/        # 🚫 Gitignored - Temporary session working memory
│   ├── README.md    # ✅ Committed - Explains purpose
│   └── YYYY-MM-DD-session.md  # 🚫 Daily session notes (not committed)
├── learned/         # ✅ Committed - Permanent project-specific patterns
│   ├── README.md    # ✅ Committed - Explains pattern format
│   └── *.md         # ✅ Committed - Discovered patterns
└── PENDING_REVIEW.md # 🚫 Gitignored - Temporary architect reviews
```

#### Session Files (Temporary)

**What they are:**
- Working memory for a single AI conversation
- Created/updated during complex multi-step work
- Automatically loaded by AI agents at session start

**Why gitignored:**
- Session-specific context (like IDE workspace files)
- Not useful to other developers or other AI sessions
- Prevents git history clutter

**Benefits:**
- ✅ Context continuity across messages in same session
- ✅ AI remembers what you worked on last time
- ✅ Complex multi-step work doesn't lose progress

#### Learned Patterns (Permanent)

**What they are:**
- Discovered patterns applicable to whole project
- Reusable across all AI assistants and team members
- Examples: Custom validation rules, debugging techniques, library-specific gotchas

**Why committed:**
- Valuable team knowledge
- Helps onboard new developers
- AI assistants get smarter with each session
- Project knowledge accumulates over time

**Benefits:**
- ✅ Reduced repeated explanations
- ✅ Team-wide pattern sharing
- ✅ AI learns from mistakes and successes

#### Review Files (Ephemeral)

**What they are:**
- Detailed code reviews created by Architect agent
- Deleted after Developer addresses issues
- Temporary handoff mechanism between agents

**Example workflow:**
1. Developer implements feature
2. Architect writes review to `PENDING_REVIEW.md`
3. Developer reads review and fixes issues
4. Developer deletes `PENDING_REVIEW.md`

#### Gitignore Configuration

The init command automatically adds:

```gitignore
# Session-specific AI memory (temporary, not committed)
.aiknowsys/sessions/*.md
!.aiknowsys/sessions/README.md
.aiknowsys/PENDING_REVIEW.md
# Note: .aiknowsys/learned/ IS committed (project-specific patterns)
```

**Validation:** Run `npx aiknowsys audit` to check if gitignore is configured correctly.

### 2. CODEBASE_ESSENTIALS.md

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

### 2. Custom Agents (Planner → Developer → Architect)

**Purpose:** Three-agent workflow with automated quality gates enforcing documented patterns.

**Platform:** GitHub Copilot in VS Code (other AI tools: see [AI Tool Compatibility](#ai-tool-compatibility))

**Workflow:**
```
User → @Planner → Creates implementation plan → Writes to .aiknowsys/CURRENT_PLAN.md →
  @Developer → Reads plan → Implements feature → Auto-handoff →
    @SeniorArchitect → Reviews against ESSENTIALS → Writes to .aiknowsys/PENDING_REVIEW.md → ✅ Approve or 🔄 Refactor
```

**What Planner does:**
- Breaks down complex features into actionable steps
- Identifies architectural concerns and dependencies
- Documents implementation plan in `.aiknowsys/CURRENT_PLAN.md`
- Ensures proper sequencing and risk mitigation

**What Developer does:**
- Reads implementation plan from `.aiknowsys/CURRENT_PLAN.md`
- Implements features following project patterns
- Writes tests (TDD if enabled, coverage testing otherwise)
- Validates all changes before handoff
- Auto-calls Architect for code review

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
- `tdd-workflow` - Test-Driven Development (RED-GREEN-REFACTOR cycle)

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

**Q: Does this only work with GitHub Copilot?**  
A: No! Core knowledge files (CODEBASE_ESSENTIALS.md, skills) work with any AI tool. The custom agents (`@Developer`, `@SeniorArchitect`) require GitHub Copilot in VS Code, but you can manually follow the same workflow with Claude Desktop, ChatGPT, Cursor, or any AI assistant. See [AI Tool Compatibility](#ai-tool-compatibility) for details.

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
