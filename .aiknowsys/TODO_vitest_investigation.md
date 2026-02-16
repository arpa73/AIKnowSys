# RESOLVED: Vitest dist/lib Import Investigation

**Title:** Investigate Vitest dist/ import requirement

**Labels:** `technical-debt`, `testing`, `investigate`

**Priority:** Medium

## Description

Some tests require importing from `dist/` (compiled JavaScript) instead of `lib/` (TypeScript source) to pass.

## Root Cause

`lib/` contains checked-in JavaScript artifacts that can drift from `*.ts` sources.

For `SqliteStorage`, `lib/context/sqlite-storage.ts` includes newer methods (`insertEvent`, `semanticSearch`), but `lib/context/sqlite-storage.js` can lag. Tests importing `../../lib/context/sqlite-storage.js` execute stale JS and fail with:

- `TypeError: storage.insertEvent is not a function`

`dist/` imports work because `dist/` is generated fresh by `npm run build`.

## Reproduction

```bash
cp test/embeddings/semantic-search.test.ts test/embeddings/semantic-search-lib.test.ts
sed -i 's#../../dist/lib/#../../lib/#g' test/embeddings/semantic-search-lib.test.ts
npx vitest run test/embeddings/semantic-search-lib.test.ts
# → Fails with: TypeError: storage.insertEvent is not a function
rm -f test/embeddings/semantic-search-lib.test.ts
```

## Resolution Applied

1. Updated `vitest.config.ts` project split so all tests importing `../../dist/lib/` run in `post-build-tests`.
2. Excluded these dist-dependent tests from `source-tests`.
3. Verified both suites:
   - `npm run test:source` ✅
   - `npm run test:post-build` ✅

## Affected Tests (post-build)

- `test/commands/export-session.test.ts`
- `test/commands/export-sessions.test.ts`
- `test/commands/migrate-to-events.test.ts`
- `test/events/event-embedding-storage.test.ts`
- `test/events/event-storage.test.ts`
- `test/events/hybrid-storage.test.ts`
- `test/embeddings/semantic-search.test.ts`
- `test/integration/cross-project-queries.test.ts`
- `test/integration/hybrid-storage.test.ts`
- `test/migration/event-migrator.test.ts`

## Follow-up (Optional)

1. Decide whether generated JS under `lib/` should remain committed.
2. Add CI check preventing `source-tests` from importing `../../dist/lib/`.
3. Add CI check detecting stale `lib/*.js` vs `lib/*.ts` drift.

## Success Criteria

- [x] Root cause identified and documented
- [x] Dist-dependent tests isolated to post-build project
- [x] `test:source` and `test:post-build` both pass

---

*Created: 2026-02-16*  
*Updated: 2026-02-16*  
*Status: RESOLVED*
