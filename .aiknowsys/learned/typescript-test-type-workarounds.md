---
title: TypeScript Test Type Workarounds
description: Handling missing properties in type definitions during test migration
trigger_words: [as any, type definition missing, test type error, TypeScript migration]
created: 2026-02-04
pattern_type: workaround
phase: TypeScript Migration (Phase 4)
---

# TypeScript Test Type Workarounds

## Problem

During TypeScript migration, test files may use properties that exist in JavaScript implementation but aren't visible to TypeScript's type checker:

- JSDoc-documented properties (e.g., `@param {boolean} options._silent`)
- Properties that will be typed when implementation migrates to TypeScript
- Optional internal properties used for testing

**Example Error:**
```
error TS2353: Object literal may only specify known properties,
and '_silent' does not exist in type 'CleanOptions'.
```

## Context

**When this occurs:**
- Migrating test files from JavaScript to TypeScript (Phase 4)
- Implementation files are still JavaScript with JSDoc
- Test needs to pass options documented in JSDoc but not in .d.ts

**Why it happens:**
- JavaScript files don't generate type definitions automatically
- JSDoc types aren't enforced by TypeScript compiler
- TypeScript requires explicit type definitions

## Solution

### Short-term (Migration Phase)

Use `as any` with explanatory comment in test files:

```typescript
// test/archive.test.ts
const result = await clean({
  dir: TEST_DIR,
  _silent: true
} as any);  // Type definition missing _silent property
```

**Why this is acceptable:**
- ✅ Tests verify actual behavior (implementation has the property)
- ✅ Type safety gap is in definitions, not implementation
- ✅ `as any` is isolated to test files
- ✅ Allows migration to proceed incrementally
- ✅ Will be resolved when implementation migrates to TypeScript

### Long-term (Post-Migration)

When migrating implementation to TypeScript, add proper type definitions:

```typescript
// lib/commands/clean.ts
export interface CleanOptions {
  dir?: string;
  dryRun?: boolean;
  _silent?: boolean;  // Now properly typed
}

export async function clean(options: CleanOptions = {}): Promise<CleanResult> {
  const silent = options._silent || false;
  // ...
}
```

### Alternative (If Needed)

For more type safety during migration, use specific type override:

```typescript
// Slightly better than 'as any'
const result = await clean({
  dir: TEST_DIR,
  _silent: true
} as Parameters<typeof clean>[0] & { _silent: boolean });
```

**Tradeoff:** More verbose, but only bypasses type check for specific property.

## When to Use Each Approach

| Approach | Use When | Pros | Cons |
|----------|----------|------|------|
| `as any` | Test files, known safe properties | Simple, clear | Bypasses ALL type checking |
| Specific override | Type safety critical | Safer | Verbose |
| Update .d.ts | Creating manual type defs | Proper types | Extra maintenance |
| Wait for migration | Can defer | No workaround needed | Blocks test migration |

## Best Practices

1. **Always add comment:** Explain why `as any` is needed
2. **Track TODOs:** Note which type definitions need updating
3. **Limit scope:** Only use in test files during migration
4. **Verify behavior:** Ensure implementation actually has the property
5. **Clean up:** Remove `as any` when implementation migrates to TypeScript

## Examples from Codebase

**clean command:**
```typescript
// Implementation (lib/commands/clean.js)
/**
 * @param {boolean} options._silent - Suppress output for testing
 */
export async function clean(options = {}) {
  const silent = options._silent || false;
  // ...
}

// Test (test/archive.test.ts)
const result = await clean({
  dir: TEST_DIR,
  _silent: true
} as any);  // Type definition missing _silent property
```

**archive-plans command:**
```typescript
// Implementation (lib/commands/archive-plans.js)
/**
 * @param {string} options.status - Status to archive (default: 'COMPLETE')
 */
export async function archivePlans(options = {}) {
  const statusFilter = options.status ?? 'COMPLETE';
  // ...
}

// Test (test/archive.test.ts)
const result = await archivePlans({
  dir: TEST_DIR,
  threshold: 0,
  status: 'CANCELLED',
  _silent: true
} as any);  // Type definition missing status property
```

## Related Patterns

- **TDD workflow:** Write tests first, implementation follows
- **Incremental migration:** Migrate test files before implementation
- **Type safety progression:** JavaScript → JSDoc → TypeScript

## Migration Checklist

When migrating implementation from JavaScript to TypeScript:

- [ ] Review all `as any` usages in tests for this file
- [ ] Create proper interface/type definitions
- [ ] Update function signatures with types
- [ ] Remove `as any` from tests
- [ ] Verify tests still pass
- [ ] Run `npm run build` to check TypeScript compilation

## References

- **Phase 4 Migration:** test/ directory conversion
- **Architect Review:** 2026-02-04 (identified pattern)
- **CODEBASE_ESSENTIALS.md:** §8 Testing Philosophy
- **TypeScript Docs:** [Type Assertions](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)
