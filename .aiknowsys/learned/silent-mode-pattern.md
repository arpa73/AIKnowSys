# Learned Pattern: Silent Mode for Testable Commands

**Pattern Type:** project_specific  
**Created:** January 26, 2026  
**Proven In:** 5 commands (init, sync, audit, update, migrate)  
**Trigger Words:** "make testable", "add silent mode", "_silent flag", "test coverage"

---

## When to Use

Use this pattern when:
- Writing a new CLI command that needs unit testing
- Refactoring existing commands for test coverage
- Commands call nested commands programmatically
- Need to suppress console output during tests

---

## The Pattern

### 1. Add _silent Flag
```javascript
export async function commandName(options) {
  const silent = options._silent || false;
  
  // ... rest of implementation
}
```

### 2. Wrap All Console Output
```javascript
if (!silent) {
  console.log(chalk.cyan('📋 User-facing output'));
}
```

### 3. Conditional Spinners
```javascript
const spinner = silent ? null : ora('Processing...').start();

// Later in code:
if (spinner) spinner.text = 'Updated message...';
if (spinner) spinner.succeed('Done!');
if (spinner) spinner.fail('Failed!');
```

### 4. Replace process.exit() with throw
```javascript
// ❌ BAD - Kills test runner
if (error) {
  console.log(chalk.red('Error!'));
  process.exit(1);
}

// ✅ GOOD - Testable error handling
if (error) {
  if (!silent) console.log(chalk.red('Error!'));
  throw new Error('Descriptive error message');
}
```

### 5. Return Structured Data
```javascript
// Enable test assertions by returning data
return {
  status: 'success',
  filesCreated: 5,
  warnings: [],
  // ... whatever tests need to verify
};
```

---

## Complete Example

```javascript
import chalk from 'chalk';
import ora from 'ora';

export async function myCommand(options) {
  const targetDir = path.resolve(options.dir);
  const silent = options._silent || false;
  
  // Header (skip in silent mode)
  if (!silent) {
    console.log('');
    console.log(chalk.cyan.bold('🎯 My Command'));
    console.log('');
  }
  
  // Validation (throw instead of exit)
  if (!fs.existsSync(targetDir)) {
    if (!silent) {
      console.log(chalk.red('❌ Directory not found'));
    }
    throw new Error('Directory not found');
  }
  
  // Spinner (null in silent mode)
  const spinner = silent ? null : ora('Processing...').start();
  
  try {
    // Do work
    const result = doWork(targetDir);
    
    if (spinner) spinner.succeed('Complete!');
    
    // Success message
    if (!silent) {
      console.log('');
      console.log(chalk.green('✅ Success!'));
      console.log('');
    }
    
    // Return data for tests
    return {
      success: true,
      filesProcessed: result.count,
      warnings: result.warnings
    };
    
  } catch (error) {
    if (spinner) spinner.fail('Failed!');
    if (!silent) console.log(chalk.red(`   Error: ${error.message}`));
    throw error; // Re-throw for test assertions
  }
}
```

---

## Test Usage

```javascript
import { myCommand } from '../lib/commands/my-command.js';
import assert from 'node:assert';

it('should process files correctly', async () => {
  const result = await myCommand({ 
    dir: testDir, 
    _silent: true  // No console spam in test output!
  });
  
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.filesProcessed, 5);
});

it('should throw on invalid directory', async () => {
  await assert.rejects(
    () => myCommand({ dir: '/nonexistent', _silent: true }),
    { message: 'Directory not found' }
  );
});
```

---

## Benefits

✅ **Clean test output** - No console spam during test runs  
✅ **Testable errors** - Can assert on thrown errors instead of exits  
✅ **Verifiable results** - Return values enable detailed assertions  
✅ **Programmatic use** - Commands can call each other without output noise  
✅ **Backward compatible** - Default behavior unchanged (silent=false)

---

## Common Mistakes

❌ **Forgetting to check spinner before use:**
```javascript
const spinner = silent ? null : ora('...').start();
spinner.succeed(); // 💥 Crashes if silent=true
```

✅ **Always check spinner:**
```javascript
if (spinner) spinner.succeed();
```

❌ **Using process.exit() with error:**
```javascript
process.exit(1); // Kills test runner
```

✅ **Throw error instead:**
```javascript
throw new Error('Message'); // Testable
```

❌ **Not returning data:**
```javascript
// Function returns nothing - can't assert results
```

✅ **Return structured data:**
```javascript
return { success: true, count: 5 };
```

---

## Related Patterns

- TDD workflow: `.github/skills/tdd-workflow/SKILL.md`
- Test organization: `test/helpers/testUtils.js`
- Command structure: `CODEBASE_ESSENTIALS.md` section 4

---

## Commands Using This Pattern

1. **init.js** - Project initialization (20 tests)
2. **sync.js** - File synchronization (13 tests)
3. **audit.js** - Quality audit (20 tests)
4. **update.js** - System updates (23 tests)
5. **migrate.js** - Migration workflow (17 tests)

**Total test coverage enabled:** 93 tests across 5 commands
