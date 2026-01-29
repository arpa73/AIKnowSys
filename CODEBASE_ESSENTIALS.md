# aiknowsys - Codebase Essentials

> **Last Updated:** January 24, 2026  
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
| `npm test` | Run unit tests | All 164 tests pass |
| `npm run lint` | Lint codebase | No errors or warnings |
| `npm run test:coverage` | Code coverage | >80% coverage on lib/ |
| `node bin/cli.js --help` | CLI works | Shows help without errors |
| `node bin/cli.js scan --dir .` | Scan command | Generates draft ESSENTIALS |
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
│   ├── stacks/             # Stack-specific templates
│   ├── AGENTS.template.md
│   ├── CODEBASE_ESSENTIALS.template.md
│   ├── CODEBASE_ESSENTIALS.minimal.template.md
│   └── CODEBASE_CHANGELOG.template.md
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

### Logger Utility Pattern

**Location:** `lib/logger.js`

**Purpose:** Centralized logging utility with silent mode support for all CLI commands.

**Factory Function:**
```javascript
import { createLogger } from '../logger.js';

const log = createLogger(silent);  // silent = true/false
```

**Available Methods:**

| Method | Purpose | Color | Icon | Silent Mode |
|--------|---------|-------|------|-------------|
| `log(msg)` | Standard output | White | - | ✅ Respects |
| `error(msg)` | Error messages | Red | ❌ | ✅ Respects |
| `warn(msg)` | Warnings | Yellow | ⚠️ | ✅ Respects |
| `info(msg)` | Information | Blue | ℹ️ | ✅ Respects |
| `success(msg)` | Success messages | Green | ✅ | ✅ Respects |
| `blank()` | Empty line | - | - | ✅ Respects |
| `header(msg, icon)` | Section header | Cyan bold | Custom | ✅ Respects |
| `section(title, icon)` | Subsection | Cyan | Custom | ✅ Respects |
| `dim(msg)` | Secondary text | Gray | - | ✅ Respects |
| `cyan(msg)` | Cyan text | Cyan | - | ✅ Respects |
| `white(msg)` | White text | White | - | ✅ Respects |
| `yellow(msg)` | Yellow text | Yellow | - | ✅ Respects |
| `green(msg)` | Green text | Green | - | ✅ Respects |

**Usage Examples:**
```javascript
import { createLogger } from '../logger.js';

export async function myCommand(options) {
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  // Headers and sections
  log.header('Initialization', '🎯');
  log.blank();
  log.section('Configuration', '⚙️');
  
  // Standard output
  log.cyan('Processing files...');
  log.dim('Step 1 of 3');
  
  // Status messages
  log.info('Found 12 files');
  log.success('All tests passed!');
  log.warn('Deprecated feature detected');
  log.error('File not found: config.json');
  
  // Color helpers
  log.white('Regular text');
  log.yellow('Highlighted text');
  log.green('Positive feedback');
}
```

**Benefits:**
- ✅ Testable (silent mode allows testing output)
- ✅ Consistent UX across all commands
- ✅ Single source of truth for logging
- ✅ Errors always show (even in silent mode)
- ✅ Easy to extend (add new methods in one place)

**Testing:**
```javascript
import { test } from 'node:test';
import { myCommand } from '../lib/commands/myCommand.js';

test('myCommand runs without output in silent mode', async () => {
  // Silent mode prevents console pollution during tests
  await myCommand({ _silent: true });
  // Verify behavior, not output
});
```

### Inquirer Prompt Compatibility
```javascript
// ⚠️ IMPORTANT: Use 'rawlist' instead of 'list' for VS Code terminal compatibility
// VS Code integrated terminal doesn't support arrow key navigation in 'list' prompts
// 'rawlist' shows numbered options that users can type (1, 2, 3)

// ✅ GOOD: Works in all terminals (VS Code, iTerm, terminals, WSL)
await inquirer.prompt([{
  type: 'rawlist',      // Shows numbered list, user types number
  name: 'choice',
  message: 'Select option:',
  choices: [...],
  default: 1            // Use number for default (1 = first option)
}]);

// ❌ BAD: Doesn't work in VS Code terminal
await inquirer.prompt([{
  type: 'list',         // Requires arrow keys - broken in VS Code
  name: 'choice',
  message: 'Select option:',
  choices: [...]
}]);

// Other types that work universally:
// - 'input' (text input)
// - 'confirm' (yes/no)
// - 'checkbox' (multi-select with space key)
// - 'password' (hidden input)
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

### Progress Indicators for Long Operations
```javascript
// Pattern 1: File operations - update every N items
const spinner = silent ? null : ora('Processing files...').start();
let filesProcessed = 0;
for (const file of files) {
  filesProcessed++;
  if (spinner && filesProcessed % 50 === 0) {
    spinner.text = `Processing... (${filesProcessed} files)`;
  }
}
if (spinner) spinner.succeed('Processing complete');

// Pattern 2: Multi-step checks - show step count
const spinner = silent ? null : ora('Starting checks...').start();
if (spinner) {
  spinner.text = 'Check 1/5: Validating structure...';
} else {
  log.white('Validating structure...');
}
// ... check logic ...
log.log('  ✓ Structure valid');

if (spinner) {
  spinner.text = 'Check 2/5: Analyzing patterns...';
} else {
  log.white('Analyzing patterns...');
}
// ... check logic ...
if (spinner) spinner.succeed('All checks complete');

// Pattern 3: Sequential phases - reuse spinner
const spinner = ora('Phase 1: Initializing...').start();
spinner.succeed('Phase 1 complete');
spinner.start('Phase 2: Processing...');
spinner.succeed('Phase 2 complete');
spinner.start('Phase 3: Finalizing...');
spinner.succeed('Phase 3 complete');
```

**Key Principles:**
- Update every N items (not every item) for file operations
- Use conditional output: spinner shows progress, log shows results
- Respect silent mode: `spinner = silent ? null : ora(...)`
- Reuse spinner instances across related phases
- Always call succeed/fail/info to clear spinner state

### Session Files vs Changelog
```
**When to use .aiknowsys/sessions/YYYY-MM-DD-session.md:**
- Multi-hour or multi-task work in progress
- Working memory for AI-to-AI continuity
- Temporary notes, blockers, and next steps
- Gitignored (never committed)

**When to use CODEBASE_CHANGELOG.md:**
- Completed work sessions
- Permanent record (git committed)
- Learning archive for future reference
- Single source of truth for project history

**Workflow:**
Day 1: Create session file → work → update session notes
Day 2: Continue from session file → complete work
Day 3: Move session to changelog → delete session file
```

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

1. **ESM `__dirname` Not Available**
   - Use `fileURLToPath(import.meta.url)` instead
   - See `lib/utils.js` for `getPackageDir()`

2. **Chalk 5.x is ESM-only**
   - Cannot use `require('chalk')` - must import

3. **Template Variables in Markdown**
   - Double curly braces (`{{VAR}}` syntax) can conflict with templating engines
   - Use regex escaping when replacing

4. **Path Separators**
   - Always use `path.join()`, never string concatenation
   - Works across Windows/Unix

---

## 7. Adding New Commands

1. Create `lib/commands/new-command.js`
2. Export async function with `options` parameter
3. Register in `bin/cli.js`:
   ```javascript
   import { newCommand } from '../lib/commands/new-command.js';
   
   program
     .command('new-command')
     .description('Description here')
     .option('-d, --dir <directory>', 'Target directory', '.')
     .action(newCommand);
   ```
4. Update README.md command table
5. For commands that check/create files, add version tracking if needed

**Version Tracking Pattern:**
```javascript
// For update-like commands, track version in .aiknowsys-version file
function getCurrentVersion(targetDir) {
  const versionFile = path.join(targetDir, '.aiknowsys-version');
  if (fs.existsSync(versionFile)) {
    return fs.readFileSync(versionFile, 'utf-8').trim();
  }
  return null;
}
```

---

## 8. Adding New Skills

1. Create `templates/skills/skill-name/SKILL.md`
2. Follow structure from existing skills
3. Add to `AVAILABLE_SKILLS` array in `lib/commands/install-skills.js`
4. Document in README

---

## 9. Testing Philosophy

We practice **Test-Driven Development (TDD)** for all new features:

1. **Write test first** - Define expected behavior before implementation
2. **Watch it fail (RED)** - Verify test catches the missing feature
3. **Implement minimal code (GREEN)** - Make the test pass
4. **Refactor** - Clean up while tests stay green

**Benefits:**
- Better code design (testable code is decoupled code)
- Fewer bugs (issues caught before shipping)
- Confidence in refactoring (tests catch regressions)
- Living documentation (tests show intent)

**Test Organization:**
```
test/
├── init.test.js           # Command tests
└── test-stack.js          # Manual integration tests
```

**Running Tests:**
```bash
npm test                   # Run all tests
node --test test/init.test.js --watch  # Watch mode
```

**When adding features:**
1. Add test to `test/init.test.js` (or create new test file)
2. Watch test fail (`npm test`)
3. Implement feature
4. Watch test pass
5. Refactor if needed
6. Commit with passing tests

See `.github/skills/tdd-workflow/SKILL.md` for detailed TDD guidance.

---

## 10. Release Checklist

- [ ] Bump version: `npm version patch/minor/major` (auto-updates package.json)
- [ ] Test all commands locally
- [ ] Run `npm pack --dry-run` to verify package contents
- [ ] Update CODEBASE_CHANGELOG.md
- [ ] `npm publish`

---

*This file is the single source of truth for AI assistants working on aiknowsys.*
