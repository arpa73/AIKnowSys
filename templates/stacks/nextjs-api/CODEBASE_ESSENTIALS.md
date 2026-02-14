<!-- 
DELIVERABLE TEMPLATE - DO NOT MODIFY DURING NORMAL DEVELOPMENT

This file is distributed to users.
Template maintenance requires: Plan → Tests → Implementation → Review → Migration Guide

See: template-maintenance workflow in learned skills or documentation
-->

# Codebase Essentials

> **Last Updated:** February 7, 2026  
> **Purpose:** AI-Powered Development Workflow Template  
> **Version:** v0.10.0 (MCP-First Architecture)

⚠️ **CRITICAL:** AIKnowSys requires MCP server to function.  
**Skills, context, validation** are all MCP-powered (10-100x faster than file reading).


**Migrated from v0.9.x** - Preserved customizations: Custom technology stack, Project-specific structure, Frontend framework patterns

---

## 1. Technology Snapshot

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js (App Router) | 15.x |
| Runtime | Node.js | 20+ |
| Language | TypeScript | 5.x |
| Package Manager | npm | 10+ |
| Database | PostgreSQL | 16+ |
| ORM | Prisma | 5.x |
| Validation | Zod | 3.x |
| Authentication | {{AUTH_PROVIDER}} | Latest |
| Testing | Vitest | Latest |
| Linter | ESLint | 9.x |
| Formatter | Prettier | 3.x |

**Additional Libraries:**
- `@prisma/client` - Type-safe database client
- `zod` - Runtime type validation
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT token management
- `rate-limiter-flexible` - Rate limiting
- `cors` - CORS configuration

---

---

## 2. Validation Matrix

| Command | Purpose | Required |
|---------|---------|----------|
| `npm run dev` | Start dev server | ✅ Must work |
| `npm run build` | Production build | ✅ Before push |
| `npm run type-check` | TypeScript validation | ✅ Before commit |
| `npm run lint` | ESLint check | ✅ Before commit |
| `npm test` | Run all tests | ✅ Before commit |
| `npm run test:api` | API route tests | ✅ Before push |
| `npm run test:integration` | Integration tests | ⚠️ Before push |
| `npx prisma migrate deploy` | Run migrations | ✅ Before deploy |

---

---

## 3. Project Structure

```
{{PROJECT_NAME}}/
├── app/
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── refresh/route.ts
│   │   ├── users/                # User CRUD
│   │   │   ├── route.ts          # GET, POST /api/users
│   │   │   └── [id]/route.ts     # GET, PUT, DELETE /api/users/:id
│   │   ├── posts/                # Posts resource
│   │   └── health/route.ts       # Health check
│   ├── actions/                  # Server Actions
│   │   ├── auth.ts               # Auth mutations
│   │   ├── posts.ts              # Post mutations
│   │   └── users.ts              # User mutations
│   └── layout.tsx                # Root layout (minimal for API)
├── lib/
│   ├── db.ts                     # Prisma client singleton
│   ├── auth.ts                   # Authentication utilities
│   ├── validation.ts             # Zod schemas
│   ├── errors.ts                 # Custom error classes
│   ├── middleware/               # Middleware utilities
│   │   ├── auth.ts               # Auth middleware
│   │   ├── ratelimit.ts          # Rate limiting
│   │   └── cors.ts               # CORS configuration
│   └── utils.ts                  # Helper functions
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Migration files
│   └── seed.ts                   # Database seeding
├── tests/
│   ├── api/                      # API route tests
│   │   ├── auth.test.ts
│   │   ├── users.test.ts
│   │   └── posts.test.ts
│   ├── integration/              # Integration tests
│   └── utils/                    # Test utilities
│       ├── setup.ts
│       └── helpers.ts
├── middleware.ts                 # Global middleware
├── .env.local                    # Environment variables
├── next.config.js                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
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

## 5. Available Skills (MCP-Powered Discovery)

**AIKnowSys requires MCP server** - skills are discovered dynamically, not listed here.

**Get skill by name:**
```typescript
mcp_aiknowsys_get_skill_by_name({ skillName: "tdd-workflow" })
// Returns: Full skill content (400+ lines)
```

**Common skills you'll use:**
- `tdd-workflow` - Write tests FIRST (RED → GREEN → REFACTOR)
- `refactoring-workflow` - Safe code improvements with tests
- `feature-implementation` - Plan features, use OpenSpec for breaking changes
- `validation-troubleshooting` - Debug test/build failures
- `context-query` - Query plans/sessions (READ operations)
- `context-mutation` - Create/update sessions/plans (WRITE operations)
- `dependency-management` - Safe package upgrades
- `3rd-party-framework-docs` - Query 3rd-party library docs (Context7 MCP)

**See Section 10 for MCP setup.** If MCP isn't running, AIKnowSys won't work properly.

**File location:** Skills are in `.github/skills/<skill-name>/SKILL.md`

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

**Target:** ESSENTIALS <300 lines (MCP-first architecture)  
**Full workflows:** [.github/skills/](.github/skills/) (discovered dynamically via MCP)
