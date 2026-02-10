# aiknowsys - Codebase Essentials

> **Last Updated:** February 7, 2026  
> **Purpose:** AI-Powered Development Workflow Template  
> **Maintainer:** arpa73  
> **Version:** v0.10.0 (MCP-First Architecture)

⚠️ **CRITICAL:** AIKnowSys requires MCP server to function.  
**Skills, context, validation** are all MCP-powered (10-100x faster than file reading).

---

## 1. Technology Snapshot

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |
| Language | TypeScript (ES Modules, compiles to JavaScript) |
| Test Framework | Vitest 4.x |
| CLI Framework | Commander.js 14.x |
| User Prompts | Inquirer.js 13.x |
| Terminal UI | Chalk 5.x, Ora 9.x |
| Package Manager | npm |
| Distribution | npm registry |
| **MCP Server** | **@modelcontextprotocol/sdk 1.26.0 (27 tools for AI agents)** |

---

## 2. Validation Matrix

| Command | Purpose | Expected |
|---------|---------|----------|
| `npm test` | Run unit tests | All 737+ tests pass (Vitest output) |
| `npm run lint` | Lint codebase | No errors or warnings |
| `npm run test:coverage` | Code coverage | >80% coverage on lib/ |
| `node bin/cli.js --help` | CLI works | Shows help without errors |
| `node bin/cli.js validate-deliverables` | Deliverables validation | All checks pass |
| `npm pack --dry-run` | Package contents | Lists correct files |

---

## 3. Project Structure

```
aiknowsys/
├── bin/cli.js              # CLI entry point
├── lib/                    # TypeScript source
│   ├── commands/           # Command implementations
│   │   ├── query-plans.ts  # Query plan metadata (JSON)
│   │   ├── query-sessions.ts # Query session history
│   │   ├── search-context.ts # Full-text search
│   │   ├── rebuild-index.ts # Rebuild context index
│   │   └── ... (other commands)
│   ├── context/            # Storage adapter layer (v0.10.0+)
│   │   ├── storage-adapter.ts # Base interface
│   │   ├── json-storage.ts # JSON implementation
│   │   └── types.ts        # Type definitions
│   └── utils.js            # Shared utilities
├── templates/              # All template files
│   ├── skills/             # Skill templates (user-facing)
│   ├── stacks/             # Stack-specific templates
│   └── ...
├── .github/skills/         # Universal skills (includes maintainer-only)
├── .aiknowsys/             # AI knowledge system
│   ├── context-index.json  # Context index (auto-generated, committed)
│   ├── PLAN_*.md           # Implementation plans
│   ├── plans/              # Multi-developer plan tracking
│   ├── learned/            # Project-specific learned patterns
│   └── sessions/           # Session notes (gitignored)
├── docs/archived/          # Archived changelog entries (v0.11.0+)
│   ├── README.md           # Archive index and search guide
│   └── changelog-2025-and-earlier.md # Pre-v0.11.0 sessions
└── package.json
```

**Note:** As of v0.11.0, `CODEBASE_CHANGELOG.md` contains **milestone entries only** (releases, breaking changes). Daily work is in `.aiknowsys/sessions/` (indexed and queryable via CLI).

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
- **AI agents never modify templates during normal workflow**
- Templates in `templates/` are deliverables distributed to users
- User customization happens in generated files (after `aiknowsys init`)
- **Exception:** Deliberate template maintenance requires:
  - Implementation plan documented (`.aiknowsys/plans/PLAN_*.md` or similar)
  - Tests written FIRST (TDD - see Invariant #7)
  - Architect review before release (`.aiknowsys/reviews/`)
  - Validation passing (`validate-deliverables`)
  - Migration guide for users ([docs/migration-guide.md](docs/migration-guide.md))
  - See: [.aiknowsys/learned/template-maintenance.md](.aiknowsys/learned/template-maintenance.md) for workflow

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
- **Full workflow:** [.github/skills/tdd-workflow/SKILL.md](.github/skills/tdd-workflow/SKILL.md)

### 8. Deliverables Consistency
- Templates (`templates/` directory) are **deliverables** distributed to users
- ANY change to core functionality MUST update corresponding templates
- Templates must match non-template equivalents
- Run `npx aiknowsys validate-deliverables` before commits/releases
- Pre-commit hook automatically validates when templates/changed

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
node bin/cli.js --help  # CLI functional
```

### Common Patterns

**Logger pattern (CLI commands in lib/commands/):**
```typescript
import { createLogger } from '../logger.js';
const log = createLogger(options._silent);
log.header('Title', '🎯');
log.success('Done');
```

**Console output (standalone scripts in scripts/):**
```javascript
// Scripts use console.log for direct output (not integrated into CLI)
console.log('📦 Script Name\n');
console.log('✅ Task complete');
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

**Chalk 5.x is ESM-only:**
```typescript
import chalk from 'chalk';  // ✅ Must use import
const { default: chalk } = require('chalk');  // ❌ Won't work
```

**Import extensions required:**
```typescript
import { fn } from './utils.js';  // ✅ .js extension required
import { fn } from './utils';     // ❌ Won't resolve
```

**For detailed solutions:** See [.aiknowsys/learned/common-gotchas.md](.aiknowsys/learned/common-gotchas.md)

---

## 8. Extending AIKnowSys

**Adding commands:** Create `lib/commands/my-command.ts`, register in `bin/cli.js`, add tests  
**Adding skills:** Create `.github/skills/my-skill/SKILL.md`, register in AVAILABLE_SKILLS  
**Pattern:** Follow existing code, write tests FIRST (TDD)

**Full guide:** See [.aiknowsys/learned/extending-aiknowsys.md](.aiknowsys/learned/extending-aiknowsys.md)

---

## 9. MCP Tools (Required for AIKnowSys)

**⚡ Performance:** MCP tools are **10-100x faster** than CLI equivalents (O(1) index lookup vs subprocess spawn)

**🎯 When to use:** If MCP server is running in VS Code, **always prefer MCP tools** over CLI commands or file reading for context queries.

### Working MCP Tools (Verified ✅)

**Context Query (Read-Only):**
```typescript
// Get critical invariants (MANDATORY rules)
mcp_aiknowsys_get_critical_invariants()
// Returns: 8 invariants with rule details

// Get validation matrix (commands to run after changes)
mcp_aiknowsys_get_validation_matrix()
// Returns: Validation commands by category

// Get recent sessions (indexed, O(1) lookup)
mcp_aiknowsys_get_recent_sessions({ days: 7 })
// Returns: Session metadata with topics, plans, dates

// Get skill by exact name (direct file read)
mcp_aiknowsys_get_skill_by_name({ skillName: "tdd-workflow" })
// Returns: Full skill file content (496+ lines)
```

**⚠️ Note:** Other MCP tools exist but have CLI flag bugs. See [.aiknowsys/sessions/2026-02-09-session.md] for status.

### MCP vs CLI vs File Reading

| Task | MCP Tool | CLI Command | File Reading | Speed |
|------|----------|-------------|--------------|-------|
| Get critical invariants | `mcp_aiknowsys_get_critical_invariants()` | N/A | `read_file()` ESSENTIALS | **100x faster** |
| Get validation commands | `mcp_aiknowsys_get_validation_matrix()` | N/A | `read_file()` ESSENTIALS | **100x faster** |
| Get recent sessions | `mcp_aiknowsys_get_recent_sessions({days:7})` | `query-sessions --days 7` | `list_dir()` + `read_file()` x N | **10-50x faster** |
| Get skill content | `mcp_aiknowsys_get_skill_by_name({skillName})` | `read_file()` | `read_file()` | **Same speed** (direct read) |
| Search context | `search_context()` (when fixed) | `search-context "query"` | `grep_search()` | **10x faster** |

**🚀 Best Practice:** Check MCP availability first, fall back to CLI if unavailable.

### Setup

**Check if MCP is available:**
- Look for `mcp_aiknowsys_*` tools in your tool list
- MCP server must be running in VS Code
- See [mcp-server/SETUP.md](mcp-server/SETUP.md) for installation

---

## 10. When to Document Where

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
- Template maintenance workflows ([.aiknowsys/learned/template-maintenance.md](.aiknowsys/learned/template-maintenance.md))

---

**Current Size:** ~250 lines (76% reduction from original 1039 lines)  
**Architecture:** MCP-first (skills/context discovered dynamically, not listed here)  
**Setup:** See Section 9 for MCP server configuration
