# TODO: Create GitHub Issue

**Title:** Investigate Vitest dist/ import requirement

**Labels:** `technical-debt`, `testing`, `investigate`

**Priority:** Medium

## Description

Some tests require importing from `dist/` (compiled JavaScript) instead of `lib/` (TypeScript source) to pass. This is not idiomatic and creates a build dependency for tests.

## Symptoms

- Tests that import from `lib/` fail with: `TypeError: storage.method is not a function`
- Same tests pass when importing from `dist/`
- Methods exist in both source and compiled code

## Affected Tests

- `test/events/event-embedding-storage.test.ts`
- `test/embeddings/semantic-search.test.ts`

## Current Workaround

**Vitest projects configuration** separates tests:
- **source-tests**: Import from `lib/` (majority of tests)
- **post-build-tests**: Import from `dist/` (Phase 2 embedding tests only)

**Scripts:**
```bash
npm run test:source      # No build required
npm run test:post-build  # Builds first, then runs
npm run test:all         # Both sequentially
```

## Investigation Needed

1. Check Vitest transpilation configuration ([vitest.config.ts](vitest.config.ts))
2. Test if issue is specific to certain modules (embeddings, events)
3. Review ES module resolution settings
4. Check if other TypeScript projects have similar issues
5. Investigate if related to circular dependencies or export patterns

## References

- Workaround documented: `.aiknowsys/learned/vitest-method-visibility.md`
- Vitest config: [vitest.config.ts](vitest.config.ts)
- Architect review: `.aiknowsys/reviews/PENDING_arno-paffen.md` (lines 75-110)
- Commit with workaround: 7c9a000

## Success Criteria

- [ ] Tests import from `lib/` (source) and pass
- [ ] No dist/ dependency for tests
- [ ] Root cause identified and documented

## Non-Goals

- This is not urgent - workaround is effective
- Defer if Vitest configuration is complex
- Projects split provides clean separation regardless

---

*Created: 2026-02-16*  
*Requested by: Senior Architect review*  
*Status: TODO - user to create GitHub issue*
