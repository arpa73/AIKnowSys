# Proposal: Migrate to Vitest for Testing

**Status:** ✅ APPROVED  
**Author:** Developer  
**Date:** 2026-02-05  
**Approved:** 2026-02-06  
**Related:** TypeScript Phase 8 Migration, Test Infrastructure

**Implementation Plan:** [.aiknowsys/plans/PLAN_vitest_migration.md](../.aiknowsys/plans/PLAN_vitest_migration.md)

## Problem

After TypeScript migration, we're experiencing test infrastructure issues:

1. **Mocking doesn't work** - Node test runner can't mock namespace imports (`import * as fs from 'node:fs'`)
2. **Slow test execution** - Requires pre-compilation with `tsc` before running tests
3. **12+ compress-essentials tests skipped** due to mocking incompatibility
4. **62 test failures** in Phase 8b validation (hooks, integration tests)

## Proposed Solution

**Migrate from Node.js test runner to Vitest**

### Why Vitest?

According to Context7 documentation:

1. **Native TypeScript support** - No pre-compilation needed, 20-30x faster than `tsc`
2. **Powerful mocking** - `vi.mock('node:fs', { spy: true })` works perfectly
3. **Jest-compatible API** - Easy migration, familiar syntax
4. **Watch mode with HMR** - Instant feedback during development
5. **Built-in coverage** - No additional tools needed
6. **Vite-powered** - Same transform pipeline as modern web apps

### Migration Benefits

**Immediate fixes:**
- ✅ Compress-essentials tests (12 tests) - mocking will work
- ✅ Faster test execution - no `tsc` build step needed
- ✅ Better developer experience - watch mode, instant feedback
- ✅ Likely fixes for integration tests - better module resolution

**Current setup:**
```json
"test": "PROJECT_ROOT=$PWD node --test dist/test/*.test.js"
```
Requires: `npm run build` → compile TS → run tests (slow)

**Vitest setup:**
```json
"test": "vitest"
```
Direct TS execution, no build step needed (fast)

## Implementation Plan

### Phase 1: Setup (1-2 hours)
1. Install dependencies: `npm install -D vitest @vitest/ui`
2. Create `vitest.config.ts`:
   ```typescript
   import { defineConfig } from 'vitest/config'
   
   export default defineConfig({
     test: {
       globals: true,
       environment: 'node',
       coverage: {
         provider: 'v8',
         reporter: ['text', 'json', 'html']
       }
     }
   })
   ```
3. Update `package.json` scripts

### Phase 2: Migration (2-3 hours)
1. Convert Node test runner syntax to Vitest:
   - `import { test, describe } from 'node:test'` → `import { test, describe, vi } from 'vitest'`
   - `mock.method()` → `vi.mock()` / `vi.spyOn()`
   - `assert` → `expect` (more ergonomic)
2. Fix compress-essentials mocking with `vi.mock('node:fs', { spy: true })`
3. Update test imports and assertions

### Phase 3: Validation (1 hour)
1. Run full test suite with Vitest
2. Verify all tests pass
3. Add coverage reporting to CI/CD
4. Update documentation

### Total Time Estimate: 4-6 hours

## Breaking Changes

**None for end users** - this is internal test infrastructure only.

**For developers:**
- Need to run `npm install` to get new dependencies
- Different test syntax if writing new tests
- Coverage reports in different format

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Tests might fail differently | Run both in parallel during transition |
| Learning curve | Vitest API is Jest-compatible (familiar) |
| Build pipeline changes | Keep `tsc` for production builds |
| CI/CD adjustments | Vitest has excellent CI support |

## Alternatives Considered

1. **Keep Node test runner** - Would require rewriting all mocks, slow, limited features
2. **Jest** - Heavier than Vitest, slower, not Vite-native
3. **AVA** - Less popular, different API, no Vite integration

## Success Criteria

- ✅ All 580 tests pass (including currently skipped 12)
- ✅ Test execution < 5 seconds (currently ~20s)
- ✅ Watch mode works smoothly
- ✅ Coverage reports generated
- ✅ CI/CD pipeline updated

## Decision

**Status:** ✅ **APPROVED** (2026-02-06)

This migration aligns with modern TypeScript best practices and will immediately solve our mocking issues while improving developer experience significantly.

**Rationale:**
- Unblocks 12 skipped compress-essentials tests
- Significantly improves developer experience (watch mode, <5s tests)
- Aligns with TypeScript-first tooling strategy
- Low migration risk (Jest-compatible API)

---

**Implementation:**
Full implementation plan created: [.aiknowsys/plans/PLAN_vitest_migration.md](../.aiknowsys/plans/PLAN_vitest_migration.md)

**Next Steps:**
1. Developer implements Phase 1-4 following plan
2. Estimated time: 4.5-7 hours across 2-3 sessions
3. Target: All 591 tests passing (579 + 12 currently skipped)
4. Validation: Test execution < 5 seconds
