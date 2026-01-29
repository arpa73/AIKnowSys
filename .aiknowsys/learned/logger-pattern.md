# Learned Skill: Logger Utility Pattern

**Pattern Type:** project_specific  
**Created:** January 29, 2026  
**Discovered During:** Initial project setup  
**Trigger Words:** "logger", "logging", "silent mode", "createLogger", "console output", "testable output"

## When to Use

Use the logger pattern when:
- Creating new CLI commands that need output
- Writing code that must be testable (silent mode required)
- Maintaining consistent UX across commands
- Supporting both interactive and programmatic usage

## Pattern

All commands use `createLogger(silent)` for consistent, testable output.

### Basic Usage

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

### Available Methods

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

### Testing Pattern

```javascript
import { test } from 'node:test';
import { myCommand } from '../lib/commands/myCommand.js';

test('myCommand runs without output in silent mode', async () => {
  // Silent mode prevents console pollution during tests
  const result = await myCommand({ _silent: true });
  
  // Verify behavior, not output
  assert.strictEqual(result.success, true);
});

test('myCommand shows output in interactive mode', async () => {
  // Interactive mode (silent = false) shows user-facing output
  const result = await myCommand({ _silent: false });
  // User sees colored output, progress, etc.
});
```

## Key Principles

1. **Always accept `_silent` option:**
   ```javascript
   export async function myCommand(options) {
     const silent = options._silent || false;
     const log = createLogger(silent);
   }
   ```

2. **Use logger methods, not console.log:**
   ```javascript
   // ✅ GOOD: Respects silent mode
   log.info('Processing...');
   
   // ❌ BAD: Always outputs (breaks tests)
   console.log('Processing...');
   ```

3. **Errors always show (even in silent mode):**
   ```javascript
   // Logger shows errors even when silent = true
   // This helps debugging test failures
   log.error('Failed to read file');
   ```

4. **Return data for assertions:**
   ```javascript
   export async function myCommand(options) {
     // ... work ...
     
     // Return data that tests can assert on
     return { 
       success: true, 
       filesProcessed: 42,
       warnings: []
     };
   }
   ```

## Benefits

- ✅ **Testable:** Silent mode allows testing without console pollution
- ✅ **Consistent UX:** Same colors, icons, spacing across all commands
- ✅ **Single source of truth:** Add methods in one place (lib/logger.js)
- ✅ **Errors always visible:** Even in silent mode (helps debugging)
- ✅ **Easy to extend:** Add new methods without touching every command

## Anti-Patterns (Avoid)

❌ **Using console.log directly:**
```javascript
// BAD - Bypasses silent mode
console.log('Processing...');
```

❌ **Forgetting _silent option:**
```javascript
// BAD - Tests will show output
export async function myCommand(options) {
  const log = createLogger(false);  // Always verbose!
}
```

❌ **Not returning testable data:**
```javascript
// BAD - Tests can't verify behavior
export async function myCommand(options) {
  // ... work ...
  // No return statement - tests can't check results
}
```

❌ **Mixing console and logger:**
```javascript
// BAD - Inconsistent (some respects silent, some doesn't)
log.info('Step 1');
console.log('Step 2');  // Breaks silent mode!
```

## Related

- Core Pattern: [CLI Command Structure](../../CODEBASE_ESSENTIALS.md#cli-command-structure) - Where logger fits in
- Core Pattern: [Silent Mode for Nested Calls](../../CODEBASE_ESSENTIALS.md#silent-mode-for-nested-calls) - Passing _silent to other commands
- Implementation: [lib/logger.js](../../lib/logger.js) - Logger factory function
- All commands use this: [lib/commands/](../../lib/commands/) - Consistent pattern

## Discovery Notes

**Why this became a learned skill:**
- Project-specific implementation (other projects might use different logging)
- Usage examples are detailed (~80 lines in ESSENTIALS)
- Not a critical invariant (could swap logging library without breaking architecture)
- Helps keep ESSENTIALS.md focused on what, not how

**Impact:**
- Consistent user experience across all commands
- Testable CLI (no console pollution in test output)
- Easy to extend (add emojis, formatting, etc. in one place)
- Professional polish (colored output, clear hierarchy)
