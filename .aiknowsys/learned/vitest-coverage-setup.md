# vitest-coverage-setup

**Pattern Type:** `framework_gotcha`

## Trigger Words

vitest, coverage, c8, @vitest/coverage-v8, "cannot find dependency", coverage provider

## Problem

Vitest has its own coverage provider ecosystem. You cannot use standalone `c8` package.

**Error message:**
```
MISSING DEPENDENCY Cannot find dependency '@vitest/coverage-v8'
```

## Solution

**Install correct provider:**
```bash
npm install -D @vitest/coverage-v8
```

**NOT this:**
```bash
npm install -D c8  # ❌ Wrong! Vitest won't recognize it
```

**Configuration** (vitest.config.ts):
```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',  // Uses @vitest/coverage-v8 package
      reporter: ['text', 'json', 'html'],
      exclude: ['dist/', 'node_modules/', 'test/']
    }
  }
});
```

**Why:** Vitest integrates with its own coverage providers for optimal TypeScript support and Vite compatibility.

## When This Applies

- Setting up Vitest for the first time
- Adding coverage reporting to existing Vitest projects
- Migrating from other test frameworks (Jest, node:test) to Vitest

## References

- Vitest Migration Phase 3 (CODEBASE_CHANGELOG.md)
- Official Vitest Coverage docs: https://vitest.dev/guide/coverage.html
