---
type: technique
discovered: 2026-02-04
source: Batches 6-9 TypeScript migration
trigger_words: migrate to typescript, convert js to ts, add types, typescript conversion, js to typescript
maintainer: false
---

# TypeScript Migration Pattern

**Pattern:** JavaScript → TypeScript conversion workflow for command files  
**Discovered:** During Phase 3 lib/ migration (Batches 6-9, 32 files, ~7,383 lines)  
**Quality Score:** 10/10 (zero violations across all batches)

## When to Use

- Converting existing JavaScript command files to TypeScript
- Migrating helper utilities to TypeScript
- Adding type safety to large codebases
- Planning incremental TypeScript adoption

**DO NOT use for:**
- Template files (stay as .js/.cjs for user compatibility)
- Files that need CommonJS (`require()`) - use `.cjs` instead
- Quick prototypes (TypeScript adds overhead)

---

## The Pattern

### 1. Interface Definition (FIRST!)

Define comprehensive interfaces for all data structures:

```typescript
// Options interface (command parameters)
interface ScanOptions {
  dir: string;              // Required parameters
  output: string;
  _silent?: boolean;        // Optional with ?
}

// Result interface (return data structure)
interface ScanFindings {
  projectName: string;
  frontendFramework: string;
  // ... 25+ properties, all typed
  containerPlatform?: string;  // Optional fields
  patterns: {                  // Nested objects
    hasApiRoutes: boolean;
    hasAuthMiddleware: boolean;
    hasErrorHandling: boolean;
    hasValidation: boolean;
  };
}
```

**Why this order?**
- Interfaces guide implementation
- Type errors appear early (easier to fix)
- Self-documenting code structure

### 2. Import Patterns

Follow strict import conventions:

```typescript
// Node.js built-ins: namespace import with 'node:' prefix
import * as fs from 'node:fs';
import * as path from 'node:path';

// Type-only imports: use 'import type'
import type { Ora } from 'ora';

// Regular imports
import ora from 'ora';
import { createLogger } from '../logger.js';

// ✅ MUST include .js extension (ES modules requirement)
```

**Critical rules:**
- Always use `node:` prefix for built-ins (fs, path, etc.)
- Use `import type` for type-only imports (prevents runtime inclusion)
- Include `.js` extension for local imports (ESM requirement)
- Never mix `require()` - use ES modules only

### 3. Function Signatures

Type all parameters and return values:

```typescript
export async function scan(options: ScanOptions): Promise<ScanFindings> {
  const targetDir = path.resolve(options.dir);
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  // Implementation...
}

// Helper functions: explicit types
function scanForPatterns(
  dir: string, 
  findings: ScanFindings, 
  spinner: Ora | null = null,  // ✅ Null default pattern
  filesScanned = 0,             // Default parameters
  depth = 0
): number {                     // Explicit return type
  // Implementation...
}
```

**Best practices:**
- Always specify return types (don't rely on inference)
- Use `Ora | null` for conditional spinners
- Default parameters: `= null`, `= 0`, `= false`
- Promise types: `Promise<void>`, `Promise<ResultType>`

### 4. Null Handling

Safe null/undefined handling throughout:

```typescript
// Pattern 1: Conditional spinner creation
const spinner: Ora | null = silent ? null : ora('Loading...').start();

// Pattern 2: Safe usage
if (spinner) spinner.succeed('Done');

// Pattern 3: Optional chaining
const testCmd = pkg.scripts?.test;  // string | undefined

// Pattern 4: Map.get with null check
const content = fileChanges.get(filePath);
if (!content) continue;  // ✅ No non-null assertion (!)
```

**Avoid:**
- Non-null assertions (`!`) - use explicit checks instead
- Unchecked nulls - always validate before use

### 5. Type Casting

Clean, minimal type casting:

```typescript
// Error handling: cast to Error
try {
  // ...
} catch (error) {
  log.error((error as Error).message);  // ✅ Simple cast
  throw error;
}

// Dynamic objects: use Record<K, V>
const deps: Record<string, string> = {
  ...pkg.dependencies,
  ...pkg.devDependencies
};
```

**Rules:**
- Prefer type guards over casts when possible
- Use `as` for simple casts (never `as any`)
- `Record<string, T>` for dynamic key-value objects
- Document with comments if cast is non-obvious

### 6. Strict Mode Compliance

Enable strict TypeScript checking:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**Implications:**
- No `any` types (use `unknown` if needed)
- All nulls/undefined must be handled
- All parameters must be typed
- Return types should be explicit

### 7. Validation Workflow

Always validate after migration:

```bash
# Step 1: Build (TypeScript compilation)
npm run build

# Step 2: Tests (functionality preserved)
npm test

# Step 3: Lint (code quality)
npm run lint

# Step 4: Manual testing (CLI commands)
node bin/cli.js <command> --help
```

**Fix order:**
1. Build errors (type issues) - MUST fix
2. Test failures (logic errors) - MUST fix
3. Lint warnings (style issues) - SHOULD fix
4. Manual verification - confirm UX unchanged

---

## Real-World Example

**Before (JavaScript):**
```javascript
export async function scan(options) {
  const targetDir = path.resolve(options.dir);
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  const spinner = silent ? null : ora('Scanning...').start();
  
  const findings = {
    projectName: path.basename(targetDir),
    // ... many properties
  };
  
  // ... detection logic
  
  return findings;
}
```

**After (TypeScript):**
```typescript
interface ScanOptions {
  dir: string;
  output: string;
  _silent?: boolean;
}

interface ScanFindings {
  projectName: string;
  frontendFramework: string;
  backendFramework: string;
  // ... 25+ typed properties
  patterns: {
    hasApiRoutes: boolean;
    hasAuthMiddleware: boolean;
    hasErrorHandling: boolean;
    hasValidation: boolean;
  };
}

export async function scan(options: ScanOptions): Promise<ScanFindings> {
  const targetDir = path.resolve(options.dir);
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  const spinner: Ora | null = silent ? null : ora('Scanning...').start();
  
  const findings: ScanFindings = {
    projectName: path.basename(targetDir),
    frontendFramework: '',
    backendFramework: '',
    // ... all properties initialized
    patterns: {
      hasApiRoutes: false,
      hasAuthMiddleware: false,
      hasErrorHandling: false,
      hasValidation: false
    }
  };
  
  try {
    // ... detection logic
    
    if (spinner) spinner.succeed('Complete');
    return findings;
  } catch (error) {
    if (spinner) spinner.fail('Failed');
    log.error((error as Error).message);
    throw error;
  }
}
```

**Benefits gained:**
- ✅ Type safety: `options.dir` guaranteed string
- ✅ Autocomplete: All `findings` properties known
- ✅ Compile-time errors: Missing properties caught early
- ✅ Self-documenting: Interfaces show data structure
- ✅ Refactor safety: Rename detection across codebase

---

## Common Gotchas

### 1. ESM Import Extensions

**Problem:**
```typescript
import { createLogger } from '../logger';  // ❌ Missing .js
```

**Solution:**
```typescript
import { createLogger } from '../logger.js';  // ✅ Extension required
```

**Why:** ES modules require explicit extensions, even for TypeScript files compiled to .js

### 2. Logger Method Confusion

**Problem:**
```typescript
log.warning('Something wrong');  // ❌ No warning() method
```

**Solution:**
```typescript
log.yellow('Something wrong');   // ✅ Use yellow() for warnings
```

**Why:** Logger uses color methods (cyan, yellow, etc.) not semantic methods (info, warning)

### 3. Unused Parameters

**Problem:**
```typescript
async function helper(dir: string, log: Logger) {  // ❌ log unused, linter warns
  // Only uses dir
}
```

**Solution:**
```typescript
async function helper(dir: string) {  // ✅ Remove unused parameter
  // Only uses dir
}
```

**Why:** TypeScript linter catches unused parameters (helps reduce bloat)

### 4. Record Type Assertions

**Problem:**
```typescript
const config: FeatureConfig = getConfig();
config['newFeature'] = true;  // ❌ Type error
```

**Solution:**
```typescript
const config = getConfig() as unknown as Record<string, boolean>;
config['newFeature'] = true;  // ✅ Works
```

**Why:** Double-cast needed when converting strict interface to dynamic Record type

---

## Migration Checklist

**Pre-Migration:**
- [ ] Read existing .js file completely
- [ ] Identify all data structures (inputs, outputs, internal state)
- [ ] Note all external dependencies (libraries, internal modules)
- [ ] Check for dynamic property access (needs `Record<K, V>`)

**During Migration:**
- [ ] Create interfaces for all data structures
- [ ] Add imports (with `node:` prefix and `.js` extensions)
- [ ] Type function signatures (params + return values)
- [ ] Handle null/undefined cases
- [ ] Cast errors in catch blocks
- [ ] Remove unused parameters

**Post-Migration:**
- [ ] Run `npm run build` - fix all type errors
- [ ] Run `npm test` - ensure functionality preserved
- [ ] Run `npm run lint` - fix warnings proactively
- [ ] Test CLI command: `node bin/cli.js <cmd> --help`
- [ ] Commit with descriptive message

---

## Quality Metrics

**Excellent migration** (10/10):
- Zero build errors
- All tests passing (no regressions)
- Zero lint warnings
- All invariants pass
- No `any` types
- No non-null assertions (`!`)
- Comprehensive interfaces (all properties typed)

**Good migration** (7-9/10):
- Some lint warnings (but explained with comments)
- Strategic `@ts-ignore` for unmigrated dependencies
- Mostly typed (95%+ coverage)

**Needs improvement** (<7/10):
- Excessive `any` types
- Non-null assertions scattered throughout
- Missing return type annotations
- Unused parameters not removed

---

## Related Patterns

- **Logger Pattern** (`.aiknowsys/learned/logger-pattern.md`) - createLogger(silent) usage
- **Progress Indicators** (`.aiknowsys/learned/progress-indicators.md`) - Ora spinner patterns
- **CLI Command Structure** (CODEBASE_ESSENTIALS.md §4) - Standard command template

---

**Last Updated:** 2026-02-04  
**Source:** Phase 3 TypeScript migration (Batches 6-9)  
**Quality:** Production-ready pattern (validated across 32 files, ~7,383 lines)
