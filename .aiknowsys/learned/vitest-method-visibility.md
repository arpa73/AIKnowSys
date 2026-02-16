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

`lib/` contains checked-in JavaScript artifacts that can drift from `*.ts` sources.

For `SqliteStorage`, `lib/context/sqlite-storage.ts` includes newer methods (`insertEvent`, `semanticSearch`), but `lib/context/sqlite-storage.js` can lag. Tests importing `../../lib/context/sqlite-storage.js` execute stale JS and fail.

**Validated reproduction (2026-02-16):**
- Copy `test/embeddings/semantic-search.test.ts`
- Replace imports from `../../dist/lib/` to `../../lib/`
- Run with Vitest
- Result: `TypeError: storage.insertEvent is not a function`

**Investigation Status:** ✅ Root cause confirmed

## Workaround

**Import from compiled JavaScript instead of TypeScript source:**

```typescript
// ❌ This fails with method visibility issues
import { SqliteStorage } from '../../lib/context/sqlite-storage.js';

// ✅ This works reliably
import { SqliteStorage } from '../../dist/lib/context/sqlite-storage.js';
```

**Files using this workaround:**
- [test/commands/export-session.test.ts](../../test/commands/export-session.test.ts)
- [test/commands/export-sessions.test.ts](../../test/commands/export-sessions.test.ts)
- [test/commands/migrate-to-events.test.ts](../../test/commands/migrate-to-events.test.ts)
- [test/events/event-embedding-storage.test.ts](../../test/events/event-embedding-storage.test.ts)
- [test/events/event-storage.test.ts](../../test/events/event-storage.test.ts)
- [test/events/hybrid-storage.test.ts](../../test/events/hybrid-storage.test.ts)
- [test/embeddings/semantic-search.test.ts](../../test/embeddings/semantic-search.test.ts)
- [test/integration/cross-project-queries.test.ts](../../test/integration/cross-project-queries.test.ts)
- [test/integration/hybrid-storage.test.ts](../../test/integration/hybrid-storage.test.ts)
- [test/migration/event-migrator.test.ts](../../test/migration/event-migrator.test.ts)

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
- ⚠️ Root cause addressed via test-runner mitigation, underlying JS/TS artifact drift still possible

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

## Mitigation Applied

Updated [vitest.config.ts](../../vitest.config.ts) project split:

- `source-tests`: excludes all tests importing `../../dist/lib/`
- `post-build-tests`: includes all dist-dependent tests

Validation:
- `npm run test:source` ✅
- `npm run test:post-build` ✅

## References

- First occurrence: Phase 2.4 (Embedding Storage) - commit 352b99a
- Second occurrence: Phase 2.5 (Semantic Search) - commit d94c522
- Related test files: hybrid-storage.test.ts, semantic-search.test.ts
- Architect review: [.aiknowsys/reviews/PENDING_arno-paffen.md](../reviews/PENDING_arno-paffen.md) (Feb 16, 2026)

## Related Patterns

- `.aiknowsys/learned/common-gotchas.md` - General ESM/TypeScript issues
- Vitest documentation: https://vitest.dev/guide/common-errors.html

---

**Status:** ✅ RESOLVED (root cause identified, mitigation applied)  
**Impact:** LOW - Tests work reliably, no user-facing impact  
**Last Updated:** Feb 16, 2026
