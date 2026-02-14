# Learned Skill: Extending AIKnowSys (Adding Commands & Skills)

**Pattern Type:** project_specific  
**Created:** January 29, 2026  
**Discovered During:** Project development  
**Trigger Words:** "add command", "new command", "extend", "new skill", "add skill", "contribute", "customization"

## When to Use

Use this skill when:
- Adding a new CLI command to aiknowsys
- Creating a new skill for `.github/skills/`
- Contributing new features
- Customizing aiknowsys for your needs

## Skill Locations

**`.github/skills/` - Universal skills (shipped with aiknowsys):**
- TDD workflow
- Code refactoring
- Dependency updates
- Feature implementation

**`.aiknowsys/learned/` - Project-specific skills (discovered during development):**
- Logger pattern (this project's implementation)
- Progress indicators (emerged from Sprint 1)
- Common gotchas (ESM-specific issues)
- Inquirer compatibility (VS Code workaround)

Both locations work with VS Code Agent Skills. Use `.github/skills/` for skills you want to share across projects, `.aiknowsys/learned/` for project-specific patterns.

## Adding New Commands

### Step-by-Step Process

**1. Create command file:**
```bash
touch lib/commands/my-command.js
```

**2. Implement command following CLI Command Structure:**
```javascript
import { createLogger } from '../logger.js';
import ora from 'ora';
import path from 'node:path';
import fs from 'node:fs/promises';

export async function myCommand(options) {
  const targetDir = path.resolve(options.dir || '.');
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  // 1. Display header
  log.header('My Command', '🎯');
  log.blank();
  
  // 2. Interactive prompts (if needed, skip if silent)
  if (!silent) {
    const answers = await inquirer.prompt([...]);
  }
  
  // 3. Spinner for long operations
  const spinner = silent ? null : ora('Working...').start();
  
  // 4. Execute logic
  try {
    // ... your work here ...
    
    if (spinner) spinner.succeed('Done!');
    log.success('Command completed successfully');
    
    // Return data for test assertions
    return { success: true, data: results };
    
  } catch (error) {
    if (spinner) spinner.fail('Failed');
    log.error(`Failed: ${error.message}`);
    throw error;  // Don't use process.exit() - breaks tests!
  }
  
  // 5. Display next steps
  log.blank();
  log.cyan('📖 Next steps:');
  log.dim('  1. Review the output');
  log.dim('  2. Run other commands');
}
```

**3. Register command in `bin/cli.js`:**
```javascript
import { myCommand } from '../lib/commands/my-command.js';

program
  .command('my-command')
  .description('Description of what this command does')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--some-option <value>', 'Optional parameter')
  .action(myCommand);
```

**4. Add tests in `test/my-command.test.js`:**
```javascript
import { test } from 'node:test';
import assert from 'node:assert';
import { myCommand } from '../lib/commands/my-command.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

test('myCommand creates expected files', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
  
  try {
    const result = await myCommand({
      dir: tmpDir,
      _silent: true  // Always use silent mode in tests!
    });
    
    assert.strictEqual(result.success, true);
    
    // Verify files were created
    const files = await fs.readdir(tmpDir);
    assert.ok(files.includes('expected-file.txt'));
    
  } finally {
    // Cleanup
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});
```

**5. Update documentation:**
- Add command to `README.md` commands table
- Document options and usage examples
- Add to `CODEBASE_CHANGELOG.md` when shipping

**6. Test manually:**
```bash
# Help text
node bin/cli.js my-command --help

# Run command
node bin/cli.js my-command --dir ./test-project

# Run tests
npm test
```

### Optional: Version Tracking

For commands that check/update files (like `check`, `audit`):

```javascript
function getCurrentVersion(targetDir) {
  const versionFile = path.join(targetDir, '.aiknowsys-version');
  
  if (fs.existsSync(versionFile)) {
    return fs.readFileSync(versionFile, 'utf-8').trim();
  }
  
  return null;
}

function saveVersion(targetDir, version) {
  const versionFile = path.join(targetDir, '.aiknowsys-version');
  fs.writeFileSync(versionFile, version, 'utf-8');
}

// In your command:
const currentVersion = getCurrentVersion(targetDir);
if (currentVersion !== packageVersion) {
  log.warn(`Project version (${currentVersion}) differs from tool version (${packageVersion})`);
}
```

---

## Adding New Skills

### Step-by-Step Process

**1. Create skill directory and file:**
```bash
mkdir -p templates/skills/my-skill
touch templates/skills/my-skill/SKILL.md
```

**2. Write skill following VS Code Agent Skills format:**
```markdown
# Skill: My Skill Name

**Trigger Words:** "keyword1", "keyword2", "scenario description"

## When to Use

Use this skill when:
- Specific scenario occurs
- User asks about [topic]
- Implementing [feature type]

## Step-by-Step Workflow

### Step 1: Analyze the Requirement
- Check for X
- Verify Y
- Identify Z

### Step 2: Implement Solution
\```javascript
// Example code
\```

### Step 3: Validate
\```bash
# Validation commands
\```

## Patterns and Examples

[Detailed patterns, anti-patterns, examples]

## Validation Checklist

- [ ] Tests pass
- [ ] Follows project patterns
- [ ] Documentation updated

## Related

- [Related skill](../other-skill/SKILL.md)
- [Documentation](../../docs/topic.md)
```

**3. Register skill in `lib/commands/install-skills.js`:**
```javascript
const AVAILABLE_SKILLS = [
  // ... existing skills ...
  {
    name: 'my-skill',
    description: 'Short description of what this skill does',
    files: ['SKILL.md']
  }
];
```

**4. Test skill installation:**
```bash
node bin/cli.js install-skills --skills my-skill
```

**5. Update documentation:**
- Add to README.md skills list
- Document what the skill covers
- Provide usage examples

---

## Command Development Best Practices

### 1. Follow Existing Patterns
- Use `createLogger(silent)` for all output
- Accept `_silent` option for tests
- Return data for assertions
- Handle errors gracefully

### 2. Write Tests First (TDD)
```javascript
// Write test BEFORE implementation
test('myCommand does X', async () => {
  const result = await myCommand({ _silent: true });
  assert.strictEqual(result.expected, true);
});

// Then implement to make test pass
```

### 3. Support Silent Mode
```javascript
// ✅ GOOD: Respects silent mode
const spinner = silent ? null : ora('Working...').start();

if (!silent) {
  const answers = await inquirer.prompt([...]);
}

// ❌ BAD: Always shows output
console.log('Working...');  // Breaks tests!
```

### 4. Use Absolute Paths
```javascript
// ✅ GOOD: Absolute path
const targetDir = path.resolve(options.dir);

// ❌ BAD: Relative path (breaks when cwd changes)
const targetDir = options.dir;
```

### 5. Clean Up After Yourself
```javascript
// If command creates temporary files
const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aiknowsys-'));

try {
  // ... work ...
} finally {
  // Always cleanup
  await fs.rm(tmpDir, { recursive: true, force: true });
}
```

---

## Skill Development Best Practices

### 1. Clear Trigger Words
```markdown
**Trigger Words:** "specific", "actionable", "keywords"
```

Make them searchable - what would a developer type?

### 2. Step-by-Step Format
Break complex workflows into numbered steps with clear actions.

### 3. Code Examples
Provide working code, not pseudocode.

### 4. Validation Checklist
Help AI agents verify their work.

### 5. Related Links
Connect to other skills, docs, implementation files.

---

## Testing New Features

```bash
# Run all tests
npm test

# Run specific test file
node --test test/my-command.test.js

# Watch mode (re-run on changes)
node --test test/my-command.test.js --watch

# Test with coverage
npm run test:coverage
```

---

## Related

- Core Pattern: [CLI Command Structure](../../CODEBASE_ESSENTIALS.md#cli-command-structure) - Required pattern
- Core Pattern: [TDD Philosophy](../../CODEBASE_ESSENTIALS.md#testing-philosophy) - Test-first development
- Skill: [TDD Workflow](./.github/skills/tdd-workflow/SKILL.md) - Detailed TDD guidance
- Examples: [lib/commands/](../../lib/commands/) - Existing commands to reference

## Discovery Notes

**Why this became a learned skill:**
- Advanced technique (not needed for basic usage)
- Only needed when extending the tool
- Detailed examples would bloat ESSENTIALS.md
- Helps contributors get started quickly

**Impact:**
- Easier contributions (clear patterns)
- Consistent command structure
- Better test coverage
- Professional quality features
