# aiknowsys - Codebase Essentials

> **Last Updated:** February 7, 2026  
> **Purpose:** AI-Powered Development Workflow Template  
> **Maintainer:** arpa73  
> **Version:** v0.10.0 (Skill-Indexed Architecture)

⚠️ **MAJOR CHANGE:** ESSENTIALS is now a skill index, not a workflow encyclopedia.  
**Full workflows** are in [.github/skills/](/.github/skills/) (auto-loaded on trigger detection).

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
└── package.json
```

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
- **Full workflow:** [.github/skills/tdd-workflow/SKILL.md](.github/skills/tdd-workflow/SKILL.md)

### 8. Deliverables Consistency
- Templates (`templates/` directory) are **deliverables** distributed to users
- ANY change to core functionality MUST update corresponding templates
- Templates must match non-template equivalents
- Run `npx aiknowsys validate-deliverables` before commits/releases
- Pre-commit hook automatically validates when templates/changed

---

## 5. Skill Index (Auto-Load on Trigger Detection)

**How this works:**
1. AI agent detects trigger words in user request
2. AI calls `npx aiknowsys query-essentials "<skill-name>"` to load full workflow
3. AI follows loaded workflow (cannot skip or "think they know")

**Why this prevents mistakes:**
- Critical invariants ALWAYS loaded (above section, not optional)
- Detailed workflows loaded ON-DEMAND (prevents "I thought I knew" failures)
- 70-80% token reduction (300 lines + 100 skill vs 1039 lines total)

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

#### Dependency Management
**[dependency-management](.github/skills/dependency-management/SKILL.md)**
- **Triggers:** "update deps", "upgrade packages", "security fix", "npm update"
- **Summary:** Safe upgrade procedures - security-first, incremental updates, rollback plans
- **Why use:** Prevents breaking changes from surprise dependencies
- **Output:** Updated package.json, test results

#### Context7 Integration
**[context7-usage](.github/skills/context7-usage/SKILL.md)**
- **Triggers:** "query framework docs", "Context7", "library documentation"
- **Summary:** Query up-to-date documentation via Context7 MCP server
- **Why use:** Always current docs instead of outdated web search
- **Output:** Framework-specific code examples, API documentation

#### Skill Management
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

### Maintainer Skills (Not Distributed to Users)

These skills have `maintainer: true` in frontmatter and stay in `.github/skills/`:

**[deliverable-review](.github/skills/deliverable-review/SKILL.md)**
- **Purpose:** Monthly quality reviews using Context7 MCP for current framework docs
- **When:** Pre-release validation, framework major version updates

**[_skill-template](.github/skills/_skill-template/SKILL.md)**
- **Purpose:** Template for creating new skills following VS Code Agent Skills standard

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

## 9. Context Query Commands (v0.10.0+)

**Purpose:** Query plans/sessions/context via CLI instead of file searching

**Available commands:**
```bash
npx aiknowsys query-plans --status ACTIVE --json
npx aiknowsys query-sessions --days 7 --json
npx aiknowsys search-context "TDD" --scope all --json
npx aiknowsys rebuild-index
```

**Full documentation + workflow:** [.github/skills/context-query/SKILL.md](.github/skills/context-query/SKILL.md)

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

---

**Target:** ESSENTIALS <400 lines (achieved: ~330 lines, 68% reduction from 1039 lines)  
**Full workflows:** [.github/skills/](.github/skills/) (auto-loaded on trigger detection)
