---
category: workarounds
tags: [vitest, testing, typescript, es-modules, method-visibility]
created: 2026-02-16
updated: 2026-02-16
trigger_words: [vitest, test imports, method not found, dist imports, transpiler]
---

# Vitest Method Visibility Issue

**Pattern Type:** Workaround for recurring test issue  
**Discovered:** Phase 2.4 (Embedding Storage) - Feb 16, 2026  
**Affects:** Integration tests in AIKnowSys project

## Problem

Vitest integration tests fail with `TypeError: storage.methodName is not a function` when importing from TypeScript source files.

**Symptoms:**
```typescript
// Test file
import { SqliteStorage } from '../../lib/context/sqlite-storage.js';

const storage = new SqliteStorage();
await storage.insertEvent(event);  // ❌ TypeError: storage.insertEvent is not a function
```

**Error Message:**
```
TypeError: storage.insertEvent is not a function
  at test/embeddings/semantic-search.test.ts:95:20
```

## Root Cause

**Unknown** - suspected Vitest transpiler issue with ES modules

**Observations:**
1. Methods exist in source file (TypeScript compiles successfully)
2. Methods visible when importing from compiled JavaScript (dist/)
3. Only affects certain methods (not all - inconsistent)
4. Occurs in integration tests (not unit tests)
5. Recurring across multiple test files (hybrid-storage.test.ts, semantic-search.test.ts)

**Investigation Status:** ⏸️ DEFERRED (workaround effective, low impact)

## Workaround

**Import from compiled JavaScript instead of TypeScript source:**

```typescript
// ❌ This fails with method visibility issues
import { SqliteStorage } from '../../lib/context/sqlite-storage.js';

// ✅ This works reliably
import { SqliteStorage } from '../../dist/lib/context/sqlite-storage.js';
```

**Files using this workaround:**
- [test/integration/hybrid-storage.test.ts](../../test/integration/hybrid-storage.test.ts)
- [test/embeddings/semantic-search.test.ts](../../test/embeddings/semantic-search.test.ts)

## Trade-offs

**Advantages:**
- ✅ Tests run reliably (14/14 passing)
- ✅ Simple one-line change
- ✅ No impact on production code
- ✅ Minimal cognitive overhead

**Disadvantages:**
- ⚠️ Tests import compiled output (not source)
- ⚠️ Requires `npm run build` before running tests
- ⚠️ Source maps might be less accurate
- ⚠️ Root cause not addressed

**Impact:** LOW - Workaround is effective and doesn't affect users

## When to Use

**Apply this workaround when:**
- Integration test fails with "method is not a function"
- Method exists in source file (confirmed with grep/search)
- TypeScript compilation succeeds
- Error occurs with ES module imports

**Don't apply if:**
- Method genuinely doesn't exist (typo, wrong class)
- Error is something else (null reference, wrong type)
- Unit tests (usually don't have this issue)

## Future Investigation

**If time permits, investigate:**
1. Vitest configuration (vitest.config.ts)
2. TypeScript compilation settings (tsconfig.json)
3. ES module resolution (package.json type: "module")
4. Vitest transpiler behavior with ESM
5. Comparison with other test frameworks (Jest, Mocha)

**Potential Root Causes:**
- Vitest's ESM transpiler doesn't handle method exports consistently
- TypeScript ES module output incompatible with Vitest's expectations
- Method visibility issue with `better-sqlite3` native module interaction
- Class method hoisting/binding issue in transpiled code

**Success Criteria for Fix:**
- Tests pass with imports from `lib/` (source) instead of `dist/` (compiled)
- No behavioral changes (same test results)
- No "method is not a function" errors

## References

- First occurrence: Phase 2.4 (Embedding Storage) - commit 352b99a
- Second occurrence: Phase 2.5 (Semantic Search) - commit d94c522
- Related test files: hybrid-storage.test.ts, semantic-search.test.ts
- Architect review: [.aiknowsys/reviews/PENDING_arno-paffen.md](../reviews/PENDING_arno-paffen.md) (Feb 16, 2026)

## Related Patterns

- `.aiknowsys/learned/common-gotchas.md` - General ESM/TypeScript issues
- Vitest documentation: https://vitest.dev/guide/common-errors.html

---

**Status:** ⏸️ DEFERRED - Workaround effective, low priority for root cause investigation  
**Impact:** LOW - Tests work reliably, no user-facing impact  
**Last Updated:** Feb 16, 2026
