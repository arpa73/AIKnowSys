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
| `npm test` | Run unit tests | All 31 tests pass |
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
│   │   ├── init.js         # New project setup
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
export async function commandName(options) {
  const targetDir = path.resolve(options.dir);
  
  // 1. Display header
  console.log(chalk.cyan.bold('🎯 Command Title'));
  
  // 2. Interactive prompts (if needed)
  const answers = await inquirer.prompt([...]);
  
  // 3. Spinner for long operations
  const spinner = ora('Doing work...').start();
  
  // 4. Execute logic
  try {
    // ... work
    spinner.succeed('Done');
  } catch (error) {
    spinner.fail('Failed');
    process.exit(1);
  }
  
  // 5. Display next steps
  console.log(chalk.cyan('📖 Next steps:'));
}
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
   - Replace {{PLACEHOLDERS}} with real values, not generic placeholders
   - Preserve template structure exactly (don't rename sections)
   - Example: Keep "Testing Patterns" as-is, don't change to "Testing Guidelines"
   - Example: Replace {{TEST_ORGANIZATION}} with actual test structure, not "Manual testing only"

6. **Backwards Compatibility**
   - Bash scripts in `scripts/` must remain functional
   - npm CLI is additive, not replacement

7. **Test-Driven Development (TDD)**
   - Write tests BEFORE implementation for new features
   - Follow RED-GREEN-REFACTOR cycle
   - Keep tests fast and focused
   - See `.github/skills/tdd-workflow/SKILL.md` for detailed guidance

---

## 6. Common Gotchas

1. **ESM `__dirname` Not Available**
   - Use `fileURLToPath(import.meta.url)` instead
   - See `lib/utils.js` for `getPackageDir()`

2. **Chalk 5.x is ESM-only**
   - Cannot use `require('chalk')` - must import

3. **Template Variables in Markdown**
   - Double curly braces `{{VAR}}` can conflict with templating engines
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
