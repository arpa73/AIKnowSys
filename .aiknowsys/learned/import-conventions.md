---
title: Import Conventions for TypeScript Migration
triggers:
  - "import pattern"
  - "node:fs import"
  - "standardize imports"
  - "fs import"
  - "path import"
category: typescript-patterns
created: 2026-02-04
author: arno-paffen
---

# Import Conventions for TypeScript Migration

**Context:** During TypeScript migration, we need consistent import patterns for Node.js built-in modules across all TypeScript files.

**Problem:** Inconsistent import styles reduce code reviewability and make future refactoring harder.

---

## Standard Import Patterns

### Node.js Built-in Modules (fs, path, etc.)

**Use namespace imports with `node:` prefix:**

```typescript
// ✅ CORRECT - Namespace import with node: prefix
import * as fs from 'node:fs';
import * as path from 'node:path';

// Usage
fs.readFileSync(path.join(dir, 'file.txt'));
```

**For async operations, use promises namespace:**

```typescript
// ✅ CORRECT - Async operations via promises
import * as fs from 'node:fs/promises';

// Usage
await fs.readFile(filePath, 'utf-8');
```

**AVOID these patterns:**

```typescript
// ❌ INCONSISTENT - No node: prefix
import * as fs from 'fs';

// ❌ INCONSISTENT - Named imports (harder to track usage)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

// ❌ INCONSISTENT - Promises as alias
import { promises as fs } from 'node:fs';
```

---

## Rationale

### Why namespace imports?

1. **Clarity:** `fs.readFileSync()` is self-documenting - you know it's a file system operation
2. **Refactoring:** Easy to find all fs operations with `fs.` search
3. **No naming conflicts:** Multiple imports don't collide (fs.read vs stream.read)
4. **IDE support:** Better autocomplete when you type `fs.`

### Why `node:` prefix?

1. **Official Node.js recommendation:** Distinguishes built-ins from userland packages
2. **Future-proof:** Prevents conflicts if a userland package has same name
3. **Clarity:** Explicit that this is a Node.js built-in, not a third-party library

---

## Migration Strategy

### Existing Code (Batch 1 & 2)

**Current state:** Mixed patterns exist
- Batch 1 files use: `import * as fs from 'fs/promises'`
- Batch 2 files vary: some `fs`, some `node:fs`, some named imports

**Decision:** Leave existing batches as-is (no breaking changes needed).

### Future Code (Batch 3+)

**All new TypeScript files MUST use:**

```typescript
// For sync operations (most common in our CLI)
import * as fs from 'node:fs';
import * as path from 'node:path';

// For async operations (rare in our CLI)
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
```

---

## Examples from Codebase

### Good Examples (Future Pattern)

```typescript
// lib/commands/future-command.ts
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createLogger } from '../logger.js';

export async function futureCommand(options) {
  const targetDir = path.resolve(options.dir || process.cwd());
  const configPath = path.join(targetDir, 'config.json');
  
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf-8');
    // ...
  }
}
```

### Legacy Examples (Keep as-is)

```typescript
// lib/commands/archive-sessions.ts (Batch 1)
import * as fs from 'fs/promises';  // OK - existing code
import * as path from 'path';       // OK - existing code

// lib/commands/sync.ts (Batch 2)
import * as fs from 'fs';           // OK - existing code
import * as path from 'path';       // OK - existing code
```

---

## Quick Reference

| Module | Import Pattern | Example Usage |
|--------|---------------|---------------|
| fs (sync) | `import * as fs from 'node:fs'` | `fs.readFileSync(path)` |
| fs (async) | `import * as fs from 'node:fs/promises'` | `await fs.readFile(path)` |
| path | `import * as path from 'node:path'` | `path.join(a, b)` |
| url | `import * as url from 'node:url'` | `url.fileURLToPath(...)` |
| process | `import process from 'node:process'` | `process.cwd()` |

---

## Validation

**When reviewing TypeScript code, check:**

- [ ] All Node.js built-ins use `node:` prefix
- [ ] All Node.js built-ins use namespace import (`import * as`)
- [ ] Async operations use `node:fs/promises`, not `promises as fs` alias
- [ ] Consistent pattern within each file (don't mix styles)

---

## Related Patterns

- **ES Module Extensions:** All relative imports require `.js` extension (even for `.ts` files)
- **Third-party Packages:** Use named imports where appropriate (e.g., `import { createLogger }`)
- **Type Imports:** Use `import type` for type-only imports when possible

---

*Established during TypeScript migration Phase 3 Batch 2 architect review.*
