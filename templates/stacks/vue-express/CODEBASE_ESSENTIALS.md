<!-- 
DELIVERABLE TEMPLATE - DO NOT MODIFY DURING NORMAL DEVELOPMENT

This file is distributed to users.
Template maintenance requires: Plan → Tests → Implementation → Review → Migration Guide

See: template-maintenance workflow in learned skills or documentation
-->

# Codebase Essentials

> **Last Updated:** February 7, 2026  
> **Purpose:** AI-Powered Development Workflow Template  
> **Version:** v0.10.0 (Skill-Indexed Architecture)

⚠️ **MAJOR CHANGE:** ESSENTIALS is now a skill index, not a workflow encyclopedia.  
**Full workflows** are in [`.github/skills/`](.github/skills/) (auto-loaded on trigger detection).


**Migrated from v0.9.x** - Preserved customizations: Custom technology stack, Project-specific structure, Frontend framework patterns

---

## 1. Technology Snapshot

| Component | Technology | Version |
|-----------|------------|---------|
| **Frontend** |
| Framework | Vue 3 (Composition API) | 3.x |
| Build Tool | Vite | 5.x |
| Language | TypeScript | 5.x |
| State Management | Pinia | 2.x |
| Router | Vue Router | 4.x |
| UI Framework | Tailwind CSS | 4.x |
| Testing | Vitest + Vue Test Utils | Latest |
| **Backend** |
| Framework | Express.js | 4.x |
| Runtime | Node.js | 20+ |
| Language | TypeScript | 5.x |
| Database | PostgreSQL | 16+ |
| ORM | Prisma | 5.x |
| Testing | Vitest + Supertest | Latest |
| **Shared** |
| Package Manager | npm (workspaces) | 10+ |
| Linter | ESLint | 9.x |
| Formatter | Prettier | 3.x |

---

---

## 2. Validation Matrix

| Command | Purpose | Required |
|---------|---------|----------|
| `npm run dev` | Start all services | ✅ Must work |
| `npm run build` | Build frontend + backend | ✅ Before push |
| `npm run type-check` | TypeScript validation | ✅ Before commit |
| `npm run lint` | ESLint all packages | ✅ Before commit |
| `npm test` | Run all tests | ✅ Before commit |
| `npm run test:e2e` | E2E tests (if exists) | ⚠️ Before push |

---

---

## 3. Project Structure

```
{{PROJECT_NAME}}/
├── packages/
│   ├── frontend/              # Vue 3 application
│   │   ├── src/
│   │   │   ├── components/    # Vue components
│   │   │   ├── views/         # Page components
│   │   │   ├── stores/        # Pinia stores
│   │   │   ├── router/        # Vue Router
│   │   │   ├── api/           # API client
│   │   │   └── types/         # Frontend types
│   │   ├── tests/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── backend/               # Express API server
│   │   ├── src/
│   │   │   ├── routes/        # Express routes
│   │   │   ├── controllers/   # Route handlers
│   │   │   ├── services/      # Business logic
│   │   │   ├── middleware/    # Express middleware
│   │   │   └── types/         # Backend types
│   │   ├── tests/
│   │   ├── prisma/            # Database schema
│   │   │   └── schema.prisma
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── shared/                # Shared TypeScript types
│       ├── src/
│       │   └── types.ts       # API contracts, DTOs
│       ├── tsconfig.json
│       └── package.json
│
├── package.json               # Root workspace config
└── .env.example              # Environment template
```

---

---

## 4. Critical Invariants (ALWAYS ENFORCED - NOT OPTIONAL)

These 8 rules are MANDATORY. AI agents cannot skip or "think they know" these.

### 1. ES Modules Only
- All **internal** files use `import`/`export`, never `require()`
- package.json has `"type": "module"`
- **Exception:** Templates distributed to user projects may use `.cjs` for compatibility

### 2. Absolute Paths Required
- Always use `path.resolve()` for user-provided paths
- Use `getPackageDir()` for template paths

### 3. Graceful Failures
- All commands must handle missing files/directories
- Show helpful error messages, not stack traces

### 4. Template Preservation
- Never modify files in `templates/` - they're the source of truth
- User customization happens in generated files

### 5. Template Structure Integrity
- When AI fills CODEBASE_ESSENTIALS.md, NEVER change section headings
- Replace `{{PLACEHOLDERS}}` with real values, not generic placeholders
- Preserve template structure exactly (don't rename sections)

### 6. Backwards Compatibility
- Bash scripts in `scripts/` must remain functional
- npm CLI is additive, not replacement

### 7. Test-Driven Development (TDD) - MANDATORY
- **For new features:** Write tests BEFORE implementation (RED → GREEN → REFACTOR)
- **For bugfixes:** Write test that reproduces bug FIRST, then fix, then refactor
- Follow RED-GREEN-REFACTOR cycle for both features and bugs
- **Exception:** Configuration-only changes (adding properties to const objects)
- **Full workflow:** [`.github/skills/tdd-workflow/SKILL.md`](.github/skills/tdd-workflow/SKILL.md)

### 8. Deliverables Consistency
- Templates (`templates/` directory) are **deliverables** distributed to users
- ANY change to core functionality MUST update corresponding templates
- Templates must match non-template equivalents
- Run `npx aiknowsys validate-deliverables` before commits/releases
- Pre-commit hook automatically validates when templates/ changed

---

## 5. Skill Index (Auto-Load on Trigger Detection)

**How this works:**
1. AI agent detects trigger words in user request
2. AI reads relevant skill from `.github/skills/`
3. AI follows loaded workflow (cannot skip or "think they know")

**Why this prevents mistakes:**
- Critical invariants ALWAYS loaded (above section, not optional)
- Detailed workflows loaded ON-DEMAND (prevents "I thought I knew" failures)
- 60-80% token reduction per session

---

### Development Workflows

#### Testing & Validation
**[tdd-workflow](.github/skills/tdd-workflow/SKILL.md)**
- **Triggers:** "write tests", "TDD", "test first", "failing test", "RED-GREEN-REFACTOR"
- **Summary:** Complete TDD cycle - write failing test FIRST, implement minimal code, refactor
- **Why use:** Prevents "I'll add tests later" - tests drive design
- **Output:** Test file paths, test execution logs

**[validation-troubleshooting](.github/skills/validation-troubleshooting/SKILL.md)**
- **Triggers:** "test fail", "validation error", "build broken", "tests not passing"
- **Summary:** Debug validation failures - common issues, fixes, rollback procedures
- **Why use:** Systematic debugging instead of guessing
- **Output:** Root cause, fix steps, validation commands

#### Code Quality
**[refactoring-workflow](.github/skills/refactoring-workflow/SKILL.md)**
- **Triggers:** "refactor", "clean up", "simplify", "extract function", "reduce duplication"
- **Summary:** Test-driven refactoring - tests pass BEFORE and AFTER each change
- **Why use:** Safe code improvements without breaking functionality
- **Output:** Refactored code paths, test results

**[ai-friendly-documentation](.github/skills/ai-friendly-documentation/SKILL.md)**
- **Triggers:** "write docs", "update README", "changelog", "documentation"
- **Summary:** AI-optimized documentation for RAG systems - self-contained sections, explicit terminology
- **Why use:** Better AI comprehension and retrieval
- **Output:** Documentation files, changelog entries

#### Architecture & Planning
**[feature-implementation](.github/skills/feature-implementation/SKILL.md)**
- **Triggers:** "new feature", "implement", "add capability", "build feature"
- **Summary:** Step-by-step feature planning - when to use OpenSpec, implementation patterns
- **Why use:** Structured approach prevents scope creep
- **Output:** Plan file, implementation steps, OpenSpec proposal (if needed)

**[context-query](.github/skills/context-query/SKILL.md)**
- **Triggers:** "find plan", "query sessions", "search context", "what's the current plan"
- **Summary:** Query CLI commands instead of file searching - O(1) index lookup
- **Why use:** 100x faster than grep_search for >100 items
- **Output:** JSON with structured metadata, file paths

---

### Dependencies & Tools

**[dependency-management](.github/skills/dependency-management/SKILL.md)**
- **Triggers:** "update deps", "upgrade packages", "security fix", "npm update"
- **Summary:** Safe upgrade procedures - security-first, incremental updates, rollback plans
- **Why use:** Prevents breaking changes from surprise dependencies
- **Output:** Updated package.json, test results

**[context7-usage](.github/skills/context7-usage/SKILL.md)**
- **Triggers:** "query framework docs", "Context7", "library documentation"
- **Summary:** Query up-to-date documentation via Context7 MCP server
- **Why use:** Always current docs instead of outdated web search
- **Output:** Framework-specific code examples, API documentation

---

### Skill Management

**[skill-creator](.github/skills/skill-creator/SKILL.md)**
- **Triggers:** "create skill", "new skill", "make this a skill"
- **Summary:** Create new Agent Skills from guides - follows VS Code Agent Skills standard
- **Why use:** Proper skill format and metadata
- **Output:** SKILL.md file, registered in AVAILABLE_SKILLS

**[skill-validation](.github/skills/skill-validation/SKILL.md)**
- **Triggers:** "validate skill", "check skill format"
- **Summary:** Validate skill format and content against standards
- **Why use:** Ensures skill works correctly
- **Output:** Validation report, errors/warnings

**[pattern-sharing](.github/skills/pattern-sharing/SKILL.md)**
- **Triggers:** "share pattern", "team pattern", "collaborate"
- **Summary:** AI-assisted workflow for sharing personal patterns with team
- **Why use:** Detects valuable patterns, checks duplicates
- **Output:** Pattern file in learned/ or personal/

---

## 6. Quick Reference

### Validation Before Claiming "Done"
```bash
npm test              # All tests pass
npm run lint          # No errors
npm run build         # Clean compilation
```

### Common Patterns

**Logger pattern (all commands):**
```typescript
import { createLogger } from '../logger.js';
const log = createLogger(options._silent);
log.header('Title', '🎯');
log.success('Done');
```

**TypeScript imports (REQUIRED):**
```typescript
import { myFunction } from './file.js';  // ✅ .js extension required
import type { MyType } from './types.js';  // ✅ type-only import
```

**Absolute paths (REQUIRED):**
```typescript
const targetDir = path.resolve(options.dir || process.cwd());
```

---

## 7. Common Gotchas

**ESM `__dirname` not available:**
```typescript
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
```

**Import extensions required:**
```typescript
import { fn } from './utils.js';  // ✅ .js extension required
import { fn } from './utils';     // ❌ Won't resolve
```

**For detailed solutions:** See [`.aiknowsys/learned/common-gotchas.md`](.aiknowsys/learned/common-gotchas.md)

---

## 8. When to Document Where

**Add to CODEBASE_ESSENTIALS.md when:**
- Core architecture decision (technology choice)
- Critical invariant (cannot be violated)
- Project structure change

**Add to .github/skills/ when:**
- Repeatable workflow (refactoring, testing, deployment)
- Multi-step process requiring guidance
- Pattern that prevents common mistakes

**Add to .aiknowsys/learned/ when:**
- Project-specific discovery
- Workaround for library quirk
- Error resolution that might recur

---

**Target:** ESSENTIALS <400 lines (skill-indexed architecture)  
**Full workflows:** [`.github/skills/`](.github/skills/) (auto-loaded on trigger detection)
