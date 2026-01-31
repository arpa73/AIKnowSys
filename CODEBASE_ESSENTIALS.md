# aiknowsys - Codebase Essentials

> **Last Updated:** January 29, 2026  
> **Purpose:** AI-Powered Development Workflow Template  
> **Maintainer:** arpa73

---

## 1. Technology Snapshot

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |
| Language | JavaScript (ES Modules) |
| CLI Framework | Commander.js 14.x |
| User Prompts | Inquirer.js 13.x |
| Terminal UI | Chalk 5.x, Ora 9.x |
| Package Manager | npm |
| Distribution | npm registry |

---

## 2. Validation Matrix

| Command | Purpose | Expected |
|---------|---------|----------|
| `npm test` | Run unit tests | All 255+ tests pass |
| `npm run lint` | Lint codebase | No errors or warnings |
| `npm run test:coverage` | Code coverage | >80% coverage on lib/ |
| `node bin/cli.js --help` | CLI works | Shows help without errors |
| `node bin/cli.js scan --dir .` | Scan command | Generates draft ESSENTIALS |
| `node bin/cli.js check` | Validation + bloat detection | ESSENTIALS <800 lines |
| `node bin/cli.js compress-essentials --analyze` | Preview compression | Shows opportunities |
| `npm pack --dry-run` | Package contents | Lists correct files |

---

## 3. Project Structure

```
aiknowsys/
├── bin/
│   └── cli.js              # CLI entry point
├── lib/
│   ├── commands/           # Command implementations
│   │   ├── init.js         # New project setup (entry point)
│   │   ├── init/           # Init command modules
│   │   │   ├── index.js    # Barrel exports
│   │   │   ├── constants.js # Stack configs
│   │   │   ├── prompts.js  # Interactive prompts
│   │   │   ├── display.js  # Output formatting
│   │   │   └── openspec.js # OpenSpec integration
│   │   ├── scan.js         # Codebase scanner
│   │   ├── migrate.js      # Migration workflow
│   │   ├── install-agents.js
│   │   └── install-skills.js
│   └── utils.js            # Shared utilities
├── templates/              # All template files
│   ├── agents/             # Agent templates
│   ├── skills/             # Skill templates
│   ├── git-hooks/          # TDD git hooks
│   ├── scripts/            # TDD install scripts
│   ├── workflows/          # GitHub Actions workflows
│   ├── hooks/              # VSCode session hooks (optional)
│   │   ├── hooks.json      # Hook configuration
│   │   ├── session-start.js # Auto-load context
│   │   ├── session-end.js  # Auto-save state
│   │   ├── validation-reminder.cjs # Stop hook (validation enforcement)
│   │   ├── tdd-reminder.cjs # PreToolUse hook (TDD reminders)
│   │   ├── collaboration-check.mjs # Concurrent work detection
│   │   ├── performance-monitor.cjs # Performance tracking
│   │   ├── migration-check.cjs # Version mismatch detection
│   │   └── doc-sync.cjs # Documentation staleness tracking
│   ├── stacks/             # Stack-specific templates
│   ├── AGENTS.template.md
│   ├── CODEBASE_ESSENTIALS.template.md
│   ├── CODEBASE_ESSENTIALS.minimal.template.md
│   └── CODEBASE_CHANGELOG.template.md
├── .aiknowsys/             # AI knowledge system (user workspace)
│   ├── performance-history.json # Performance tracking (gitignored, last 100 runs)
│   ├── CURRENT_PLAN.md     # Active plan pointer
│   ├── learned/            # Project-specific patterns (committed)
│   └── sessions/           # Session notes (gitignored)
├── scripts/                # Bash alternatives (legacy)
├── examples/               # Stack-specific examples
├── docs/                   # Documentation
└── package.json
```

---

## 4. Core Patterns

### CLI Command Structure
```javascript
// All commands follow this pattern:
import { createLogger } from '../logger.js';

export async function commandName(options) {
  const targetDir = path.resolve(options.dir);
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  // 1. Display header
  log.header('Command Title', '🎯');
  
  // 2. Interactive prompts (if needed, skip if silent)
  if (!silent) {
    const answers = await inquirer.prompt([...]);
  }
  
  // 3. Spinner for long operations (conditional on silent mode)
  const spinner = silent ? null : ora('Doing work...').start();
  
  // 4. Execute logic
  try {
    // ... work
    if (spinner) spinner.succeed('Done');
    
    // Return data for test assertions
    return { success: true, data: result };
  } catch (error) {
    if (spinner) spinner.fail('Failed');
    log.error('Failed: ' + error.message);
    throw error;  // Testable - don't use process.exit()
  }
  
  // 5. Display next steps
  log.cyan('📖 Next steps:');
}
```

### Logger Pattern
All commands use `createLogger(silent)` for consistent, testable output. See [learned skill](.aiknowsys/learned/logger-pattern.md) for detailed usage, methods, and examples.

```javascript
import { createLogger } from '../logger.js';
const log = createLogger(silent);  // silent = true/false
```

### Inquirer Prompts
Use `'rawlist'` instead of `'list'` for VS Code terminal compatibility. See [learned skill](.aiknowsys/learned/inquirer-compatibility.md) for details.

```javascript
// Use rawlist (numbered options) - works everywhere
await inquirer.prompt([{
  type: 'rawlist',
  name: 'choice',
  message: 'Select option:',
  choices: [...],
  default: 1
}]);
```

### Template Variable Replacement
```javascript
// Use {{VARIABLE}} syntax in templates
copyTemplate(source, dest, {
  '{{PROJECT_NAME}}': answers.projectName,
  '{{DATE}}': new Date().toLocaleDateString(...)
});
```

### Silent Mode for Nested Calls
```javascript
// Commands accept _silent option for programmatic use
export async function installAgents(options) {
  const silent = options._silent || false;
  if (!silent) {
    console.log(...);
  }
}
```

### Progress Indicators
For detailed guidance on progress indicators and spinners, see the [learned skill](.aiknowsys/learned/progress-indicators.md). This project uses ora spinners with three distinct patterns depending on the operation type (file processing, multi-step checks, or sequential phases). Always call `succeed()`, `fail()`, or `info()` to clear spinner state.

### Plan Management Pattern
**Multiple concurrent plans** enabled via pointer system.

**.aiknowsys/CURRENT_PLAN.md:**
- Lightweight index file (pointer)
- Lists all plans with status
- Indicates active plan

**Individual Plans (.aiknowsys/PLAN_*.md):**
- Full implementation details
- Progress tracking
- Phase/step breakdown

**Workflow:**
1. Planner creates PLAN_*.md
2. Updates CURRENT_PLAN.md pointer
3. Developer follows active plan
4. Progress tracked in PLAN_*.md
5. Completed plans stay visible

**Status Lifecycle:**
📋 PLANNED → 🎯 ACTIVE → 🔄 PAUSED or ✅ COMPLETE or ❌ CANCELLED

See: [AGENTS.md](AGENTS.md#plan-management)

---

## 5. Critical Invariants

1. **ES Modules Only**
   - All files use `import`/`export`, never `require()`
   - package.json has `"type": "module"`

2. **Absolute Paths Required**
   - Always use `path.resolve()` for user-provided paths
   - Use `getPackageDir()` for template paths

3. **Graceful Failures**
   - All commands must handle missing files/directories
   - Show helpful error messages, not stack traces

4. **Template Preservation**
   - Never modify files in `templates/` - they're the source of truth
   - User customization happens in generated files

5. **Template Structure Integrity**
   - When AI fills CODEBASE_ESSENTIALS.md, NEVER change section headings
   - Replace `{{PLACEHOLDERS}}` with real values, not generic placeholders
   - Preserve template structure exactly (don't rename sections)
   - Example: Keep "Testing Patterns" as-is, don't change to "Testing Guidelines"
   - Example: Replace `{{TEST_ORGANIZATION}}` with actual test structure, not "Manual testing only"

6. **Backwards Compatibility**
   - Bash scripts in `scripts/` must remain functional
   - npm CLI is additive, not replacement

7. **Test-Driven Development (TDD)**
   - Write tests BEFORE implementation for new features
   - Follow RED-GREEN-REFACTOR cycle
   - Keep tests fast and focused
   - **Exception:** Configuration-only changes (e.g., adding properties to const objects) don't require new tests if existing tests already cover the logic using that configuration
   - See `.github/skills/tdd-workflow/SKILL.md` for detailed guidance

---

## 6. Common Gotchas

See [learned skill](.aiknowsys/learned/common-gotchas.md) for detailed solutions to common issues:
- ESM `__dirname` not available (use `fileURLToPath(import.meta.url)`)
- Chalk 5.x is ESM-only (must use `import`, not `require()`)
- Template variables in markdown (use regex escaping)
- Path separators (always use `path.join()`, never string concatenation)
- Import extensions required (must include `.js`)
- JSON import syntax (use import assertions)
- **CommonJS in ES module projects**: Use `.cjs` extension when you need CommonJS (require/module.exports) in a project with `"type": "module"` in package.json. Example: VSCode hooks use `.cjs` because stdin JSON parsing is simpler with CommonJS than ES module async imports.

---

## 7. Extending AIKnowSys

For adding new commands or skills, see [learned skill](.aiknowsys/learned/extending-aiknowsys.md).

**Quick reference:**
- Commands: Create `lib/commands/my-command.js`, register in `bin/cli.js`, add tests
- Skills: Create `templates/skills/my-skill/SKILL.md`, register in `install-skills.js`
- Follow existing patterns, write tests first (TDD)

**Universal Learned Skills:**
- `plan-management.md` - Multi-plan concurrent workflow pattern
- `essentials-compression.md` - ESSENTIALS bloat detection and compression

### When to Document Where

**Add to CODEBASE_ESSENTIALS.md when:**
- Core architecture decision (technology choice)
- Universal pattern (all files of type X follow this)
- Critical invariant (cannot be violated)
- Project structure change (new directories, file organization)
- Core command/feature that ships with aiknowsys

**Add to .aiknowsys/learned/ when:**
- Project-specific discovery (specific to this codebase)
- Workaround for library/framework quirk
- Optional technique that improves quality
- Pattern that emerged from practice (not designed upfront)
- Error resolution that might recur

**Why this matters:** Keeps ESSENTIALS focused on architecture while allowing learned skills to capture project evolution. Target: ESSENTIALS <800 lines.

---

## 8. Testing Philosophy

We practice **Test-Driven Development (TDD)** for all new features. See [.github/skills/tdd-workflow/SKILL.md](.github/skills/tdd-workflow/SKILL.md) for detailed guidance.

**Quick summary:**
1. Write test first (RED) - Define expected behavior
2. Watch it fail - Verify test catches the issue
3. Implement minimal code (GREEN) - Make the test pass  
4. Refactor - Clean up while tests stay green

**Testing Standards:**
- **Test Runner:** Node.js built-in (`node:test`) - ZERO external dependencies
- **Assertion Library:** `node:assert` module
- **Structure:** `describe()` for test suites, `it()` for individual tests
- **Assertions:** Use `assert.strictEqual()`, `assert.ok()`, `assert.match()`, etc.
- **Mocking:** Use `beforeEach()` / `afterEach()` for setup/teardown

**Example test structure:**
```javascript
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something specific', () => {
    const result = functionUnderTest();
    assert.strictEqual(result, expectedValue);
  });

  afterEach(() => {
    // Cleanup
  });
});
```

**Running tests:**
```bash
npm test                             # Run all tests
node --test test/init.test.js --watch  # Watch mode
```

---

## 9. Release Checklist

- [ ] Bump version: `npm version patch/minor/major` (auto-updates package.json)
- [ ] Test all commands locally
- [ ] Run `npm pack --dry-run` to verify package contents
- [ ] Update CODEBASE_CHANGELOG.md
- [ ] `npm publish`

---

*This file is the single source of truth for AI assistants working on aiknowsys.*
