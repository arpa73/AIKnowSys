# Learned Skill: Common JavaScript/Node.js Gotchas

**Pattern Type:** error_resolution  
**Created:** January 29, 2026  
**Discovered During:** Project development and debugging  
**Trigger Words:** "ESM", "__dirname", "chalk import", "path separators", "require", "common errors", "gotchas"

## When to Use

Reference this skill when encountering:
- Import/export errors in ES Modules
- Path-related bugs
- Cross-platform compatibility issues
- Library-specific quirks

## Gotchas and Solutions

### 1. ESM `__dirname` Not Available

**Problem:**
```javascript
// ❌ ERROR: __dirname is not defined in ES modules
const templatePath = path.join(__dirname, 'templates');
```

**Error Message:**
```
ReferenceError: __dirname is not defined in ES module scope
```

**Solution:**
```javascript
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const templatePath = path.join(__dirname, 'templates');
```

**Or use our utility:**
```javascript
import { getPackageDir } from './utils.js';

const packageDir = getPackageDir(import.meta.url);
const templatePath = path.join(packageDir, 'templates');
```

**Why this happens:**
- CommonJS has `__dirname` and `__filename` as globals
- ES Modules don't have these (different module system)
- Must construct them from `import.meta.url`

---

### 2. Chalk 5.x is ESM-only

**Problem:**
```javascript
// ❌ ERROR: Cannot use require() with chalk 5.x
const chalk = require('chalk');
```

**Error Message:**
```
Error [ERR_REQUIRE_ESM]: require() of ES Module not supported.
```

**Solution:**
```javascript
// ✅ Use import instead
import chalk from 'chalk';

console.log(chalk.green('Success!'));
```

**Why this happens:**
- Chalk 5.x is pure ESM (no CommonJS build)
- `require()` only works with CommonJS
- Must use `import` for ESM packages

**Additional:**
- If you need Chalk 4.x (supports CommonJS): `npm install chalk@4`
- But our project uses ES Modules, so Chalk 5.x is fine

---

### 3. Template Variables in Markdown

**Problem:**
```javascript
// Trying to replace {{VAR}} in markdown files
const content = fs.readFileSync('template.md', 'utf-8');
content.replace('{{PROJECT_NAME}}', projectName);  // Might not work!
```

**Why it fails:**
- Curly braces `{}` have special meaning in regex
- Some templating engines might interpret `{{VAR}}`
- String replacement might miss edge cases

**Solution:**
```javascript
// Use regex with proper escaping
function replaceVariables(content, replacements) {
  let result = content;
  
  for (const [key, value] of Object.entries(replacements)) {
    // Escape regex special characters
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedKey, 'g');
    result = result.replace(regex, value);
  }
  
  return result;
}

// Usage
const content = replaceVariables(template, {
  '{{PROJECT_NAME}}': 'my-project',
  '{{DATE}}': new Date().toLocaleDateString()
});
```

**Or use our copyTemplate utility:**
```javascript
import { copyTemplate } from './utils.js';

await copyTemplate(source, dest, {
  '{{PROJECT_NAME}}': answers.projectName,
  '{{DATE}}': new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
});
```

---

### 4. Path Separators (Windows vs Unix)

**Problem:**
```javascript
// ❌ BREAKS ON WINDOWS: Hardcoded Unix separator
const filePath = baseDir + '/templates/' + filename;
```

**Why it fails:**
- Unix uses `/` (forward slash)
- Windows uses `\` (backslash)
- Hardcoded separators break cross-platform

**Solution:**
```javascript
// ✅ WORKS EVERYWHERE: Use path.join()
import path from 'node:path';

const filePath = path.join(baseDir, 'templates', filename);
```

**Additional path utilities:**
```javascript
// Resolve absolute path
const absolutePath = path.resolve(options.dir);

// Get directory name
const dirname = path.dirname(filePath);

// Get file extension
const ext = path.extname(filePath);  // '.js'

// Get filename without extension
const basename = path.basename(filePath, '.js');

// Normalize path (fix slashes)
const normalized = path.normalize('/foo//bar/../baz');  // '/foo/baz'
```

---

### 5. Import Extensions Required in ES Modules

**Problem:**
```javascript
// ❌ ERROR: Missing file extension
import { myFunction } from './utils';
```

**Error Message:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
```

**Solution:**
```javascript
// ✅ Include .js extension
import { myFunction } from './utils.js';
```

**Why this happens:**
- ES Modules require explicit file extensions
- Node.js doesn't auto-resolve `.js` like it does in CommonJS
- This is intentional (faster module resolution)

---

### 6. JSON Import Syntax

**Problem:**
```javascript
// ❌ ERROR: JSON must use assertion
import data from './config.json';
```

**Solution (Node 18+):**
```javascript
// ✅ Use import assertion
import data from './config.json' assert { type: 'json' };
```

**Or read dynamically:**
```javascript
import fs from 'node:fs/promises';

const data = JSON.parse(
  await fs.readFile('./config.json', 'utf-8')
);
```

---

### 7. Async File Operations

**Problem:**
```javascript
// ⚠️ BLOCKING: Synchronous file operations
const content = fs.readFileSync('huge-file.txt', 'utf-8');
```

**Better:**
```javascript
// ✅ NON-BLOCKING: Use async/await
import fs from 'node:fs/promises';

const content = await fs.readFile('huge-file.txt', 'utf-8');
```

**When to use sync:**
- Startup/initialization (one-time reads)
- CLI tools (blocking is expected)
- Small files (<1MB)

**When to use async:**
- Large files
- Multiple files
- Production servers
- User-facing operations

---

## Quick Reference

| Problem | Solution |
|---------|----------|
| `__dirname` not defined | Use `fileURLToPath(import.meta.url)` |
| Can't require() chalk | Use `import chalk from 'chalk'` |
| Template vars broken | Use regex escaping or copyTemplate utility |
| Path separators break | Use `path.join()`, never string concat |
| Import fails | Add `.js` extension to imports |
| JSON import fails | Use import assertion or fs.readFile |
| Blocking file I/O | Use `fs/promises` for async operations |

## Related

- Core Invariant: [ES Modules Only](../../CODEBASE_ESSENTIALS.md#critical-invariants) - Why we use import/export
- Utility: [lib/utils.js](../../lib/utils.js) - Helper functions (getPackageDir, copyTemplate)
- Testing: [test/](../../test/) - See examples of proper imports

## Discovery Notes

**Why this became a learned skill:**
- Collection of problem-solution pairs (perfect for learned skills)
- Project-specific context (ES Modules, Chalk 5.x choices)
- Can expand without bloating ESSENTIALS.md
- Helps new contributors avoid common pitfalls

**Impact:**
- Faster debugging (known solutions)
- Fewer GitHub issues (common errors documented)
- Better onboarding (gotchas explained upfront)
