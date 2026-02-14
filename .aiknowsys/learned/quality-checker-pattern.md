# Quality Checker Pattern

**Trigger Words:** "quality check", "code health", "pattern scanner", "add checker", "new quality rule"

**What This Is:** A reusable architectural pattern for building independent, composable code quality checkers with consistent interfaces.

---

## When to Use

Use this pattern when:
- Adding new code quality checks (e.g., detect unused imports, check file naming)
- Building health monitoring for codebases
- Creating modular validation systems
- Need composable checkers that can run independently or together

---

## Pattern Overview

**Architecture:** Independent checker modules orchestrated by a main command.

```
quality-check.js (orchestrator)
├── essentials-bloat.js (checker)
├── template-validator.js (checker)
├── link-validator.js (checker)
├── pattern-scanner.js (checker)
└── common.js (shared constants)
```

**Key Principles:**
1. **Single Responsibility** - Each checker validates one thing
2. **Consistent Interface** - All checkers return same structure
3. **Configuration-Driven** - Thresholds and exclusions from config
4. **Independent** - Checkers can be used alone or orchestrated
5. **Testable** - Each checker has isolated unit tests

---

## Checker Interface

Every quality checker exports a single async function with this signature:

```javascript
/**
 * Check something about the codebase
 * @param {string} targetDir - Directory to check
 * @param {Object} config - Configuration options
 * @returns {Promise<Object>} Check result
 */
export async function checkSomething(targetDir, config = {}) {
  // 1. Extract config with sensible defaults
  const threshold = config.someThreshold || DEFAULT_VALUE;
  const excludePatterns = config.excludePatterns || DEFAULT_EXCLUDE_PATTERNS;
  
  // 2. Scan/analyze files
  const violations = [];
  // ... scanning logic ...
  
  // 3. Return consistent structure
  if (violations.length > 0) {
    return {
      passed: false,
      severity: 'error' | 'warning',  // Optional
      message: 'Brief summary',
      fix: 'How to fix this issue',    // Optional
      violations: [...]                // Optional
    };
  }
  
  return {
    passed: true,
    message: 'Everything OK'
  };
}
```

**Required fields:**
- `passed` (boolean) - Did the check pass?
- `message` (string) - Human-readable summary

**Optional fields:**
- `severity` (string) - 'error', 'warning', or 'info'
- `fix` (string) - Suggested fix command or action
- `violations` (array) - Detailed list of issues found
- `details` (object) - Additional structured data

---

## Implementation Steps

### 1. Create Checker Module

**File:** `lib/quality-checkers/my-checker.js`

```javascript
import { promises as fs } from 'fs';
import path from 'path';
import { DEFAULT_EXCLUDE_PATTERNS } from './common.js';

export async function checkMyRule(targetDir, config = {}) {
  const excludePatterns = config.excludePatterns || DEFAULT_EXCLUDE_PATTERNS;
  const violations = [];
  
  // Scan files
  const files = await findRelevantFiles(targetDir, excludePatterns);
  
  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf-8');
    // Check logic here
    if (ruleViolated) {
      violations.push({
        file: path.relative(targetDir, filePath),
        line: lineNumber,
        reason: 'Why this is wrong',
        context: relevantCode
      });
    }
  }
  
  if (violations.length > 0) {
    return {
      passed: false,
      severity: 'warning',
      message: `Found ${violations.length} violation(s)`,
      fix: 'Run: command-to-fix',
      violations
    };
  }
  
  return {
    passed: true,
    message: 'No violations found'
  };
}

// Helper function
async function findRelevantFiles(dir, excludePatterns) {
  // Recursive file walking with exclusions
  // ...
}
```

### 2. Add Tests (TDD)

**File:** `test/quality-check.test.js` (or separate test file)

```javascript
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'fs';
import path from 'path';
import { checkMyRule } from '../lib/quality-checkers/my-checker.js';

describe('My Rule Checker', () => {
  const TEST_DIR = path.join(process.cwd(), 'test-temp-my-rule');
  
  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
  });
  
  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });
  
  it('should detect violations', async () => {
    // Create test file with violation
    await fs.writeFile(
      path.join(TEST_DIR, 'bad.js'),
      'violating code here'
    );
    
    const result = await checkMyRule(TEST_DIR);
    
    assert.strictEqual(result.passed, false);
    assert.strictEqual(result.violations.length, 1);
  });
  
  it('should pass when no violations', async () => {
    await fs.writeFile(
      path.join(TEST_DIR, 'good.js'),
      'clean code here'
    );
    
    const result = await checkMyRule(TEST_DIR);
    
    assert.strictEqual(result.passed, true);
  });
});
```

### 3. Register in Orchestrator

**File:** `lib/commands/quality-check.js`

```javascript
import { checkMyRule } from '../quality-checkers/my-checker.js';

export async function qualityCheck(options = {}) {
  // ... existing code ...
  
  const checks = {
    essentials: await checkEssentialsBloat(targetDir, qualityConfig),
    templates: await validateTemplates(targetDir, qualityConfig),
    links: await validateLinks(targetDir, qualityConfig),
    patterns: await scanPatterns(targetDir, qualityConfig),
    myRule: await checkMyRule(targetDir, qualityConfig)  // ADD THIS
  };
  
  // ... rest of orchestration ...
}
```

### 4. Update Display Logic

Add display section in `displayResults()` function:

```javascript
function displayResults(log, checks, dryRun) {
  // ... existing checks ...
  
  log.cyan('\n🔍 My Rule:');
  if (checks.myRule.passed) {
    log.success(`✓ ${checks.myRule.message}`);
  } else {
    log.error(`✗ ${checks.myRule.message}`);
    if (checks.myRule.violations) {
      checks.myRule.violations.slice(0, 5).forEach(v => {
        log.dim(`  • ${v.file}:${v.line} - ${v.reason}`);
      });
      if (checks.myRule.violations.length > 5) {
        log.dim(`  ... and ${checks.myRule.violations.length - 5} more`);
      }
    }
  }
}
```

### 5. Add Configuration

**File:** `templates/hooks/config.json`

```json
{
  "qualityChecks": {
    "essentialsMaxLines": 800,
    "myRuleThreshold": 10,
    "excludePatterns": [
      "node_modules",
      ".git",
      "dist"
    ]
  }
}
```

---

## Shared Utilities

**File:** `lib/quality-checkers/common.js`

```javascript
/**
 * Default patterns to exclude from quality checks
 */
export const DEFAULT_EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  'templates',
  '.aiknowsys/archive'
];

/**
 * Recursive file walker with exclusions
 */
export async function findFiles(dir, extensions, excludePatterns) {
  const files = [];
  
  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (excludePatterns.includes(entry.name)) {
        continue;
      }
      
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  await walk(dir);
  return files;
}
```

---

## Best Practices

### ✅ DO:

1. **Keep checkers focused** - One checker = one rule
2. **Use shared constants** - Import from `common.js`
3. **Provide helpful messages** - Clear error descriptions
4. **Include fix suggestions** - Tell users how to resolve issues
5. **Test extensively** - Cover edge cases, missing files, empty dirs
6. **Handle errors gracefully** - Never crash, return structured errors
7. **Respect configuration** - Use config for thresholds and exclusions
8. **Use relative paths** - In violation reports (easier to read)

### ❌ DON'T:

1. **Don't mix concerns** - Keep checkers single-purpose
2. **Don't hardcode paths** - Use config or constants
3. **Don't crash on missing files** - Return empty results or errors
4. **Don't use `console.log`** - Return data, let orchestrator display
5. **Don't skip tests** - Always write tests first (TDD)
6. **Don't duplicate file walking** - Use shared utilities
7. **Don't ignore config** - Always accept and use config parameter

---

## Pattern Violations to Detect

Good candidates for quality checkers:

**Code Quality:**
- Unused imports/variables
- Console.log statements in production code
- TODO/FIXME comments (with age threshold)
- File size violations (>500 lines)
- Cyclomatic complexity

**Documentation:**
- Missing JSDoc on public functions
- Outdated copyright years
- Broken external links
- Missing README sections

**Patterns:**
- Hardcoded credentials
- require() in ES module projects
- Direct process.exit() calls
- Synchronous fs methods in async code

**Structure:**
- Files in wrong directories
- Naming convention violations
- Circular dependencies

---

## Example: Real Checkers

See implementations in `lib/quality-checkers/`:
- `essentials-bloat.js` - Single file size check (simplest)
- `template-validator.js` - Pattern matching with regex
- `link-validator.js` - Cross-file reference validation (complex)
- `pattern-scanner.js` - Multiple rules in one checker

---

## Testing Pattern

**TDD Workflow:**

1. **RED** - Write failing test
   ```javascript
   it('should detect bad pattern', async () => {
     await fs.writeFile(TEST_FILE, 'bad code');
     const result = await checker(TEST_DIR);
     assert.strictEqual(result.passed, false);
   });
   ```

2. **GREEN** - Implement minimal code to pass
   ```javascript
   export async function checker(targetDir) {
     // Minimal implementation
     return { passed: false, message: 'Found issue' };
   }
   ```

3. **REFACTOR** - Clean up while tests stay green
   ```javascript
   export async function checker(targetDir, config = {}) {
     const violations = await scan(targetDir);
     return formatResult(violations);
   }
   ```

---

## Common Pitfalls

### 1. False Positives

**Problem:** Detecting code in comments or strings

**Solution:**
```javascript
lines.forEach((line, index) => {
  const trimmed = line.trim();
  
  // Skip comments
  if (trimmed.startsWith('//') || trimmed.startsWith('*')) {
    return;
  }
  
  // Skip regex patterns
  if (/\/.*\/[gimuy]*/.test(line)) {
    return;
  }
  
  // Now safe to check
  if (violatesRule(line)) {
    violations.push({...});
  }
});
```

### 2. Detector Detects Itself

**Problem:** Pattern scanner flags its own regex patterns

**Solution:** Exclude checker files or add smarter detection:
```javascript
// In config.json
"excludeFiles": ["lib/quality-checkers/pattern-scanner.js"]

// Or in code:
const isOwnFile = filePath.includes('quality-checkers');
if (isOwnFile) return;
```

### 3. Inconsistent Exclusions

**Problem:** Different checkers exclude different paths

**Solution:** Use shared constant:
```javascript
import { DEFAULT_EXCLUDE_PATTERNS } from './common.js';
const excludePatterns = config.excludePatterns || DEFAULT_EXCLUDE_PATTERNS;
```

---

## Integration with VSCode Hooks

Quality checks can run automatically via sessionStart hook:

**File:** `templates/hooks/quality-health.cjs`

```javascript
// Quick, non-blocking health check at session start
function quickHealthCheck() {
  // Run subset of checks (fast ones only)
  // Output warnings to stderr
  // Always exit 0 (non-blocking)
}
```

**Benefits:**
- Immediate feedback when opening project
- Catches issues before they compound
- Non-intrusive (warnings, not errors)

---

*This pattern was extracted from Phase 4 VSCode Hooks implementation (quality-check command and quality checkers).*
