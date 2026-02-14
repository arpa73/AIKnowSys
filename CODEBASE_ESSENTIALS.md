# aiknowsys - Codebase Essentials

> **Last Updated:** February 14, 2026  
> **Purpose:** AI-Powered Development Workflow Template  
> **Maintainer:** arpa73  
> **Version:** v0.10.0 (MCP-First Architecture + Natural Language Query API)

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
| **MCP Server** | **@modelcontextprotocol/sdk 1.26.0 (36 tools for AI agents)** |

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

**Barrel exports (Code Organization):**
```typescript
// Use barrel exports (api.ts, index.ts) when:
// - Multiple modules need to import from same package
// - Consolidating public API surface
// - Hiding internal implementation details

// Example: mcp-server/src/api.ts exports all public tools
export { querySessionsSqlite, queryPlansSqlite } from './tools/sqlite-query.js';
export { getCriticalInvariants } from './tools/context.js';

// Usage: Import from barrel instead of individual files
import { querySessionsSqlite, getCriticalInvariants } from '../../mcp-server/src/api.js';
// vs 4+ separate import statements
```

**Error Response Patterns (v0.11.0+):**

All commands and MCP tools use structured error responses for AI agents.

```typescript
import { AIFriendlyErrorBuilder } from '../utils/error-builder.js';

// Invalid parameter (typo, case, missing)
AIFriendlyErrorBuilder.invalidParameter(
  'status',
  'Use one of: ACTIVE, PAUSED, COMPLETE',
  ['{ "status": "ACTIVE" }']  // examples (optional)
);

// Tool/command not found
AIFriendlyErrorBuilder.toolNotFound('query-session', ['query-sessions']);

// Validation failure
AIFriendlyErrorBuilder.validationFailed(
  'filters',
  'Invalid date format',
  'Use YYYY-MM-DD'
);

// Missing required parameter
AIFriendlyErrorBuilder.missingRequired(
  'dbPath',
  'Path to SQLite database',
  ['/path/to/db.sqlite']
);
```

**Response format:**
```typescript
{
  success: false,
  error: {
    type: 'InvalidParameter' | 'ToolNotFound' | 'ValidationFailed' | 'MissingRequired',
    message: string,             // Human-readable description
    parameter?: string,          // Which param failed
    suggestion?: string,         // How to fix
    similar_errors?: string[],   // Typo suggestions
    correct_usage?: UsageExample[], // Working examples
    docs_url: string            // Documentation link
  }
}
```

**When to use:**
- CLI commands parsing user input
- MCP tools with parameter validation
- Any error AI agents need to learn from

**Why:**
- Reduces blind retries (agent gets guidance)
- Self-improving (learns correct syntax)
- Token efficient (one error teaches pattern)

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

**Build system limitations:**
TypeScript compilation doesn't copy non-.ts files to dist/. Manual workaround:
```bash
mkdir -p dist/scripts
cp scripts/*.js dist/scripts/
cp lib/context/*.sql dist/lib/context/
cp package.json dist/
```
Affects: migrate-to-sqlite command (needs schema.sql, migrate-learned-patterns.js, package.json)

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

**Mutation Tools (Write Operations - 10 tools available):**

**Session File Management:**
```typescript
// Create new session file
mcp_aiknowsys_create_session({
  title: "Implement feature X",
  topics: ["feature", "implementation"],  // optional
  status: "active"  // optional: active | paused | complete
})

// Append content to session section
mcp_aiknowsys_append_to_session({
  date: "2026-02-13",  // optional, defaults to today
  section: "## Changes",
  content: "Fixed bug Y"
})

// Prepend critical update to session
mcp_aiknowsys_prepend_to_session({
  section: "## Critical Issue",
  content: "Security fix needed"
})

// Insert after specific section
mcp_aiknowsys_insert_after_section({
  pattern: "## Goal",  // literal string to match
  section: "## Progress",  // optional new section
  content: "Step 1 complete"
})

// Update session YAML frontmatter metadata
mcp_aiknowsys_update_session_metadata({
  date: "2026-02-10",  // optional, defaults to today
  addTopic: "mcp-server",  // optional
  addFile: "server.ts",  // optional
  setStatus: "in-progress"  // optional: in-progress | complete | abandoned
})
// At least one operation required
```

**Plan File Management:**
```typescript
// Create new plan file
mcp_aiknowsys_create_plan({
  id: "feature_x",  // lowercase with underscores
  title: "Add Feature X",
  type: "feature",  // optional: feature | refactor | bugfix | research
  priority: "high"  // optional: high | medium | low
})

// Append progress to plan
mcp_aiknowsys_append_to_plan({
  planId: "PLAN_feature_x",
  content: "Phase 1 complete: 19/19 tests passing"
})

// Prepend critical update to plan
mcp_aiknowsys_prepend_to_plan({
  planId: "PLAN_feature_x",
  content: "⚠️ BLOCKER: API breaking change detected"
})

// Set plan status
mcp_aiknowsys_set_plan_status({
  planId: "PLAN_feature_x",
  status: "COMPLETE"  // ACTIVE | PAUSED | COMPLETE | CANCELLED
})

// Update plan YAML frontmatter metadata
mcp_aiknowsys_update_plan_metadata({
  planId: "PLAN_feature_x",
  author: "arno-paffen",  // optional
  topics: ["feature-x", "api"]  // optional
})
// At least one field (author or topics) required
```

**Archival Tools:**
```typescript
// Archive old session files
mcp_aiknowsys_archive_sessions({
  days: 30,  // optional, default 30
  dryRun: false  // optional, default false
})
// Moves sessions older than N days to .aiknowsys/sessions/archive/

// Archive plans by status
mcp_aiknowsys_archive_plans({
  status: "COMPLETE",  // optional, default COMPLETE (also: CANCELLED, PAUSED)
  days: 7,  // optional, default 7
  dryRun: false  // optional, default false
})
// Moves plans with status inactive >N days to .aiknowsys/plans/archive/
```

**🚀 Total: 10 mutation tools available** (6 session + 4 plan management tools)

**Usage Pattern:** 
- Use `create_*` to start new sessions/plans
- Use `append_*` / `prepend_*` for content updates (main workflow)
- Use `insert_*` for surgical placement (rare)
- Use `update_*_metadata` for YAML frontmatter changes
- Use `set_plan_status` / `archive_*` for lifecycle management

**SQLite Backend Tools (Phase 1 - Experimental):**
```typescript
// Get database statistics
mcp_aiknowsys_get_db_stats_sqlite({ dbPath: ".aiknowsys/knowledge.db" })
// Returns: Record counts, database size, last updated
// Performance: ~9ms average

// Query sessions with filters
mcp_aiknowsys_query_sessions_sqlite({
  dbPath: ".aiknowsys/knowledge.db",
  dateAfter: "2026-02-01",  // optional
  dateBefore: "2026-02-13",  // optional
  topic: "mcp-tools"  // optional
})
// Returns: Session metadata + content
// Performance: ~3.6ms average (100x faster than file scanning)

// Query plans with filters
mcp_aiknowsys_query_plans_sqlite({
  dbPath: ".aiknowsys/knowledge.db",
  status: "ACTIVE",  // optional: ACTIVE | PAUSED | COMPLETE | CANCELLED
  author: "arno-paffen",  // optional
  topic: "mcp"  // optional
})
// Returns: Plan metadata + content
// Performance: ~7ms average

// Query learned patterns
mcp_aiknowsys_query_learned_patterns_sqlite({
  dbPath: ".aiknowsys/knowledge.db",
  category: "error_resolution",  // optional
  keywords: "yaml,parsing"  // optional, comma-separated
})
// Returns: Pattern metadata + content
// Performance: ~18ms average

// Full-text search across all content
mcp_aiknowsys_search_context_sqlite({
  dbPath: ".aiknowsys/knowledge.db",
  query: "SQLite migration",
  limit: 10  // optional, default 10
})
// Returns: Ranked results with snippets
// Performance: ~18ms average
```

**Token Optimization Pattern (v0.12.0+):**

All SQLite query tools support the `includeContent` parameter for token efficiency:

```typescript
// Default: Metadata-only (95%+ token savings)
mcp_aiknowsys_query_sessions_sqlite({
  dateAfter: "2026-02-01"
  // includeContent defaults to false
})
// Returns: ~1KB for 4 sessions (date, title, status, topics, timestamps)
// No content field - ideal for navigation/discovery

// Opt-in: Full content (when you need analysis)
mcp_aiknowsys_query_sessions_sqlite({
  dateAfter: "2026-02-01",
  includeContent: true
})
// Returns: ~90KB for same 4 sessions (includes full markdown content)
// Use for deep analysis or when specific details needed
```

**When to use:**
- **Metadata-only (default):** Browsing sessions by date/topic, listing plans, discovering patterns
- **Full content:** Reading specific session details, code review, troubleshooting

**Performance impact:** 97.4% token reduction (validated Feb 2026)

**Setup Required:**
1. Run `npx aiknowsys migrate-to-sqlite` to create `.aiknowsys/knowledge.db`
2. Database must exist before using SQLite tools
3. Re-run migration after creating new sessions/plans/patterns

**See:** [mcp-server/SETUP.md](mcp-server/SETUP.md) for full setup guide

**Natural Language Query API (Layer 3 - v0.12.0+):**

All SQLite query tools accept **conversational parameters** alongside structured filters:

```typescript
// Style 1: Natural language (conversational)
mcp_aiknowsys_query_sessions_sqlite({
  when: "last week",
  about: "MCP testing"
})

// Style 2: Relative dates (human-friendly)
mcp_aiknowsys_query_sessions_sqlite({
  last: 7,
  unit: "days",
  topic: "sqlite"
})

// Style 3: Structured (backward compatible)
mcp_aiknowsys_query_sessions_sqlite({
  dateAfter: "2026-02-07",
  topic: "mcp-tools"
})

// All three styles work! Priority: when > last/unit > dateAfter
```

**Supported natural language time expressions:**
- Keywords: `"yesterday"`, `"today"`, `"last week"`, `"last month"`, `"this week"`, `"this month"`
- Time ago: `"3 days ago"`, `"2 weeks ago"`, `"1 month ago"`
- Case insensitive: `"Last Week"`, `"YESTERDAY"`, `"3 Days Ago"`
- Extract from queries: `"show me sessions from last week"` → extracts "last week"

**Supported tools:**
- `mcp_aiknowsys_query_sessions_sqlite({ when, about, last, unit })`
- `mcp_aiknowsys_query_plans_sqlite({ when, about, last, unit })`
- `mcp_aiknowsys_query_learned_patterns_sqlite({ when, about, last, unit })`

**Implementation:**
- Parser: [mcp-server/src/utils/time-parser.ts](mcp-server/src/utils/time-parser.ts) (UTC-aware)
- Converter: [mcp-server/src/utils/query-parser.ts](mcp-server/src/utils/query-parser.ts)
- Tests: 28 time parser tests + 31 query parser tests (all passing)

**Why this matters:**
- Agents can use conversational queries (`when: "yesterday"`) instead of computing dates
- Backward compatible - all existing structured queries still work
- Priority-based: Natural language > Relative > Structured (predictable behavior)

### MCP vs CLI vs File Reading

| Task | MCP Tool | CLI Command | File Reading | Speed |
|------|----------|-------------|--------------|-------|
| Get critical invariants | `mcp_aiknowsys_get_critical_invariants()` | N/A | `read_file()` ESSENTIALS | **100x faster** |
| Get validation commands | `mcp_aiknowsys_get_validation_matrix()` | N/A | `read_file()` ESSENTIALS | **100x faster** |
| Get recent sessions | `mcp_aiknowsys_get_recent_sessions({days:7})` | `query-sessions --days 7` | `list_dir()` + `read_file()` x N | **10-50x faster** |
| **Query sessions (SQLite)** | `mcp_aiknowsys_query_sessions_sqlite()` | `migrate-to-sqlite` + query | File scanning + parsing | **100x faster (3.6ms)** |
| **Query plans (SQLite)** | `mcp_aiknowsys_query_plans_sqlite()` | N/A | File scanning + parsing | **100x faster (7ms)** |
| **Search context (SQLite)** | `mcp_aiknowsys_search_context_sqlite()` | N/A | `grep_search()` | **10-50x faster (18ms)** |
| Get skill content | `mcp_aiknowsys_get_skill_by_name({skillName})` | `read_file()` | `read_file()` | **Same speed** (direct read) |
| Search context | `search_context()` (when fixed) | `search-context "query"` | `grep_search()` | **10x faster** |

**🚀 Best Practice:** 
1. Use SQLite tools if database exists (fastest)
2. Fall back to file-based MCP tools if no database
3. Fall back to CLI if MCP unavailable

### Setup

**Check if MCP is available:**
- Look for `mcp_aiknowsys_*` tools in your tool list
- MCP server must be running in VS Code
- See [mcp-server/SETUP.md](mcp-server/SETUP.md) for installation

### Testing MCP Tools from Command Line

Test individual MCP tools without running the full server using the `mcp-test` command:

```bash
# Test database stats
npx aiknowsys mcp-test get-db-stats '{}'

# Test critical invariants
npx aiknowsys mcp-test get-invariants '{}'

# Query sessions (natural language)
npx aiknowsys mcp-test query-sessions '{"when":"last week"}'

# Query active plans
npx aiknowsys mcp-test get-active-plans '{}'

# Search context
npx aiknowsys mcp-test search-context '{"query":"MCP testing"}'

# Find relevant skill
npx aiknowsys mcp-test find-skill '{"task":"refactoring"}'
```

**Available tool names:**
- `get-db-stats` - Database statistics
- `get-invariants` - Critical project rules
- `get-validation-matrix` - Validation commands
- `get-active-plans` - Active implementation plans
- `get-recent-sessions` - Recent session history
- `query-sessions` - Query sessions with filters
- `query-plans` - Query plans with filters
- `query-patterns` - Query learned patterns
- `search-context` - Full-text search
- `find-skill` - Find relevant skill

**Flags:**
- `--silent` - Suppress output (useful for scripting)
- `--json` - JSON-only output (no formatting)

**Smart features:**
- Auto-detects database path (no manual configuration!)
- Pretty-prints JSON results
- Shows execution time
- Color-coded success/error messages

**Performance:** 98.3% testing friction reduction (20-30 min manual scripts → 10 sec command)

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
